# Automated Release Pipeline (EAS Build + Store Submit)

Every merge to `master` builds the app in the cloud and uploads it to both stores.
No macOS machine is involved. This document covers the one-time setup and the
day-to-day workflow.

---

## Table of Contents

- [What happens on a merge to master](#what-happens-on-a-merge-to-master)
- [One-time setup](#one-time-setup)
  - [1. Create the EAS project](#1-create-the-eas-project)
  - [2. Upload signing credentials to EAS](#2-upload-signing-credentials-to-eas)
  - [3. Upload store submission credentials to EAS](#3-upload-store-submission-credentials-to-eas)
  - [4. Configure GitHub secrets and variables](#4-configure-github-secrets-and-variables)
- [Versioning](#versioning)
- [Day-to-day workflow](#day-to-day-workflow)
- [Manual runs](#manual-runs)
- [The release ladder](#the-release-ladder)
- [Design notes](#design-notes)
- [Troubleshooting](#troubleshooting)

---

## What happens on a merge to master

`.github/workflows/release-master.yml` runs on every push to `master`:

1. Installs dependencies with pnpm.
2. Writes the real production credentials from a GitHub secret, then generates
   `GoogleService-Info.plist` and `google-services.json` from them.
3. Type-checks with `tsc --noEmit`.
4. Runs `expo prebuild --clean` plus the repo's post-prebuild patch scripts
   (`patch-podfile-properties`, `copy-track-player-headers`,
   `add-ios-splash-copyright`, `copy-android-splash`) on the Linux runner.
5. Runs `eas build --platform all --profile production
   --auto-submit-with-profile=production`.

EAS compiles iOS on its own macOS workers and Android on Linux workers, then
submits the artifacts:

| Platform | Destination |
| --- | --- |
| iOS | App Store Connect → TestFlight |
| Android | Google Play → **internal** testing track |

Apple requires a human to submit a TestFlight build for App Store review, so iOS
stops at TestFlight by design. Android stops at the internal track by choice, so
that a merge never ships to real users unattended. Moving further is a config
change — see [The release ladder](#the-release-ladder).

Pull requests into `master` are still gated by the existing
`.github/workflows/validate-main.yml`, which is unchanged.

---

## One-time setup

You need an Expo account that owns the `thrive-church` organization (already set
as `owner` in `app.config.js`), plus Apple Developer and Google Play Console
access.

Run everything below from the `ThriveChurchExpo/` directory.

```bash
pnpm add -g eas-cli
eas login
```

### 1. Create the EAS project

```bash
eas init
eas project:info      # prints the project ID
```

`eas init` normally writes the project ID into `app.json`, which this repo does
not use — the config lives in `app.config.js` and is generated from credentials.
Instead, the project ID is read from the `EAS_PROJECT_ID` environment variable
(see `app.config.js`). Copy the ID printed by `eas project:info` and store it as
a GitHub **repository variable** in step 4.

For local EAS commands, export it in your shell:

```bash
export EAS_PROJECT_ID=<the-uuid-from-eas-project-info>
```

### 2. Upload signing credentials to EAS

The pipeline uses EAS **remote** credentials (`"credentialsSource": "remote"` in
`eas.json`). Nothing sensitive lives in the repo or in GitHub for signing.

```bash
eas credentials
```

- **iOS** → select `production` → let EAS create/manage the Distribution
  Certificate and the App Store provisioning profile. The profile must include
  the Push Notifications capability, since `plugins/withPushNotifications.js`
  adds the `aps-environment` entitlement.
- **Android** → select `production` → upload the existing `thrive-release.keystore`
  (choose "Set up a new keystore" only if you have never shipped this app).

> **Important:** upload the *existing* Android keystore. Google Play rejects an
> app bundle signed with a different key than the one already on the store,
> unless Play App Signing is enabled and you rotate the upload key deliberately.

Once the keystore lives on EAS, local release signing is no longer used by CI.
The workflow sets `THRIVE_REMOTE_SIGNING=1`, which makes
`plugins/withAndroidGradleConfig.js` skip its local `signingConfigs` injection so
it cannot conflict with the keystore EAS installs on the build worker. Local
builds without that variable behave exactly as before.

### 3. Upload store submission credentials to EAS

```bash
eas credentials
```

- **iOS** → App Store Connect API Key. Create the key in
  App Store Connect → Users and Access → Integrations → App Store Connect API,
  with the **App Manager** role, then upload the `.p8` along with its Key ID and
  Issuer ID.
- **Android** → Google Service Account Key. In Google Cloud Console create a
  service account, grant it access in Play Console
  (Users and permissions → Invite user → grant *Release to testing tracks* and
  *Release apps to production*), and upload the JSON key.

With both stored on EAS, `eas.json`'s `submit.production` block only needs the
track and language — no key files ever touch the GitHub runner.

### 4. Configure GitHub secrets and variables

**Repository secrets** (Settings → Secrets and variables → Actions → Secrets):

| Name | Value |
| --- | --- |
| `EXPO_TOKEN` | A robot access token from https://expo.dev/settings/access-tokens |
| `THRIVE_CREDENTIALS_PRODUCTION` | Base64 of your `credentials.production.json` |

Generate the credentials payload:

```bash
# Linux
base64 -w0 credentials.production.json

# macOS
base64 -i credentials.production.json
```

Paste the single-line output as the secret value. `scripts/write-production-credentials.js`
accepts raw JSON too, but base64 avoids newline mangling.

The script rejects any payload still containing `YOUR_` or `REPLACE_WITH_`
placeholders, so a half-filled template fails the run instead of producing a
build wired to nothing.

**Repository variables** (same page → Variables):

| Name | Value |
| --- | --- |
| `EAS_PROJECT_ID` | The UUID from `eas project:info` |

This is a variable rather than a secret because the project ID is not sensitive,
and masking it would make build logs harder to read.

---

## Versioning

Two numbers, two owners:

| Number | Where it lives | Who changes it |
| --- | --- | --- |
| Marketing version (`2.0.0`) | `ThriveChurchExpo/version.json` | You, in a normal PR |
| Build number / versionCode | EAS servers | EAS, automatically |

`eas.json` sets `"appVersionSource": "remote"` with `"autoIncrement": true`, so
EAS keeps a monotonic build counter per platform and writes it into the native
projects at build time. That is why the pipeline never commits back to `master`
— no bot pushes, no `[skip ci]` loops, and nothing that branch protection has to
allow.

When `THRIVE_REMOTE_VERSIONS=1` is set (the workflow sets it), `app.config.js`
omits `ios.buildNumber` and `android.versionCode` so EAS is the only source of
truth. Without that variable, local builds keep reading `version.json` exactly
as before, including `pnpm run version:bump`.

To ship a new marketing version, bump it in a PR before merging:

```bash
pnpm run version:patch    # 2.0.0 -> 2.0.1
pnpm run version:minor    # 2.0.0 -> 2.1.0
pnpm run version:major    # 2.0.0 -> 3.0.0
```

Note these commands also change `buildNumber` in `version.json`. That field is
now only used by local builds; store releases ignore it.

---

## Day-to-day workflow

1. Open a PR into `master`. `validate-main.yml` runs the full validation suite.
2. Merge. `release-master.yml` builds and submits automatically.
3. Watch progress at
   https://expo.dev/accounts/thrive-church/projects/ThriveChurchExpo/builds
4. iOS: the build appears in TestFlight after Apple finishes processing
   (typically 5–15 minutes). Promote to the App Store from App Store Connect
   when you are ready.
5. Android: the build lands on the internal testing track. Promote it in Play
   Console when you are ready.

The workflow job fails if the EAS build or submission fails, so a red check on
`master` means the release did not ship.

---

## Manual runs

Actions → *Release (EAS Build + Store Submit)* → **Run workflow**:

- **Platform** — `all`, `ios`, or `android`.
- **Submit** — uncheck to build without uploading to the stores. Useful for
  producing an artifact to test before a release.
- **Submit profile** — which rung of [the release ladder](#the-release-ladder)
  to use for this run: `production` (Play internal), `production-beta`
  (Play open testing), or `production-store` (Play production, as a draft you
  roll out by hand). iOS goes to TestFlight in all three.

You can also run a release from your own machine (still building in the cloud):

```bash
cd ThriveChurchExpo
export EAS_PROJECT_ID=<uuid>
export THRIVE_REMOTE_VERSIONS=1
export THRIVE_REMOTE_SIGNING=1
export APP_ENV=production
pnpm run prebuild:ci
pnpm run eas:release
```

---

## The release ladder

The pipeline is built to move one rung at a time, from "uploads are automated,
humans still press the store buttons" toward "merging ships the app". Each rung
is a submit profile in `eas.json`, so moving between them is a config change,
not a rewrite.

| Rung | Submit profile | Android lands in | iOS lands in | Human still does |
| --- | --- | --- | --- | --- |
| 1 (current) | `production` | Internal testing, live to internal testers | TestFlight | Promotes to production in both consoles |
| 2 | `production-beta` | Open testing track | TestFlight | Promotes to production in both consoles |
| 3 | `production-store` | Production track, as a **draft** release | TestFlight | Clicks "Start rollout" in Play, submits for review in App Store Connect |
| 4 | a profile with `"releaseStatus": "completed"` on the `production` track, optionally with `"rollout": 0.1` | Production, rolling out | TestFlight | Nothing on Android; Apple still requires a human to submit for review |

Rung 3 is the interesting one: the AAB is fully uploaded and attached to a real
production release, and the only remaining act is pressing the button. That is
the natural place to sit for a few releases before going to rung 4, because it
exercises the entire automated path without ever shipping unattended.

Apple caps the ladder at rung 4 regardless: `eas submit` delivers to App Store
Connect, and submitting a build for App Store review is a deliberate human
action. Automating "upload to TestFlight" is the whole of what Apple allows
here, and it is what this pipeline does.

### Moving rungs

For a one-off, use the workflow's **Run workflow** button and pick a different
**submit_profile**. Nothing is committed, so this is the safe way to try a rung.

To change the default for every merge to `master`, edit
`.github/workflows/release-master.yml` and change the `submit_profile` input's
`default`. To add rung 4, add a profile to `eas.json`:

```json
"production-rollout": {
  "extends": "production",
  "android": {
    "track": "production",
    "releaseStatus": "inProgress",
    "rollout": 0.1
  }
}
```

`rollout` takes a fraction between 0 and 1 and requires
`"releaseStatus": "inProgress"`.

### Adding an approval gate

If you want a human click in GitHub rather than in the store consoles, split the
build and submit steps into two jobs and give the submit job
`environment: production-release`, then add required reviewers to that
Environment in repository settings. The build still runs automatically; only the
upload waits.

---

## Design notes

A few decisions worth knowing about before changing things:

**`.easignore` is required, and it replaces `.gitignore` for uploads.**
`.gitignore` excludes `credentials.*.json` and the Firebase config files, but
EAS Build must receive them: `app.config.js` resolves credentials on the build
server. `.easignore` re-includes those while still excluding `node_modules/`,
build outputs, and all signing material. If you add a new ignore rule to
`.gitignore` that should also apply to EAS uploads, add it to `.easignore` too —
the two files are not merged.

**Prebuild runs on the GitHub runner, not on EAS.**
The repo's native config depends on config plugins *and* on four post-prebuild
node scripts that are not plugins. Running `expo prebuild` in CI and uploading
the result keeps those scripts in the loop and makes the native output
deterministic and inspectable in the workflow logs. `android/` and `ios/` are
therefore deliberately *not* listed in `.easignore`.

**Pods are installed by EAS.** `pnpm run prebuild:ci` is the Linux-safe variant
of `prebuild:ios` — same patch scripts, no `pod install`, which EAS runs on its
macOS worker.

**The workflow waits for the build instead of using `--no-wait`.** Expo's CI
example uses `--no-wait` so the runner exits as soon as the build is queued. We
deliberately do not: without waiting, the check on `master` goes green the
instant the build is *accepted*, and a failed compile or a rejected upload is
invisible unless somebody opens the Expo dashboard. Waiting costs runner minutes
and buys a check mark that actually means "this shipped".

**Build numbers must not come from `version.json` in CI.** Expo's docs are
explicit that with a remote version source, "the build version values stored in
app config are ignored and not updated when the version is incremented
remotely", and that they can safely be removed. `app.config.js` removes them
only under `THRIVE_REMOTE_VERSIONS=1`, which keeps local builds working off
`version.json` as before.

### Reference

| Topic | Expo docs |
| --- | --- |
| Local vs remote app versions | https://docs.expo.dev/build-reference/app-versions/ |
| Building on CI | https://docs.expo.dev/build/building-on-ci/ |
| Automating submissions | https://docs.expo.dev/build/automate-submissions/ |
| eas.json schema | https://docs.expo.dev/eas/json/ |
| `.easignore` | https://docs.expo.dev/build-reference/easignore/ |
| Submitting to Google Play | https://docs.expo.dev/submit/android/ |
| Prebuild behavior on EAS | https://docs.expo.dev/workflow/continuous-native-generation/ |

---

## Troubleshooting

**`Missing secret EXPO_TOKEN` / `Missing repository variable EAS_PROJECT_ID`**
The workflow checks configuration before doing any work. Complete step 4 above.

**`Production credentials still contain template placeholders`**
Your `THRIVE_CREDENTIALS_PRODUCTION` secret was generated from
`credentials.template.json` without filling in real values. Fill them in,
re-encode, and update the secret.

**iOS build fails on code signing**
Run `eas credentials` → iOS → `production` and confirm a Distribution
Certificate and an App Store provisioning profile exist, and that the profile
includes Push Notifications.

**Google Play rejects the bundle: "not signed by the correct key"**
The keystore uploaded to EAS is not the one used for previous releases. Upload
the original `thrive-release.keystore` via `eas credentials`.

**`Google Api Error: applicationNotFound`**
Play cannot find the package name. Expo's docs say `eas submit` handles a first
submission out of the box, so this normally means the service account lacks
access to the app, or the `package` in `app.config.js` does not match the app in
Play Console. Check the service account's permissions in Play Console before
assuming a manual first upload is needed.

**Build succeeds but submission fails**
Submission credentials live on EAS, not GitHub. Re-check step 3. Submission
status is visible at
https://expo.dev/accounts/thrive-church/projects/ThriveChurchExpo/submissions

**Two releases at once**
The workflow uses `concurrency: release-master` with `cancel-in-progress: false`,
so a second merge queues behind the first rather than cancelling it. Cancelling
would orphan an EAS build that had already consumed a remote build number.
