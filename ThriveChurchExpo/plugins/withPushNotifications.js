/**
 * Expo Config Plugin for Push Notifications
 *
 * This plugin ensures that:
 * 1. iOS entitlements include aps-environment
 * 2. Push Notifications capability is enabled in Xcode project
 * 3. Background modes include remote-notification
 * 4. AppDelegate includes APNS delegate methods
 *
 * These settings persist across `expo prebuild --clean`
 */

const { withEntitlementsPlist, withXcodeProject, withInfoPlist, withAppDelegate } = require('@expo/config-plugins');
const fs = require('fs');

/**
 * Add aps-environment to iOS entitlements
 */
const withAPNSEntitlement = (config) => {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['aps-environment'] = 'development';
    return config;
  });
};

/**
 * Enable Push Notifications capability in Xcode project
 */
const withPushNotificationsCapability = (config) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    
    // Get the project UUID
    const projectUuid = xcodeProject.getFirstProject().uuid;
    const projectName = xcodeProject.getFirstProject().firstProject.name;
    
    // Get all targets
    const targets = xcodeProject.getFirstProject().firstProject.targets;
    
    // Find the main app target
    const mainTarget = targets.find(target => 
      target.name === projectName || 
      target.name === 'ThriveChurchOfficialApp'
    );
    
    if (mainTarget) {
      const targetUuid = mainTarget.uuid;
      
      // Add SystemCapabilities to the target attributes
      const targetAttributes = xcodeProject.getFirstProject().firstProject.attributes.TargetAttributes;
      
      if (!targetAttributes[targetUuid]) {
        targetAttributes[targetUuid] = {};
      }
      
      if (!targetAttributes[targetUuid].SystemCapabilities) {
        targetAttributes[targetUuid].SystemCapabilities = {};
      }
      
      // Enable Push Notifications capability
      targetAttributes[targetUuid].SystemCapabilities['com.apple.Push'] = {
        enabled: 1
      };
      
      console.log('✅ Push Notifications capability enabled in Xcode project');
    }
    
    return config;
  });
};

/**
 * Ensure remote-notification is in UIBackgroundModes
 */
const withRemoteNotificationBackgroundMode = (config) => {
  return withInfoPlist(config, (config) => {
    if (!config.modResults.UIBackgroundModes) {
      config.modResults.UIBackgroundModes = [];
    }

    if (!config.modResults.UIBackgroundModes.includes('remote-notification')) {
      config.modResults.UIBackgroundModes.push('remote-notification');
    }

    return config;
  });
};

/**
 * Add APNS delegate methods to AppDelegate
 */
const withAPNSDelegateMethod = (config) => {
  return withAppDelegate(config, (config) => {
    const { contents } = config.modResults;

    // Check if APNS methods are already added
    if (contents.includes('didRegisterForRemoteNotificationsWithDeviceToken')) {
      console.log('✅ APNS delegate methods already present in AppDelegate');
      return config;
    }

    // Find the closing brace of the AppDelegate class
    const appDelegateClassEndPattern = /^}(\s*)$/m;
    const match = contents.match(appDelegateClassEndPattern);

    if (!match) {
      console.warn('⚠️ Could not find AppDelegate class closing brace');
      return config;
    }

    // APNS delegate methods to add
    const apnsMethods = `
  // MARK: - Push Notifications (APNS)

  // Called when APNS successfully registers the device
  public override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    print("✅ APNS device token registered successfully")
    // This will trigger Firebase to generate the FCM token
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  // Called when APNS registration fails
  public override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("❌ Failed to register for remote notifications: \\(error.localizedDescription)")
    super.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
  }
`;

    // Insert the methods before the closing brace
    const insertIndex = match.index;
    config.modResults.contents =
      contents.slice(0, insertIndex) +
      apnsMethods +
      contents.slice(insertIndex);

    console.log('✅ Added APNS delegate methods to AppDelegate');

    return config;
  });
};

/**
 * Main plugin function
 */
const withPushNotifications = (config) => {
  config = withAPNSEntitlement(config);
  config = withPushNotificationsCapability(config);
  config = withRemoteNotificationBackgroundMode(config);
  config = withAPNSDelegateMethod(config);
  return config;
};

module.exports = withPushNotifications;

