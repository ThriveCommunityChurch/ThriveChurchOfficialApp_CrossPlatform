/**
 * Expo Config Plugin for Native UI Tests
 *
 * This plugin ensures that:
 * 1. iOS UI test files are copied to the test target directory
 * 2. iOS UI test target is added via Ruby xcodeproj gem (more reliable)
 * 3. Android Espresso tests are copied and build.gradle is configured
 *
 * Test source files are stored in native-tests/ directory and copied during prebuild.
 * This allows tests to survive `expo prebuild --clean`
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants
const IOS_TEST_TARGET_NAME = 'ThriveChurchOfficialAppUITests';
const ANDROID_TEST_PACKAGE = 'com/thrivefl/ThriveCommunityChurch';

/**
 * Add iOS UI Test target to Xcode project using Ruby xcodeproj gem
 */
const withIOSUITestTarget = (config) => {
  return withDangerousMod(config, ['ios', async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosPath = path.join(projectRoot, 'ios');
    const testTargetPath = path.join(iosPath, IOS_TEST_TARGET_NAME);

    // Create the UI test target directory
    if (!fs.existsSync(testTargetPath)) {
      fs.mkdirSync(testTargetPath, { recursive: true });
    }

    // Copy test files from native-tests/ios to ios/ThriveChurchOfficialAppUITests
    const sourceTestsPath = path.join(projectRoot, 'native-tests', 'ios');
    if (fs.existsSync(sourceTestsPath)) {
      // Copy Swift test files
      const testFiles = fs.readdirSync(sourceTestsPath).filter(f => f.endsWith('.swift'));
      testFiles.forEach(file => {
        const src = path.join(sourceTestsPath, file);
        const dest = path.join(testTargetPath, file);
        fs.copyFileSync(src, dest);
        console.log(`✅ Copied ${file} to ${IOS_TEST_TARGET_NAME}`);
      });

      // Copy Info.plist if it exists
      const infoPlistSrc = path.join(sourceTestsPath, 'Info.plist');
      if (fs.existsSync(infoPlistSrc)) {
        const infoPlistDest = path.join(testTargetPath, 'Info.plist');
        fs.copyFileSync(infoPlistSrc, infoPlistDest);
        console.log(`✅ Copied Info.plist to ${IOS_TEST_TARGET_NAME}`);
      }
    } else {
      console.warn('⚠️ No iOS test files found in native-tests/ios');
      return config;
    }

    // Generate Ruby script to add UI test target
    const rubyScript = `
require 'xcodeproj'

project_path = '${path.join(iosPath, 'ThriveChurchOfficialApp.xcodeproj')}'
project = Xcodeproj::Project.open(project_path)

# Check if UI test target already exists
existing_target = project.targets.find { |t| t.name == '${IOS_TEST_TARGET_NAME}' }
if existing_target
  puts "✅ ${IOS_TEST_TARGET_NAME} target already exists"
  exit 0
end

# Get the main app target
main_target = project.targets.find { |t| t.name == 'ThriveChurchOfficialApp' }
unless main_target
  puts "⚠️ Could not find main app target"
  exit 1
end

# Create new UI test target
ui_test_target = project.new_target(:ui_test_bundle, '${IOS_TEST_TARGET_NAME}', :ios, '15.1')

# Create the group for UI test files
ui_tests_group = project.main_group.new_group('${IOS_TEST_TARGET_NAME}', '${IOS_TEST_TARGET_NAME}')

# Add Swift files to the target
test_files = Dir.glob('${testTargetPath}/*.swift')
test_files.each do |file_path|
  file_name = File.basename(file_path)
  file_ref = ui_tests_group.new_reference(file_name)
  ui_test_target.source_build_phase.add_file_reference(file_ref)
end

# Add Info.plist to the group if it exists
info_plist_path = '${testTargetPath}/Info.plist'
if File.exist?(info_plist_path)
  info_plist_ref = ui_tests_group.new_reference('Info.plist')
end

# Configure build settings for the UI test target
ui_test_target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.thrive-fl.ThriveCommunityChurch.UITests'
  config.build_settings['PRODUCT_NAME'] = '$(TARGET_NAME)'
  config.build_settings['TEST_TARGET_NAME'] = 'ThriveChurchOfficialApp'
  config.build_settings['DEVELOPMENT_TEAM'] = '87ME42WJYA'
  config.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
  config.build_settings['INFOPLIST_FILE'] = '${IOS_TEST_TARGET_NAME}/Info.plist'
  config.build_settings['CURRENT_PROJECT_VERSION'] = '1'
  config.build_settings['MARKETING_VERSION'] = '1.0'
  config.build_settings['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@loader_path/Frameworks']
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
  config.build_settings['MACH_O_TYPE'] = 'mh_bundle'
end

# Add target dependency
ui_test_target.add_dependency(main_target)

# Save the project
project.save

puts "✅ Added ${IOS_TEST_TARGET_NAME} target to Xcode project"
`;

    // Write and execute Ruby script
    // Use /usr/bin/ruby (system Ruby) which has xcodeproj gem installed
    // Homebrew Ruby at /opt/homebrew/... doesn't have xcodeproj
    const scriptPath = path.join(iosPath, 'add-uitest-target.rb');
    fs.writeFileSync(scriptPath, rubyScript);

    try {
      execSync(`/usr/bin/ruby ${scriptPath}`, {
        cwd: iosPath,
        stdio: 'inherit'
      });
    } catch (error) {
      console.error('⚠️ Failed to add UI test target:', error.message);
    } finally {
      // Clean up the script
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }
    }

    // Create xcscheme for UI tests with Release configuration
    // This ensures tests run without needing Metro/Expo server
    const schemesPath = path.join(iosPath, 'ThriveChurchOfficialApp.xcodeproj', 'xcshareddata', 'xcschemes');
    fs.mkdirSync(schemesPath, { recursive: true });

    const schemeContent = `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1640"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES"
      buildArchitectures = "Automatic">
   </BuildAction>
   <TestAction
      buildConfiguration = "Release"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES"
      shouldAutocreateTestPlan = "YES">
      <Testables>
         <TestableReference
            skipped = "NO">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "${IOS_TEST_TARGET_NAME}"
               BuildableName = "${IOS_TEST_TARGET_NAME}.xctest"
               BlueprintName = "${IOS_TEST_TARGET_NAME}"
               ReferencedContainer = "container:ThriveChurchOfficialApp.xcodeproj">
            </BuildableReference>
         </TestableReference>
      </Testables>
   </TestAction>
   <LaunchAction
      buildConfiguration = "Release"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Release">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
`;

    const schemePath = path.join(schemesPath, `${IOS_TEST_TARGET_NAME}.xcscheme`);
    fs.writeFileSync(schemePath, schemeContent);
    console.log(`✅ Created ${IOS_TEST_TARGET_NAME}.xcscheme with Release configuration`);

    return config;
  }]);
};

/**
 * Copy Android test files and configure build.gradle
 */
const withAndroidEspressoTests = (config) => {
  return withDangerousMod(config, ['android', async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const androidPath = path.join(projectRoot, 'android', 'app');
    
    // Create androidTest directory structure
    const androidTestPath = path.join(androidPath, 'src', 'androidTest', 'java', ...ANDROID_TEST_PACKAGE.split('/'));
    fs.mkdirSync(androidTestPath, { recursive: true });

    // Copy test files from native-tests/android
    const sourceTestsPath = path.join(projectRoot, 'native-tests', 'android');
    if (fs.existsSync(sourceTestsPath)) {
      const testFiles = fs.readdirSync(sourceTestsPath).filter(f => f.endsWith('.kt') || f.endsWith('.java'));
      testFiles.forEach(file => {
        const src = path.join(sourceTestsPath, file);
        const dest = path.join(androidTestPath, file);
        fs.copyFileSync(src, dest);
        console.log(`✅ Copied ${file} to androidTest`);
      });
    }

    // Modify build.gradle to add Espresso dependencies and test runner
    const buildGradlePath = path.join(androidPath, 'build.gradle');
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf-8');

    // Add testInstrumentationRunner if not present
    // Insert after the buildConfigField line in defaultConfig
    if (!buildGradle.includes('testInstrumentationRunner')) {
      const buildConfigFieldPattern = /(buildConfigField\s+"String",\s+"REACT_NATIVE_RELEASE_LEVEL"[^\n]+)/;
      const match = buildGradle.match(buildConfigFieldPattern);
      if (match) {
        buildGradle = buildGradle.replace(
          match[0],
          match[0] + '\n        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"'
        );
        console.log('✅ Added testInstrumentationRunner to defaultConfig');
      }
    }

    // Add Espresso dependencies if not present
    // Insert after the react-android implementation line
    if (!buildGradle.includes('espresso-core')) {
      const reactAndroidPattern = /(implementation\("com\.facebook\.react:react-android"\))/;
      const match = buildGradle.match(reactAndroidPattern);
      if (match) {
        const espressoDeps = `

    // AndroidX Test - UI Testing with Espresso
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test:runner:1.5.2")
    androidTestImplementation("androidx.test:rules:1.5.0")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")`;
        buildGradle = buildGradle.replace(match[0], match[0] + espressoDeps);
        console.log('✅ Added Espresso dependencies');
      }
    }

    fs.writeFileSync(buildGradlePath, buildGradle);
    console.log('✅ Configured Android build.gradle for Espresso tests');

    return config;
  }]);
};

/**
 * Main plugin function
 */
const withNativeUITests = (config) => {
  config = withIOSUITestTarget(config);
  config = withAndroidEspressoTests(config);
  return config;
};

module.exports = withNativeUITests;

