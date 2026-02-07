/**
 * Android Splash Screen Icon Generator
 *
 * Generates properly sized splash screen icons for Android 12+ from the
 * splash-icon.png (light mode) and splash-icon-dark.png (dark mode) source images.
 *
 * Android 12+ uses a centered icon (with circular masking) for splash screens,
 * not full-screen images. This script generates square icons that fit within
 * the Android splash screen icon dimensions.
 *
 * Usage: node scripts/generate-android-splash.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Source images (1920x1920 square with logo centered for circular mask safe zone)
const LIGHT_SOURCE = path.join(__dirname, '..', 'assets', 'splash-icon.png');
const DARK_SOURCE = path.join(__dirname, '..', 'assets', 'splash-icon-dark.png');

// Output directory for generated images (intermediate storage)
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'android-splash');

// Android splash screen icon sizes (same as adaptive icon - 108dp base)
// These are square icons that Android displays in a circle
const DENSITIES = {
  'mdpi': 108,    // 1x baseline
  'hdpi': 162,    // 1.5x
  'xhdpi': 216,   // 2x
  'xxhdpi': 324,  // 3x
  'xxxhdpi': 432, // 4x
};

async function generateSplashIcons() {
  console.log('🎨 Android Splash Screen Icon Generator');
  console.log('========================================\n');

  // Check if source images exist
  if (!fs.existsSync(LIGHT_SOURCE)) {
    console.error(`❌ Light mode source not found: ${LIGHT_SOURCE}`);
    process.exit(1);
  }
  if (!fs.existsSync(DARK_SOURCE)) {
    console.error(`❌ Dark mode source not found: ${DARK_SOURCE}`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`);
  }

  // Get source image metadata
  const lightMeta = await sharp(LIGHT_SOURCE).metadata();
  console.log(`📷 Light source: ${lightMeta.width}x${lightMeta.height}`);
  const darkMeta = await sharp(DARK_SOURCE).metadata();
  console.log(`📷 Dark source: ${darkMeta.width}x${darkMeta.height}\n`);

  // Generate light mode icons
  console.log('☀️  Generating light mode splash icons...');
  for (const [density, size] of Object.entries(DENSITIES)) {
    const outputPath = path.join(OUTPUT_DIR, `splashscreen_logo_${density}.png`);

    try {
      // Resize square source to target size
      await sharp(LIGHT_SOURCE)
        .resize(size, size)
        .png({ compressionLevel: 9 })
        .toFile(outputPath);

      const outputStats = fs.statSync(outputPath);
      console.log(`   ✅ ${density}: ${size}x${size} (${(outputStats.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error(`   ❌ Failed to generate ${density}: ${error.message}`);
    }
  }

  // Generate dark mode icons
  console.log('\n🌙 Generating dark mode splash icons...');
  for (const [density, size] of Object.entries(DENSITIES)) {
    const outputPath = path.join(OUTPUT_DIR, `splashscreen_logo_${density}_dark.png`);

    try {
      // Resize square source to target size
      await sharp(DARK_SOURCE)
        .resize(size, size)
        .png({ compressionLevel: 9 })
        .toFile(outputPath);

      const outputStats = fs.statSync(outputPath);
      console.log(`   ✅ ${density}: ${size}x${size} (${(outputStats.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error(`   ❌ Failed to generate ${density}: ${error.message}`);
    }
  }

  console.log('\n✨ Done! Generated splash icons are in:');
  console.log(`   ${OUTPUT_DIR}\n`);
  console.log('📋 Next steps:');
  console.log('   1. Run "npm run prebuild:android" to regenerate Android project');
  console.log('   2. The copy script will place these icons in res/drawable-*');
}

generateSplashIcons().catch(console.error);

