# Thrive Church Expo - Quick Start Guide

## 📋 Prerequisites

- Node.js 18+ installed
- Xcode (for iOS development)
- Android Studio (for Android development)
- Git

---

## Key Features

### Listen Screen
- Sermon audio playback
- Video playback
- Downloads for offline listening
- Recently played history

### Bible Screen
- ESV Bible passage reading
- Book/chapter/verse selection
- Bible passage integration with sermons

### Connect Screen
- RSS feed reading
- Web view for external content
- Social media links

### More Screen
- App settings
- About information
- Device information
- Log sharing (for debugging)

---

## ⚡ Quick Setup (5 minutes)

### 1. Clone & Install

```bash
cd ThriveChurchExpo
npm install
```

### 2. Setup Credentials

```bash
# Copy template
cp credentials.template.json credentials.json

# Edit credentials.json with actual values
# (Get credentials from team lead)

# Generate Firebase files
node generate-firebase-configs.js
```

### 3. Start Development

```bash
# Start Expo
npx expo start

# Or run on specific platform
npx expo run:ios
npx expo run:android
```

---

## 🔐 Credentials Setup

### First Time Setup

1. **Get credentials** from team lead (via 1Password or secure channel)

2. **Create credentials.json:**
   ```bash
   cp credentials.template.json credentials.json
   ```

3. **Fill in actual values** in `credentials.json`:
   - API keys (Thrive API, ESV API)
   - Firebase configuration
   - App bundle IDs

4. **Generate Firebase files:**
   ```bash
   node generate-firebase-configs.js
   ```

5. **Verify setup:**
   ```bash
   npx expo start
   ```

### Important Notes

- ⚠️ **NEVER commit `credentials.json` to git**
- ⚠️ **NEVER commit Firebase config files** (GoogleService-Info.plist, google-services.json)
- ✅ These files are in `.gitignore`
- ✅ Use `credentials.template.json` for reference

---

## 🛠️ Common Commands

### Development

```bash
# Start Expo dev server
npx expo start

# Start with cache cleared
npx expo start --clear

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Run on specific iOS device
npx expo run:ios --device

# Run on specific Android device
npx expo run:android --device
```

### Building

```bash
# Prebuild native projects
npx expo prebuild

# Clean prebuild
npx expo prebuild --clean

# Build iOS
npx expo run:ios --configuration Release

# Build Android
npx expo run:android --variant release
```

### Testing

```bash
# Run TypeScript check
npx tsc --noEmit

# Run tests (if configured)
npm test

# Lint code (if configured)
npm run lint
```

### Credentials

```bash
# Regenerate Firebase config files
node generate-firebase-configs.js

# Test credential loading
node -e "const { loadCredentials } = require('./load-credentials'); loadCredentials();"

# Test app config loading
node -e "const config = require('./app.config.js'); console.log(config.expo.name);"
```

### Debugging & Troubleshooting

```bash
# Clear Metro bundler cache
npx expo start --clear

# Clear iOS build cache and reinstall pods
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Clear Android build cache
cd android && ./gradlew clean && cd ..

# Full nuclear reset (when nothing else works)
watchman watch-del-all
rm -rf node_modules
npm install --legacy-peer-deps
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Kill process on port 8081 (if Metro won't start)
lsof -ti:8081 | xargs kill -9

# Rebuild iOS after config changes
npx expo prebuild --platform ios --clean
npx expo run:ios

# Rebuild Android after config changes
npx expo prebuild --platform android --clean
npx expo run:android
```

### Production Builds

```bash
# iOS - Using EAS Build (recommended)
eas build --platform ios --profile production

# iOS - Using Xcode
open ios/ThriveChurch.xcworkspace
# Then: Product > Archive > Distribute App

# Android - Using EAS Build (recommended)
eas build --platform android --profile production

# Android - Build AAB for Play Store
cd android && ./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab

# Android - Build APK for testing
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📁 Project Structure

```
ThriveChurchExpo/
├── app/                          # Application code
│   ├── config/                   # Configuration files
│   │   ├── app.config.ts         # App-wide config
│   │   └── firebase.config.ts    # Firebase config
│   ├── screens/                  # Screen components
│   ├── services/                 # API & services
│   ├── components/               # Reusable components
│   ├── navigation/               # Navigation setup
│   ├── providers/                # Context providers
│   ├── hooks/                    # Custom hooks
│   ├── types/                    # TypeScript types
│   ├── theme/                    # Theme & styling
│   └── utils/                    # Utility functions
│
├── ios/                          # iOS native code
├── android/                      # Android native code
├── assets/                       # Images, fonts, etc.
│
├── credentials.json              # ❌ NOT in git - Your credentials
├── credentials.template.json     # ✅ In git - Template
├── app.config.js                 # ✅ In git - Expo config
├── load-credentials.js           # ✅ In git - Credential loader
├── generate-firebase-configs.js  # ✅ In git - Firebase generator
│
├── App.tsx                       # App entry point
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── .gitignore                    # Git ignore rules
```

---

## ⚠️ Known Issues & Current State

### Firebase Modules Temporarily Disabled

Due to compatibility issues with Expo SDK 54 + React Native Firebase 23.x + static frameworks:

- ✅ **@react-native-firebase/app** (core) - Working
- ❌ **@react-native-firebase/analytics** - Disabled (stubbed with console.log)
- ❌ **@react-native-firebase/crashlytics** - Disabled
- ❌ **@react-native-firebase/messaging** - Disabled (push notifications stubbed)

**Workarounds:**
- Analytics: Currently logs to console with "(disabled)" suffix
- Push Notifications: Can use `@notifee/react-native` (already installed)
- Crashlytics: Consider Sentry or Bugsnag as alternatives

**Future Solutions:**
1. Wait for Expo SDK 55 (may have better compatibility)
2. Downgrade React Native Firebase to v20 or v21
3. Use Firebase JS SDK for some services (loses native features)

### Important Configuration Notes

**After changing `app.config.js`**, you MUST run:
```bash
npx expo prebuild --platform ios --clean
# or
npx expo prebuild --platform android --clean
```

**Always use `--legacy-peer-deps`** when installing npm packages:
```bash
npm install --legacy-peer-deps <package-name>
```

**Gesture Handler Import**: `react-native-gesture-handler` must be imported first in `index.js` (already configured)

**App Transport Security**: iOS allows HTTP connections to the production API server (configured in `app.config.js`)

---

## 🔧 Troubleshooting

### "credentials.json not found"

```bash
cp credentials.template.json credentials.json
# Edit credentials.json with actual values
```

### "Missing required credentials"

Check that all required fields in `credentials.json` are filled in. Compare with `credentials.template.json`.

### Firebase not working

```bash
# Regenerate Firebase config files
node generate-firebase-configs.js

# Clean and rebuild
npx expo prebuild --clean
npx expo run:ios  # or run:android
```

### Changes not reflecting

```bash
# Clear cache and restart
npx expo start --clear
```

### Build errors

```bash
# Clean everything
rm -rf node_modules
rm -rf ios/Pods
rm -rf android/.gradle
npm install
npx expo prebuild --clean
```

### TypeScript errors

```bash
# Check for errors
npx tsc --noEmit

# If errors persist, check:
# - Import paths
# - Type definitions
# - tsconfig.json
```

---

## 🔒 Security Reminders

### ✅ DO
- Keep `credentials.json` secure
- Use different credentials for dev/prod
- Rotate API keys periodically
- Share credentials via secure channels (1Password)
- Review `.gitignore` before commits

### ❌ DON'T
- Commit `credentials.json` to git
- Share credentials in plain text (Slack, email)
- Use production keys in development
- Hardcode credentials in source files
- Commit Firebase config files

---

## 🆘 Getting Help

1. Check this Quick Start guide
2. Read `CREDENTIALS_SETUP.md`
3. Review `credentials.template.json`
4. Check the troubleshooting section
5. Ask team lead for help

---

## 📞 Team Contacts

- **Project Lead:** [Add contact]
- **iOS Developer:** [Add contact]
- **Android Developer:** [Add contact]
- **Backend API:** [Add contact]

---

## ✅ Pre-Commit Checklist

Before committing code:

- [ ] No credentials in source files
- [ ] `credentials.json` is in `.gitignore`
- [ ] Firebase config files are in `.gitignore`
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Code follows project conventions
- [ ] No console.logs left in code (unless intentional)

---

## 🎊 You're Ready!

You should now be able to:
- ✅ Run the app in development
- ✅ Build for iOS and Android
- ✅ Make changes and test
- ✅ Manage credentials securely

**Happy coding! 🚀**

