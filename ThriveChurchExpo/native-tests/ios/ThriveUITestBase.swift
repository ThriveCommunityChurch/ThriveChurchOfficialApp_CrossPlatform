//
//  ThriveUITestBase.swift
//  ThriveChurchOfficialAppUITests
//
//  Base class for UI Tests - provides common utilities and helpers
//  Adapted from the native iOS app's test suite
//

import XCTest

class ThriveUITestBase: XCTestCase {

    var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false

        app = XCUIApplication()
        app.launch()

        // Wait for app to fully load
        _ = app.wait(for: .runningForeground, timeout: 30)

        // Handle system alerts (like notification permissions)
        addUIInterruptionMonitor(withDescription: "System Alert") { alert in
            let allowButton = alert.buttons["Allow"]
            let dontAllowButton = alert.buttons["Don't Allow"]

            if allowButton.exists {
                allowButton.tap()
                return true
            } else if dontAllowButton.exists {
                dontAllowButton.tap()
                return true
            }
            return false
        }

        // Dismiss onboarding if it appears
        dismissOnboardingIfPresent()
    }

    // MARK: - Onboarding Handling

    /// Dismisses the onboarding screen if it's present by tapping the Skip button
    func dismissOnboardingIfPresent() {
        // Wait a moment for the UI to settle
        Thread.sleep(forTimeInterval: 1.0)

        // Look for the Skip button which is present on all onboarding pages
        let skipButton = app.buttons["Skip"]

        if skipButton.waitForExistence(timeout: 3) {
            skipButton.tap()
            print("✅ Dismissed onboarding screen")

            // Wait for onboarding to dismiss and main app to appear
            Thread.sleep(forTimeInterval: 1.0)
        } else {
            print("ℹ️ Onboarding not present (already completed)")
        }
    }

    override func tearDown() {
        app = nil
        super.tearDown()
    }

    // MARK: - Device Configuration Helpers

    var isIPad: Bool {
        return UIDevice.current.userInterfaceIdiom == .pad
    }

    var isIPhone: Bool {
        return UIDevice.current.userInterfaceIdiom == .phone
    }

    var isLandscape: Bool {
        return XCUIDevice.shared.orientation.isLandscape
    }

    var isPortrait: Bool {
        return XCUIDevice.shared.orientation.isPortrait
    }

    var deviceSuffix: String {
        return isIPad ? "ipad" : "iphone"
    }

    var orientationSuffix: String {
        return isLandscape ? "landscape" : "portrait"
    }

    // MARK: - Common Test Utilities

    func waitForElementToAppear(_ element: XCUIElement, timeout: TimeInterval = 10) -> Bool {
        let predicate = NSPredicate(format: "exists == true")
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        let result = XCTWaiter.wait(for: [expectation], timeout: timeout)
        return result == .completed
    }

    func waitForElementToDisappear(_ element: XCUIElement, timeout: TimeInterval = 10) -> Bool {
        let predicate = NSPredicate(format: "exists == false")
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        let result = XCTWaiter.wait(for: [expectation], timeout: timeout)
        return result == .completed
    }

    func takeScreenshot(name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "\(name)_\(deviceSuffix)_\(orientationSuffix)"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func rotateToLandscape() {
        XCUIDevice.shared.orientation = .landscapeLeft
        Thread.sleep(forTimeInterval: 1.0)
    }

    func rotateToPortrait() {
        XCUIDevice.shared.orientation = .portrait
        Thread.sleep(forTimeInterval: 1.0)
    }

    // MARK: - Navigation Helpers

    func navigateToTab(_ tabName: String) {
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(waitForElementToAppear(tabBar), "Tab bar should be visible")

        let tab = tabBar.buttons[tabName]
        XCTAssertTrue(tab.exists, "Tab '\(tabName)' should exist")
        tab.tap()

        Thread.sleep(forTimeInterval: 0.5)
    }

    func validateTabBarAppearance() {
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(waitForElementToAppear(tabBar), "Tab bar should be visible")

        let expectedTabs = ["Listen", "Bible", "Notes", "Connect", "More"]
        for tabName in expectedTabs {
            let tab = tabBar.buttons[tabName]
            XCTAssertTrue(tab.exists, "Tab '\(tabName)' should exist")
        }
    }

    func validateNavigationBarAppearance(expectedTitle: String? = nil) {
        let navigationBar = app.navigationBars.firstMatch
        XCTAssertTrue(waitForElementToAppear(navigationBar), "Navigation bar should be visible")

        if let title = expectedTitle {
            let titleElement = navigationBar.staticTexts[title]
            XCTAssertTrue(titleElement.exists, "Navigation title '\(title)' should be visible")
        }
    }
}

