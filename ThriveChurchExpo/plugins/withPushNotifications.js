/**
 * Expo Config Plugin for Push Notifications
 * 
 * This plugin ensures that:
 * 1. iOS entitlements include aps-environment
 * 2. Push Notifications capability is enabled in Xcode project
 * 3. Background modes include remote-notification
 * 
 * These settings persist across `expo prebuild --clean`
 */

const { withEntitlementsPlist, withXcodeProject, withInfoPlist } = require('@expo/config-plugins');

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
 * Main plugin function
 */
const withPushNotifications = (config) => {
  config = withAPNSEntitlement(config);
  config = withPushNotificationsCapability(config);
  config = withRemoteNotificationBackgroundMode(config);
  return config;
};

module.exports = withPushNotifications;

