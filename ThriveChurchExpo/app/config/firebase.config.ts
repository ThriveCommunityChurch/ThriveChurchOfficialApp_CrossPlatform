/**
 * Firebase Configuration
 * Manages Firebase credentials and settings from environment variables
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logWarning } from '../services/logging/logger';

// Get environment variables from Expo Constants
const extra = Constants.expoConfig?.extra || {};

/**
 * Firebase configuration interface
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Get Firebase configuration from environment variables
 * Uses platform-specific App IDs (iOS vs Android)
 */
export const getFirebaseConfig = (): FirebaseConfig => {
  const appId = Platform.OS === 'ios'
    ? extra.FIREBASE_APP_ID_IOS
    : extra.FIREBASE_APP_ID_ANDROID;

  return {
    apiKey: extra.FIREBASE_API_KEY || '',
    authDomain: extra.FIREBASE_AUTH_DOMAIN || '',
    projectId: extra.FIREBASE_PROJECT_ID || '',
    storageBucket: extra.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: appId || '',
    measurementId: extra.FIREBASE_MEASUREMENT_ID,
  };
};

/**
 * Validate Firebase configuration
 * Returns true if all required fields are present
 */
export const validateFirebaseConfig = (): boolean => {
  const config = getFirebaseConfig();
  
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  for (const field of requiredFields) {
    if (!config[field as keyof FirebaseConfig]) {
      console.warn(`Firebase config validation failed: Missing ${field}`);
      logWarning(`Firebase config validation failed: Missing ${field}`).catch(() => {
        // Ignore logging errors during config validation
      });
      return false;
    }
  }

  return true;
};

/**
 * Check if Firebase is configured
 * Returns true if Firebase configuration files exist
 * Note: This checks environment variables, not native config files
 */
export const isFirebaseConfigured = (): boolean => {
  try {
    return validateFirebaseConfig();
  } catch (error) {
    console.error('Error checking Firebase configuration:', error);
    return false;
  }
};

/**
 * Get environment name
 */
export const getEnvironment = (): string => {
  return extra.ENVIRONMENT || 'development';
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

/**
 * Feature flags from environment
 */
export const featureFlags = {
  analytics: extra.ENABLE_ANALYTICS === 'true',
  crashlytics: extra.ENABLE_CRASHLYTICS === 'true',
  pushNotifications: extra.ENABLE_PUSH_NOTIFICATIONS === 'true',
};

/**
 * Log Firebase configuration status (without exposing sensitive data)
 */
export const logFirebaseConfigStatus = (): void => {
  const isConfigured = isFirebaseConfigured();
  const env = getEnvironment();
  
  console.log('=== Firebase Configuration Status ===');
  console.log(`Environment: ${env}`);
  console.log(`Configured: ${isConfigured ? 'yes' : 'no'}`);
  console.log(`Platform: ${Platform.OS}`);
  console.log(`Analytics: ${featureFlags.analytics ? 'Enabled' : 'Disabled'}`);
  console.log(`Crashlytics: ${featureFlags.crashlytics ? 'Enabled' : 'Disabled'}`);
  console.log(`Push Notifications: ${featureFlags.pushNotifications ? 'Enabled' : 'Disabled'}`);
  
  if (!isConfigured) {
    console.warn('WARNING: Firebase is not configured. Please add Firebase credentials to .env file.');
    console.warn('See .env.example for required values.');
    logWarning('Firebase is not configured - missing credentials in .env file').catch(() => {
      // Ignore logging errors during config check
    });
  }
  
  console.log('====================================');
};

export default {
  getFirebaseConfig,
  validateFirebaseConfig,
  isFirebaseConfigured,
  getEnvironment,
  isDevelopment,
  isProduction,
  featureFlags,
  logFirebaseConfigStatus,
};

