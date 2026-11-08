#!/usr/bin/env bash
# Debug APK build that proves the native Android project compiles. Agents run it on the shared
# build box from a claudebox host or the iMac (KDM Scripts buildbox/README.md "Android builds"):
#   cd ThriveChurchExpo && remote -p android/app/build/outputs/apk bash scripts/android/build.sh
# credentials.json / google-services.json never cross to the box (gitignored); missing ones are
# replaced with the same CI stand-ins validate-main.yml uses, so the APK verifies the build only.
set -euo pipefail
cd "$(dirname "$0")/../.."
[ -d "$HOME/.local/node26/bin" ] && export PATH="$HOME/.local/node26/bin:$PATH"  # build box: engines >=26
[ -f credentials.json ] || node scripts/generate-ci-credentials.js
[ -f google-services.json ] || cp scripts/android/google-services.mock.json google-services.json
pnpm install --frozen-lockfile
EXPO_NO_TELEMETRY=1 npx expo prebuild --platform android --no-install --clean
cd android
gate=(); command -v gate >/dev/null && gate=(gate android-build 2)  # build box: 2 at once, memory-capped
"${gate[@]}" ./gradlew assembleDebug
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"
