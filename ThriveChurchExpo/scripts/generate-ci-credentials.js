#!/usr/bin/env node

/**
 * Generate Mock Credentials for CI
 * 
 * This script generates a fake credentials.json file for CI/CD environments.
 * It creates valid JSON with mock values that allow the app configuration to load
 * without exposing real API keys or credentials.
 * 
 * Usage: node scripts/generate-ci-credentials.js
 * 
 * This is automatically called by GitHub Actions workflows before running builds.
 */

const fs = require('fs');
const path = require('path');

// Path to the credentials file
const CREDENTIALS_FILE = path.join(__dirname, '..', 'credentials.json');

// Mock credentials with fake but valid-looking values
const mockCredentials = {
  "_comment": "This is a CI-generated mock credentials file. DO NOT use in production.",
  
  "api": {
    "baseUrl": "localhost:8080",
    "thriveApiKey": "mock_thrive_api_key_for_ci_testing_only",
    "esvApiKey": "mock_esv_api_key_for_ci_testing_only"
  },
  
  "firebase": {
    "ios": {
      "clientId": "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com",
      "reversedClientId": "com.googleusercontent.apps.123456789012-abcdefghijklmnopqrstuvwxyz123456",
      "apiKey": "AIzaSyMockApiKeyForCITestingOnly123456789",
      "gcmSenderId": "123456789012",
      "bundleId": "com.thrive-fl.ThriveCommunityChurch",
      "projectId": "thrive-church-ci-mock",
      "storageBucket": "thrive-church-ci-mock.appspot.com",
      "googleAppId": "1:123456789012:ios:abcdef1234567890abcdef",
      "databaseUrl": "https://thrive-church-ci-mock.firebaseio.com"
    },
    "android": {
      "clientId": "123456789012-zyxwvutsrqponmlkjihgfedcba654321.apps.googleusercontent.com",
      "apiKey": "AIzaSyMockApiKeyForCITestingOnly123456789",
      "gcmSenderId": "123456789012",
      "bundleId": "com.thrivefl.ThriveCommunityChurch",
      "projectId": "thrive-church-ci-mock",
      "storageBucket": "thrive-church-ci-mock.appspot.com",
      "googleAppId": "1:123456789012:android:1234567890abcdef123456",
      "databaseUrl": "https://thrive-church-ci-mock.firebaseio.com"
    },
    "common": {
      "projectId": "thrive-church-ci-mock",
      "storageBucket": "thrive-church-ci-mock.appspot.com",
      "messagingSenderId": "123456789012",
      "measurementId": "G-MOCKCITEST12",
      "authDomain": "thrive-church-ci-mock.firebaseapp.com"
    }
  },
  
  "app": {
    "name": "Thrive Church Official App",
    "bundleIdIos": "com.thrive-fl.ThriveCommunityChurch",
    "bundleIdAndroid": "com.thrivefl.ThriveCommunityChurch",
    "deepLinkScheme": "thrivechurch",
    "deepLinkHost": "thrive-fl.org"
  },
  
  "features": {
    "analytics": false,
    "crashlytics": false,
    "pushNotifications": false
  },
  
  "environment": "ci"
};

console.log('🔧 Generating mock credentials for CI...');

try {
  // Write the mock credentials file
  fs.writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify(mockCredentials, null, 2) + '\n',
    'utf8'
  );
  
  console.log('✅ Mock credentials.json created successfully');
  console.log(`   Location: ${CREDENTIALS_FILE}`);
  console.log('   ⚠️  This file contains MOCK data for CI testing only');
  console.log('   ⚠️  DO NOT use these credentials in production builds');
} catch (error) {
  console.error('❌ Failed to generate mock credentials');
  console.error('Error details:', error.message);
  process.exit(1);
}

