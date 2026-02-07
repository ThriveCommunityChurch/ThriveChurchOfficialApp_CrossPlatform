#!/usr/bin/env node
/**
 * Post-prebuild script to add copyright text to iOS SplashScreen.storyboard
 * 
 * This runs AFTER expo prebuild completes, ensuring the expo-splash-screen
 * base mod has already written the storyboard file.
 */

const fs = require('fs');
const path = require('path');

const COPYRIGHT_TEXT = `©${new Date().getFullYear()} Thrive Community Church\nAll Rights Reserved`;

const iosRoot = path.join(__dirname, '..', 'ios');

// Find the app directory
const iosDirs = fs.readdirSync(iosRoot).filter(file => {
  const fullPath = path.join(iosRoot, file);
  return fs.statSync(fullPath).isDirectory() && 
         !file.startsWith('.') && 
         file !== 'Pods';
});

if (iosDirs.length === 0) {
  console.warn('⚠️  Could not find iOS app directory');
  process.exit(0);
}

const appDir = iosDirs[0];
const storyboardPath = path.join(iosRoot, appDir, 'SplashScreen.storyboard');

if (!fs.existsSync(storyboardPath)) {
  console.warn('⚠️  SplashScreen.storyboard not found at:', storyboardPath);
  process.exit(0);
}

let storyboardContent = fs.readFileSync(storyboardPath, 'utf8');

// Check if copyright label and constraints already exist
const hasLabel = storyboardContent.includes('copyright-label-id');
const hasConstraints = storyboardContent.includes('copyright-leading-constraint') &&
                       storyboardContent.includes('copyright-trailing-constraint') &&
                       storyboardContent.includes('copyright-bottom-constraint');

if (hasLabel && hasConstraints) {
  console.log('✅ Copyright label and constraints already exist in storyboard');
  process.exit(0);
}

// If label doesn't exist, add it before </subviews>
if (!hasLabel) {
  // Use regex to find </subviews> with its indentation and insert the label before it
  // The label needs 28 spaces (7 levels of 4-space indentation) to match the imageView sibling
  const subviewsPattern = /(\n)([ \t]*)(<\/subviews>)/;
  const match = storyboardContent.match(subviewsPattern);

  if (!match) {
    console.warn('⚠️  Could not find </subviews> tag in storyboard');
    process.exit(1);
  }

  // Build the copyright label with correct indentation (28 spaces for elements inside subviews)
  const indent = '                            '; // 28 spaces
  const innerIndent = '                                '; // 32 spaces for nested content
  const deepIndent = '                                    '; // 36 spaces for deeply nested content

  const copyrightLabel = `${indent}<label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" textAlignment="center" lineBreakMode="tailTruncation" numberOfLines="2" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="copyright-label-id">
${innerIndent}<rect key="frame" x="0.0" y="782" width="393" height="50"/>
${innerIndent}<constraints>
${deepIndent}<constraint firstAttribute="height" constant="50" id="copyright-height-constraint"/>
${innerIndent}</constraints>
${innerIndent}<string key="text">${COPYRIGHT_TEXT}</string>
${innerIndent}<fontDescription key="fontDescription" type="system" pointSize="14"/>
${innerIndent}<color key="textColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
${innerIndent}<nil key="highlightedColor"/>
${indent}</label>`;

  // Replace: newline + original indentation + </subviews>
  // With: newline + copyright label + newline + original indentation + </subviews>
  storyboardContent = storyboardContent.replace(
    subviewsPattern,
    `$1${copyrightLabel}$1$2$3`
  );

  console.log('✅ Added copyright label to iOS splash screen');
}

// Now add the constraints (find the LAST </constraints> tag which is in the container view)
if (!hasConstraints) {
  // Find all occurrences of </constraints> and get the last one
  const constraintsPattern = /(\n)([ \t]*)(<\/constraints>)/g;
  let lastMatch = null;
  let match;

  while ((match = constraintsPattern.exec(storyboardContent)) !== null) {
    lastMatch = match;
  }

  if (!lastMatch) {
    console.warn('⚠️  Could not find </constraints> tag in storyboard');
    process.exit(1);
  }

  // 28 spaces = 7 levels of 4-space indentation (matches other constraint elements)
  const indent = '                            '; // 28 spaces

  const copyrightConstraints = `${indent}<constraint firstItem="copyright-label-id" firstAttribute="leading" secondItem="EXPO-ContainerView" secondAttribute="leading" id="copyright-leading-constraint"/>
${indent}<constraint firstAttribute="trailing" secondItem="copyright-label-id" secondAttribute="trailing" id="copyright-trailing-constraint"/>
${indent}<constraint firstAttribute="bottom" secondItem="copyright-label-id" secondAttribute="bottom" constant="20" id="copyright-bottom-constraint"/>`;

  // Insert the constraints before the last </constraints> tag
  const insertPosition = lastMatch.index;
  const originalMatch = lastMatch[0]; // \n + spaces + </constraints>

  storyboardContent =
    storyboardContent.slice(0, insertPosition) +
    `\n${copyrightConstraints}` +
    originalMatch +
    storyboardContent.slice(insertPosition + originalMatch.length);

  console.log('✅ Added copyright constraints to iOS splash screen');
}

// Write the modified storyboard
fs.writeFileSync(storyboardPath, storyboardContent, 'utf8');
console.log('✅ iOS splash screen copyright complete');

