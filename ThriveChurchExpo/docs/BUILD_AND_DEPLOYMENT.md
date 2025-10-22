# Build and Deployment Guide - Expo Bare Workflow

This guide covers building and deploying the Thrive Church app using Expo Bare Workflow, which provides both local development builds and cloud-based production builds.

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Builds](#development-builds)
- [Production Builds with EAS](#production-builds-with-eas)
- [Local Production Builds](#local-production-builds)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### General Requirements
- Node.js (v16 or higher)
- Expo CLI: `npm install -g @expo/cli`
- EAS CLI: `npm install -g @expo/eas-cli` (for production builds)

### Android Requirements
- Android Studio with Android SDK
- `ANDROID_HOME` environment variable set
- ADB (Android Debug Bridge) available in PATH
- Java Development Kit (JDK 17 or higher)

### iOS Requirements
- macOS with Xcode installed
- CocoaPods installed: `sudo gem install cocoapods`
- iOS device or simulator

---

## Development Builds

Development builds include the Expo development client and connect to Metro bundler for fast iteration.

### 1. Start Development Server

```bash
# Start Expo development server
npx expo start --dev-client

# Or start with cleared cache
npx expo start --dev-client --clear
```

### 2. Build and Run on iOS

#### Option A: Build and Run (Recommended)
```bash
# Build and run on iOS simulator
npx expo run:ios

# Specify a specific simulator
npx expo run:ios --device="iPhone 15 Pro"

# Run on physical device
npx expo run:ios --device="Your iPhone Name"
```

#### Option B: Use Development Server
```bash
# Start development server
npx expo start --dev-client

# Press 'i' to open iOS simulator
# Or scan QR code with Expo Go on physical device
```

### 3. Build and Run on Android

#### Option A: Build and Run (Recommended)
```bash
# Build and run on Android emulator/device
npx expo run:android

# Specify a specific device
npx expo run:android --device="emulator-5554"
npx expo run:android --device="Pixel_7_API_34"
```

#### Option B: Use Development Server
```bash
# Start development server
npx expo start --dev-client

# Press 'a' to open Android emulator
# Or scan QR code with Expo Go on physical device
```

### 4. Development Workflow

**Complete workflow for daily development:**

```bash
# Terminal 1: Start development server
npx expo start --dev-client

# Terminal 2: Build and run (first time or after native changes)
npx expo run:ios    # For iOS
# OR
npx expo run:android # For Android

# After that, just use the development server
# Press 'r' to reload, 'j' to open debugger
```

---

## Production Builds with EAS

EAS (Expo Application Services) provides cloud-based builds that are perfect for production releases.

### 1. Setup EAS

```bash
# Install EAS CLI globally
npm install -g @expo/eas-cli

# Login to your Expo account
eas login

# Initialize EAS in your project
eas build:configure
```

This creates `eas.json` with build configurations.

### 2. Configure Build Profiles

Edit `eas.json` to customize build settings:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3. Build for iOS

```bash
# Development build (includes dev client)
eas build --platform ios --profile development

# Preview build (for TestFlight)
eas build --platform ios --profile preview

# Production build (for App Store)
eas build --platform ios --profile production
```

### 4. Build for Android

```bash
# Development build (includes dev client)
eas build --platform android --profile development

# Preview build (for internal testing)
eas build --platform android --profile preview

# Production build (for Google Play)
eas build --platform android --profile production
```

### 5. Build for Both Platforms

```bash
# Build for both iOS and Android
eas build --platform all --profile production
```

### 6. Monitor Builds

```bash
# View build status
eas build:list

# View specific build details
eas build:view [BUILD_ID]

# Cancel a build
eas build:cancel [BUILD_ID]
```

---

## Local Production Builds

For advanced users who prefer local builds or need custom configurations.

### iOS Local Production Build

```bash
# Build release configuration locally
npx expo run:ios --configuration Release

# Or build with Xcode
# 1. Open ios/ThriveChurchExpo.xcworkspace
# 2. Select "Product" → "Archive"
# 3. Follow App Store submission process
```

### Android Local Production Build

```bash
# Build release APK
npx expo run:android --variant release

# Or build AAB for Google Play
cd android
./gradlew bundleRelease

# The AAB will be at:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## App Store Submission

### iOS App Store (using EAS)

```bash
# Build for production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Google Play Store (using EAS)

```bash
# Build for production
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

### Manual Submission

1. **iOS**: Use Xcode → Window → Organizer → Upload to App Store
2. **Android**: Upload AAB file to Google Play Console

---

## Environment Configuration

### Development Environment

```bash
# Use development configuration
cp .env.development .env
npx expo start --dev-client
```

### Production Environment

```bash
# Use production configuration
cp .env.production .env
eas build --platform all --profile production
```

---

## Troubleshooting

### Development Build Issues

#### Issue: "No development build found"
**Solution:**
```bash
# Build a development build first
npx expo run:ios    # For iOS
npx expo run:android # For Android
```

#### Issue: Metro bundler connection failed
**Solution:**
```bash
# For Android, setup port forwarding
adb reverse tcp:8081 tcp:8081

# Restart development server
npx expo start --dev-client --clear
```

### EAS Build Issues

#### Issue: Build fails with dependency errors
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try build again
eas build --platform ios --profile production
```

#### Issue: iOS build fails with provisioning profile errors
**Solution:**
```bash
# Clear credentials and reconfigure
eas credentials

# Or let EAS manage credentials automatically
eas build --platform ios --profile production --clear-cache
```

### Native Module Issues

#### Issue: New native module not working
**Solution:**
```bash
# For iOS: Reinstall pods
cd ios && pod install && cd ..

# Rebuild the app
npx expo run:ios
npx expo run:android
```

---

## Quick Reference Commands

### Development
```bash
# Start development server
npx expo start --dev-client

# Build and run
npx expo run:ios
npx expo run:android

# Clear cache and restart
npx expo start --dev-client --clear
```

### Production (EAS)
```bash
# Build for production
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android

# View builds
eas build:list
```

### Local Production
```bash
# iOS release build
npx expo run:ios --configuration Release

# Android release build
npx expo run:android --variant release
```

---

## Additional Notes

### Key Differences from React Native CLI

**Expo Bare Workflow Benefits:**
- ✅ **EAS Build**: Cloud builds with zero configuration
- ✅ **Automatic linking**: Native modules link automatically
- ✅ **OTA Updates**: Update JavaScript without app store releases
- ✅ **Simplified config**: Single `app.json` for most settings
- ✅ **Better tooling**: Expo DevTools, debugging, and profiling

**Commands Changed:**
- `npx react-native run-ios` → `npx expo run:ios`
- `npx react-native run-android` → `npx expo run:android`
- `npm start` → `npx expo start --dev-client`

### Firebase Configuration

Before production builds, ensure Firebase is configured:
1. Add `GoogleService-Info.plist` to `ios/` directory
2. Add `google-services.json` to `android/app/` directory
3. Configure Firebase in your app code

### Testing Production Builds

Always test production builds before releasing:
```bash
# Test iOS release build locally
npx expo run:ios --configuration Release

# Test Android release build locally
npx expo run:android --variant release
```

---

**Ready to build and deploy with Expo! 🚀**
