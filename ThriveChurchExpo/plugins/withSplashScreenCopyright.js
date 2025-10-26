/**
 * Expo Config Plugin for Splash Screen Copyright Text
 * 
 * This plugin adds dynamic copyright text to the splash screen:
 * - iOS: Modifies the SplashScreen.storyboard to add a copyright label
 * - Android: Creates a custom splash screen layout with copyright text
 * 
 * This runs AFTER expo-splash-screen plugin to preserve the copyright text.
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const COPYRIGHT_TEXT = `©${new Date().getFullYear()} Thrive Community Church\nAll Rights Reserved`;

/**
 * Add copyright label to iOS SplashScreen.storyboard
 */
const withIosSplashCopyright = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosRoot = path.join(projectRoot, 'ios');
      
      // Find the app directory (it might be named differently)
      const iosDirs = fs.readdirSync(iosRoot).filter(file => {
        const fullPath = path.join(iosRoot, file);
        return fs.statSync(fullPath).isDirectory() && 
               !file.startsWith('.') && 
               file !== 'Pods';
      });
      
      if (iosDirs.length === 0) {
        console.warn('⚠️  Could not find iOS app directory');
        return config;
      }
      
      const appDir = iosDirs[0];
      const storyboardPath = path.join(iosRoot, appDir, 'SplashScreen.storyboard');
      
      if (!fs.existsSync(storyboardPath)) {
        console.warn('⚠️  SplashScreen.storyboard not found at:', storyboardPath);
        return config;
      }
      
      let storyboardContent = fs.readFileSync(storyboardPath, 'utf8');
      
      // Check if copyright label already exists
      if (storyboardContent.includes('copyright-label-id')) {
        console.log('✅ Copyright label already exists in storyboard');
        return config;
      }
      
      // Find the closing </subviews> tag and add the copyright label before it
      const subviewsClosingTag = '</subviews>';
      const subviewsIndex = storyboardContent.indexOf(subviewsClosingTag);
      
      if (subviewsIndex === -1) {
        console.warn('⚠️  Could not find </subviews> tag in storyboard');
        return config;
      }
      
      // Create the copyright label XML (matches exact structure from original storyboard)
      const copyrightLabel = `                            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" textAlignment="center" lineBreakMode="tailTruncation" numberOfLines="2" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="copyright-label-id">
                                <rect key="frame" x="0.0" y="782" width="393" height="50"/>
                                <constraints>
                                    <constraint firstAttribute="height" constant="50" id="copyright-height-constraint"/>
                                </constraints>
                                <string key="text">${COPYRIGHT_TEXT}</string>
                                <fontDescription key="fontDescription" type="system" pointSize="14"/>
                                <color key="textColor" white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
                                <nil key="highlightedColor"/>
                            </label>
`;
      
      // Insert the copyright label before </subviews>
      storyboardContent = 
        storyboardContent.slice(0, subviewsIndex) + 
        copyrightLabel + 
        storyboardContent.slice(subviewsIndex);
      
      // Now add constraints for the copyright label
      // Find the closing </constraints> tag in the view
      const constraintsClosingTag = '</constraints>';
      const lastConstraintsIndex = storyboardContent.lastIndexOf(constraintsClosingTag);
      
      if (lastConstraintsIndex === -1) {
        console.warn('⚠️  Could not find </constraints> tag in storyboard');
        return config;
      }
      
      // Add constraints for the copyright label (matches exact constraints from original storyboard)
      // Note: These constraints pin the label edge-to-edge with 20pt bottom padding from container view
      const copyrightConstraints = `                            <constraint firstAttribute="trailing" secondItem="copyright-label-id" secondAttribute="trailing" id="copyright-trailing-constraint"/>
                            <constraint firstItem="copyright-label-id" firstAttribute="leading" secondItem="EXPO-ContainerView" secondAttribute="leading" id="copyright-leading-constraint"/>
                            <constraint firstAttribute="bottom" secondItem="copyright-label-id" secondAttribute="bottom" constant="20" symbolic="YES" id="copyright-bottom-constraint"/>
`;
      
      storyboardContent = 
        storyboardContent.slice(0, lastConstraintsIndex) + 
        copyrightConstraints + 
        storyboardContent.slice(lastConstraintsIndex);
      
      // Write the modified storyboard back
      fs.writeFileSync(storyboardPath, storyboardContent, 'utf8');
      console.log('✅ Added copyright label to iOS splash screen');
      
      return config;
    },
  ]);
};

/**
 * Add copyright text to Android splash screen
 * This creates a custom layout with copyright text overlay matching iOS constraints
 */
const withAndroidSplashCopyright = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidResPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

      if (!fs.existsSync(androidResPath)) {
        console.warn('⚠️  Android res directory not found');
        return config;
      }

      // Create values directory if it doesn't exist
      const valuesDir = path.join(androidResPath, 'values');
      if (!fs.existsSync(valuesDir)) {
        fs.mkdirSync(valuesDir, { recursive: true });
      }

      // Create or update strings.xml with copyright text
      const stringsPath = path.join(valuesDir, 'strings.xml');
      let stringsContent = '';

      if (fs.existsSync(stringsPath)) {
        stringsContent = fs.readFileSync(stringsPath, 'utf8');

        // Update existing copyright string if it exists
        if (stringsContent.includes('splash_copyright')) {
          // Replace the existing copyright string with the correct one
          stringsContent = stringsContent.replace(
            /<string name="splash_copyright">.*?<\/string>/,
            `<string name="splash_copyright">${COPYRIGHT_TEXT.replace(/\n/g, '\\n')}</string>`
          );
          fs.writeFileSync(stringsPath, stringsContent, 'utf8');
          console.log('✅ Updated Android copyright string');
        } else {
          // Add new copyright string
          const copyrightString = `  <string name="splash_copyright">${COPYRIGHT_TEXT.replace(/\n/g, '\\n')}</string>`;
          stringsContent = stringsContent.replace('</resources>', `${copyrightString}\n</resources>`);
          fs.writeFileSync(stringsPath, stringsContent, 'utf8');
          console.log('✅ Added Android copyright string');
        }
      } else {
        stringsContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <string name="splash_copyright">${COPYRIGHT_TEXT.replace(/\n/g, '\\n')}</string>
</resources>`;
        fs.writeFileSync(stringsPath, stringsContent, 'utf8');
        console.log('✅ Created Android strings.xml with copyright');
      }

      // Create layout directory if it doesn't exist
      const layoutDir = path.join(androidResPath, 'layout');
      if (!fs.existsSync(layoutDir)) {
        fs.mkdirSync(layoutDir, { recursive: true });
      }

      // Create custom splash screen layout with copyright text
      // Matches iOS constraints: edge-to-edge with 20dp bottom padding
      const splashLayoutPath = path.join(layoutDir, 'splash_screen.xml');
      const splashLayout = `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/splashscreen_background">

    <!-- Background Image (generated by expo-splash-screen) -->
    <ImageView
        android:id="@+id/splashscreen_image"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:src="@drawable/splashscreen_logo"
        android:scaleType="centerCrop"
        android:contentDescription="@null" />

    <!-- Copyright Text - matches iOS constraints (edge-to-edge, 20dp bottom) -->
    <TextView
        android:id="@+id/copyright_text"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_gravity="bottom"
        android:layout_marginBottom="20dp"
        android:paddingTop="8dp"
        android:paddingBottom="8dp"
        android:text="@string/splash_copyright"
        android:textColor="@android:color/white"
        android:textSize="14sp"
        android:textAlignment="center"
        android:gravity="center"
        android:lineSpacingMultiplier="1.2" />
</FrameLayout>
`;

      fs.writeFileSync(splashLayoutPath, splashLayout, 'utf8');
      console.log('✅ Created Android splash screen layout with copyright text (matches iOS)');

      return config;
    },
  ]);
};

/**
 * Main plugin function
 */
const withSplashScreenCopyright = (config) => {
  config = withIosSplashCopyright(config);
  config = withAndroidSplashCopyright(config);
  return config;
};

module.exports = withSplashScreenCopyright;

