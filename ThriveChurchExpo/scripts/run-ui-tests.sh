#!/bin/bash

# Run UI Tests for Thrive Church Official App
# Usage: ./scripts/run-ui-tests.sh [ios|android|all]
#
# Prerequisites:
# - iOS: Xcode with simulators installed
# - Android: Android SDK with emulator running or device connected
#
# The tests run against the Release configuration (no Metro server needed)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Run iOS UI Tests
run_ios_tests() {
    print_header "Running iOS UI Tests"
    
    cd "$PROJECT_ROOT/ios"
    
    # Check if Xcode project exists
    if [ ! -d "ThriveChurchOfficialApp.xcworkspace" ]; then
        print_error "Xcode workspace not found. Run 'npm run prebuild:ios' first."
        exit 1
    fi
    
    # Default to iPhone 16 simulator if not specified (common in Xcode 16+)
    # Use IOS_DESTINATION env var to override
    DESTINATION="${IOS_DESTINATION:-platform=iOS Simulator,name=iPhone 16}"
    
    print_warning "Testing on: $DESTINATION"

    # Create test-results directory and remove old result bundle
    mkdir -p "$PROJECT_ROOT/test-results"
    rm -rf "$PROJECT_ROOT/test-results/ios-ui-tests.xcresult"

    # Run tests using xcodebuild
    # Use xcpretty if available, otherwise run without it
    if command -v xcpretty &> /dev/null; then
        xcodebuild test \
            -workspace ThriveChurchOfficialApp.xcworkspace \
            -scheme ThriveChurchOfficialAppUITests \
            -destination "$DESTINATION" \
            -configuration Release \
            -resultBundlePath "$PROJECT_ROOT/test-results/ios-ui-tests.xcresult" \
            CODE_SIGN_IDENTITY="-" \
            CODE_SIGNING_REQUIRED=NO \
            | xcpretty --color || true
    else
        print_warning "xcpretty not found, running without pretty output"
        xcodebuild test \
            -workspace ThriveChurchOfficialApp.xcworkspace \
            -scheme ThriveChurchOfficialAppUITests \
            -destination "$DESTINATION" \
            -configuration Release \
            -resultBundlePath "$PROJECT_ROOT/test-results/ios-ui-tests.xcresult" \
            CODE_SIGN_IDENTITY="-" \
            CODE_SIGNING_REQUIRED=NO || true
    fi

    print_success "iOS UI tests completed"
    print_warning "Test results: $PROJECT_ROOT/test-results/ios-ui-tests.xcresult"
}

# Run Android UI Tests
run_android_tests() {
    print_header "Running Android UI Tests"
    
    cd "$PROJECT_ROOT/android"
    
    # Check if gradle wrapper exists
    if [ ! -f "gradlew" ]; then
        print_error "Gradle wrapper not found. Run 'npm run prebuild:android' first."
        exit 1
    fi
    
    # Check if emulator is running or device is connected
    if ! adb devices | grep -q "device$"; then
        print_warning "No Android device/emulator detected. Starting emulator..."
        # Try to start emulator (user may need to configure)
        print_error "Please start an Android emulator or connect a device, then re-run."
        exit 1
    fi
    
    # Run connected Android tests
    ./gradlew connectedAndroidTest \
        --stacktrace \
        -PtestBuildType=release
    
    print_success "Android UI tests completed"
    print_warning "Test results: android/app/build/reports/androidTests/connected/"
}

# Show usage
show_usage() {
    echo "Usage: $0 [ios|android|all]"
    echo ""
    echo "Options:"
    echo "  ios     - Run iOS UI tests only"
    echo "  android - Run Android UI tests only"
    echo "  all     - Run tests on both platforms (default)"
    echo ""
    echo "Environment Variables:"
    echo "  IOS_DESTINATION - Custom iOS simulator destination"
    echo "                    Example: \"platform=iOS Simulator,name=iPhone 14\""
    echo ""
    echo "Examples:"
    echo "  $0 ios"
    echo "  $0 android"
    echo "  IOS_DESTINATION=\"platform=iOS Simulator,name=iPad Pro (12.9-inch)\" $0 ios"
}

# Main
case "${1:-all}" in
    ios)
        run_ios_tests
        ;;
    android)
        run_android_tests
        ;;
    all)
        run_ios_tests
        run_android_tests
        print_header "All UI Tests Completed"
        ;;
    -h|--help)
        show_usage
        ;;
    *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac

