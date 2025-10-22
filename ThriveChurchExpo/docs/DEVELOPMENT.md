# Thrive Church Expo - Development Guide

This guide covers debugging, building, and deploying the Thrive Church app built with Expo Bare Workflow.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Running the App](#running-the-app)
- [Debugging](#debugging)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)
- [Known Issues](#known-issues)

---

## Prerequisites

### Required Software

- **Node.js**: v18.x or later
- **npm**: v9.x or later
- **Xcode**: 15.x or later (for iOS development)
- **Android Studio**: Latest version (for Android development)
- **CocoaPods**: 1.14.x or later (for iOS dependencies)
- **Expo CLI**: Installed globally via `npm install -g expo-cli`

### Required Accounts

- **Apple Developer Account**: For iOS builds and App Store deployment
- **Google Play Console Account**: For Android builds and Play Store deployment
- **Expo Account**: For EAS Build (optional but recommended)

---

## Development Setup

### 1. Install Dependencies

```bash
cd ThriveChurchExpo
npm install --legacy-peer-deps
```

**Note**: We use `--legacy-peer-deps` due to some peer dependency conflicts in the current package versions.

### 2. Set Up Credentials

Create a `credentials.json` file in the project root (this file is gitignored):

```json
{
  "api": {
    "baseUrl": "localhost:8080",
    "thriveApiKey": "YOUR_API_KEY",
    "esvApiKey": "YOUR_ESV_API_KEY"
  },
  "firebase": {
    "ios": {
      "apiKey": "YOUR_IOS_API_KEY",
      "projectId": "YOUR_PROJECT_ID",
      "storageBucket": "YOUR_STORAGE_BUCKET",
      "messagingSenderId": "YOUR_SENDER_ID",
      "appId": "YOUR_APP_ID",
      "reversedClientId": "YOUR_REVERSED_CLIENT_ID",
      "googleAppId": "YOUR_GOOGLE_APP_ID",
      "databaseUrl": "YOUR_DATABASE_URL"
    },
    "android": {
      "apiKey": "YOUR_ANDROID_API_KEY",
      "projectId": "YOUR_PROJECT_ID",
      "storageBucket": "YOUR_STORAGE_BUCKET",
      "messagingSenderId": "YOUR_SENDER_ID",
      "appId": "YOUR_APP_ID",
      "databaseUrl": "YOUR_DATABASE_URL"
    }
  },
  "app": {
    "name": "Thrive Church Official App",
    "bundleIdIos": "com.thrive-fl.ThriveCommunityChurch",
    "bundleIdAndroid": "com.thrivefl.ThriveCommunityChurch",
    "deepLinkScheme": "thrivechurch"
  }
}
```

Use `credentials.template.json` as a reference.

### 3. Generate Firebase Configuration Files

```bash
node generate-firebase-configs.js
```

This will create:
- `GoogleService-Info.plist` (iOS)
- `google-services.json` (Android)

### 4. Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

---

## Running the App

### Development Mode (Metro Bundler)

Start the Metro bundler:

```bash
npx expo start
```

Or with cache clearing:

```bash
npx expo start --clear
```

### iOS Development

#### Option 1: Run on Simulator

```bash
npx expo run:ios
```

#### Option 2: Run on Specific Simulator

```bash
npx expo run:ios --simulator="iPhone 15 Pro"
```

#### Option 3: Run on Physical Device

```bash
npx expo run:ios --device
```

**Note**: Physical device requires proper code signing configuration in Xcode.

### Android Development

#### Option 1: Run on Emulator

```bash
npx expo run:android
```

#### Option 2: Run on Physical Device

1. Enable USB debugging on your Android device
2. Connect via USB
3. Run:

```bash
npx expo run:android --device
```

---

## Debugging

### Metro Bundler Debugging

The Metro bundler provides several debugging options:

- **Press `r`**: Reload the app
- **Press `m`**: Toggle menu
- **Press `j`**: Open debugger
- **Press `shift+m`**: More tools
- **Press `?`**: Show all commands

### React Native Debugger

1. Install React Native Debugger:
   ```bash
   brew install --cask react-native-debugger
   ```

2. Open React Native Debugger before starting the app

3. In the app, shake the device (or press `Cmd+D` in simulator) and select "Debug"

### Chrome DevTools

1. In the app, shake the device and select "Debug"
2. Open Chrome and navigate to `chrome://inspect`
3. Click "inspect" under your app

### Viewing Logs

#### iOS Logs

```bash
# View all logs
npx react-native log-ios

# Or use Xcode Console (Cmd+Shift+Y in Xcode)
```

#### Android Logs

```bash
# View all logs
npx react-native log-android

# Or use Android Studio Logcat
```

### Common Debug Commands

```bash
# Clear Metro bundler cache
npx expo start --clear

# Clear iOS build cache
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Clear Android build cache
cd android && ./gradlew clean && cd ..

# Reset everything
watchman watch-del-all
rm -rf node_modules
npm install --legacy-peer-deps
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

---

## Building for Production

### iOS Production Build

#### Method 1: Using EAS Build (Recommended)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure EAS:
   ```bash
   eas build:configure
   ```

4. Build for iOS:
   ```bash
   # For App Store
   eas build --platform ios --profile production

   # For TestFlight
   eas build --platform ios --profile preview
   ```

#### Method 2: Using Xcode

1. Open the project in Xcode:
   ```bash
   open ios/ThriveChurch.xcworkspace
   ```

2. Select "Any iOS Device" or your connected device as the build target

3. In Xcode menu: **Product > Archive**

4. Once archived, click "Distribute App" and follow the wizard

5. Choose distribution method:
   - **App Store Connect**: For App Store submission
   - **Ad Hoc**: For testing on registered devices
   - **Enterprise**: For internal distribution (requires Enterprise account)

### Android Production Build

#### Method 1: Using EAS Build (Recommended)

```bash
# For Google Play Store
eas build --platform android --profile production

# For internal testing (APK)
eas build --platform android --profile preview
```

#### Method 2: Using Gradle

1. Generate a signing key (first time only):
   ```bash
   cd android/app
   keytool -genkeypair -v -storetype PKCS12 -keystore thrive-release-key.keystore -alias thrive-key-alias -keyalg RSA -keysize 2048 -validity 10000
   cd ../..
   ```

2. Create `android/gradle.properties` (gitignored):
   ```properties
   MYAPP_RELEASE_STORE_FILE=thrive-release-key.keystore
   MYAPP_RELEASE_KEY_ALIAS=thrive-key-alias
   MYAPP_RELEASE_STORE_PASSWORD=YOUR_STORE_PASSWORD
   MYAPP_RELEASE_KEY_PASSWORD=YOUR_KEY_PASSWORD
   ```

3. Build the release APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. Build the release AAB (for Play Store):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

5. Find your build:
   - APK: `android/app/build/outputs/apk/release/app-release.apk`
   - AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Troubleshooting

### iOS Build Issues

#### "Command PhaseScriptExecution failed"

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx expo run:ios
```

#### "Module not found" errors

```bash
npx expo start --clear
```

#### CocoaPods installation issues

```bash
sudo gem install cocoapods
pod repo update
```

### Android Build Issues

#### Gradle build failures

```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

#### "SDK location not found"

Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### Metro Bundler Issues

#### Port already in use

```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use a different port
npx expo start --port 8082
```

#### Watchman issues

```bash
watchman watch-del-all
```

---

## Known Issues

### Firebase Modules Temporarily Disabled

**Issue**: Firebase Analytics, Crashlytics, and Messaging are temporarily disabled due to compatibility issues with Expo SDK 54 + React Native Firebase 23.x + static frameworks.

**Current Status**:
- ✅ `@react-native-firebase/app` (core module) - Working
- ❌ `@react-native-firebase/analytics` - Disabled
- ❌ `@react-native-firebase/crashlytics` - Disabled  
- ❌ `@react-native-firebase/messaging` - Disabled

**Workarounds**:
- Analytics: Stubbed with console.log statements
- Push Notifications: Can use `@notifee/react-native` (already installed)
- Crashlytics: Consider using Sentry or Bugsnag

**Future Solutions**:
1. Wait for Expo SDK 55 (may have better compatibility)
2. Downgrade React Native Firebase to v20 or v21
3. Use Firebase JS SDK for some services (loses native features)

### Gesture Handler Import

**Issue**: `react-native-gesture-handler` must be imported first in `index.js`

**Solution**: Already implemented - `import 'react-native-gesture-handler';` is the first line in `index.js`

### App Transport Security (HTTP Connections)

**Issue**: iOS blocks HTTP connections by default

**Solution**: Already configured in `app.config.js`:
```javascript
NSAppTransportSecurity: {
  NSAllowsArbitraryLoads: true
}
```

**Note**: After changing `app.config.js`, run:
```bash
npx expo prebuild --platform ios --clean
```

---

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Firebase Documentation](https://rnfirebase.io/)

---

## Support

For issues or questions, contact the development team or refer to the project's issue tracker.

