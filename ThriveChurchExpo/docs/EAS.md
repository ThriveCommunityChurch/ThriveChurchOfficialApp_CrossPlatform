# EAS Setup & Release Guide

End-to-end walkthrough for getting Expo Application Services (EAS) working with
this repo: cloud builds plus automatic store uploads. Follow it top to bottom
for a fresh setup; each step says how to verify it worked.

Our EAS identity (all three must agree — see step 3):

| Field | Value |
| --- | --- |
| Owner (Expo account/org) | `thrive-fl` |
| Slug | `thrivechurchexpo` |
| Project ID | `a59a5677-545c-4421-8f58-412983921f62` |

Pipeline internals (the release ladder, `eas.json` design, `workflow_dispatch`
options) live in [CI_CD_RELEASE.md](CI_CD_RELEASE.md). This file is the
hands-on setup companion.

---

## Prerequisites

- An Expo account with access to the `thrive-fl` organization
- Apple Developer (Company/Organization team) + App Store Connect access
- Google Play Console admin + Google Cloud Console access
- Node 26, pnpm 10.34.0, and `eas-cli` (`npm install --global eas-cli`)
- All commands below run from `ThriveChurchExpo/` unless noted

---

## 1. Log in and point your shell at the project

```bash
eas login                 # add --no-browser on a headless machine
export EAS_PROJECT_ID=a59a5677-545c-4421-8f58-412983921f62
eas project:info          # expect @thrive-fl/thrivechurchexpo
```

Do **not** run `eas init`. It tries to write the project ID into the app
config, which fails on purpose here: `app.config.js` is dynamic and reads the
ID from `EAS_PROJECT_ID` instead, so nothing is ever committed. The
"Cannot automatically write to dynamic config" error is expected — skip it and
use the export above.

---

## 2. Owner and slug must match EAS exactly

Every `eas` command validates the local config against the server project:

- `owner` in `app.config.js` must equal the Expo account/org that owns the
  project (`thrive-fl`).
- `slug` in `app.config.js` must equal the EAS project slug. EAS slugs are
  **always lowercase** (`thrivechurchexpo`), so a PascalCase local slug will
  never match — the repo side has to come to EAS.

If either check fails, `eas` tells you exactly which field disagrees. Fix the
local value, never the dashboard (the slug can't be edited there anyway).

---

## 3. pnpm quirk: `NODE_PATH` for local `eas` commands

`eas` spawns the project's `expo` binary straight out of pnpm's `.pnpm` store,
bypassing the `node_modules/.bin/expo` shim that sets `NODE_PATH`. Under pnpm's
strict isolation the spawned process dies silently (`config --json exited with
non-zero code: 1`) while direct `pnpm exec expo config` works fine. Until
upstream fixes the resolution, prefix local `eas` invocations:

```bash
export NODE_PATH=$(node -e "const s=require('fs').readFileSync('node_modules/.bin/expo','utf8'); process.stdout.write(s.match(/export NODE_PATH=\"([^\"]+)\"/)[1])")
```

CI is unaffected (it never shells from `eas` back into `expo` this way), and
npm checkouts don't need it (flat `node_modules` resolves normally).

---

## 4. Android credentials (`eas credentials` → Android → production)

1. **Keystore** → *Set up a new keystore* → upload the **existing**
   `thrive-release.keystore` (never generate a new one — Play rejects bundles
   signed with a different key). You'll need the store password, key alias
   (ours: `thrive-release-key`; confirm with
   `keytool -list -keystore thrive-release.keystore`), and key password
   (often identical to the store password; also recorded as
   `android.releaseKeyPassword` in the production credentials file).
2. **Google Service Account** → upload the Play service-account JSON (Cloud
   Console service account granted *Release to testing tracks* and *Release
   apps to production* in Play Console). This is what submits builds.
3. Skip **Push Notifications (Legacy)** (legacy FCM; the project uses
   `google-services.json`) and **credentials.json** (EAS's own local-signing
   file — unrelated to this repo's `credentials.json` despite the name).

Verify: the keystore's SHA-256 fingerprint in EAS matches Play Console →
Setup → App integrity. A mismatch means the first bundle gets rejected.

EAS-only extra (dashboard, not CLI): project → Credentials → Android → **FCM V1
service account key**. Upload a JSON key for a service account in the
*Firebase* project with the **Firebase Cloud Messaging API Admin** role. Only
needed if pushes go through Expo's push service; builds work without it.

---

## 5. iOS credentials (`eas credentials` → iOS → production, or "All")

Set up, in this order:

1. Apple Team (sign in; Company/Organization team).
2. **App Store Connect API Key** (App Manager role): `.p8` + Key ID + Issuer ID.
   Used for TestFlight submission and for EAS to manage signing on demand.
3. **Push Notifications key** (generate new; gets assigned to the bundle ID).
4. **Distribution Certificate** (generate new).
5. **App Store Provisioning Profile** (generate new; confirm it includes Push —
   `withPushNotifications.js` adds the `aps-environment` entitlement).

"All credentials are ready to build" is the done signal. At every prompt that
offers a storage choice, pick **EAS servers** — the profiles pin
`credentialsSource: remote`, so anything saved locally is invisible to builds.

---

## 6. Seed the remote build counters (one time)

With `appVersionSource: remote`, EAS initializes its counters from the local
project (`version.json`), so if the stores already hold a higher `versionCode`
/ build number, the first automated build is rejected as a duplicate. Check the
highest shipped versions in both consoles, then once per platform:

```bash
eas build:version:set
```

Answer yes to the remote version source and enter a number higher than anything
already shipped.

---

## 7. GitHub secrets and variables

Settings → Secrets and variables → Actions:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `EXPO_TOKEN` | robot token from expo.dev/settings/access-tokens |
| Secret | `THRIVE_CREDENTIALS_PRODUCTION` | `base64 -w0 credentials.production.json` |
| Variable | `EAS_PROJECT_ID` | the project UUID |

**Rotation rule: the secret is a snapshot.** Any credential change (API key
rotation, Firebase value, new field) requires re-running the `base64` command
on the updated `credentials.production.json` and pasting the new output over
the secret. No code change, no PR — the next `master` push picks it up. The
workflow rejects payloads that still contain template placeholders, so a
half-filled rotation fails fast instead of shipping a broken build.

---

## 8. Releasing

1. PR into `dev` (gated by `validate-dev.yml`), then `dev` → `master`.
2. Every `master` push runs `release-master.yml`: deps → credentials from the
   secret → type-check → `prebuild --clean` + patch scripts on Linux → EAS
   build + auto-submit.
3. Android lands on the **internal** track; iOS lands in **TestFlight**. A human
   promotes from there (see [the release ladder](CI_CD_RELEASE.md#the-release-ladder)).
4. Watch progress: expo.dev → `thrive-fl` → `thrivechurchexpo` → builds /
   submissions. A red check on `master` means the release did not ship.

---

## Troubleshooting quick index

| Symptom | Cause / fix |
| --- | --- |
| `expo ... config --json exited with non-zero code: 1` under `eas` | pnpm isolation — see step 3 |
| Owner mismatch error | `owner` in `app.config.js` vs EAS account — see step 2 |
| Slug mismatch error | EAS lowercases slugs — see step 2 |
| `eas init` "cannot automatically write to dynamic config" | Expected — skip `init`, use the export in step 1 |
| Unknown keystore alias | `keytool -list -keystore <file>` (asks store password) |
| Unknown key password | Try the store password; else `android.releaseKeyPassword` in the credentials file — unrecoverable otherwise |
| `android.package ... ignored, using native code` | Expected: `android/` is committed and CI regenerates it via prebuild |
| Play rejects bundle "not signed by correct key" | Fingerprint mismatch — compare EAS vs Play Console integrity page |
| `Production credentials still contain template placeholders` | Secret was encoded from an unfilled template — fill, re-encode, update (step 7) |
