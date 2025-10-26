#!/usr/bin/env node

/**
 * Copy react-native-track-player bridging headers to iOS project
 *
 * This script works around an issue where expo prebuild doesn't properly
 * copy the bridging header files from react-native-track-player v5.0.0-alpha0
 * to the iOS project structure.
 *
 * This script should be run after `npx expo prebuild` and before `pod install`.
 */

const fs = require('fs');
const path = require('path');

// Paths
const nodeModulesPath = path.join(__dirname, '..', 'node_modules', 'react-native-track-player', 'ios');
const iosProjectPath = path.join(__dirname, '..', 'ios');
const targetDir = path.join(iosProjectPath, 'RNTrackPlayer', 'Support');

console.log('Copying react-native-track-player bridging headers...');

try {
  // Check if node_modules path exists
  if (!fs.existsSync(nodeModulesPath)) {
    console.error('Error: react-native-track-player not found in node_modules!');
    console.error('   Make sure you run `npm install` first.');
    process.exit(1);
  }

  // Check if iOS project exists
  if (!fs.existsSync(iosProjectPath)) {
    console.error('Error: ios/ directory not found!');
    console.error('   Make sure you run `npx expo prebuild` first.');
    process.exit(1);
  }

  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    console.log(`   Creating directory: ${path.relative(path.join(__dirname, '..'), targetDir)}`);
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy the bridging header file
  const sourceFile = path.join(nodeModulesPath, 'Support', 'RNTrackPlayer-Bridging-Header.h');
  const targetFile = path.join(targetDir, 'RNTrackPlayer-Bridging-Header.h');

  if (!fs.existsSync(sourceFile)) {
    console.error(`Error: Source file not found: ${sourceFile}`);
    console.error('   The react-native-track-player package structure may have changed.');
    process.exit(1);
  }

  console.log(`   Copying: ${path.basename(sourceFile)}`);
  fs.copyFileSync(sourceFile, targetFile);

  console.log('✅ Successfully copied react-native-track-player bridging headers');
  console.log(`   Target: ${path.relative(path.join(__dirname, '..'), targetFile)}`);

} catch (error) {
  console.error('Error copying bridging headers:', error.message);
  process.exit(1);
}

