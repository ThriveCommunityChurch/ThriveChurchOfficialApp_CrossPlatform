//
//  ThriveChurchOfficialAppUITests.swift
//  ThriveChurchOfficialAppUITests
//
//  UI Tests for Thrive Church Official App (React Native/Expo version)
//

import XCTest

final class ThriveChurchOfficialAppUITests: ThriveUITestBase {
    
    // MARK: - Smoke Tests
    
    /// Test that the app launches successfully
    func testAppLaunches() throws {
        // App should launch without crashing
        XCTAssertTrue(app.state == .runningForeground)
    }
    
    /// Test onboarding screen appears or main tab bar is visible
    func testOnboardingOrMainScreenAppears() throws {
        // Wait for either onboarding or main content to appear
        let skipButton = app.buttons["Skip"]
        let tabBar = app.tabBars.firstMatch
        
        let onboardingOrMainAppeared = skipButton.waitForExistence(timeout: 10) || tabBar.waitForExistence(timeout: 10)
        XCTAssertTrue(onboardingOrMainAppeared, "Neither onboarding nor main screen appeared")
    }
    
    // MARK: - Navigation Tests
    
    /// Test navigation to Listen tab
    func testNavigateToListenTab() throws {
        dismissOnboardingIfPresent()
        navigateToTab("Listen")
        takeScreenshot(name: "listen_tab")
    }

    /// Test navigation to Bible tab
    func testNavigateToBibleTab() throws {
        dismissOnboardingIfPresent()
        navigateToTab("Bible")
        takeScreenshot(name: "bible_tab")
    }

    /// Test navigation to Notes tab
    func testNavigateToNotesTab() throws {
        dismissOnboardingIfPresent()
        navigateToTab("Notes")
        takeScreenshot(name: "notes_tab")
    }

    /// Test navigation to Connect tab
    func testNavigateToConnectTab() throws {
        dismissOnboardingIfPresent()
        navigateToTab("Connect")
        takeScreenshot(name: "connect_tab")
    }

    /// Test navigation to More tab
    func testNavigateToMoreTab() throws {
        dismissOnboardingIfPresent()
        navigateToTab("More")
        takeScreenshot(name: "more_tab")
    }

    /// Test all tabs exist
    func testAllTabsExist() throws {
        dismissOnboardingIfPresent()
        validateTabBarAppearance()
        takeScreenshot(name: "all_tabs_validated")
    }

    // MARK: - Helper Methods

    /// Dismisses onboarding if present
    private func dismissOnboardingIfPresent() {
        let skipButton = app.buttons["Skip"]
        if skipButton.waitForExistence(timeout: 15) {
            skipButton.tap()
        }

        // Tap anywhere to trigger potential system alert handlers
        app.tap()
    }
}

