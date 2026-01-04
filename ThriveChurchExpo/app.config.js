/**
 * Expo App Configuration
 *
 * This file dynamically loads credentials from credentials.json
 * and configures the Expo app accordingly.
 *
 * Version is managed in version.json - use scripts/increment-build.js
 * to increment the build number before each release.
 */

const fs = require('fs');
const path = require('path');
const { loadCredentials, credentialsToExpoExtra } = require('./load-credentials');

// Load credentials
const credentials = loadCredentials();
const extra = credentialsToExpoExtra(credentials);

// Load version info
const versionPath = path.join(__dirname, 'version.json');
const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

module.exports = {
  expo: {
    name: credentials.app.name,
    slug: "ThriveChurchExpo",
    version: versionData.version,
    jsEngine: "hermes",
    // Allow rotation on tablets while keeping portrait default on phones
    // This enables proper tablet layouts in landscape mode
    orientation: "default",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: credentials.app.bundleIdIos,
      buildNumber: String(versionData.buildNumber),
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        // Firebase URL Schemes
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              credentials.firebase.ios.reversedClientId,
              credentials.app.bundleIdIos,
            ]
          }
        ],
        // Deep linking and external app schemes (matches old iOS project)
        LSApplicationQueriesSchemes: [
          credentials.app.deepLinkScheme,
          "youtube",
          "fbauth2",
          "fbapi",
          "twitter",
          "instagram",
          "fb"
        ],
        // App Transport Security - Allow HTTP connections (matches old iOS project)
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        },
        // Background modes for audio playback and notifications (matches old iOS project)
        UIBackgroundModes: [
          "audio",
          "fetch",
          "remote-notification"
        ],
        // Firebase configuration (matches old iOS project)
        FirebaseAppDelegateProxyEnabled: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: credentials.app.bundleIdAndroid,
      versionCode: versionData.buildNumber,
      googleServicesFile: "./google-services.json",
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            // Workaround for React Native Firebase + Expo SDK 54 build errors
            // See: https://github.com/invertase/react-native-firebase/issues/8657#issuecomment-3236409106
            // Force static linking for Firebase pods to avoid modular header issues
            forceStaticLinking: ["RNFBApp", "RNFBAnalytics", "RNFBMessaging"]
          },
          android: {
            ndkVersion: "26.1.10909125"
          }
        }
      ],
      [
        "expo-splash-screen",
        {
          // Enable full-screen image support (legacy mode for full-screen splash images)
          enableFullScreenImage_legacy: true,
          image: "./assets/splash.png",
          resizeMode: "cover",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-system-ui",
      "@react-native-firebase/app",
      // Custom plugin to configure push notifications (entitlements + Xcode capabilities)
      "./plugins/withPushNotifications.js",
      // Custom plugin to add copyright text to splash screen (runs after expo-splash-screen)
      "./plugins/withSplashScreenCopyright.js",
      // Custom plugin to configure dynamic theme support (iOS + Android)
      "./plugins/withThemeConfiguration.js",
      // Custom plugin to add native UI tests (XCUITest for iOS, Espresso for Android)
      "./plugins/withNativeUITests.js",
      // Custom plugin to apply Xcode recommended settings (avoids manual updates each time you open Xcode)
      "./plugins/withXcodeSettings.js",
      // Custom plugin to enable tablet support and rotation on Android/iOS tablets
      "./plugins/withTabletSupport.js"
      // Note: @react-native-firebase/analytics and @react-native-firebase/messaging
      // do not have Expo config plugins. They are configured via native files
      // (GoogleService-Info.plist and google-services.json) and work at runtime.
      // "@react-native-firebase/crashlytics", // Temporarily disabled due to Expo SDK 54 compatibility issues
    ],
    extra: extra,
    scheme: credentials.app.deepLinkScheme,
    // EAS Build configuration
    owner: "thrive-church",
    updates: {
      fallbackToCacheTimeout: 0
    },
    runtimeVersion: {
      policy: "sdkVersion"
    }
  }
};

