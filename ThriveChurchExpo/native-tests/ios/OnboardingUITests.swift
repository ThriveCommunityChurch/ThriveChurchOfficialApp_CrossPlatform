//
//  OnboardingUITests.swift
//  ThriveChurchOfficialAppUITests
//
//  UI Tests for the Onboarding flow
//
//  IMPORTANT: These tests require a FRESH simulator/device state where onboarding
//  has NOT been completed. Run these tests on a clean simulator before other tests.
//
//  To reset simulator: Device > Erase All Content and Settings
//

import XCTest

final class OnboardingUITests: ThriveUITestBase {

    // MARK: - Helper to find onboarding elements

    private func findNextButton() -> XCUIElement? {
        // Try various button identifiers
        for label in ["NEXT", "Next", "next"] {
            let button = app.buttons[label]
            if button.exists { return button }
            if let element = findElementByText(label, timeout: 1) { return element }
        }
        return nil
    }

    private func findDoneButton() -> XCUIElement? {
        for label in ["Done", "DONE", "done"] {
            let button = app.buttons[label]
            if button.exists { return button }
            if let element = findElementByText(label, timeout: 1) { return element }
        }
        return nil
    }

    private func findSkipButton() -> XCUIElement? {
        let button = app.buttons["Skip"]
        if button.exists { return button }
        return findElementByText("Skip", timeout: 2)
    }

    // MARK: - Onboarding Tests

    /// Test: Complete the onboarding flow by navigating through all pages
    /// This is the primary onboarding test - it verifies the full flow works
    func testOnboardingCompleteFlow() throws {
        // Check if onboarding is present
        guard isOnboardingPresent() else {
            throw XCTSkip("Onboarding already completed - run on fresh simulator")
        }

        takeScreenshot(name: "onboarding_start")

        // Verify Skip button exists (confirms we're on onboarding)
        XCTAssertNotNil(findSkipButton(), "Skip button should be visible on onboarding")

        var pageCount = 1

        // Navigate through all pages using Next button
        while let nextButton = findNextButton(), nextButton.isHittable {
            nextButton.tap()
            Thread.sleep(forTimeInterval: 0.5)
            pageCount += 1
            takeScreenshot(name: "onboarding_page_\(pageCount)")

            // Safety limit
            if pageCount > 10 { break }
        }

        // Should have navigated through multiple pages
        XCTAssertTrue(pageCount > 1, "Should have multiple onboarding pages")

        // Tap Done button on last page
        if let doneButton = findDoneButton(), doneButton.isHittable {
            doneButton.tap()
            Thread.sleep(forTimeInterval: 1.0)
        }

        // Verify we're now in the main app (tabs visible)
        let listenTabVisible = textExists("Listen", timeout: 10)
        XCTAssertTrue(listenTabVisible, "Main app should appear after completing onboarding")

        takeScreenshot(name: "onboarding_complete_main_app")
    }

    /// Test: Skip button takes user directly to main app
    func testOnboardingSkipButton() throws {
        guard isOnboardingPresent() else {
            throw XCTSkip("Onboarding already completed - run on fresh simulator")
        }

        guard let skipButton = findSkipButton() else {
            XCTFail("Skip button not found on onboarding screen")
            return
        }

        takeScreenshot(name: "onboarding_before_skip")

        XCTAssertTrue(skipButton.isHittable, "Skip button should be tappable")
        skipButton.tap()

        Thread.sleep(forTimeInterval: 1.0)

        // Verify main app appears
        let tabsVisible = textExists("Listen", timeout: 10)
        XCTAssertTrue(tabsVisible, "Tab bar should appear after skipping onboarding")

        takeScreenshot(name: "onboarding_skipped_main_app")
    }
}

