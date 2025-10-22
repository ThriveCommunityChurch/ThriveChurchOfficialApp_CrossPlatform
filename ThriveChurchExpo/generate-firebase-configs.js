/**
 * Generate Firebase Configuration Files
 * 
 * This script generates GoogleService-Info.plist (iOS) and google-services.json (Android)
 * from the centralized credentials.json file.
 * 
 * Run this script after updating credentials.json:
 *   node generate-firebase-configs.js
 */

const fs = require('fs');
const path = require('path');

const CREDENTIALS_FILE = path.join(__dirname, 'credentials.json');
const IOS_OUTPUT = path.join(__dirname, 'ios', 'ThriveChurchExpo', 'GoogleService-Info.plist');
const IOS_ROOT_OUTPUT = path.join(__dirname, 'GoogleService-Info.plist');
const ANDROID_OUTPUT = path.join(__dirname, 'android', 'app', 'google-services.json');
const ANDROID_ROOT_OUTPUT = path.join(__dirname, 'google-services.json');

/**
 * Load credentials
 */
function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    console.error('ERROR: credentials.json not found!');
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('ERROR: Failed to parse credentials.json:', error.message);
    process.exit(1);
  }
}

/**
 * Generate GoogleService-Info.plist for iOS
 */
function generateIOSPlist(credentials) {
  const ios = credentials.firebase.ios;
  
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>CLIENT_ID</key>
\t<string>${ios.clientId}</string>
\t<key>REVERSED_CLIENT_ID</key>
\t<string>${ios.reversedClientId}</string>
\t<key>API_KEY</key>
\t<string>${ios.apiKey}</string>
\t<key>GCM_SENDER_ID</key>
\t<string>${ios.gcmSenderId}</string>
\t<key>PLIST_VERSION</key>
\t<string>1</string>
\t<key>BUNDLE_ID</key>
\t<string>${ios.bundleId}</string>
\t<key>PROJECT_ID</key>
\t<string>${ios.projectId}</string>
\t<key>STORAGE_BUCKET</key>
\t<string>${ios.storageBucket}</string>
\t<key>IS_ADS_ENABLED</key>
\t<false></false>
\t<key>IS_ANALYTICS_ENABLED</key>
\t<${credentials.features.analytics}></${credentials.features.analytics}>
\t<key>IS_APPINVITE_ENABLED</key>
\t<true></true>
\t<key>IS_GCM_ENABLED</key>
\t<true></true>
\t<key>IS_SIGNIN_ENABLED</key>
\t<true></true>
\t<key>GOOGLE_APP_ID</key>
\t<string>${ios.googleAppId}</string>
\t<key>DATABASE_URL</key>
\t<string>${ios.databaseUrl}</string>
</dict>
</plist>
`;

  return plist;
}

/**
 * Generate google-services.json for Android
 */
function generateAndroidJson(credentials) {
  const android = credentials.firebase.android;
  const common = credentials.firebase.common;
  
  const config = {
    "project_info": {
      "project_number": android.gcmSenderId,
      "firebase_url": android.databaseUrl,
      "project_id": android.projectId,
      "storage_bucket": android.storageBucket
    },
    "client": [
      {
        "client_info": {
          "mobilesdk_app_id": android.googleAppId,
          "android_client_info": {
            "package_name": android.bundleId
          }
        },
        "oauth_client": [
          {
            "client_id": android.clientId,
            "client_type": 3
          }
        ],
        "api_key": [
          {
            "current_key": android.apiKey
          }
        ],
        "services": {
          "appinvite_service": {
            "other_platform_oauth_client": [
              {
                "client_id": android.clientId,
                "client_type": 3
              }
            ]
          }
        }
      }
    ],
    "configuration_version": "1"
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Main function
 */
function main() {
  console.log('🔧 Generating Firebase configuration files...\n');

  // Load credentials
  const credentials = loadCredentials();
  console.log('Credentials loaded');

  // Generate iOS plist
  const iosPlist = generateIOSPlist(credentials);
  const iosDir = path.dirname(IOS_OUTPUT);
  
  if (!fs.existsSync(iosDir)) {
    console.log(`Creating iOS directory: ${iosDir}`);
    fs.mkdirSync(iosDir, { recursive: true });
  }
  
  fs.writeFileSync(IOS_OUTPUT, iosPlist, 'utf8');
  console.log(`Generated: ${IOS_OUTPUT}`);

  // Also copy to root for Expo prebuild
  fs.writeFileSync(IOS_ROOT_OUTPUT, iosPlist, 'utf8');
  console.log(`Generated: ${IOS_ROOT_OUTPUT}`);

  // Generate Android json
  const androidJson = generateAndroidJson(credentials);
  const androidDir = path.dirname(ANDROID_OUTPUT);

  if (!fs.existsSync(androidDir)) {
    console.log(`Creating Android directory: ${androidDir}`);
    fs.mkdirSync(androidDir, { recursive: true });
  }

  fs.writeFileSync(ANDROID_OUTPUT, androidJson, 'utf8');
  console.log(`Generated: ${ANDROID_OUTPUT}`);

  // Also copy to root for Expo prebuild
  fs.writeFileSync(ANDROID_ROOT_OUTPUT, androidJson, 'utf8');
  console.log(`Generated: ${ANDROID_ROOT_OUTPUT}`);

  console.log('\nFirebase configuration files generated successfully!');
  console.log('\nRemember: These files are in .gitignore and should NOT be committed to git');
}

// Run the script
main();

