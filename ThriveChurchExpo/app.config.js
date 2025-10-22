/**
 * Expo App Configuration
 * 
 * This file dynamically loads credentials from credentials.json
 * and configures the Expo app accordingly.
 */

const { loadCredentials, credentialsToExpoExtra } = require('./load-credentials');

// Load credentials
const credentials = loadCredentials();
const extra = credentialsToExpoExtra(credentials);

module.exports = {
  expo: {
    name: credentials.app.name,
    slug: "ThriveChurchExpo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: credentials.app.bundleIdIos,
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
      "expo-system-ui",
      "@react-native-firebase/app"
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

