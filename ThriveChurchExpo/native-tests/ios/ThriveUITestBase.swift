//
//  ThriveUITestBase.swift
//  ThriveChurchOfficialAppUITests
//
//  Base class for UI Tests - provides common utilities and helpers
//  Optimized for React Native apps where content is rendered in a different element hierarchy
//

import XCTest

class ThriveUITestBase: XCTestCase {

    var app: XCUIApplication!

    // MARK: - File Logging System

    /// Shared log file URL for the test run
    static var logFileURL: URL?
    static var logFileHandle: FileHandle?

    /// Get or create the log file for this test run
    private func getLogFileURL() -> URL {
        if let existingURL = ThriveUITestBase.logFileURL {
            return existingURL
        }

        // Create log file in temporary directory (works on iOS)
        let tempDir = FileManager.default.temporaryDirectory
        let logDir = tempDir.appendingPathComponent("UITestLogs")

        // Create directory if needed
        try? FileManager.default.createDirectory(at: logDir, withIntermediateDirectories: true)

        // Create timestamped log file
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd_HH-mm-ss"
        let timestamp = dateFormatter.string(from: Date())
        let logFile = logDir.appendingPathComponent("ui-test-log_\(timestamp).txt")

        // Create the file
        FileManager.default.createFile(atPath: logFile.path, contents: nil)

        ThriveUITestBase.logFileURL = logFile
        ThriveUITestBase.logFileHandle = try? FileHandle(forWritingTo: logFile)

        // Write header with full path for easy access
        let header = """
        ╔══════════════════════════════════════════════════════════════════════════════╗
        ║                    THRIVE CHURCH APP - UI TEST LOG                            ║
        ║                    Started: \(timestamp)                              ║
        ╚══════════════════════════════════════════════════════════════════════════════╝

        LOG FILE LOCATION: \(logFile.path)

        To view this log after tests complete, run:
        cat "\(logFile.path)"

        This log file contains detailed information about UI elements found during testing.
        Use this to identify the correct selectors for React Native elements.

        Note: React Native uses translation keys in code but displays translated values.

        """
        log(header)

        return logFile
    }

    /// Log a message to both console and file
    func log(_ message: String) {
        // Print to console
        print(message)

        // Write to file
        let logURL = getLogFileURL()
        if let handle = ThriveUITestBase.logFileHandle {
            let timestamp = ISO8601DateFormatter().string(from: Date())
            let logLine = "[\(timestamp)] \(message)\n"
            if let data = logLine.data(using: .utf8) {
                handle.write(data)
            }
        } else if let handle = try? FileHandle(forWritingTo: logURL) {
            ThriveUITestBase.logFileHandle = handle
            handle.seekToEndOfFile()
            let timestamp = ISO8601DateFormatter().string(from: Date())
            let logLine = "[\(timestamp)] \(message)\n"
            if let data = logLine.data(using: .utf8) {
                handle.write(data)
            }
        }
    }

    /// Log a section header
    func logSection(_ title: String) {
        let separator = String(repeating: "═", count: 80)
        log("\n\(separator)")
        log("║ \(title)")
        log(separator)
    }

    /// Log all visible elements on the current screen to the file
    func logAllVisibleElements(screenName: String) {
        logSection("SCREEN: \(screenName)")

        // Log static texts
        log("\n📝 STATIC TEXTS (\(app.staticTexts.count) found):")
        log("   Format: [label] | identifier: [id] | frame: [x,y,w,h]")
        log("   " + String(repeating: "-", count: 70))
        for (index, text) in app.staticTexts.allElementsBoundByIndex.enumerated() {
            let label = text.label
            let identifier = text.identifier.isEmpty ? "(none)" : text.identifier
            let frame = text.frame
            log("   \(index): \"\(label)\"")
            log("      ID: \(identifier)")
            log("      Frame: (\(Int(frame.origin.x)), \(Int(frame.origin.y)), \(Int(frame.width)), \(Int(frame.height)))")
            log("      Hittable: \(text.isHittable)")
        }

        // Log buttons
        log("\n🔘 BUTTONS (\(app.buttons.count) found):")
        log("   " + String(repeating: "-", count: 70))
        for (index, button) in app.buttons.allElementsBoundByIndex.enumerated() {
            let label = button.label
            let identifier = button.identifier.isEmpty ? "(none)" : button.identifier
            let frame = button.frame
            log("   \(index): \"\(label)\"")
            log("      ID: \(identifier)")
            log("      Frame: (\(Int(frame.origin.x)), \(Int(frame.origin.y)), \(Int(frame.width)), \(Int(frame.height)))")
            log("      Hittable: \(button.isHittable)")
        }

        // Log other elements (images, cells, etc.)
        log("\n🖼️ IMAGES (\(app.images.count) found):")
        for (index, image) in app.images.allElementsBoundByIndex.enumerated() {
            if !image.label.isEmpty || !image.identifier.isEmpty {
                log("   \(index): label=\"\(image.label)\" id=\"\(image.identifier)\"")
            }
        }

        // Log cells (for list items)
        log("\n📋 CELLS (\(app.cells.count) found):")
        for (index, cell) in app.cells.allElementsBoundByIndex.enumerated() {
            log("   \(index): label=\"\(cell.label)\" id=\"\(cell.identifier)\"")
        }

        // Log scroll views
        log("\n📜 SCROLL VIEWS (\(app.scrollViews.count) found)")

        // Log collection views
        log("📚 COLLECTION VIEWS (\(app.collectionViews.count) found)")

        // Log tables
        log("📊 TABLES (\(app.tables.count) found)")

        // Log tab bars and their buttons
        log("\n🔲 TAB BARS (\(app.tabBars.count) found):")
        for tabBar in app.tabBars.allElementsBoundByIndex {
            log("   TabBar buttons:")
            for button in tabBar.buttons.allElementsBoundByIndex {
                log("      - \"\(button.label)\" (hittable: \(button.isHittable))")
            }
        }

        // Log navigation bars
        log("\n🧭 NAVIGATION BARS (\(app.navigationBars.count) found):")
        for navBar in app.navigationBars.allElementsBoundByIndex {
            log("   Title: \"\(navBar.identifier)\"")
            for button in navBar.buttons.allElementsBoundByIndex {
                log("      Button: \"\(button.label)\"")
            }
        }

        log("\n" + String(repeating: "═", count: 80) + "\n")
    }

    /// Log a test action
    func logAction(_ action: String) {
        log("▶️ ACTION: \(action)")
    }

    /// Log a test result
    func logResult(_ result: String, success: Bool) {
        let icon = success ? "✅" : "❌"
        log("\(icon) RESULT: \(result)")
    }

    /// Log element search attempts
    func logElementSearch(_ description: String, found: Bool, label: String? = nil) {
        if found {
            log("   🔍 FOUND: \(description)" + (label != nil ? " -> \"\(label!)\"" : ""))
        } else {
            log("   🔍 NOT FOUND: \(description)")
        }
    }

    override func setUp() {
        super.setUp()
        continueAfterFailure = false

        app = XCUIApplication()

        // Set launch arguments for testing
        app.launchArguments = ["--uitesting"]

        app.launch()

        // Wait for app to fully load
        _ = app.wait(for: .runningForeground, timeout: 30)

        // Log test start
        log("\n🧪 TEST STARTING: \(name)")

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
    }

    override func tearDown() {
        log("🏁 TEST FINISHED: \(name)\n")
        app = nil
        super.tearDown()
    }

    // MARK: - Onboarding Handling

    /// Dismisses the onboarding screen if it's present by tapping the Skip button
    func dismissOnboardingIfPresent() {
        // Wait for UI to settle
        Thread.sleep(forTimeInterval: 2.0)

        // In React Native, buttons may be rendered as different element types
        // Try multiple approaches to find and tap Skip

        // Approach 1: Look for Skip button
        let skipButton = app.buttons["Skip"]
        if skipButton.waitForExistence(timeout: 3) && skipButton.isHittable {
            skipButton.tap()
            Thread.sleep(forTimeInterval: 1.0)
            print("✅ Dismissed onboarding via Skip button")
            return
        }

        // Approach 2: Look for Skip text
        let skipText = app.staticTexts["Skip"]
        if skipText.waitForExistence(timeout: 3) && skipText.isHittable {
            skipText.tap()
            Thread.sleep(forTimeInterval: 1.0)
            print("✅ Dismissed onboarding via Skip text")
            return
        }

        // Approach 3: Look for any element containing "Skip"
        let predicate = NSPredicate(format: "label CONTAINS[c] 'Skip'")
        let skipElements = app.descendants(matching: .any).matching(predicate)
        if skipElements.count > 0 && skipElements.firstMatch.waitForExistence(timeout: 3) {
            if skipElements.firstMatch.isHittable {
                skipElements.firstMatch.tap()
                Thread.sleep(forTimeInterval: 1.0)
                print("✅ Dismissed onboarding via Skip element")
                return
            }
        }

        print("ℹ️ Onboarding not present or already completed")
    }

    /// Checks if onboarding is currently displayed
    func isOnboardingPresent() -> Bool {
        let skipButton = app.buttons["Skip"]
        let skipText = app.staticTexts["Skip"]
        return skipButton.waitForExistence(timeout: 3) || skipText.waitForExistence(timeout: 3)
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

    func waitForElementToBeHittable(_ element: XCUIElement, timeout: TimeInterval = 10) -> Bool {
        let predicate = NSPredicate(format: "exists == true AND isHittable == true")
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

    /// Waits for content to load (looks for loading indicators to disappear)
    func waitForContentToLoad(timeout: TimeInterval = 15) {
        // Wait for any activity indicators to disappear
        let activityIndicator = app.activityIndicators.firstMatch
        if activityIndicator.exists {
            _ = waitForElementToDisappear(activityIndicator, timeout: timeout)
        }
        // Additional settle time for React Native rendering
        Thread.sleep(forTimeInterval: 1.0)
    }

    // MARK: - React Native Element Finding (with logging)

    /// Finds an element by its text label - works for React Native rendered content
    /// Uses flexible matching with logging to help identify correct selectors
    func findElementByText(_ text: String, timeout: TimeInterval = 10, logSearch: Bool = false) -> XCUIElement? {
        if logSearch {
            log("   🔎 Searching for element with text: \"\(text)\"")
        }

        // Try static text first (exact match) - use firstMatch to avoid "multiple matching elements" error
        let staticTextQuery = app.staticTexts[text]
        let staticText = staticTextQuery.firstMatch
        if staticText.waitForExistence(timeout: timeout / 4) {
            if logSearch { logElementSearch("StaticText exact match", found: true, label: staticText.label) }
            return staticText
        }
        if logSearch { logElementSearch("StaticText exact match", found: false) }

        // Try button (exact match) - use firstMatch to avoid "multiple matching elements" error
        let buttonQuery = app.buttons[text]
        let button = buttonQuery.firstMatch
        if button.waitForExistence(timeout: timeout / 4) {
            if logSearch { logElementSearch("Button exact match", found: true, label: button.label) }
            return button
        }
        if logSearch { logElementSearch("Button exact match", found: false) }

        // Try CONTAINS match for static text
        let containsPredicate = NSPredicate(format: "label CONTAINS[c] %@", text)
        let containsTexts = app.staticTexts.matching(containsPredicate)
        if containsTexts.count > 0 && containsTexts.firstMatch.waitForExistence(timeout: timeout / 4) {
            if logSearch { logElementSearch("StaticText CONTAINS match", found: true, label: containsTexts.firstMatch.label) }
            return containsTexts.firstMatch
        }
        if logSearch { logElementSearch("StaticText CONTAINS match", found: false) }

        // Try CONTAINS match for button
        let containsButtons = app.buttons.matching(containsPredicate)
        if containsButtons.count > 0 && containsButtons.firstMatch.waitForExistence(timeout: timeout / 4) {
            if logSearch { logElementSearch("Button CONTAINS match", found: true, label: containsButtons.firstMatch.label) }
            return containsButtons.firstMatch
        }
        if logSearch { logElementSearch("Button CONTAINS match", found: false) }

        // Try any element with matching label
        let predicate = NSPredicate(format: "label == %@", text)
        let elements = app.descendants(matching: .any).matching(predicate)
        if elements.count > 0 && elements.firstMatch.waitForExistence(timeout: timeout / 4) {
            if logSearch { logElementSearch("Any element exact match", found: true, label: elements.firstMatch.label) }
            return elements.firstMatch
        }
        if logSearch { logElementSearch("Any element exact match", found: false) }

        if logSearch { log("   ❌ Element not found: \"\(text)\"") }
        return nil
    }

    /// Finds an element containing the specified text with logging
    func findElementContainingText(_ text: String, timeout: TimeInterval = 10, logSearch: Bool = false) -> XCUIElement? {
        if logSearch { log("   🔎 Searching for element containing: \"\(text)\"") }

        let predicate = NSPredicate(format: "label CONTAINS[c] %@", text)
        let elements = app.descendants(matching: .any).matching(predicate)
        if elements.count > 0 && elements.firstMatch.waitForExistence(timeout: timeout) {
            if logSearch { logElementSearch("CONTAINS match", found: true, label: elements.firstMatch.label) }
            return elements.firstMatch
        }
        if logSearch { logElementSearch("CONTAINS match", found: false) }
        return nil
    }

    /// Taps an element by its text with logging
    @discardableResult
    func tapByText(_ text: String, timeout: TimeInterval = 10, shouldLog: Bool = true) -> Bool {
        if shouldLog { logAction("Tap element with text: \"\(text)\"") }

        if let element = findElementByText(text, timeout: timeout, logSearch: shouldLog) {
            if element.isHittable {
                element.tap()
                Thread.sleep(forTimeInterval: 0.5)
                if shouldLog { logResult("Tapped \"\(text)\"", success: true) }
                return true
            } else {
                if shouldLog { logResult("Element found but not hittable: \"\(text)\"", success: false) }
            }
        } else {
            if shouldLog { logResult("Element not found: \"\(text)\"", success: false) }
        }
        return false
    }

    /// Checks if text exists on screen with optional logging
    func textExists(_ text: String, timeout: TimeInterval = 5, logSearch: Bool = false) -> Bool {
        let exists = findElementByText(text, timeout: timeout, logSearch: logSearch) != nil
        if logSearch { log("   Text exists check: \"\(text)\" = \(exists)") }
        return exists
    }

    // MARK: - Tab Navigation (React Native)

    /// Navigate to a tab by tapping on the tab bar button
    /// Note: React Native tab buttons have labels like "Bible, tab, 2 of 5" so we use BEGINSWITH
    func navigateToTab(_ tabName: String) {
        // Wait for UI to settle
        Thread.sleep(forTimeInterval: 0.5)

        // Approach 1: Find button with label BEGINNING with tab name (React Native accessibility)
        // React Native tab labels are formatted as "TabName, tab, X of Y"
        let beginswithPredicate = NSPredicate(format: "label BEGINSWITH[c] %@", tabName)
        let matchingButtons = app.buttons.matching(beginswithPredicate)
        if matchingButtons.count > 0 {
            let button = matchingButtons.firstMatch
            if button.waitForExistence(timeout: 2) && button.isHittable {
                button.tap()
                Thread.sleep(forTimeInterval: 0.5)
                print("✅ Tapped tab via BEGINSWITH predicate: \(tabName)")
                return
            }
        }

        // Approach 2: Try exact match for static text (tab label text)
        let staticText = app.staticTexts[tabName]
        if staticText.waitForExistence(timeout: 2) && staticText.isHittable {
            staticText.tap()
            Thread.sleep(forTimeInterval: 0.5)
            print("✅ Tapped tab via static text: \(tabName)")
            return
        }

        // Approach 3: Try exact match for button
        let button = app.buttons[tabName]
        if button.waitForExistence(timeout: 2) && button.isHittable {
            button.tap()
            Thread.sleep(forTimeInterval: 0.5)
            print("✅ Tapped tab via exact button match: \(tabName)")
            return
        }

        // Approach 4: Use position-based tapping as fallback
        let tabPositions = ["Listen": 0, "Bible": 1, "Notes": 2, "Connect": 3, "More": 4]
        if let position = tabPositions[tabName] {
            print("⚠️ Falling back to position-based tap for tab: \(tabName)")
            tapTabByPosition(position)
            return
        }

        print("⚠️ Could not find tab: \(tabName)")
    }

    /// Finds a tab button by name using BEGINSWITH predicate (for React Native accessibility labels)
    func findTabButton(_ tabName: String) -> XCUIElement? {
        // React Native tab labels are formatted as "TabName, tab, X of Y"
        let beginswithPredicate = NSPredicate(format: "label BEGINSWITH[c] %@", tabName)
        let matchingButtons = app.buttons.matching(beginswithPredicate)
        if matchingButtons.count > 0 && matchingButtons.firstMatch.exists {
            return matchingButtons.firstMatch
        }
        return nil
    }

    /// Verifies that all expected tabs exist (using BEGINSWITH for React Native accessibility labels)
    func verifyAllTabsExist() -> Bool {
        let expectedTabs = ["Listen", "Bible", "Notes", "Connect", "More"]
        for tabName in expectedTabs {
            if findTabButton(tabName) == nil {
                print("⚠️ Tab not found: \(tabName)")
                return false
            }
        }
        return true
    }

    /// Debug helper: prints all visible text elements
    func debugPrintVisibleElements() {
        print("=== DEBUG: Visible Static Texts ===")
        for text in app.staticTexts.allElementsBoundByIndex {
            print("  StaticText: '\(text.label)' at \(text.frame)")
        }
        print("=== DEBUG: Visible Buttons ===")
        for button in app.buttons.allElementsBoundByIndex {
            print("  Button: '\(button.label)' at \(button.frame)")
        }
        print("=== DEBUG: Tab Bars ===")
        for tabBar in app.tabBars.allElementsBoundByIndex {
            print("  TabBar at \(tabBar.frame)")
            for button in tabBar.buttons.allElementsBoundByIndex {
                print("    TabButton: '\(button.label)'")
            }
        }
        print("=== END DEBUG ===")
    }

    /// Tap on a tab by its position (0-4 for 5 tabs)
    func tapTabByPosition(_ position: Int) {
        let screenWidth = app.frame.width
        let screenHeight = app.frame.height

        // Tab bar is typically at the bottom, about 50-80 points high
        let tabBarY = screenHeight - 40  // Middle of tab bar

        // Calculate X position for the tab (divide screen into 5 equal parts)
        let tabWidth = screenWidth / 5.0
        let tabX = (CGFloat(position) * tabWidth) + (tabWidth / 2.0)

        let coordinate = app.coordinate(withNormalizedOffset: CGVector(dx: 0, dy: 0))
            .withOffset(CGVector(dx: tabX, dy: tabBarY))
        coordinate.tap()
        Thread.sleep(forTimeInterval: 0.5)
    }

    /// Navigate to tab by name with fallback to position-based tapping
    func navigateToTabWithFallback(_ tabName: String) {
        // First try the standard approach
        navigateToTab(tabName)

        // Check if we're on the right tab by looking for expected content
        // If not, try position-based tapping
        let tabPositions = ["Listen": 0, "Bible": 1, "Notes": 2, "Connect": 3, "More": 4]
        if let position = tabPositions[tabName] {
            // Give it a moment to see if navigation worked
            Thread.sleep(forTimeInterval: 1.0)

            // If we still can't find expected content, try coordinate tap
            if !textExists(tabName, timeout: 1) {
                print("⚠️ Falling back to position-based tap for tab: \(tabName)")
                tapTabByPosition(position)
            }
        }
    }

    /// Navigate back using the back button or swipe gesture
    func navigateBack() {
        // Try navigation bar back button first
        let navigationBar = app.navigationBars.firstMatch
        if navigationBar.exists {
            let backButton = navigationBar.buttons.firstMatch
            if backButton.exists && backButton.isHittable {
                backButton.tap()
                Thread.sleep(forTimeInterval: 0.5)
                return
            }
        }

        // Try swipe from left edge
        app.swipeRight()
        Thread.sleep(forTimeInterval: 0.5)
    }

    // MARK: - Scrolling Helpers

    /// Scrolls down in the main view
    func scrollDown() {
        let scrollViews = app.scrollViews
        if scrollViews.count > 0 {
            scrollViews.firstMatch.swipeUp()
        } else {
            // Fall back to swipe on the main window
            app.swipeUp()
        }
        Thread.sleep(forTimeInterval: 0.5)
    }

    /// Scrolls up in the main view
    func scrollUp() {
        let scrollViews = app.scrollViews
        if scrollViews.count > 0 {
            scrollViews.firstMatch.swipeDown()
        } else {
            app.swipeDown()
        }
        Thread.sleep(forTimeInterval: 0.5)
    }

    /// Scrolls to find an element and taps it
    @discardableResult
    func scrollToAndTap(_ text: String, maxScrolls: Int = 5) -> Bool {
        for _ in 0..<maxScrolls {
            if let element = findElementByText(text, timeout: 2) {
                if element.isHittable {
                    element.tap()
                    Thread.sleep(forTimeInterval: 0.5)
                    return true
                }
            }
            scrollDown()
        }
        return false
    }

    // MARK: - Content Interaction Helpers

    /// Taps the first tappable content element (for sermon cards, menu items, etc.)
    @discardableResult
    func tapFirstContentItem() -> Bool {
        // In React Native, content is often in scroll views as other elements
        // Try to find something tappable

        // Try collection view cells
        let cells = app.collectionViews.cells
        if cells.count > 0 && cells.firstMatch.isHittable {
            cells.firstMatch.tap()
            Thread.sleep(forTimeInterval: 0.5)
            return true
        }

        // Try table view cells
        let tableViewCells = app.tables.cells
        if tableViewCells.count > 0 && tableViewCells.firstMatch.isHittable {
            tableViewCells.firstMatch.tap()
            Thread.sleep(forTimeInterval: 0.5)
            return true
        }

        // Try buttons in scroll views
        let scrollViewButtons = app.scrollViews.buttons
        if scrollViewButtons.count > 0 && scrollViewButtons.firstMatch.isHittable {
            scrollViewButtons.firstMatch.tap()
            Thread.sleep(forTimeInterval: 0.5)
            return true
        }

        return false
    }

    /// Gets the count of visible text elements (useful for checking content loaded)
    func getVisibleTextCount() -> Int {
        return app.staticTexts.count
    }

    /// Prints the current element hierarchy for debugging
    func printElementHierarchy() {
        print("=== Element Hierarchy ===")
        print(app.debugDescription)
        print("=========================")
    }
}

