/**
 * Expo Config Plugin: withTabletSupport
 * 
 * Configures both iOS and Android to properly support tablet devices
 * and screen rotation for tablet-optimized layouts.
 * 
 * Android:
 * - Sets screenOrientation to "unspecified" to allow rotation on tablets
 * - Enables resizeableActivity for proper multi-window support
 * - Adds large screens support flags
 * 
 * iOS:
 * - Ensures supportsTablet is enabled
 * - Allows all orientations on iPad
 */

const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

/**
 * Configure Android for tablet support
 */
function withAndroidTabletSupport(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const mainApplication = manifest.manifest.application?.[0];
    const mainActivity = mainApplication?.activity?.find(
      (activity) => activity.$['android:name'] === '.MainActivity'
    );

    if (mainActivity) {
      // Allow rotation based on device - tablets can rotate, phones stay portrait
      // "unspecified" lets the system decide based on device type
      mainActivity.$['android:screenOrientation'] = 'unspecified';
      
      // Enable resizeable activity for proper tablet/multi-window support
      mainActivity.$['android:resizeableActivity'] = 'true';
    }

    // Add supports-screens element for explicit large screen support
    if (!manifest.manifest['supports-screens']) {
      manifest.manifest['supports-screens'] = [];
    }

    // Configure supports-screens for tablets and large displays
    const supportsScreens = {
      $: {
        'android:smallScreens': 'true',
        'android:normalScreens': 'true',
        'android:largeScreens': 'true',
        'android:xlargeScreens': 'true',
        'android:anyDensity': 'true',
      },
    };

    // Replace or add supports-screens
    manifest.manifest['supports-screens'] = [supportsScreens];

    return config;
  });
}

/**
 * Configure iOS for tablet support
 */
function withIOSTabletSupport(config) {
  return withInfoPlist(config, (config) => {
    // Ensure iPad orientations are allowed
    // This adds all orientations for iPad specifically
    config.modResults.UISupportedInterfaceOrientations = [
      'UIInterfaceOrientationPortrait',
    ];
    
    // iPad supports all orientations
    config.modResults['UISupportedInterfaceOrientations~ipad'] = [
      'UIInterfaceOrientationPortrait',
      'UIInterfaceOrientationPortraitUpsideDown',
      'UIInterfaceOrientationLandscapeLeft',
      'UIInterfaceOrientationLandscapeRight',
    ];

    return config;
  });
}

/**
 * Main plugin - applies both Android and iOS tablet support
 */
module.exports = function withTabletSupport(config) {
  config = withAndroidTabletSupport(config);
  config = withIOSTabletSupport(config);
  return config;
};

