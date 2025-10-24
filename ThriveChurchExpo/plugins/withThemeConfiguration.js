/**
 * Expo Config Plugin for Dynamic Theme Configuration
 *
 * This plugin ensures that:
 * 1. iOS Info.plist has UIUserInterfaceStyle set to "Automatic"
 * 2. Android MainActivity has onConfigurationChanged method to handle theme changes
 *
 * These settings persist across `expo prebuild --clean`
 */

const { withInfoPlist, withMainActivity } = require('@expo/config-plugins');

/**
 * Ensure UIUserInterfaceStyle is set to Automatic in iOS Info.plist
 * This allows the app to follow the system appearance (light/dark mode)
 */
const withAutomaticUserInterfaceStyle = (config) => {
  return withInfoPlist(config, (config) => {
    // Set UIUserInterfaceStyle to Automatic
    config.modResults.UIUserInterfaceStyle = 'Automatic';
    
    console.log('✅ UIUserInterfaceStyle set to Automatic in Info.plist');
    
    return config;
  });
};

/**
 * Add onConfigurationChanged method to Android MainActivity
 * This ensures React Native is notified when the system theme changes
 */
const withConfigurationChangeHandler = (config) => {
  return withMainActivity(config, (config) => {
    let { contents } = config.modResults;

    // Check if onConfigurationChanged is already present
    if (contents.includes('onConfigurationChanged')) {
      console.log('✅ onConfigurationChanged method already present in MainActivity');
      return config;
    }

    // Check if this is a Kotlin file
    const isKotlin = contents.includes('class MainActivity') && contents.includes('override fun');

    if (!isKotlin) {
      console.warn('⚠️ MainActivity is not a Kotlin file. Skipping onConfigurationChanged injection.');
      return config;
    }

    // Add required imports if not present
    if (!contents.includes('import android.content.Intent')) {
      // Find the package declaration and add imports after it
      const packageMatch = contents.match(/package\s+[\w.]+/);
      if (packageMatch) {
        const insertIndex = packageMatch.index + packageMatch[0].length;
        contents = 
          contents.slice(0, insertIndex) +
          '\nimport android.content.Intent\nimport android.content.res.Configuration' +
          contents.slice(insertIndex);
        console.log('✅ Added Intent and Configuration imports to MainActivity');
      }
    } else if (!contents.includes('import android.content.res.Configuration')) {
      // Add Configuration import after Intent import
      contents = contents.replace(
        'import android.content.Intent',
        'import android.content.Intent\nimport android.content.res.Configuration'
      );
      console.log('✅ Added Configuration import to MainActivity');
    }

    // Find the last override method before the closing brace
    // We'll insert our method after the last override method
    const lastOverridePattern = /override fun \w+\([^)]*\)[^}]*\{[^}]*\}(?:\s*\})?/g;
    const matches = [...contents.matchAll(lastOverridePattern)];
    
    if (matches.length === 0) {
      console.warn('⚠️ Could not find suitable insertion point in MainActivity');
      return config;
    }

    const lastMatch = matches[matches.length - 1];
    const insertIndex = lastMatch.index + lastMatch[0].length;

    // The onConfigurationChanged method to add
    const configChangeMethod = `

  /**
   * Handle configuration changes (including theme changes)
   * This ensures React Native is notified when the system theme changes
   */
  override fun onConfigurationChanged(newConfig: Configuration) {
      super.onConfigurationChanged(newConfig)
      val intent = Intent("onConfigurationChanged")
      intent.putExtra("newConfig", newConfig)
      sendBroadcast(intent)
  }
`;

    // Insert the method
    config.modResults.contents =
      contents.slice(0, insertIndex) +
      configChangeMethod +
      contents.slice(insertIndex);

    console.log('✅ Added onConfigurationChanged method to MainActivity');

    return config;
  });
};

/**
 * Main plugin function
 */
const withThemeConfiguration = (config) => {
  // Configure iOS
  config = withAutomaticUserInterfaceStyle(config);
  
  // Configure Android
  config = withConfigurationChangeHandler(config);
  
  return config;
};

module.exports = withThemeConfiguration;

