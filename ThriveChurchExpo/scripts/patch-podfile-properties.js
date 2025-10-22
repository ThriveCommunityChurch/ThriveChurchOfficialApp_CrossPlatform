#!/usr/bin/env node

/**
 * Patch ios/Podfile.properties.json to fix forceStaticLinking bug
 *
 * This script works around a known bug in expo-build-properties@1.0.9 where
 * the forceStaticLinking array values are not written to Podfile.properties.json.
 *
 * See: https://github.com/invertase/react-native-firebase/issues/8657
 *
 * This script should be run after `npx expo prebuild` and before `pod install`.
 */

const fs = require('fs');
const path = require('path');

// Path to the Podfile.properties.json file
const podfilePropertiesPath = path.join(__dirname, '..', 'ios', 'Podfile.properties.json');

// The correct forceStaticLinking value
const FORCE_STATIC_LINKING_PODS = ['RNFBApp', 'RNFBAnalytics', 'RNFBMessaging'];

console.log('Patching ios/Podfile.properties.json...');

try {
  // Check if file exists
  if (!fs.existsSync(podfilePropertiesPath)) {
    console.error('Error: ios/Podfile.properties.json not found!');
    console.error('   Make sure you run `npx expo prebuild` first.');
    process.exit(1);
  }

  // Read the file
  const fileContent = fs.readFileSync(podfilePropertiesPath, 'utf8');
  const properties = JSON.parse(fileContent);

  // Check current value
  const currentValue = properties['ios.forceStaticLinking'];
  console.log(`   Current value: ${currentValue}`);

  // Update the forceStaticLinking property
  const newValue = JSON.stringify(FORCE_STATIC_LINKING_PODS);
  properties['ios.forceStaticLinking'] = newValue;

  // Write back to file with proper formatting
  fs.writeFileSync(
    podfilePropertiesPath,
    JSON.stringify(properties, null, 2) + '\n',
    'utf8'
  );

  console.log(`   New value: ${newValue}`);
  console.log('Successfully patched ios/Podfile.properties.json');
  console.log('   You can now run: cd ios && pod install');

} catch (error) {
  console.error('Error patching Podfile.properties.json:', error.message);
  process.exit(1);
}

