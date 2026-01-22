/**
 * Expo Config Plugin for Android Gradle Configuration
 *
 * This plugin injects CI/CD performance settings and release signing configuration
 * into gradle.properties, persisting across `expo prebuild --clean`.
 *
 * Settings applied:
 * - org.gradle.caching=true (speeds up builds)
 * - org.gradle.configuration-cache=false (required for Expo/RN compatibility)
 * - Release signing configuration from credentials file
 *
 * The plugin also configures build.gradle for release signing.
 */

const { withDangerousMod, withAppBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * CI/CD Performance optimizations for gradle.properties
 */
const CI_CD_CONFIG = `
# ============================================
# CI/CD Performance Optimizations
# ============================================

# Enable Gradle build cache (reuses task outputs from previous builds)
# This significantly speeds up builds by avoiding re-execution of tasks with unchanged inputs
# https://docs.gradle.org/current/userguide/build_cache.html
org.gradle.caching=true

# Enable configuration cache (speeds up configuration phase and enables better parallelization)
# This caches the result of the configuration phase for faster subsequent builds
# https://docs.gradle.org/current/userguide/configuration_cache.html
# DISABLED: Incompatible with Expo/React Native projects that call Node.js during configuration time
# See: https://docs.gradle.org/current/userguide/configuration_cache.html#config_cache:requirements:external_processes
org.gradle.configuration-cache=false
`;

/**
 * Generate release signing configuration for gradle.properties
 */
function generateSigningConfig(credentials) {
  const android = credentials.android || {};
  
  return `
# ============================================
# Release Signing Configuration
# ============================================
# These values configure the release keystore for Play Store builds.
# The keystore file should be in android/app/ directory.
# IMPORTANT: Do not commit real passwords to version control!
# For CI/CD, inject these values via environment variables or secrets.
#
# Use the following command to generate your release keystore file:
# keytool -genkeypair -v -storetype PKCS12 -keystore thrive-release.keystore -alias thrive-release-key -keyalg RSA -keysize 2048 -validity 10000
THRIVE_RELEASE_STORE_FILE=${android.releaseStoreFile || 'thrive-release.keystore'}
THRIVE_RELEASE_STORE_PASSWORD=${android.releaseStorePassword || 'REPLACE_WITH_YOUR_PASSWORD'}
THRIVE_RELEASE_KEY_ALIAS=${android.releaseKeyAlias || 'thrive-release-key'}
THRIVE_RELEASE_KEY_PASSWORD=${android.releaseKeyPassword || 'REPLACE_WITH_YOUR_PASSWORD'}
`;
}

/**
 * Modify gradle.properties to include CI/CD and signing config
 */
const withGradleProperties = (config, { credentials }) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const gradlePropertiesPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle.properties'
      );

      let contents = fs.readFileSync(gradlePropertiesPath, 'utf-8');

      // Check if our config is already present
      if (!contents.includes('# CI/CD Performance Optimizations')) {
        contents += CI_CD_CONFIG;
        console.log('✅ Added CI/CD performance settings to gradle.properties');
      }

      if (!contents.includes('# Release Signing Configuration')) {
        contents += generateSigningConfig(credentials);
        console.log('✅ Added release signing configuration to gradle.properties');
      }

      fs.writeFileSync(gradlePropertiesPath, contents);

      return config;
    },
  ]);
};

/**
 * Modify build.gradle to include release signing configuration
 */
const withReleaseSigning = (config) => {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Check if release signing is already configured
    if (contents.includes('signingConfigs {') && contents.includes('release {')) {
      console.log('✅ Release signing already configured in build.gradle');
      return config;
    }

    // Add signingConfigs block if not present
    const signingConfigsBlock = `
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('THRIVE_RELEASE_STORE_FILE')) {
                storeFile file(THRIVE_RELEASE_STORE_FILE)
                storePassword THRIVE_RELEASE_STORE_PASSWORD
                keyAlias THRIVE_RELEASE_KEY_ALIAS
                keyPassword THRIVE_RELEASE_KEY_PASSWORD
            }
        }
    }`;

    // Find the android { block and insert signingConfigs after it
    const androidBlockMatch = contents.match(/android\s*\{/);
    if (androidBlockMatch) {
      const insertIndex = androidBlockMatch.index + androidBlockMatch[0].length;
      
      // Only add if not already present
      if (!contents.includes('signingConfigs {')) {
        contents = contents.slice(0, insertIndex) + signingConfigsBlock + contents.slice(insertIndex);
        console.log('✅ Added signingConfigs block to build.gradle');
      }
    }

    // Update release buildType to use release signing
    contents = contents.replace(
      /buildTypes\s*\{[\s\S]*?release\s*\{/,
      (match) => {
        if (!match.includes('signingConfig')) {
          return match + '\n            signingConfig signingConfigs.release';
        }
        return match;
      }
    );

    config.modResults.contents = contents;
    return config;
  });
};

/**
 * Main plugin function
 */
const withAndroidGradleConfig = (config, { credentials }) => {
  config = withGradleProperties(config, { credentials });
  config = withReleaseSigning(config);
  return config;
};

module.exports = withAndroidGradleConfig;

