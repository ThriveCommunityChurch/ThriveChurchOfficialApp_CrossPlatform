# Thrive Church Expo - Developer Quick Start

> For app features and overview, see the [main README](../README.md).

## 📋 Prerequisites

- Node.js 18+ installed
- Xcode (for iOS development)
- Android Studio (for Android development)
- Git

---

## ⚡ Quick Setup (5 minutes)

### 1. Clone & Install

```bash
cd ThriveChurchExpo
npm install
```

### 2. Setup Credentials

```bash
# Copy template for development
cp credentials.template.json credentials.development.json

# Edit credentials.development.json with actual values
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

### Environment-Based Credentials

The app supports separate credentials for development and production:

| File | Environment | Usage |
|------|-------------|-------|
| `credentials.development.json` | Development | Default when running `npx expo run:ios` |
| `credentials.production.json` | Production | Used with `APP_ENV=production` |

### First Time Setup

1. **Get credentials** from team lead (via 1Password or secure channel)

2. **Create development credentials:**
   ```bash
   cp credentials.template.json credentials.development.json
   ```

3. **Fill in actual values** in `credentials.development.json`:
   - API keys (Thrive API, ESV API, YouTube API)
   - Firebase configuration (from Firebase Console)
   - App bundle IDs
   - Set `environment: "development"`

4. **Create production credentials** (when ready to ship):
   ```bash
   cp credentials.development.json credentials.production.json
   # Edit and set environment: "production"
   ```

5. **Generate Firebase files:**
   ```bash
   node generate-firebase-configs.js
   ```

6. **Verify setup:**
   ```bash
   npx expo start
   ```

### Building for Different Environments

```bash
# Development build (default)
npx expo run:ios
npx expo run:android

# Production build
APP_ENV=production npx expo run:ios
APP_ENV=production npx expo run:android
```

### Important Notes

- ⚠️ **NEVER commit credential files to git** (`credentials.*.json`)
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
# iOS - Using Xcode (Archive with Distribution profile)
APP_ENV=production npx expo prebuild --platform ios --clean
open ios/ThriveChurchOfficialApp.xcworkspace
# Then: Product > Archive > Distribute App

# Android - Build AAB for Play Store
APP_ENV=production npx expo prebuild --platform android --clean
cd android && ./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab

# Android - Build APK for testing
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Android Release Signing

Release builds require a keystore. Setup steps:

1. **Generate keystore** (one-time):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore android/app/thrive-release.keystore \
     -alias thrive-release-key -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure passwords** in `android/gradle.properties`:
   ```properties
   THRIVE_RELEASE_STORE_PASSWORD=your_keystore_password
   THRIVE_RELEASE_KEY_PASSWORD=your_key_password
   ```

3. **Verify signing** (optional):
   ```bash
   cd android && ./gradlew signingReport
   ```

> ⚠️ **CRITICAL**: Back up your keystore and passwords securely. If lost, you cannot update your app on the Play Store.

### CI/CD Setup

For automated builds, inject credentials at build time:

```bash
# 1. Create credentials file from CI secrets
echo "$CREDENTIALS_JSON" > credentials.production.json

# 2. Set Android keystore password (if building Android)
export THRIVE_RELEASE_STORE_PASSWORD="$KEYSTORE_PASSWORD"
export THRIVE_RELEASE_KEY_PASSWORD="$KEY_PASSWORD"

# 3. Build with production environment
APP_ENV=production npx expo prebuild --clean
```

Required CI secrets:
- `CREDENTIALS_JSON` - Contents of `credentials.production.json`
- `KEYSTORE_PASSWORD` - Android keystore password (Android builds only)
- `KEY_PASSWORD` - Android key password (Android builds only)
- Keystore file should be stored as a base64-encoded secret or secure file

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
├── credentials.development.json  # ❌ NOT in git - Dev credentials
├── credentials.production.json   # ❌ NOT in git - Prod credentials
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

## 🔥 Firebase & Feature Flags

### Feature-Flagged Services

Firebase services are controlled by feature flags in `credentials.*.json`:

```json
{
  "features": {
    "analytics": true,
    "crashlytics": true,
    "pushNotifications": true
  }
}
```

| Service | Package | Status |
|---------|---------|--------|
| **Analytics** | `@react-native-firebase/analytics` | ✅ Working (feature-flagged) |
| **Crashlytics** | `@react-native-firebase/crashlytics` | ✅ Working (feature-flagged) |
| **Push Notifications** | `@react-native-firebase/messaging` + `@notifee/react-native` | ✅ Working (feature-flagged) |

### How Feature Flags Work

- **Enabled (`true`)**: Full native Firebase functionality
- **Disabled (`false`)**: Gracefully stubbed (logs to console in dev)

Feature flags are loaded at build time via `app.config.js` and available at runtime via `Constants.expoConfig.extra`.

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

### "No credentials file found"

```bash
# Create development credentials
cp credentials.template.json credentials.development.json
# Edit credentials.development.json with actual values

# For production builds, also create:
cp credentials.template.json credentials.production.json
```

### "Missing required credentials"

Check that all required fields in your credentials file are filled in. Compare with `credentials.template.json`.

Required fields:
- `api.baseUrl`, `api.thriveApiKey`, `api.esvApiKey`
- `firebase.ios.apiKey`, `firebase.ios.projectId`
- `firebase.android.apiKey`, `firebase.android.projectId`

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
- Keep `credentials.*.json` files secure
- Use `credentials.development.json` for dev, `credentials.production.json` for prod
- Rotate API keys periodically
- Share credentials via secure channels (1Password)
- Review `.gitignore` before commits

### ❌ DON'T
- Commit `credentials.*.json` files to git
- Share credentials in plain text (Slack, email)
- Use production keys in development
- Hardcode credentials in source files
- Commit Firebase config files or keystores

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
- [ ] `credentials.*.json` files are NOT staged (`git status`)
- [ ] Firebase config files are NOT staged
- [ ] Keystore files are NOT staged
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Code follows project conventions

---

## 🎊 You're Ready!

You should now be able to:
- ✅ Run the app in development
- ✅ Build for iOS and Android
- ✅ Make changes and test
- ✅ Manage credentials securely

**Happy coding! 🚀**

