/**
 * Android Splash Screen Image Copier
 * 
 * This script copies pre-generated full-screen splash images to the Android
 * drawable folders AFTER expo prebuild completes. This is necessary because
 * expo-splash-screen generates its images at a late stage in the prebuild process.
 * 
 * Usage: Automatically called after "npm run prebuild:android"
 * Manual: node scripts/copy-android-splash.js
 */

const fs = require('fs');
const path = require('path');

// Source directory (generated images)
const SOURCE_DIR = path.join(__dirname, '..', 'assets', 'android-splash');

// Target directory (Android res)
const ANDROID_RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Mapping from generated filename to Android drawable folder
const DENSITY_MAP = {
  'splashscreen_logo_ldpi.png': 'drawable-ldpi',
  'splashscreen_logo_mdpi.png': 'drawable-mdpi',
  'splashscreen_logo_hdpi.png': 'drawable-hdpi',
  'splashscreen_logo_xhdpi.png': 'drawable-xhdpi',
  'splashscreen_logo_xxhdpi.png': 'drawable-xxhdpi',
  'splashscreen_logo_xxxhdpi.png': 'drawable-xxxhdpi',
};

function copySplashImages() {
  console.log('\n Copying Android Splash Images (Post-Prebuild)');
  console.log('=================================================');

  // Check if source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(` Source directory not found: ${SOURCE_DIR}`);
    console.error('   Run "npm run generate:splash" first to generate images');
    process.exit(1);
  }

  // Check if Android res directory exists
  if (!fs.existsSync(ANDROID_RES)) {
    console.error(` Android res directory not found: ${ANDROID_RES}`);
    console.error('   Make sure prebuild completed successfully');
    process.exit(1);
  }

  let copiedCount = 0;

  // Copy each generated image to its corresponding drawable folder
  for (const [sourceFile, targetFolder] of Object.entries(DENSITY_MAP)) {
    const sourcePath = path.join(SOURCE_DIR, sourceFile);
    const targetDir = path.join(ANDROID_RES, targetFolder);
    const targetPath = path.join(targetDir, 'splashscreen_logo.png');

    if (!fs.existsSync(sourcePath)) {
      console.warn(`  Missing source: ${sourceFile}`);
      continue;
    }

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copy the file, overwriting the expo-splash-screen generated one
    fs.copyFileSync(sourcePath, targetPath);
    
    const stats = fs.statSync(targetPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(` ${targetFolder}/splashscreen_logo.png (${sizeKB} KB)`);
    copiedCount++;
  }

  if (copiedCount > 0) {
    console.log(`\n Replaced ${copiedCount} splash images with full-screen versions\n`);
  } else {
    console.error('\n No splash images were copied');
    process.exit(1);
  }
}

copySplashImages();

