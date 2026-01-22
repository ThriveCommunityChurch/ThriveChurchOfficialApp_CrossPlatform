#!/usr/bin/env node

/**
 * Build Number Increment Script
 * 
 * Automatically increments the build number in version.json
 * Run this before each build: node scripts/increment-build.js
 * 
 * Options:
 *   --bump-patch    Also bump the patch version (e.g., 1.8.6 -> 1.8.7)
 *   --bump-minor    Also bump the minor version (e.g., 1.8.6 -> 1.9.0)
 *   --bump-major    Also bump the major version (e.g., 1.8.6 -> 2.0.0)
 *   --set-version   Set a specific version (e.g., --set-version 1.8.6)
 *   --dry-run       Show what would change without writing
 */

const fs = require('fs');
const path = require('path');

const VERSION_FILE = path.join(__dirname, '..', 'version.json');

function loadVersion() {
  try {
    const content = fs.readFileSync(VERSION_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading version.json:', error.message);
    process.exit(1);
  }
}

function saveVersion(versionData) {
  try {
    fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + '\n');
  } catch (error) {
    console.error('Error writing version.json:', error.message);
    process.exit(1);
  }
}

function bumpVersion(version, type) {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default:
      return version;
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const bumpPatch = args.includes('--bump-patch');
  const bumpMinor = args.includes('--bump-minor');
  const bumpMajor = args.includes('--bump-major');
  const setVersionIndex = args.indexOf('--set-version');
  
  const versionData = loadVersion();
  const oldVersion = versionData.version;
  const oldBuild = versionData.buildNumber;
  
  // Increment build number
  versionData.buildNumber += 1;
  
  // Handle version bumps
  if (setVersionIndex !== -1 && args[setVersionIndex + 1]) {
    versionData.version = args[setVersionIndex + 1];
  } else if (bumpMajor) {
    versionData.version = bumpVersion(versionData.version, 'major');
    versionData.buildNumber = 1; // Reset build number on version bump
  } else if (bumpMinor) {
    versionData.version = bumpVersion(versionData.version, 'minor');
    versionData.buildNumber = 1;
  } else if (bumpPatch) {
    versionData.version = bumpVersion(versionData.version, 'patch');
    versionData.buildNumber = 1;
  }
  
  console.log('📦 Version Update');
  console.log('─────────────────');
  console.log(`   Version: ${oldVersion} → ${versionData.version}`);
  console.log(`   Build:   ${oldBuild} → ${versionData.buildNumber}`);
  console.log('');
  
  if (dryRun) {
    console.log('🔍 Dry run - no changes made');
  } else {
    saveVersion(versionData);
    console.log('✅ version.json updated');
  }
  
  console.log(`\n📱 Full version string: ${versionData.version} (${versionData.buildNumber})`);
}

main();

