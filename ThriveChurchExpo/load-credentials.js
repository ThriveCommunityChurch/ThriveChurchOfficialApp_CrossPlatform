/**
 * Credentials Loader
 * 
 * This script loads credentials from credentials.json and makes them available
 * to the Expo app configuration. This keeps sensitive data out of version control.
 * 
 * Usage: This file is automatically loaded by app.config.js
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_FILE = path.join(__dirname, 'credentials.template.json');

/**
 * Determine which credentials file to load based on APP_ENV environment variable.
 *
 * Priority:
 * 1. APP_ENV=production → credentials.production.json
 * 2. APP_ENV=development → credentials.development.json
 * 3. No APP_ENV set → credentials.development.json (default)
 * 4. Fallback → credentials.json (backwards compatibility)
 *
 * Usage:
 *   APP_ENV=production npx expo run:ios
 *   APP_ENV=development npx expo run:android
 */
function getCredentialsFile() {
  const appEnv = process.env.APP_ENV?.toLowerCase() || 'development';

  // Environment-specific files
  const envFile = path.join(__dirname, `credentials.${appEnv}.json`);
  // Legacy fallback
  const legacyFile = path.join(__dirname, 'credentials.json');

  if (fs.existsSync(envFile)) {
    console.log(`📋 Using credentials for environment: ${appEnv}`);
    return { file: envFile, env: appEnv };
  }

  if (fs.existsSync(legacyFile)) {
    console.log(` Using legacy credentials.json (APP_ENV=${appEnv} file not found)`);
    return { file: legacyFile, env: appEnv };
  }

  return { file: null, env: appEnv };
}

/**
 * Load credentials from the appropriate credentials file based on APP_ENV.
 * If the file doesn't exist, provide helpful error message.
 */
function loadCredentials() {
  const { file: credentialsFile, env: appEnv } = getCredentialsFile();

  // Check if credentials file exists
  if (!credentialsFile) {
    console.error('\nERROR: No credentials file found!\n');
    console.error(`Looked for: credentials.${appEnv}.json or credentials.json\n`);
    console.error('Please create a credentials file from the template:\n');
    console.error('   1. Copy credentials.template.json to credentials.development.json');
    console.error('   2. Fill in your actual credential values');
    console.error('   3. For production, also create credentials.production.json');
    console.error('   4. Make sure credentials.*.json files are in .gitignore\n');
    console.error('To select environment: APP_ENV=production npx expo run:ios\n');

    // Check if template exists
    if (fs.existsSync(TEMPLATE_FILE)) {
      console.error('Template file found at: credentials.template.json\n');
    }

    process.exit(1);
  }

  try {
    // Read and parse credentials
    const credentialsContent = fs.readFileSync(credentialsFile, 'utf8');
    const credentials = JSON.parse(credentialsContent);

    // Validate required fields
    validateCredentials(credentials);

    // Warn if environment in file doesn't match APP_ENV
    if (credentials.environment && credentials.environment !== appEnv) {
      console.warn(`  Warning: APP_ENV=${appEnv} but credentials.environment="${credentials.environment}"`);
    }

    console.log(` Credentials loaded successfully (${appEnv})`);
    return credentials;
  } catch (error) {
    console.error(`\nERROR: Failed to load ${path.basename(credentialsFile)}\n`);
    console.error('Error details:', error.message);
    console.error('\nMake sure the file is valid JSON\n');
    process.exit(1);
  }
}

/**
 * Validate that required credential fields are present
 */
function validateCredentials(credentials) {
  const required = [
    'api.baseUrl',
    'api.thriveApiKey',
    'api.esvApiKey',
    'firebase.ios.apiKey',
    'firebase.ios.projectId',
    'firebase.android.apiKey',
    'firebase.android.projectId',
  ];

  const missing = [];

  required.forEach(field => {
    const parts = field.split('.');
    let value = credentials;
    
    for (const part of parts) {
      if (!value || !value[part]) {
        missing.push(field);
        break;
      }
      value = value[part];
    }
  });

  if (missing.length > 0) {
    console.error('\nERROR: Missing required credentials:\n');
    missing.forEach(field => console.error(`   - ${field}`));
    console.error('\nPlease check your credentials.json file\n');
    process.exit(1);
  }
}

/**
 * Convert credentials to Expo extra format
 */
function credentialsToExpoExtra(credentials) {
  return {
    // API Configuration
	    // Use the baseUrl exactly as provided so it can be either
	    // http://localhost:8080 for dev or a full https:// URL in prod.
	    API_BASE_URL: credentials.api.baseUrl,
    THRIVE_API_KEY: credentials.api.thriveApiKey,
    ESV_API_KEY: credentials.api.esvApiKey,
    
    // Firebase Configuration
    FIREBASE_API_KEY: credentials.firebase.ios.apiKey,
    FIREBASE_AUTH_DOMAIN: credentials.firebase.common.authDomain || `${credentials.firebase.common.projectId}.firebaseapp.com`,
    FIREBASE_PROJECT_ID: credentials.firebase.common.projectId,
    FIREBASE_STORAGE_BUCKET: credentials.firebase.common.storageBucket,
    FIREBASE_MESSAGING_SENDER_ID: credentials.firebase.common.messagingSenderId,
    FIREBASE_APP_ID_IOS: credentials.firebase.ios.googleAppId,
    FIREBASE_APP_ID_ANDROID: credentials.firebase.android.googleAppId,
    FIREBASE_DATABASE_URL: credentials.firebase.ios.databaseUrl,
    FIREBASE_CLIENT_ID_IOS: credentials.firebase.ios.clientId,
    FIREBASE_REVERSED_CLIENT_ID_IOS: credentials.firebase.ios.reversedClientId,
    
    // App Configuration
    APP_NAME: credentials.app.name,
    APP_BUNDLE_ID_IOS: credentials.app.bundleIdIos,
    APP_BUNDLE_ID_ANDROID: credentials.app.bundleIdAndroid,
    DEEP_LINK_SCHEME: credentials.app.deepLinkScheme,
    DEEP_LINK_HOST: credentials.app.deepLinkHost,
    
    // Feature Flags
    ENABLE_ANALYTICS: credentials.features.analytics.toString(),
    ENABLE_CRASHLYTICS: credentials.features.crashlytics.toString(),
    ENABLE_PUSH_NOTIFICATIONS: credentials.features.pushNotifications.toString(),
    
    // Environment
    ENVIRONMENT: credentials.environment,

    // YouTube Configuration
    YOUTUBE_API_KEY: credentials.youtube?.apiKey || '',
    YOUTUBE_CHANNEL_ID: credentials.youtube?.channelId || '',
  };
}

module.exports = {
  loadCredentials,
  credentialsToExpoExtra,
};

