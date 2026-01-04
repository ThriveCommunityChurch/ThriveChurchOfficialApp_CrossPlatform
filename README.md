# Thrive Church Official App

A modern cross-platform mobile application for Thrive Community Church in Estero, FL, designed to help members and visitors stay connected with sermons, take notes, and engage with the church community.

[![iOS & Android Builds](https://github.com/ThriveCommunityChurch/ThriveChurchOfficialApp_CrossPlatform/actions/workflows/validate-main.yml/badge.svg)](https://github.com/ThriveCommunityChurch/ThriveChurchOfficialApp_CrossPlatform/actions/workflows/validate-main.yml)

## 📱 Download
Cross-platform app for iOS and Android coming soon!

Search for **"Thrive Church Official App"** in the Apple App Store or Google Play Store.

## 🎯 Key Features

### 🎧 Listen
- Stream sermons with background playback and lock screen controls
- Download for offline listening with WiFi-only option and series downloads
- Search by tags, series, or speaker
- Playback speed controls and resume playback support
- Waveform visualization and recently played history

### 📝 Notes
- Take sermon notes with full text editing
- Notes linked to specific sermons for easy reference

### 🤝 Connect
- Native screens for I'm New, Social, Serve, and About
- RSS announcements, prayer requests, small groups, and volunteer opportunities
- Contact info, directions, and social media links

### 📖 Bible
- ESV Bible passage reading with audio playback
- YouVersion integration with deep links

### ⚙️ Settings & Experience
- Dark/light mode with automatic or manual switching
- Multi-language support (i18n)
- Onboarding flow for first-time users
- Optimized tablet layouts for iPad and Android tablets
- Offline support with graceful degradation

## 🛠 Technical Specifications

- **Platform**: iOS and Android (Universal app)
- **iOS Version**: iOS 15.0 or later
- **Android Version**: Android 5.0 (API 21) or later
- **Framework**: React Native 0.81.4 via Expo Bare
- **Language**: TypeScript with React Hooks
- **Architecture**: Component-based architecture with custom hooks and context providers
- **State Management**: Zustand for global state, React Query for server state
- **Navigation**: React Navigation (Stack & Bottom Tabs) with custom header and footer components
- **Storage**: AsyncStorage for local data persistence
- **Audio**: react-native-track-player for professional audio playback
- **Design**: Modern card-based UI with responsive layouts for phones and tablets

## 🚀 Quick Start

### Prerequisites

**For iOS Development (macOS only):**
- Xcode 15.0 or later
- iOS 15.0+ deployment target
- CocoaPods installed (`sudo gem install cocoapods`)
- Node.js (v16 or higher)

**For Android Development:**
- Android Studio with Android SDK
- Java Development Kit (JDK 17+)
- Node.js (v16 or higher)

### Setup Instructions

1. **Clone and setup**:
   ```bash
   git clone https://github.com/ThriveCommunityChurch/ThriveChurchOfficialApp_CrossPlatform.git
   cd ThriveChurchOfficialApp_CrossPlatform/ThriveChurchExpo
   npm install
   ```

2. **Configure required files**:
   - Copy `credentials.template.json` to `credentials.json` and fill in your values
   - Add your `GoogleService-Info.plist` file (iOS) to the project root
   - Add your `google-services.json` file (Android) to the project root
   - The app will automatically generate Firebase config files from credentials

3. **iOS Setup**:
   ```bash
   cd ios && pod install && cd ..
   npx expo run:ios
   ```

4. **Android Setup**:
   ```bash
   npx expo run:android
   ```

5. **Development Server**:
   ```bash
   npx expo start --dev-client
   ```

### ⚙️ Configuration Files

#### credentials.json Setup
Copy `credentials.template.json` to `credentials.json` and configure:

```json
{
  "app": {
    "name": "Thrive Church Official App",
    "bundleIdIos": "org.name.ThriveChurchExpo",
    "bundleIdAndroid": "org.name.ThriveChurchExpo",
    "deepLinkScheme": "thrivechurch"
  },
  "api": {
    "baseUrl": "your-api-domain.com",
    "esvApiKey": "your-esv-api-key-here"
  },
  "firebase": {
    "ios": {
      "reversedClientId": "com.googleusercontent.apps.YOUR-CLIENT-ID"
    }
  }
}
```

#### ESV API Configuration
The app integrates with the ESV (English Standard Version) Bible API for scripture reading functionality:

1. **Get your ESV API key**:
   - Visit [https://api.esv.org/](https://api.esv.org/)
   - Create a free account
   - Generate an API key for your application

2. **API Usage**: The ESV API provides:
   - Bible passage text retrieval
   - Audio playback of scripture
   - Integration with sermon content

**Note**: The ESV API is free for non-commercial use with reasonable rate limits. See their [terms of service](https://api.esv.org/docs/) for details.

## 📱 Advanced Features

### 🎵 Professional Audio System
- **Lock screen media controls** with artwork and metadata
- **Background audio playback** continues when app is minimized
- **Remote control events** - Play/pause from Control Center, AirPods, CarPlay
- **15-second skip controls** forward and backward
- **Custom audio session management** with Bluetooth support
- **Offline sermon downloads** for listening without internet
- **Playback speed control** - Adjust sermon playback speed
- **Sleep timer** - Auto-stop playback after set duration

### 📱 Cross-Platform Features
- **Universal Design** - Optimized layouts for phones and tablets
- **React Navigation** - Smooth navigation with native feel
- **AsyncStorage** - Persistent data storage
- **Safe Area Context** - Proper handling of device notches and home indicators
- **Vector Icons** - Beautiful, scalable icons
- **Fast Image Loading** - Optimized image caching and loading
- **WebView Integration** - In-app browser for external content
- **Share Functionality** - Share sermons and content with others

## 🛠 Development Commands

### Basic Commands
```bash
# Start development server
npm start

# Build and run iOS
npm run ios

# Build and run Android
npm run android

# Clear cache and restart
npx expo start --dev-client --clear
```

### Advanced Commands
```bash
# Build for specific iOS simulator
npx expo run:ios --device="iPad Pro (12.9-inch) (6th generation)"

# Build for specific Android device
npx expo run:android --device="Pixel_7_API_34"

# Build release version
npx expo run:ios --configuration Release
npx expo run:android --variant release

# Clean builds
cd ios && rm -rf build Pods Podfile.lock && pod install && cd ..
cd android && ./gradlew clean && cd ..
```

## 🏗 Project Structure

```
ThriveChurchExpo/
├── App.tsx                   # Main app component
├── app.config.js             # Expo configuration (dynamic)
├── package.json              # Dependencies and scripts
├── service.js                # TrackPlayer background service
├── index.js                  # App entry point
├── credentials.json          # App credentials (not in git)
├── load-credentials.js       # Credential loading utility
├── app/
│   ├── components/           # Reusable UI components
│   ├── config/               # App configuration
│   ├── data/                 # Static data and constants
│   ├── hooks/                # Custom React hooks
│   ├── navigation/           # Navigation configuration
│   ├── providers/            # Context providers
│   ├── screens/              # Screen components
│   ├── services/             # API and service layer
│   ├── theme/                # Theme and styling
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── assets/                   # Images, icons, splash screens
├── ios/                      # iOS native code and configuration
├── android/                  # Android native code and configuration
└── docs/                     # Documentation
```

## 🔧 Configuration

### Expo Configuration (app.config.js)
The app is dynamically configured from `credentials.json`:
- **Bundle identifiers**: Configurable per platform
- **Display name**: "Thrive Church Official App"
- **Orientation**: Portrait (with landscape support for media)
- **iOS frameworks**: Static linking for compatibility
- **Background modes**: Audio playback, fetch, remote notifications
- **Deep linking**: Custom URL scheme support

### Key Dependencies
- **react-native-track-player**: Professional audio playback with background support
- **@react-navigation/native**: Navigation framework (Stack & Bottom Tabs)
- **@react-native-async-storage/async-storage**: Local data persistence
- **@tanstack/react-query**: Server state management and caching
- **zustand**: Global state management
- **axios**: HTTP client for API requests
- **react-native-fast-image**: Optimized image loading and caching
- **@shopify/flash-list**: High-performance list rendering
- **react-native-webview**: In-app browser functionality
- **react-native-share**: Native share functionality
- **expo-file-system**: File system access for downloads
- **@notifee/react-native**: Local notifications

## 🧪 Testing

### iOS Testing
```bash
# Test on different simulators
npx expo run:ios --device="iPhone 15 Pro"
npx expo run:ios --device="iPad Pro (12.9-inch) (6th generation)"

# Test audio features
# 1. Play a sermon from the Listen tab
# 2. Minimize app (Cmd+Shift+H)
# 3. Check Control Center for media controls
# 4. Test play/pause from lock screen
# 5. Test 15-second skip forward/backward
```

### Android Testing
```bash
# Test on emulator
npx expo run:android --device="emulator-5554"

# Test audio features
# 1. Play a sermon from the Listen tab
# 2. Use home button to minimize
# 3. Check notification panel for media controls
# 4. Test background audio playback
# 5. Test 15-second skip forward/backward
```

### Feature Testing Checklist
- [ ] Sermon playback with background audio
- [ ] Lock screen controls (iOS) and notification controls (Android)
- [ ] Offline sermon downloads
- [ ] Note taking and editing
- [ ] Bible integration with YouVersion
- [ ] Sharing functionality
- [ ] Deep linking
- [ ] Tablet layouts (iPad/Android tablets)

## 🚀 Deployment

### Development Builds
Development builds include the Expo development client and connect to Metro bundler:

```bash
# iOS development build
npx expo run:ios

# Android development build
npx expo run:android
```

### Production Builds
For production, use EAS Build (Expo Application Services):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build for iOS App Store
eas build --platform ios --profile production

# Build for Google Play Store
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

### App Store Requirements
- **iOS**: Xcode Cloud or EAS Build for production builds
- **Android**: Signed APK/AAB with proper keystore
- **Both**: Privacy policy, support URL, app screenshots
- **Both**: Proper app icons and splash screens

## � Team

### Development Team
- **[Wyatt Baggett](https://github.com/ksigWyatt)** - Lead Designer and Developer

### Quality Assurance
- **Phil Klopke** - Testing
- **[Joel Butcher](https://github.com/joelbutcher)** - QA

## 📞 Support

### Bug Reports & Feature Requests
- **GitHub Issues**: Submit issues directly to this repository
- **Email Support**: Technical issues can be reported through the app's diagnostic tools

### Community
- **Church Website**: [https://thrive-fl.org](https://thrive-fl.org)
- **Social Media**: Follow @ThriveFl on social platforms
- **Location**: Thrive Community Church, Estero, FL

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Before submitting PRs**:
- Ensure the app builds successfully on both iOS and Android
- Test all affected features
- Follow the existing code style and patterns
- Update documentation as needed

## 🆘 Troubleshooting

### Common Issues

**White screen on app launch:**
```bash
# Clear Metro cache and rebuild
npx expo start --dev-client --clear
```

**iOS build fails:**
```bash
# Clean and reinstall pods
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..
npx expo run:ios
```

**Android build fails:**
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
npx expo run:android
```

**Metro bundler connection issues:**
```bash
# For Android, setup port forwarding
adb reverse tcp:8081 tcp:8081

# Reload the app
# iOS: Cmd+R in simulator
# Android: Press 'r' twice or shake device
```

**Audio not playing in background:**
- iOS: Check that Background Modes are enabled in Xcode (Audio, AirPlay, and Picture in Picture)
- Android: Verify foreground service permissions in AndroidManifest.xml
- Both: Ensure TrackPlayer service is properly registered

**Credentials not loading:**
```bash
# Verify credentials.json exists and is valid JSON
cat credentials.json | python -m json.tool

# Regenerate Firebase config files
node generate-firebase-configs.js
```

---

**Version**: 1.0.0 | **React Native**: 0.75.5 | **Expo SDK**: ~54.0 | **Last Updated**: 2025

### Acknowledgements
Thank you to everyone who uses this application, we made it for you - to help make taking notes and hearing the gospel message that much easier for you. Made with ❤️
