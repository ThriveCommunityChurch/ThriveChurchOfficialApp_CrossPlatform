# Expo SDK 58 Upgrade Plan

**Status:** Draft, 2026-11-18. Founder decisions on 2026-11-18:
- **Audio:** replace RNTP with expo-video. **Proposed change 2026-11-22 (agent; needs founder confirmation): expo-audio instead.** On iOS 27, an audio-only expo-video player has been seen flipping playing/not-playing every ~0.3s, while expo-audio plays with `playImmediately(atRate:)` and skips the buffering-rate wait behind it. The premise for expo-video, that expo-audio had no lock-screen controls, is out of date: expo-audio 58 has `setActiveForLockScreen` with seek buttons.
- **Sequencing:** do the full SDK 58 upgrade in one jump. Plan B (SDK 57) is rejected.
- **Notifications:** replace Notifee with **expo-notifications**, not notify-kit.
- **iOS minimum:** accept 16.4.
**Grounded on:** `origin/dev` 53562f3.

## Summary

Move `ThriveChurchExpo` from **Expo SDK 54 (`expo ~54.0.36`, RN 0.81.4, React 19.1.0)** to **Expo SDK 58
(`expo ~58.0.26`, RN 0.88.1, React 19.3.0)** in one jump.

**Why:** when built with Xcode 27, the app crashes at launch on iOS 27 with `EXC_BREAKPOINT` in
`_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`. SDK 58's prebuild generates `SceneDelegate.swift`
(`ExpoAppSceneDelegate`) and `UIApplicationSceneManifest`. This was checked against the `expo-template-bare-minimum@58.0.35`
tarball.

**What this forces:**

1. **RNTP removed.** `react-native-track-player@5.0.0-alpha0` doesn't work on RN 0.87+
   ([RNTP #2687](https://github.com/doublesymmetry/react-native-track-player/issues/2687)). Audio moves to expo-audio
   (Phase 2). Phase 2 is gated on expo-audio passing a device check.
2. **iOS goes from static to dynamic frameworks.** **RNFB 27 is SPM-only and requires `use_frameworks! :linkage => :dynamic`**
   ([migrating-to-v27](https://github.com/invertase/react-native-firebase/blob/main/docs/migrating-to-v27.mdx)), and
   RNFB below 27 skips `FirebaseApp.configure()` on the SDK 58 AppDelegate. Static linking can stay only with the
   fallback (RNFB 26.4.2 plus a patch; see Rollback).
3. **Notifee replaced.** `invertase/notifee` was archived on 2026-04-07; its README points to expo-notifications or
   [`react-native-notify-kit`](https://github.com/marcocrupi/react-native-notify-kit).
4. **`react-native-fast-image` replaced by `expo-image`, and the RNGH 3 `Swipeable` removal** (it now needs Reanimated).

## Research (sources)

| Source | Settles |
|---|---|
| [Expo SDK 58 changelog](https://expo.dev/changelog/sdk-58), [expo/fyi ios-scene-lifecycle](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md), [expo#47628](https://github.com/expo/expo/pull/47628) | Scene life cycle. Cold-start URLs are rebuilt from `connectionOptions`. Never hand-forward to `RCTLinkingManager`. |
| `expo@58.0.26` `bundledNativeModules.json` (npm tarball, read 2026-11-18) | Every "Expo-managed" version below. |
| `expo@57.0.33` `bundledNativeModules.json` | SDK 57 = RN **0.86.3**, RNGH 2.32: the basis for Plan B. |
| [SDK 55](https://expo.dev/changelog/sdk-55)/[56](https://expo.dev/changelog/sdk-56)/[57](https://expo.dev/changelog/sdk-57) | 55: `newArchEnabled` and edge-to-edge config removed. 56: iOS minimum **16.4**, `expo/fetch` replaces global fetch, TS 6, Hermes v1. 57: prebuild cleans by default. |
| [RN 0.87 blog](https://reactnative.dev/blog/2026/08/11/react-native-0.87) | Strict TS API. StatusBar `backgroundColor`/`translucent` removed. compileSdk 37, NDK 27.1.12297006, minSdk 24. |
| [RNFB v27 guide](https://github.com/invertase/react-native-firebase/blob/main/docs/migrating-to-v27.mdx) | Modular API (namespaced removed in v26). SPM-only, dynamic frameworks. Kotlin ≥ 2.4 (for `firebase-auth` metadata, which Thrive doesn't use). minSdk 24. |
| [notifee README](https://github.com/invertase/notifee) (archived) / [notify-kit](https://github.com/marcocrupi/react-native-notify-kit) | notify-kit 10.10.1 (2026-11-13): API "100% compatible", TurboModules, Expo CNG plugin; development target RN 0.85.3. |
| [react-native-fast-image](https://github.com/DylanVann/react-native-fast-image) | Dormant since 8.6.3, then **seven releases (10.9.12 to 10.11.0) between 2026-10-30 and 11-02**. Treat as untrusted churn and don't adopt. |
| [audio-analyzer](https://github.com/exzos28/react-native-audio-analyzer) 4.0.1 / [nitro](https://github.com/margelo/nitro/releases) 0.37.2 | v4 removed `computeAmplitude`; use `analyzeAudio()` plus `resample`/`normalize`. Peer `react-native-nitro-modules ^0.37.1`. |
| [FlashList v2 migration](https://shopify.github.io/flash-list/docs/v2-migration) | `estimatedItemSize` removed. `overrideItemLayout` handles span only. New Architecture only. |
| [RNGH 3 upgrade](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/upgrading-to-3/) + 3.3.0 tarball | Legacy `Swipeable` is gone. `react-native-gesture-handler/ReanimatedSwipeable` imports `react-native-reanimated` and `react-native-worklets`. |
| [react-native-share](https://github.com/react-native-share/react-native-share) 12.3.1 | Ships a `codegenConfig` (TurboModule), so it stays. |
| [TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) | `types` defaults to `[]`; `baseUrl` is deprecated. |
| [expo-audio docs](https://docs.expo.dev/versions/latest/sdk/audio/) | `setActiveForLockScreen`, `setAudioModeAsync` (`shouldPlayInBackground`, `interruptionMode: 'doNotMix'`), the plugin's `enableBackgroundPlayback`/`microphonePermission`. |

**App facts:**
- `ios/` (27 files) and `android/` (51 files) are tracked. Every build path runs `prebuild --clean`: `prebuild:ci`, CI,
  and `scripts/android/build.sh`.
- No Jest, ESLint or Prettier config exists. The `eslint`/`prettier` devDependencies are unused, and `validate-dev.yml`
  has no lint step despite its summary line. The type check is `pnpm exec tsc --noEmit`, which is right here:
  `tsconfig.json` is not `files: []` with references.
- Deep links: `app/navigation/linking.ts` with prefixes `thrivechurch://` and `https://(www.)thrive-fl.org/app`
  (`app/config/app.config.ts:45`). There are **no `associatedDomains`**, so the https links don't open the app on iOS
  today. That's pre-existing and out of scope.
- Push: FCM through RNFB messaging (`index.js:11`, `app/services/notifications/pushNotificationService.ts`), displayed
  by Notifee, cold start through `messaging().getInitialNotification()` (line 314). Wired in
  `app/navigation/RootNavigator.tsx:663`.

## Target versions (`ThriveChurchExpo/package.json`)

"Managed" means `npx expo install --fix` sets the version. "Manual" means `pnpm add`.

| Package | Now | Target | How / note |
|---|---|---|---|
| expo | ~54.0.36 | ~58.0.26 | Managed |
| react / react-native | 19.1.0 / 0.81.4 | 19.3.0 / 0.88.1 | Managed |
| expo-application, -build-properties, -calendar, -constants, -dev-client, -device, -file-system, -linear-gradient, -localization, -splash-screen, -status-bar, -system-ui | various | ~58.0.x (application ~58.1.2) | Managed |
| **expo-audio** (new) | — | ~58.0.12 | Managed. Phase 2 only. Plugin `{ microphonePermission: false, recordAudioAndroid: false }` |
| **expo-image** (new) | — | ~58.0.18 | Managed. Replaces fast-image |
| expo-sharing | ^14.0.8 | **remove** | No imports in `app/` |
| @expo/vector-icons | ^15.1.1 | keep | The SDK lists ^15.0.2. `expo` dropped it as a dependency in SDK 56, so keep it explicit |
| react-native-vector-icons | ^10.3.0 | **remove** | Unused; every icon comes from `@expo/vector-icons` |
| @react-native-async-storage/async-storage | ^2.2.0 | 2.2.0 | Managed |
| @react-native-community/netinfo | ^11.5.2 | 12.0.1 | Managed |
| react-native-gesture-handler | ^2.32.0 | ~3.3.0 | Managed. See C5 |
| **react-native-reanimated / react-native-worklets** (new) | — | 4.7.1 / 0.13.0 | Managed. Needed by `ReanimatedSwipeable` |
| react-native-safe-area-context / react-native-screens | ^5.8.0 / ~4.16.0 | ~5.11.1 / ~4.30.1 | Managed |
| react-native-webview | ^13.17.0 | 14.0.1 | Managed |
| @shopify/flash-list | ^1.8.3 | 2.3.2 | Managed. See C4 |
| @react-native-firebase/app, analytics, crashlytics, messaging | ^23.8.8 | ^27.1.1 (all four together) | Manual. See C2 |
| @notifee/react-native | ^9.1.8 | **→ expo-notifications ~58.x** (founder decision) | Expo-managed. See C3 |
| react-native-fast-image | ^8.6.3 | **→ expo-image** | See C4 |
| react-native-audio-analyzer / react-native-nitro-modules | ^3.1.0 / ^0.29.8 | ^4.0.1 / ^0.37.2 | Manual. See C6. Keep nitro in `pnpm-workspace.yaml` `allowBuilds` |
| react-native-track-player | ^5.0.0-alpha0 | **→ expo-audio** | Phase 2 |
| @react-navigation/native, native-stack, bottom-tabs | 7.3/7.18/7.18 | ^7.5.2 / ^7.21.1 / ^7.22.0 | Manual |
| @react-navigation/stack | ^7.10.17 | **remove** | Only used for the `StackNavigationProp` type; no `createStackNavigator` anywhere |
| react-native-share | ^12.3.1 | 12.3.1 | Keep (TurboModule) |
| react-native-youtube-iframe | ^2.4.1 | 2.4.1 | Keep: pure JS over webview |
| react-native-rss-parser | ^1.5.1 | 1.5.1 | Keep: pure JS, unmaintained since 2022 (follow-up) |
| react-native-markdown-display | ^7.0.2 | 7.0.2 | Keep: pure JS |
| typescript / @types/react | ^5.9.3 / ~19.1.0 | ~6.0 (not 7) / ~19.3.0 | Managed |
| axios, zod, zustand, @tanstack/react-query, i18next, react-i18next | current | unchanged | Pure JS |

## Phase 1: SDK upgrade (everything except audio)

Work in a worktree under `.worktrees/` on branch `chore/expo-sdk-58`, with Node 26, pnpm 10.34 and
`TMPDIR=~/.cache/tmp`. The parent does the git writes.

1. `npx expo install expo@^58.0.26`, then `npx expo install --fix`.
2. Run the manual `pnpm add`/`pnpm remove` steps from the table, then `pnpm install` and `pnpm audit --audit-level=moderate`.
3. Make code and config changes C1–C9.
4. Run `npx expo-doctor`; it must report no failed checks.
5. Run `node scripts/generate-ci-credentials.js` (if no credentials), then `npx expo prebuild --clean --no-install`, then the native assertions in gate 3.
6. Run the gates in order.

### C1. `app.config.js`, plugins and scripts
- `expo-build-properties`: `ios: { useFrameworks: "dynamic" }`. Delete `forceStaticLinking` and the
  `android.ndkVersion: "26.1.10909125"` pin (RN 0.88 uses NDK 27.1). Add the comment
  `// dynamic: RNFB >=27 resolves Firebase via SPM, which needs it`.
- Add the plugin entries `"expo-image"` (only if expo-doctor asks for it) and `expo-notifications` (C3). The
  `expo-audio` entry comes in Phase 2.
- Delete `scripts/patch-podfile-properties.js` and the stray root `Podfile.properties.json` (only that script refers to
  it). Delete `scripts/copy-track-player-headers.js`. Then update `package.json` `prebuild:ios` and `prebuild:ci` to drop
  those steps.
- Plugin audit:

| Plugin | Modifies | SDK 58 impact | Change |
|---|---|---|---|
| `withPushNotifications.js` | Entitlement `aps-environment`, pbxproj capability, Info.plist `UIBackgroundModes`, **AppDelegate**: adds `import FirebaseMessaging` after `import FirebaseCore`, and APNS token methods inserted before the first column-0 `}` | Within the 58 template that `}` still closes `AppDelegate` (checked). `import FirebaseCore` comes from RNFB 27's plugin, which handles `internal import Expo`. **Risk:** under dynamic SPM, the app target may not see the `FirebaseMessaging` module. | None up front. If iOS fails with "no such module FirebaseMessaging", fall back to deleting `withFirebaseMessagingImport`/`withAPNSDelegateMethod` and `FirebaseAppDelegateProxyEnabled: false`, so Firebase swizzles the APNS token. The token's `.prod` hard-code is pre-existing. |
| `withPodsDeploymentTarget.js` | Podfile `post_install` | The SDK floor is now 16.4 | Change the default `minimum` from `'15.1'` to `'16.4'` and update the header comment |
| `withXcodeSettings.js` | pbxproj attributes and settings, schemes | No AppDelegate or Info.plist changes | `LAST_UPGRADE_CHECK` `2620` → `2720` (Xcode 27.2) |
| `withNativeUITests.js` | Adds the UI test target through the Ruby `xcodeproj` gem; Espresso `build.gradle` | Must still find target `ThriveChurchOfficialApp` | Check on the iMac prebuild |
| `withSplashScreenCopyright.js` + `scripts/add-ios-splash-copyright.js` | Android strings; iOS `SplashScreen.storyboard` | The 58 storyboard markup could differ | Check the label renders (device item 1) |
| `withTabletSupport.js`, `withThemeConfiguration.js` | Info.plist orientation and style; AndroidManifest, `MainActivity` | Same anchors in the SDK 58 template | None |
| `withAndroidGradleConfig.js` | `gradle.properties` signing and perf, `build.gradle` | Appends only | Confirm release signing actually applies (an append can silently no-op) |

None of the custom plugins touches `SceneDelegate.swift` or `UIApplicationSceneManifest`.

### C2. React Native Firebase 27 (modular API)
- `app/services/analytics/analyticsService.ts:6`: replace `import analytics from ...` with `getAnalytics`. Each
  `await analytics().logEvent(...)` (lines 64–212) becomes `await getAnalytics().logEvent(...)`. Use the instance method
  and **keep the `await`**: modular `logEvent()` returns `void` and would detach rejections.
- `pushNotificationService.ts` and `index.js:11`: `const m = getMessaging()`. Use `requestPermission(m)` (line 56),
  `getToken(m)` (96), `onMessage(m, cb)` (232), `setBackgroundMessageHandler(m, cb)` (index.js, 269),
  `onNotificationOpenedApp(m, cb)` (305), `getInitialNotification(m)` (314), `onTokenRefresh(m, cb)` (419) and
  `hasPermission(m)` (453). Await every promise-returning call inside the existing try/catch.
- `setBackgroundMessageHandler` is registered both in `index.js` and in `setupBackgroundMessageHandler()`. Keep only
  the `index.js` registration (it must be at top level).
- Crashlytics has no JS call sites; it's plugin only. Keep the plugin entry.

### C3. Notifee → expo-notifications (founder decision, 2026-11-18)
- **Packages:** run `pnpm remove @notifee/react-native`, then `npx expo install expo-notifications`. Add the
  `expo-notifications` plugin to `app.config.js` with the Android icon and color Notifee used.
- **Call sites** (`pushNotificationService.ts`):

  | Notifee | expo-notifications |
  |---|---|
  | `createChannel` | `setNotificationChannelAsync` |
  | `displayNotification` | `scheduleNotificationAsync({ content, trigger: null })` |
  | `onForegroundEvent` | `addNotificationResponseReceivedListener` + `setNotificationHandler` |
  | `setBadgeCount` | `setBadgeCountAsync` |
  | `cancelAllNotifications` | `dismissAllNotificationsAsync` |

- **The open design point: two notification delegates.** RNFB messaging stays for the FCM token, data messages and
  cold start (`getInitialNotification`). expo-notifications also installs a `UNUserNotificationCenter` delegate on
  iOS. Resolve it **first** in implementation with a spike:
  - **(a)** Keep RNFB for receipt and tokens, use expo-notifications only to present foreground notifications, and
    confirm that taps reach RNFB's `onNotificationOpenedApp` and `getInitialNotification`.
  - **(b)** If the delegates conflict, move tap handling fully to expo-notifications, using
    `getLastNotificationResponseAsync` for cold start, and keep RNFB only for the FCM token.

  Do not switch the backend to Expo push or APNs. iOS FCM delivery depends on the RNFB token.
- **Proof:** device checklist items 7–8 (cold, warm and foreground push open, and badge clear) on iOS and Android.

### C4. UI library swaps
- **expo-image** replaces FastImage in `app/screens/Listen/{DownloadsScreen,ListenScreen,RecentlyPlayedScreen,SeriesDetailScreen}.tsx`,
  `app/screens/Connect/EventDetailScreen.tsx`, `app/components/RelatedSeriesCard.tsx` and
  `app/components/events/FeaturedEventsBanner.tsx`. Make these changes:
  - `resizeMode={FastImage.resizeMode.cover}` and `resizeMode="cover"` become `contentFit="cover"`.
  - `FastImage.priority.normal` becomes `priority="normal"`.
  - Add `cachePolicy="memory-disk"`.
  - Keep any `style` that sets the dimensions.
- **FlashList 2** in `ListenScreen.tsx`, `app/components/Search/{SearchResultsList,SpeakerSelector,TagSelector}.tsx`
  and `app/screens/Connect/{EventsScreen,RSSScreen}.tsx`:
  - Delete the 7 `estimatedItemSize` props.
  - Re-check the single `overrideItemLayout`: v2 only honors `span`, so remove any size logic.
  - Keep `getItemType`.
  - Check the list refs and types against the v2 types.
- **Navigation types:** in `app/components/RelatedSeriesSection.tsx` and
  `app/screens/Listen/{VideoPlayer,NowPlaying,BiblePassage,SermonDetail,SermonNotes}Screen.tsx`, replace
  `StackNavigationProp` from `@react-navigation/stack` with `NativeStackNavigationProp` from `native-stack`.

### C5. RNGH 3
- `App.tsx:3` `GestureHandlerRootView`: no change.
- `app/screens/Notes/NotesListScreen.tsx:18`: replace `Swipeable` with
  `import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'`. Its `renderRightActions`
  receives `SharedValue`s instead of `Animated` values, and the ref type is `SwipeableMethods`. babel-preset-expo adds
  the worklets plugin automatically, so there's no babel config change.

### C6. Waveform (`app/services/audio/waveformService.ts`)
- Keep `load(url)`. Replace `computeAmplitude(filePath, n)` with
  `analyzeAudio(filePath, { maxBuckets: 1000 })`, then `resample`/`normalize` down to `n` values in 0–1. Keep the
  AsyncStorage cache key and the fallback pattern. RNTP isn't involved: NowPlaying only extracts on the device for
  local files.

### C7. TypeScript 6 and RN strict API
- `tsconfig.json`: delete `baseUrl` (deprecated in TS 6) and the `@/*` `paths` entry (no `@/` imports exist). Add
  `"types": ["node"]` if tsc reports `process` or `require`.
- Fix what tsc flags: ref instance types, and `useColorScheme()` now returning `| null`
  (`app/providers/ThemeProvider.tsx:46`). Drop the StatusBar `backgroundColor` prop at
  `app/screens/Listen/BiblePassageScreen.tsx:158,174` (removed in RN 0.87; edge-to-edge).
- Do **not** add the `react-native-legacy-deep-imports` condition.
- `fetch` in `app/services/bible/esvApiService.ts` now resolves to `expo/fetch`. The ESV calls are plain GET and JSON;
  device item 9 covers them. axios keeps XHR.

### C8. Native folders: stop tracking `ios/` and `android/`
- The parent runs `git rm -r --cached ThriveChurchExpo/ios ThriveChurchExpo/android` and adds `/ios/` and `/android/`
  to `ThriveChurchExpo/.gitignore`. Reasons: expo-doctor fails while they're tracked, every build runs
  `prebuild --clean`, and the tracked pre-scene `AppDelegate.swift` misleads. UI tests survive in `native-tests/`.
- EAS still receives the prebuilt folders: `.easignore` uploads the working tree and keeps native dirs. Update its
  comment to say they're generated, not tracked. **Unless** the iMac deploy script needs tracked `ios/` (Unknown 2);
  then commit the regenerated folder instead.

### C9. CI and docs
- `.github/workflows/validate-main.yml`:
  - Delete the steps "Apply Firebase static linking patch", "Copy react-native-track-player bridging headers",
    "Verify Podfile.properties.json" (it checks `forceStaticLinking`) and "Verify bridging header" (RNTP).
  - Add `xcodebuild -version` before the Xcode build.
  - Keep `assembleRelease` with the generated debug keystore.
- `validate-dev.yml`: add `pnpm exec expo-doctor` after the type check, and fix the summary text (there's no ESLint step).
- `release-master.yml`: unchanged; it uses `prebuild:ci`.
- `eas.json`: set `build.*.ios.image` to an Xcode 27 image once EAS publishes one (Unknown 3).
- `scripts/android/build.sh`: take `[Debug|Release]` (default Debug). For Release, create
  `android/app/debug.keystore` as CI does, then run `./gradlew assemble${variant} --stacktrace`. There's no Sentry, so
  no upload flag is needed.
- Docs: in `docs/BUILD_AND_DEPLOYMENT.md`, `DEVELOPMENT.md` and `README.md`, update the SDK, RN and Xcode lines and
  remove the RNTP and static-linking notes.

**Phase 1 audio stub (branch only, never merged alone):** remove RNTP from `index.js:3,18` and delete `service.js`.
Then point `app/hooks/usePlayer.ts` and the two Bible screens at a temporary no-op module, so Phase 1 can build and
pass the device run with everything but audio. Phase 2 replaces it. **The PR merges only after Phase 2.**

## Phase 2: audio port to expo-audio

**Gate:** the founder confirms expo-audio. Phase 1 merges only with this phase, after device item 2 passes.

Add `["expo-audio", { microphonePermission: false, recordAudioAndroid: false }]` to the plugins.
`UIBackgroundModes: audio` already exists.

| Thrive today (RNTP) | Becomes |
|---|---|
| `index.js:18` `registerPlaybackService(() => require('./service'))`, plus `service.js` remote events | Deleted. `player.setActiveForLockScreen(true, metadata, { showSeekForward, showSeekBackward })` plus `setAudioModeAsync({ shouldPlayInBackground: true, interruptionMode: 'doNotMix' })` provide lock screen and Control Center play, pause and seek natively. |
| `app/services/audio/trackPlayerService.ts` (446 lines): `setupPlayer`, `playAudio`, pause, resume, stop, `seekTo`, `skipForward`/`Backward`, state, progress, the progress-save interval, recently-played, `markMessageAsPlayed`, series completion | **New `app/stores/audioStore.ts`**: a Zustand store around one lazily created `AudioPlayer` (`createAudioPlayer`, `replace` per track, one `playbackStatusUpdate` listener). Keep Thrive's side effects inside `playMessage`/listeners: `addToRecentlyPlayed`, resume from `getPlaybackProgressForMessage` through `pendingStartPosition` on `isLoaded`, `savePlaybackProgress` throttled on status updates while playing (`PROGRESS_SAVE_INTERVAL_MS`, `MIN_POSITION_TO_SAVE`, `END_THRESHOLD`), and `markMessageAsPlayed` plus `checkAndMarkCompletion` on `didJustFinish`, with `setCompletionContext`/`clearCompletionContext`. Delete `trackPlayerService.ts` and update `app/services/audio/index.ts`. |
| `playbackService()` in `trackPlayerService.ts:175` (progress saved on remote pause and stop) | **Dead code today**: `index.js` registers `service.js`, so remote pause never saves progress. The store's status-update throttle plus a save in `pause()` fixes that. |
| `updatePlayerSkipIntervals`/`getCurrentSkipIntervals` (lock-screen jump intervals from `PlaybackSettingsScreen`, `usePlaybackSettings.ts`) | In-app skip buttons use the configured interval through store `skip(seconds)`. Lock-screen jump buttons come from `showSeekForward`/`showSeekBackward`; their interval is the platform default (Unknown 4). |
| `setRepeatMode`, `addToQueue`, `clearQueue`, `getQueue` | Delete them; there are no callers outside the service. |
| `app/hooks/usePlayer.ts` (`usePlayer`, `usePlayerProgress` = RNTP `useProgress`, `useTrackPlayerEvents`) | Keep the hook's public shape (`isPlaying`/`isPaused`/`isLoading`/`isStopped`, current track, `play`/`pause`/`resume`/`seekTo`/`togglePlayPause`) as selectors over the store. `usePlayerProgress` returns `{ position, duration }` from the store. Callers stay unchanged: `RecentlyPlayedScreen`, `SermonDetailScreen`, `DownloadsScreen`, `NowPlayingScreen`. |
| `NowPlayingScreen.tsx:15,99,276` `TrackPlayer.setRate` | Store `setRate(rate)` → `player.setPlaybackRate(rate)` (pitch correction on by default). |
| `BiblePassageScreen.tsx:15,61,113–148` and `ChapterReaderScreen.tsx:24,198–278` (reset, add, play, pause, `getPlaybackState`, `getActiveTrack`) | Store `playTrack({ kind: 'bible', uri, title, artist })` on the same singleton. `kind: 'bible'` skips progress, recently-played and completion. State comes from store selectors. |
| Downloads (`app/services/downloads/*`, expo-file-system/legacy) and `isLocal` playback | Unchanged. The store takes the local `file://` URI and prefers it over the stream. |
| Waveform (`NowPlayingScreen` + C6) | Independent of the player; it reads the current track URI from the store. |
| Sleep timer, mini player, queue UI | Thrive has none, so nothing to port. |

Also remove `react-native-track-player` from `package.json`.

## Verification gates (in order, all must pass)

1. `pnpm exec tsc --noEmit`, `pnpm exec expo-doctor` and `pnpm audit --audit-level=moderate`. There's no lint,
   format or Jest config, so those gates don't exist here (adding them is out of scope).
2. `pnpm exec expo export --platform all --output-dir dist` (as CI runs it).
3. **Native assertions** after prebuild (Linux is fine):
   - `ios/ThriveChurchOfficialApp/SceneDelegate.swift` subclasses `ExpoAppSceneDelegate`.
   - Info.plist has `UIApplicationSceneManifest` → `$(PRODUCT_MODULE_NAME).SceneDelegate`.
   - `AppDelegate.swift` has `FirebaseApp.configure()` above `return super.application(...)`, the APNS methods inside
     `class AppDelegate`, and no `UIWindow(`.
   - `Podfile.properties.json` has `"ios.useFrameworks": "dynamic"` and no `forceStaticLinking`.
   - The Podfile has the `# withPodsDeploymentTarget` marker at `16.4`.
   - No RNFB "Unable to determine correct Firebase insertion point" warning appears.
4. **Android on the build box** (from `ThriveChurchExpo/`): run
   `remote -p android/app/build/outputs/apk bash scripts/android/build.sh`, then the same with `Release`. If Kotlin
   metadata fails on BoM 35, add `android: { kotlinVersion: "2.4.0" }` to expo-build-properties and rerun.
   Release must pass R8.
5. **iOS Release build on the founder's iMac with Xcode 27.2**, then install on the iPhone 16 Pro Max (iOS 27) with the
   existing deploy script. **The parent runs this.** The credentials need push enabled.
6. CI green: `validate-dev.yml`, plus `validate-main.yml` for the native jobs.
7. Run gates 1–6 after Phase 1 (audio stubbed), and again after Phase 2.

## Device checklist (iPhone 16 Pro Max, iOS 27, Release; repeat items 2–4 on an Android release APK)

| # | Check | Pass when |
|---|---|---|
| 1 | Cold launch after a fresh install | Splash with the copyright label, then onboarding or Listen. No crash and no black window. |
| 2 | Sermon playback | Start a sermon and let it play **≥ 60 s with no stall** (the iOS 27 expo-video symptom). Play and pause work. Seek with the scrubber and the waveform. Skip ±interval. Speed at 1.5× and back. |
| 3 | Lock screen and background | Title and artwork show on the lock screen and in Control Center. Play, pause and scrub work there. With the app backgrounded for 2 min, audio continues. A phone call or Siri interrupts and then resumes. |
| 4 | Resume and progress | Kill mid-sermon and relaunch: it resumes near that position. Recently Played lists the sermon. Playing to the end marks it played and updates series progress. |
| 5 | Bible audio | Chapter audio plays, pauses, and replaces a running sermon cleanly. |
| 6 | Downloads offline | Download a sermon, turn on airplane mode, and play it from Downloads. The on-device waveform renders. |
| 7 | Push, cold | Kill the app, send FCM, tap it: the app opens on the routed screen. |
| 8 | Push, warm and foreground | A backgrounded tap routes. A foreground message shows the expo-notifications notification; tapping it routes. Badge clears. |
| 9 | Deep links | `thrivechurch://listen/series/<id>` from Notes, both cold and warm, lands on SeriesDetail. |
| 10 | Feeds and webviews | The RSS/blog list and its detail webview, the Live screen webview, and the ESV chapter text all load. |
| 11 | YouTube | The sermon video embed plays inline; "open in YouTube" works. |
| 12 | Share | MoreScreen email share (`Share.shareSingle`) opens Mail. |
| 13 | Notes | Swipe-to-delete (`ReanimatedSwipeable`) works; markdown renders. |
| 14 | Lists and images | Listen, Search and Events (FlashList 2) scroll without blank cells. expo-image artwork loads and caches. |
| 15 | Dark mode | Switching the system appearance live flips the theme; the in-app override still wins. |
| 16 | Tablet | iPad or simulator on Xcode 27: rotation and window resizing work, with no clipping. |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| expo-audio also stutters on iOS 27 (unverified on device) | Medium | Phase 2 gate; device item 2 |
| Static → dynamic frameworks: link or dyld failures; `import FirebaseMessaging` not visible to the app target | Medium | Gate 3, then the iOS build; the C1 fallback (let Firebase swizzle) |
| Push regressions: the expo-notifications swap (two iOS notification delegates), the modular messaging API, cold start under UIScene | Medium–High | C3 spike first; device items 7–8 |
| iOS minimum 15.1 → 16.4 drops live users on iOS 15.x and 16.0–16.3 (Thrive is in the stores) | Certain | The founder accepts it; App Store Connect keeps serving the last compatible build to them |
| Lock-screen jump interval or the Android "stop on app kill" behavior differs with expo-audio | Medium | Device item 3; accepted parity gap if expo-audio lacks them |
| RNFB 27 on Android (Kotlin ≥ 2.4 metadata) | Medium | The Kotlin fallback in gate 4 |
| nitro 0.37 / audio-analyzer 4 on RN 0.88 | Low–Medium | Android and iOS builds; device item 6. If it fails, ship without on-device waveforms (the API waveform still works) |
| FlashList 2 or RNGH 3 layout and gesture regressions | Low | Device items 13–14 |

## Rollback

1. Everything lives on `chore/expo-sdk-58`. Abandon or revert the PR and `dev` stays on SDK 54. SDK 54 keeps building
   with Xcode 26.x until Apple's iOS 27 SDK requirement (April 2027).
2. **Plan B (SDK 57, keeping RNTP): rejected** by the founder on 2026-11-18. The sequence is the full SDK 58
   upgrade.
3. **RNFB fallback (keeps static linking):** `@react-native-firebase/*@26.4.2` plus a `pnpm patch` of
   `plugin/build/ios/appDelegate.js`, adding the `return super.application(...)` and `(?:internal\s+)?import\s+Expo`
   anchors. The modular API is still required.

## Not in scope
- EAS submission and store release (separate, after the device pass).
- Universal links (`associatedDomains`).
- ESLint, Prettier and Jest setup.
- Replacing `react-native-rss-parser` and `react-native-markdown-display`.
- RN `SafeAreaView` deprecation clean-up.
- The pre-existing `.prod` APNS token type.
- A sleep timer.

## Unknowns
1. **expo-audio on iOS 27:** whether it plays without the expo-video stall; device item 2 answers it.
2. **iMac deploy script:** whether it reads tracked `ios/` (C8).
3. **Xcode 27 availability** on GitHub `macos-latest` and on EAS images; check `xcodebuild -version` and set the eas
   image.
4. **expo-audio lock-screen jump interval** (the API has show/hide but no interval) and the Android kill behavior: check them on the device.
5. **Resolved:** expo-notifications (founder, 2026-11-18). The remaining unknown is the delegate interaction with
   RNFB messaging; see the C3 spike.
6. **Build box toolchain** for compileSdk 37, NDK 27.1 and Kotlin 2.4; gate 4 answers this.
