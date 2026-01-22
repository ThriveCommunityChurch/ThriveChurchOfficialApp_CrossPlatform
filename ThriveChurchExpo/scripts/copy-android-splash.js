/**
 * Android Splash Screen Icon Copier
 *
 * This script copies pre-generated splash screen icons to the Android
 * drawable folders AFTER expo prebuild completes. This is necessary because
 * expo-splash-screen generates its images at a late stage in the prebuild process.
 *
 * Copies both light mode (drawable-*) and dark mode (drawable-night-*) icons.
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

// Android splash screen icon densities (matching adaptive icon sizes)
const DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

function copySplashIcons() {
  console.log('\n📱 Copying Android Splash Icons (Post-Prebuild)');
  console.log('================================================');

  // Check if source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    console.error('   Run "npm run generate:splash" first to generate icons');
    process.exit(1);
  }

  // Check if Android res directory exists
  if (!fs.existsSync(ANDROID_RES)) {
    console.error(`❌ Android res directory not found: ${ANDROID_RES}`);
    console.error('   Make sure prebuild completed successfully');
    process.exit(1);
  }

  let lightCount = 0;
  let darkCount = 0;

  // Copy light mode icons
  console.log('\n☀️  Light mode icons:');
  for (const density of DENSITIES) {
    const sourceFile = `splashscreen_logo_${density}.png`;
    const sourcePath = path.join(SOURCE_DIR, sourceFile);
    const targetDir = path.join(ANDROID_RES, `drawable-${density}`);
    const targetPath = path.join(targetDir, 'splashscreen_logo.png');

    if (!fs.existsSync(sourcePath)) {
      console.warn(`   ⚠️  Missing source: ${sourceFile}`);
      continue;
    }

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, targetPath);

    const stats = fs.statSync(targetPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   ✅ drawable-${density}/splashscreen_logo.png (${sizeKB} KB)`);
    lightCount++;
  }

  // Copy dark mode icons
  console.log('\n🌙 Dark mode icons:');
  for (const density of DENSITIES) {
    const sourceFile = `splashscreen_logo_${density}_dark.png`;
    const sourcePath = path.join(SOURCE_DIR, sourceFile);
    const targetDir = path.join(ANDROID_RES, `drawable-night-${density}`);
    const targetPath = path.join(targetDir, 'splashscreen_logo.png');

    if (!fs.existsSync(sourcePath)) {
      console.warn(`   ⚠️  Missing source: ${sourceFile}`);
      continue;
    }

    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, targetPath);

    const stats = fs.statSync(targetPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   ✅ drawable-night-${density}/splashscreen_logo.png (${sizeKB} KB)`);
    darkCount++;
  }

  if (lightCount > 0 || darkCount > 0) {
    console.log(`\n✨ Copied ${lightCount} light + ${darkCount} dark splash icons\n`);
  } else {
    console.error('\n❌ No splash icons were copied');
    process.exit(1);
  }
}

copySplashIcons();

