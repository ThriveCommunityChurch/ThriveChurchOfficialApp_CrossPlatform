/**
 * Expo Config Plugin for Splash Screen Copyright Text
 * 
 * This plugin adds dynamic copyright text to the splash screen:
 * - iOS: Modifies the SplashScreen.storyboard to add a copyright label
 * - Android: Creates a custom splash screen layout with copyright text
 * 
 * This runs AFTER expo-splash-screen plugin to preserve the copyright text.
 */

const { withDangerousMod, withStringsXml } = require('@expo/config-plugins');
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
      
      // Create the copyright label XML
      const copyrightLabel = `                            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" textAlignment="center" lineBreakMode="tailTruncation" numberOfLines="2" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="copyright-label-id">
                                <rect key="frame" x="16" y="812" width="382" height="50"/>
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
      
      // Add constraints for the copyright label
      const copyrightConstraints = `                            <constraint firstItem="copyright-label-id" firstAttribute="leading" secondItem="Rmq-lb-GrQ" secondAttribute="leading" constant="16" id="copyright-leading-constraint"/>
                            <constraint firstItem="copyright-label-id" firstAttribute="trailing" secondItem="Rmq-lb-GrQ" secondAttribute="trailing" constant="-16" id="copyright-trailing-constraint"/>
                            <constraint firstItem="Rmq-lb-GrQ" firstAttribute="bottom" secondItem="copyright-label-id" secondAttribute="bottom" id="copyright-bottom-constraint"/>
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
 * This creates a custom layout with copyright text overlay
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
      } else {
        stringsContent = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n</resources>';
      }
      
      // Add copyright string if it doesn't exist
      if (!stringsContent.includes('splash_copyright')) {
        const copyrightString = `    <string name="splash_copyright">${COPYRIGHT_TEXT.replace('\n', '\\n')}</string>`;
        stringsContent = stringsContent.replace('</resources>', `${copyrightString}\n</resources>`);
        fs.writeFileSync(stringsPath, stringsContent, 'utf8');
      }
      
      // Create layout directory if it doesn't exist
      const layoutDir = path.join(androidResPath, 'layout');
      if (!fs.existsSync(layoutDir)) {
        fs.mkdirSync(layoutDir, { recursive: true });
      }
      
      // Create custom splash screen layout with copyright text
      const splashLayoutPath = path.join(layoutDir, 'splash_screen.xml');
      const splashLayout = `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">
    
    <!-- Background Image -->
    <ImageView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:src="@drawable/splashscreen"
        android:scaleType="centerCrop" />
    
    <!-- Copyright Text -->
    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_gravity="bottom"
        android:layout_marginBottom="16dp"
        android:layout_marginStart="16dp"
        android:layout_marginEnd="16dp"
        android:text="@string/splash_copyright"
        android:textColor="@android:color/white"
        android:textSize="14sp"
        android:textAlignment="center"
        android:gravity="center" />
</FrameLayout>
`;
      
      fs.writeFileSync(splashLayoutPath, splashLayout, 'utf8');
      console.log('✅ Created Android splash screen layout with copyright text');
      
      // Note: The MainActivity.java will need to be modified to use this custom layout
      // This is typically done in the expo-splash-screen configuration or manually
      console.log('ℹ️  Note: Android splash screen may require additional native configuration');
      console.log('ℹ️  The custom layout has been created at: res/layout/splash_screen.xml');
      
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

