/**
 * Expo Config Plugin for Xcode Recommended Settings
 *
 * This plugin applies Xcode recommended project settings and custom app settings
 * so you don't need to manually update them each time you open the project.
 *
 * Settings applied:
 * - BuildIndependentTargetsInParallel = YES
 * - LastUpgradeCheck = 1640 (Xcode 16.4)
 * - CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = YES
 * - SWIFT_COMPILATION_MODE = wholemodule (Release only)
 * - INFOPLIST_KEY_CFBundleDisplayName
 * - INFOPLIST_KEY_LSApplicationCategoryType
 * - DEVELOPMENT_TEAM
 *
 * NOTE: ENABLE_USER_SCRIPT_SANDBOXING is NOT set because it's incompatible with CocoaPods
 *
 * These settings persist across `expo prebuild --clean`
 */

const { withXcodeProject } = require('@expo/config-plugins');

const DEVELOPMENT_TEAM = '87ME42WJYA';
const APP_DISPLAY_NAME = 'Thrive Church Official App';
const APP_CATEGORY = 'public.app-category.productivity';
const LAST_UPGRADE_CHECK = '1640'; // Xcode 16.4

/**
 * Apply Xcode recommended project-level settings
 */
const withXcodeRecommendedSettings = (config) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    // Get project attributes
    const projectAttributes = xcodeProject.getFirstProject().firstProject.attributes;

    // Set BuildIndependentTargetsInParallel (Xcode recommended)
    projectAttributes.BuildIndependentTargetsInParallel = 'YES';

    // Set LastUpgradeCheck to current Xcode version to suppress upgrade prompts
    projectAttributes.LastUpgradeCheck = LAST_UPGRADE_CHECK;

    console.log('✅ Applied Xcode project-level recommended settings');

    return config;
  });
};

/**
 * Apply build settings to all configurations
 */
const withXcodeBuildSettings = (config) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    // Get the project's build configuration list
    const projectConfigListKey = xcodeProject.getFirstProject().firstProject.buildConfigurationList;
    const projectConfigList = xcodeProject.hash.project.objects.XCConfigurationList[projectConfigListKey];

    if (projectConfigList && projectConfigList.buildConfigurations) {
      projectConfigList.buildConfigurations.forEach((configRef) => {
        const configUuid = configRef.value;
        const buildConfig = xcodeProject.hash.project.objects.XCBuildConfiguration[configUuid];

        if (buildConfig && buildConfig.buildSettings) {
          // Xcode recommended warnings
          buildConfig.buildSettings.CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = 'YES';

          // NOTE: ENABLE_USER_SCRIPT_SANDBOXING = YES is NOT compatible with CocoaPods
          // CocoaPods scripts need to write to Pods/ directory which sandbox blocks
          // Leaving this at default (NO) to avoid build failures

          // Release-only optimization (wholemodule compilation)
          if (buildConfig.name === 'Release') {
            buildConfig.buildSettings.SWIFT_COMPILATION_MODE = 'wholemodule';
          }
        }
      });

      console.log('✅ Applied Xcode build configuration recommended settings');
    }

    return config;
  });
};

/**
 * Apply app-specific settings to the main target
 */
const withAppTargetSettings = (config) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    // Find the main app target
    const targets = xcodeProject.getFirstProject().firstProject.targets;
    const mainTarget = targets.find(
      (target) => target.comment === 'ThriveChurchOfficialApp'
    );

    if (!mainTarget) {
      console.warn('⚠️ Could not find main app target');
      return config;
    }

    // Get the target's native target object
    const nativeTarget = xcodeProject.hash.project.objects.PBXNativeTarget[mainTarget.value];

    if (!nativeTarget) {
      console.warn('⚠️ Could not find native target object');
      return config;
    }

    // Get the target's build configuration list
    const targetConfigListKey = nativeTarget.buildConfigurationList;
    const targetConfigList = xcodeProject.hash.project.objects.XCConfigurationList[targetConfigListKey];

    if (targetConfigList && targetConfigList.buildConfigurations) {
      targetConfigList.buildConfigurations.forEach((configRef) => {
        const configUuid = configRef.value;
        const buildConfig = xcodeProject.hash.project.objects.XCBuildConfiguration[configUuid];

        if (buildConfig && buildConfig.buildSettings) {
          // App display name and category
          buildConfig.buildSettings.INFOPLIST_KEY_CFBundleDisplayName = `"${APP_DISPLAY_NAME}"`;
          buildConfig.buildSettings.INFOPLIST_KEY_LSApplicationCategoryType = `"${APP_CATEGORY}"`;

          // Development team
          buildConfig.buildSettings.DEVELOPMENT_TEAM = DEVELOPMENT_TEAM;
        }
      });

      console.log('✅ Applied app target settings (display name, category, team)');
    }

    return config;
  });
};

/**
 * Main plugin function
 */
const withXcodeSettings = (config) => {
  config = withXcodeRecommendedSettings(config);
  config = withXcodeBuildSettings(config);
  config = withAppTargetSettings(config);
  return config;
};

module.exports = withXcodeSettings;

