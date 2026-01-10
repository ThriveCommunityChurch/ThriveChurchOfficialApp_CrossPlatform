/**
 * App Configuration
 * Central configuration for the entire app
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get environment variables from Expo Constants
const expoConfig = Constants.expoConfig;
const extra = expoConfig?.extra || {};

/**
 * API Configuration
 */
export const apiConfig = {
  baseURL: extra.API_BASE_URL || 'http://localhost:8080',
  timeout: 30000, // 30 seconds
  thriveApiKey: extra.THRIVE_API_KEY || '',
  esvApiKey: extra.ESV_API_KEY || '',
};

/**
 * YouTube Configuration
 * Used for live streaming feature
 */
export const youtubeConfig = {
  apiKey: extra.YOUTUBE_API_KEY || '',
  channelId: extra.YOUTUBE_CHANNEL_ID || 'UC47Nme86YGrVy1lY15rF3ig',
  channelUrl: 'https://youtube.com/@thrivefl/videos'
};

/**
 * App Information
 */
export const appInfo = {
  name: extra.APP_NAME || 'Thrive Church Official App',
  bundleId: Platform.OS === 'ios'
    ? extra.APP_BUNDLE_ID_IOS || 'com.thrivechurchexpo'
    : extra.APP_BUNDLE_ID_ANDROID || 'com.thrivechurchexpo',
};

/**
 * Deep Linking Configuration
 */
export const deepLinkConfig = {
  scheme: extra.DEEP_LINK_SCHEME || 'thrivechurch',
  host: extra.DEEP_LINK_HOST || 'thrive-fl.org',
  prefixes: [
    `${extra.DEEP_LINK_SCHEME || 'thrivechurch'}://`,
    `https://${extra.DEEP_LINK_HOST || 'thrive-fl.org'}/app`,
    `https://www.${extra.DEEP_LINK_HOST || 'thrive-fl.org'}/app`,
  ],
};

/**
 * Environment
 */
export const environment = {
  name: extra.ENVIRONMENT || 'development',
  isDevelopment: extra.ENVIRONMENT === 'development' || __DEV__,
  isProduction: extra.ENVIRONMENT === 'production',
  isStaging: extra.ENVIRONMENT === 'staging',
};

/**
 * Feature Flags
 */
export const features = {
  analytics: extra.ENABLE_ANALYTICS === 'true',
  crashlytics: extra.ENABLE_CRASHLYTICS === 'true',
  pushNotifications: extra.ENABLE_PUSH_NOTIFICATIONS === 'true',
};

/**
 * Log app configuration (without sensitive data)
 */
export const logAppConfig = (): void => {
  console.log('=== App Configuration ===');
  console.log(`App Name: ${appInfo.name}`);
  console.log(`Bundle ID: ${appInfo.bundleId}`);
  console.log(`Environment: ${environment.name}`);
  console.log(`API Base URL: ${apiConfig.baseURL}`);
  console.log(`Deep Link Scheme: ${deepLinkConfig.scheme}`);
  console.log(`Features:`, features);
  console.log('========================');
};

export default {
  api: apiConfig,
  app: appInfo,
  deepLink: deepLinkConfig,
  environment,
  features,
  youtube: youtubeConfig,
  logAppConfig,
};

