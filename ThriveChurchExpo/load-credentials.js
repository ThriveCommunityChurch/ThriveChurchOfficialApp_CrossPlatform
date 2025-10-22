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

const CREDENTIALS_FILE = path.join(__dirname, 'credentials.json');
const TEMPLATE_FILE = path.join(__dirname, 'credentials.template.json');

/**
 * Load credentials from credentials.json
 * If the file doesn't exist, provide helpful error message
 */
function loadCredentials() {
  // Check if credentials.json exists
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    console.error('\nERROR: credentials.json not found!\n');
    console.error('Please create credentials.json from the template:\n');
    console.error('   1. Copy credentials.template.json to credentials.json');
    console.error('   2. Fill in your actual credential values');
    console.error('   3. Make sure credentials.json is in .gitignore\n');
    
    // Check if template exists
    if (fs.existsSync(TEMPLATE_FILE)) {
      console.error('Template file found at: credentials.template.json\n');
    }
    
    process.exit(1);
  }

  try {
    // Read and parse credentials
    const credentialsContent = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
    const credentials = JSON.parse(credentialsContent);
    
    // Validate required fields
    validateCredentials(credentials);
    
    console.log('✅ Credentials loaded successfully');
    return credentials;
  } catch (error) {
    console.error('\nERROR: Failed to load credentials.json\n');
    console.error('Error details:', error.message);
    console.error('\nMake sure credentials.json is valid JSON\n');
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
    API_BASE_URL: `http://${credentials.api.baseUrl}`,
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
  };
}

module.exports = {
  loadCredentials,
  credentialsToExpoExtra,
};

