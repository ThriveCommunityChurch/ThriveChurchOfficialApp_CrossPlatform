# Quick Start Guide - Expo Bare Workflow

Get up and running with Thrive Church app development using Expo Bare Workflow in minutes.

---

## Prerequisites

### Required Software

**For Android Development:**
- Node.js (v16 or higher)
- Android Studio with Android SDK
- Java Development Kit (JDK 17+)

**For iOS Development (macOS only):**
- Node.js (v16 or higher)
- Xcode (latest version)
- CocoaPods

### Install Expo CLI

```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Verify installation
expo --version
```

---

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd ThriveChurchExpo

# Install Node dependencies
npm install

# For iOS only: Install CocoaPods dependencies
cd ios && pod install && cd ..
```

### 2. Configure Environment Variables (Android)

Add to your `~/.zshrc` or `~/.bash_profile`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

---

## Running the App

### Method 1: Direct Build and Run (Recommended)

#### iOS
```bash
# Build and run on iOS simulator
npx expo run:ios

# Or specify a specific simulator
npx expo run:ios --device="iPhone 15 Pro"
```

#### Android
```bash
# Build and run on Android emulator/device
npx expo run:android

# Or specify a specific device
npx expo run:android --device="emulator-5554"
```

### Method 2: Development Server

```bash
# Start Expo development server
npx expo start --dev-client

# Then press:
# 'i' for iOS simulator
# 'a' for Android emulator
# 'r' to reload
# 'j' to open debugger
```

---

## Development Workflow

### First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   cd ios && pod install && cd ..
   ```

2. **Start an emulator/simulator:**
   - **Android:** Open Android Studio → AVD Manager → Start emulator
   - **iOS:** Will boot automatically when running the app

3. **Build and run the app:**
   ```bash
   npx expo run:ios      # For iOS
   # OR
   npx expo run:android  # For Android
   ```

### Daily Development

**Option A: Using Development Server (Faster for JS changes)**
```bash
# Terminal 1: Start development server
npx expo start --dev-client

# Use the interactive menu:
# Press 'i' for iOS, 'a' for Android
# Press 'r' to reload, 'j' for debugger
```

**Option B: Direct Build (Required for native changes)**
```bash
# Build and run directly
npx expo run:ios      # For iOS
npx expo run:android  # For Android
```

### Making Changes

1. **JavaScript/TypeScript changes:**
   - Save your files
   - App will reload automatically (Fast Refresh)
   - Or press 'r' in development server

2. **Native code changes:**
   - Rebuild the app: `npx expo run:ios` or `npx expo run:android`

3. **New dependencies:**
   ```bash
   npm install <package-name>
   
   # For iOS, update pods if needed
   cd ios && pod install && cd ..
   
   # Rebuild the app
   npx expo run:ios
   npx expo run:android
   ```

---

## Common Commands

### Development
```bash
# Start development server
npx expo start --dev-client

# Start with cleared cache
npx expo start --dev-client --clear

# Build and run iOS
npx expo run:ios

# Build and run Android
npx expo run:android

# Build for specific devices
npx expo run:ios --device="iPad Pro (12.9-inch) (6th generation)"
npx expo run:android --device="Pixel_7_API_34"
```

### Debugging
```bash
# Open React DevTools
npx expo start --dev-client
# Then press 'j' in the terminal

# View logs
# iOS: Check Metro bundler output or Xcode console
# Android: adb logcat | grep -i "ReactNative\|Expo"
```

### Clean Builds
```bash
# Clear Metro cache
npx expo start --dev-client --clear

# Clean iOS build
cd ios && rm -rf build && pod install && cd ..
npx expo run:ios

# Clean Android build
cd android && ./gradlew clean && cd ..
npx expo run:android
```

---

## Device Management

### iOS Simulators
```bash
# List available simulators
xcrun simctl list devices | grep iPhone

# Boot a specific simulator
xcrun simctl boot "iPhone 15 Pro"

# Run on specific simulator
npx expo run:ios --device="iPhone 15 Pro"
```

### Android Emulators
```bash
# List connected devices
adb devices -l

# Setup port forwarding for Metro
adb reverse tcp:8081 tcp:8081

# Run on specific device
npx expo run:android --device="emulator-5554"
```

---

## Testing the Audio Features

The app includes a professional audio player with advanced features:

### Test Lock Screen Controls
1. **Start the app** and tap "Play Sample Sermon"
2. **Minimize the app** (iOS: Cmd+Shift+H, Android: Home button)
3. **Check Control Center/Notification Panel** for media controls
4. **Test play/pause** from lock screen
5. **Test skip controls** (15-second forward/backward)

### Test Background Audio
1. **Start audio playback**
2. **Switch to another app** or lock the device
3. **Verify audio continues playing**
4. **Test remote controls** (AirPods, Bluetooth headphones)

---

## Project Structure

```
ThriveChurchExpo/
├── App.js                    # Main app component with audio player
├── app.json                  # Expo configuration
├── package.json              # Dependencies and scripts
├── service.js                # TrackPlayer background service
├── index.js                  # App entry point
├── assets/                   # Images, icons, splash screens
├── ios/                      # iOS native code
│   ├── Podfile              # CocoaPods dependencies
│   └── ThriveChurchExpo.xcworkspace
├── android/                  # Android native code
│   └── app/build.gradle     # Android dependencies
└── docs/                     # Documentation
    ├── BUILD_AND_DEPLOYMENT.md
    └── QUICK_START.md
```

---

## Troubleshooting

### Common Issues

#### "No development build found"
```bash
# Build a development build first
npx expo run:ios      # For iOS
npx expo run:android  # For Android
```

#### Metro bundler connection issues
```bash
# Clear cache and restart
npx expo start --dev-client --clear

# For Android, setup port forwarding
adb reverse tcp:8081 tcp:8081
```

#### iOS build fails
```bash
# Clean and reinstall pods
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..
npx expo run:ios
```

#### Android build fails
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
npx expo run:android
```

#### App crashes on startup
```bash
# Check logs
# iOS: Check Xcode console or Metro output
# Android: adb logcat | grep -i "ReactNative\|Expo"

# Try clearing cache
npx expo start --dev-client --clear
```

### Audio Player Issues

#### No sound playing
1. **Check device volume** and mute switch
2. **Verify internet connection** (sample uses online audio)
3. **Check Metro logs** for TrackPlayer errors
4. **Test on physical device** (simulators have audio limitations)

#### Lock screen controls not working
1. **Test on physical device** (simulators don't support lock screen controls)
2. **Check iOS Background App Refresh** settings
3. **Verify TrackPlayer service** is registered in `index.js`

---

## Next Steps

### Immediate
1. **Test the audio player** - Tap "Play Sample Sermon" and test controls
2. **Add Firebase configuration** - See Firebase setup guide
3. **Customize the app** - Replace sample content with your church's data

### Advanced
1. **Setup EAS Build** for production builds
2. **Configure push notifications** with Firebase
3. **Add deep linking** for sharing content
4. **Setup analytics** to track user engagement

---

## Key Differences from React Native CLI

**Commands:**
- `npx react-native run-ios` → `npx expo run:ios`
- `npx react-native run-android` → `npx expo run:android`
- `npm start` → `npx expo start --dev-client`

**Benefits:**
- ✅ **Automatic linking** - No manual native module setup
- ✅ **Better tooling** - Interactive development server
- ✅ **EAS Build** - Cloud builds for production
- ✅ **Simplified config** - Single `app.json` file
- ✅ **OTA Updates** - Update JavaScript without app store

---

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review the [Full Build & Deployment Guide](BUILD_AND_DEPLOYMENT.md)
3. Check Expo documentation: https://docs.expo.dev/
4. Review error logs in Metro bundler or device logs

---

## Success! 🎉

You now have a working Expo Bare Workflow app with:
- ✅ Professional audio playback with lock screen controls
- ✅ Cross-platform compatibility (iOS + Android)
- ✅ Modern development workflow with Expo tooling
- ✅ Full native access for advanced features

**The app should be running in your simulator with a working audio player!**

---

**Built with ❤️ using Expo Bare Workflow**
