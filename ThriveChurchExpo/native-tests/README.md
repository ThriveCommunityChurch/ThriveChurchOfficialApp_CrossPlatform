# Native UI Tests for Thrive Church Official App

This directory contains the native UI test source files for both iOS and Android platforms. Tests are designed to work with Expo's prebuild system and will survive `expo prebuild --clean` operations.

## Directory Structure

```
native-tests/
├── README.md                 # This file
├── ios/                      # iOS XCUITest files
│   ├── Info.plist           # Test target configuration
│   ├── ThriveUITestBase.swift      # Base class with helper methods
│   ├── ThriveChurchOfficialAppUITests.swift  # Main test suite
│   └── OnboardingUITests.swift     # Onboarding-specific tests
└── android/                  # Android Espresso/UiAutomator files
    ├── ThriveTestBase.kt    # Base class with helper methods
    ├── MainActivityTest.kt  # Main test suite
    └── OnboardingTest.kt    # Onboarding-specific tests
```

## How It Works

The Expo config plugin (`plugins/withNativeUITests.js`) automatically:

1. **iOS**: Copies Swift files to `ios/ThriveChurchOfficialAppUITests/`, creates the UI test target in Xcode project, and configures the scheme for Release configuration testing.

2. **Android**: Copies Kotlin files to `android/app/src/androidTest/java/com/thrivefl/ThriveCommunityChurch/`, adds Espresso and UiAutomator dependencies, and configures the test runner.

## Prerequisites

### iOS
- macOS with Xcode installed (Xcode 15+ recommended)
- iOS Simulator (or physical device with valid provisioning)
- Ruby with `xcodeproj` gem: `sudo gem install xcodeproj`

### Android
- Android SDK with platform tools
- Android Emulator running or physical device connected via USB
- ADB configured in PATH

## Running Tests

### Using npm scripts (Recommended)

```bash
# Run all UI tests (iOS + Android)
npm run test:ui

# Run iOS tests only
npm run test:ui:ios

# Run Android tests only
npm run test:ui:android
```

### Using the shell script directly

```bash
# Make sure you've run prebuild first
npm run prebuild

# Run tests
./scripts/run-ui-tests.sh ios       # iOS only
./scripts/run-ui-tests.sh android   # Android only
./scripts/run-ui-tests.sh all       # Both platforms
```

### Custom iOS Simulator

```bash
# Run on a specific simulator
IOS_DESTINATION="platform=iOS Simulator,name=iPhone 14" npm run test:ui:ios
```

### Running Individual Test Classes

**iOS (Xcode)**:
```bash
xcodebuild test \
  -workspace ios/ThriveChurchOfficialApp.xcworkspace \
  -scheme ThriveChurchOfficialAppUITests \
  -destination "platform=iOS Simulator,name=iPhone 15 Pro" \
  -only-testing:ThriveChurchOfficialAppUITests/OnboardingUITests
```

**Android (Gradle)**:
```bash
cd android
./gradlew connectedAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.thrivefl.ThriveCommunityChurch.OnboardingTest
```

## Test Results

- **iOS**: Results are saved to `test-results/ios-ui-tests.xcresult`
- **Android**: Results are in `android/app/build/reports/androidTests/connected/`

## Test Coverage

Both iOS and Android test suites include:

| Test Category | Description |
|--------------|-------------|
| **Smoke Tests** | App launch, activity/controller state verification |
| **Tab Navigation** | Navigation to all 5 tabs (Listen, Bible, Notes, Connect, More) |
| **Onboarding** | Skip, Next, Previous, Done buttons, swipe navigation |
| **Content Loading** | Sermon series list, settings, about screen |
| **Orientation** | Portrait/landscape rotation (iOS) |

## CI/CD Integration

### GitHub Actions Example

```yaml
jobs:
  ios-ui-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: sudo gem install xcodeproj
      - run: npm run prebuild:ios
      - run: npm run test:ui:ios

  android-ui-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Start emulator
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 33
          script: npm run test:ui:android
```

## Troubleshooting

### Tests fail with "Metro server not running"
Tests are configured to run in Release mode. Make sure you ran `npm run prebuild` before testing.

### Onboarding tests are skipped
Onboarding tests use `XCTSkip`/`assumeTrue` when onboarding has already been completed. To re-run onboarding tests, clear the app data:
- **iOS Simulator**: Device > Erase All Content and Settings
- **Android**: `adb shell pm clear com.thrivefl.ThriveCommunityChurch`

### Cannot find UI elements
React Native elements may take time to render. Both test bases include wait helpers. Increase timeouts if tests are flaky on slower devices.

### Ruby xcodeproj gem not found
Install it with: `sudo gem install xcodeproj`

## Adding New Tests

1. Add new test files to `native-tests/ios/` or `native-tests/android/`
2. Run `npm run prebuild` to copy files to native projects
3. Tests will automatically be included in the test targets

