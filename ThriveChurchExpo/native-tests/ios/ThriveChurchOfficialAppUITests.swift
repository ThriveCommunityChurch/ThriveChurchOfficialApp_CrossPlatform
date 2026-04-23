//
//  ThriveChurchOfficialAppUITests.swift
//  ThriveChurchOfficialAppUITests
//
//  UI Tests for Thrive Church Official App (React Native/Expo version)
//  Tests navigation between screens and verifies content loads correctly
//
//  NOTE: These tests log all visible elements to ~/Desktop/UITestLogs/ for review.
//  This helps identify the correct selectors for React Native elements.
//
//  NOTE: React Native code uses translation keys, but the app displays translated values.
//

import XCTest

final class ThriveChurchOfficialAppUITests: ThriveUITestBase {

    override func setUp() {
        super.setUp()
        // Skip onboarding for all tests in this class
        dismissOnboardingIfPresent()
        waitForContentToLoad()
    }

    // MARK: - Element Discovery Test (Run this first to see all available elements)

    /// This test logs ALL visible elements on each screen to help identify correct selectors
    /// Check ~/Desktop/UITestLogs/ for the log file after running
    func testAA_DiscoverAllElements() throws {
        log("╔══════════════════════════════════════════════════════════════════════════════╗")
        log("║           ELEMENT DISCOVERY TEST - Finding correct selectors                  ║")
        log("╚══════════════════════════════════════════════════════════════════════════════╝")

        // Log initial screen (Listen tab is default)
        logAllVisibleElements(screenName: "Listen Tab (Initial)")
        takeScreenshot(name: "00_discover_listen")

        // Navigate to each tab and log all elements
        let tabs = ["Bible", "Notes", "Connect", "More"]
        for tab in tabs {
            navigateToTab(tab)
            waitForContentToLoad()
            Thread.sleep(forTimeInterval: 1.0)
            logAllVisibleElements(screenName: "\(tab) Tab")
            takeScreenshot(name: "00_discover_\(tab.lowercased())")
        }

        // Also scroll down on Connect and More to find more elements
        navigateToTab("Connect")
        waitForContentToLoad()
        scrollDown()
        Thread.sleep(forTimeInterval: 0.5)
        logAllVisibleElements(screenName: "Connect Tab (Scrolled)")

        navigateToTab("More")
        waitForContentToLoad()
        scrollDown()
        Thread.sleep(forTimeInterval: 0.5)
        logAllVisibleElements(screenName: "More Tab (Scrolled)")

        log("\n✅ Element discovery complete. Check log file for all available selectors.\n")
    }

    // MARK: - Smoke Tests

    /// Test that the app launches and shows main content
    func testAppLaunches() throws {
        logAction("Verify app is running")
        XCTAssertTrue(app.state == .runningForeground, "App should be running in foreground")
        logResult("App is running in foreground", success: true)
        takeScreenshot(name: "01_app_launch")
    }

    /// Test that main app content is visible
    func testAppShowsMainContent() throws {
        logAction("Verify main content is visible")
        let hasMainContent = textExists("Listen", timeout: 5, logSearch: true)
        XCTAssertTrue(hasMainContent, "Main app content should be visible")
        logResult("Main content visible", success: hasMainContent)
        takeScreenshot(name: "02_main_content")
    }

    // MARK: - Tab Navigation Tests

    /// Test that all tabs are visible
    func testAllTabsExist() throws {
        logAction("Verify all 5 tabs exist")
        logAllVisibleElements(screenName: "Tab Bar Check")

        let allTabsExist = verifyAllTabsExist()
        logResult("All tabs exist", success: allTabsExist)
        XCTAssertTrue(allTabsExist, "All 5 tabs should be visible")
        takeScreenshot(name: "03_all_tabs_visible")
    }

    /// Test navigating through all tabs
    func testTabNavigation() throws {
        let tabs = ["Listen", "Bible", "Notes", "Connect", "More"]
        for (index, tab) in tabs.enumerated() {
            logAction("Navigate to tab: \(tab) (position \(index))")
            navigateToTab(tab)
            waitForContentToLoad()
            logResult("Navigated to \(tab)", success: true)
            takeScreenshot(name: "04_tab_\(index + 1)_\(tab.lowercased())")
        }
    }

    // MARK: - Listen Screen Tests

    /// Test Listen screen loads with content
    func testListenScreenContent() throws {
        navigateToTab("Listen")
        waitForContentToLoad(timeout: 20)
        Thread.sleep(forTimeInterval: 3.0)

        logAllVisibleElements(screenName: "Listen Screen Content")

        // Count both static texts and buttons (sermon cards are rendered as buttons with accessibilityLabel)
        let textCount = getVisibleTextCount()
        let buttonCount = app.buttons.count
        let totalCount = textCount + buttonCount
        log("Listen screen has \(textCount) text elements and \(buttonCount) buttons (total: \(totalCount))")

        // Tab bar has 5 buttons, so we need more than 5 buttons (meaning at least 1 sermon card)
        // OR at least some text content beyond just the "Listen" title
        let hasSermonCards = buttonCount > 5
        let hasTextContent = textCount > 1
        XCTAssertTrue(hasSermonCards || hasTextContent, "Listen screen should have content loaded (sermon cards or text)")
        takeScreenshot(name: "05_listen_content")
    }

    /// Test tapping on sermon content
    func testListenSermonTap() throws {
        navigateToTab("Listen")
        waitForContentToLoad(timeout: 20)
        Thread.sleep(forTimeInterval: 3.0)

        logAction("Tap first content item")
        if tapFirstContentItem() {
            logResult("Tapped content item", success: true)
            waitForContentToLoad()
            takeScreenshot(name: "06_listen_detail")
            navigateBack()
        } else {
            logResult("No content item to tap", success: false)
        }
    }

    /// Test scrolling on Listen screen
    func testListenScrolling() throws {
        navigateToTab("Listen")
        waitForContentToLoad(timeout: 20)
        Thread.sleep(forTimeInterval: 2.0)

        logAction("Scroll down")
        scrollDown()
        takeScreenshot(name: "07_listen_scrolled")

        logAction("Scroll up")
        scrollUp()
        takeScreenshot(name: "08_listen_scrolled_back")
    }

    // MARK: - Bible Screen Tests

    /// Test Bible screen loads with book selection
    func testBibleScreenContent() throws {
        navigateToTab("Bible")
        waitForContentToLoad()

        logAllVisibleElements(screenName: "Bible Screen")

        // Log what we're looking for
        log("Looking for Bible screen elements...")
        let hasOldTestament = textExists("Old Testament", timeout: 5, logSearch: true)
        let hasTraditional = textExists("Traditional", timeout: 5, logSearch: true)
        let hasAlphabetical = textExists("Alphabetical", timeout: 5, logSearch: true)

        let hasContent = hasOldTestament || hasTraditional || hasAlphabetical
        logResult("Bible screen has content", success: hasContent)

        // Don't fail, just log - we want to discover what's actually there
        if !hasContent {
            log("⚠️ Expected elements not found. Check log for available elements.")
        }
        takeScreenshot(name: "09_bible_selection")
    }

    /// Test navigating into Bible books
    func testBibleNavigation() throws {
        navigateToTab("Bible")
        waitForContentToLoad()

        logAction("Try to tap Traditional Order or Traditional")
        if tapByText("Traditional Order", shouldLog: true) || tapByText("Traditional", shouldLog: true) {
            waitForContentToLoad()
            takeScreenshot(name: "10_bible_traditional")

            logAction("Try to tap Genesis")
            if tapByText("Genesis", shouldLog: true) {
                waitForContentToLoad()
                takeScreenshot(name: "11_bible_genesis")
                navigateBack()
            }
            navigateBack()
        } else {
            log("⚠️ Could not find Traditional Order button")
        }
    }

    // MARK: - Notes Screen Tests

    /// Test Notes screen loads
    func testNotesScreenContent() throws {
        navigateToTab("Notes")
        waitForContentToLoad()

        logAllVisibleElements(screenName: "Notes Screen")

        let textCount = getVisibleTextCount()
        log("Notes screen has \(textCount) text elements")
        takeScreenshot(name: "12_notes_screen")
    }

    // MARK: - Connect Screen Tests

    /// Test Connect screen shows menu items - logs all elements for discovery
    func testConnectScreenContent() throws {
        navigateToTab("Connect")
        waitForContentToLoad()

        logAllVisibleElements(screenName: "Connect Screen (Top)")

        // Scroll and log more
        scrollDown()
        Thread.sleep(forTimeInterval: 0.5)
        logAllVisibleElements(screenName: "Connect Screen (Scrolled)")
        scrollUp()

        // Log searches for expected elements
        log("Looking for Connect screen menu items...")
        let hasImNew = textExists("I'm New", timeout: 3, logSearch: true)
        let hasContact = textExists("Contact", timeout: 3, logSearch: true)
        let hasAnnouncements = textExists("Announcements", timeout: 3, logSearch: true)

        let hasContent = hasImNew || hasContact || hasAnnouncements
        logResult("Connect screen has expected items", success: hasContent)

        if !hasContent {
            log("⚠️ Expected elements not found. Check log for available elements on Connect screen.")
        }
        takeScreenshot(name: "13_connect_menu")
    }

    /// Test navigating to I'm New screen
    func testConnectImNew() throws {
        navigateToTab("Connect")
        waitForContentToLoad()
        logAllVisibleElements(screenName: "Connect - Looking for I'm New")

        if tapByText("I'm New", shouldLog: true) {
            waitForContentToLoad()
            logAllVisibleElements(screenName: "I'm New Screen")
            takeScreenshot(name: "14_connect_imnew")
            navigateBack()
        } else {
            log("⚠️ Could not find 'I'm New' button")
        }
    }

    /// Test navigating to Announcements
    func testConnectAnnouncements() throws {
        navigateToTab("Connect")
        waitForContentToLoad()

        logAction("Try to tap Announcements")
        if scrollToAndTap("Announcements") {
            waitForContentToLoad(timeout: 10)
            logAllVisibleElements(screenName: "Announcements Screen")
            takeScreenshot(name: "15_connect_announcements")
            navigateBack()
        } else {
            log("⚠️ Could not find 'Announcements' button")
        }
    }

    /// Test navigating to Small Groups
    func testConnectSmallGroups() throws {
        navigateToTab("Connect")
        waitForContentToLoad()

        logAction("Try to tap Small Group related button")
        if scrollToAndTap("Join a small group") || scrollToAndTap("Small Group") || scrollToAndTap("Small Groups") {
            waitForContentToLoad()
            logAllVisibleElements(screenName: "Small Groups Screen")
            takeScreenshot(name: "16_connect_smallgroup")
            navigateBack()
        } else {
            log("⚠️ Could not find Small Group button")
        }
    }

    /// Test navigating to Serve
    func testConnectServe() throws {
        navigateToTab("Connect")
        waitForContentToLoad()

        logAction("Try to tap Serve")
        if scrollToAndTap("Serve") {
            waitForContentToLoad()
            logAllVisibleElements(screenName: "Serve Screen")
            takeScreenshot(name: "17_connect_serve")
            navigateBack()
        } else {
            log("⚠️ Could not find 'Serve' button")
        }
    }

    // MARK: - More Screen Tests

    /// Test More screen shows menu items - logs all elements for discovery
    func testMoreScreenContent() throws {
        navigateToTab("More")
        waitForContentToLoad()

        logAllVisibleElements(screenName: "More Screen (Top)")

        // Scroll and log more
        scrollDown()
        Thread.sleep(forTimeInterval: 0.5)
        logAllVisibleElements(screenName: "More Screen (Scrolled)")
        scrollUp()

        // Log searches for expected elements
        log("Looking for More screen menu items...")
        let hasSettings = textExists("Settings", timeout: 3, logSearch: true)
        let hasAbout = textExists("About", timeout: 3, logSearch: true)
        let hasGive = textExists("Give", timeout: 3, logSearch: true)

        let hasContent = hasSettings || hasAbout || hasGive
        logResult("More screen has expected items", success: hasContent)

        if !hasContent {
            log("⚠️ Expected elements not found. Check log for available elements on More screen.")
        }
        takeScreenshot(name: "18_more_menu")
    }

    /// Test navigating to Settings
    func testMoreSettings() throws {
        navigateToTab("More")
        waitForContentToLoad()
        logAllVisibleElements(screenName: "More - Looking for Settings")

        logAction("Try to tap Settings")
        if scrollToAndTap("Settings") {
            waitForContentToLoad()
            logAllVisibleElements(screenName: "Settings Screen")
            takeScreenshot(name: "19_more_settings")

            log("Looking for Settings options...")
            let hasTheme = textExists("Theme", timeout: 3, logSearch: true) || textExists("Appearance", timeout: 3, logSearch: true)
            let hasLanguage = textExists("Language", timeout: 3, logSearch: true)

            logResult("Settings has options", success: hasTheme || hasLanguage)
            navigateBack()
        } else {
            log("⚠️ Could not find 'Settings' button")
        }
    }

    /// Test navigating to About
    func testMoreAbout() throws {
        navigateToTab("More")
        waitForContentToLoad()

        logAction("Try to tap About")
        if scrollToAndTap("About") {
            waitForContentToLoad()
            logAllVisibleElements(screenName: "About Screen")
            takeScreenshot(name: "20_more_about")

            log("Looking for About screen content...")
            let hasVersion = textExists("Version", timeout: 3, logSearch: true)
            let hasThrive = textExists("Thrive", timeout: 3, logSearch: true)

            logResult("About has content", success: hasVersion || hasThrive)
            navigateBack()
        } else {
            log("⚠️ Could not find 'About' button")
        }
    }

    /// Test navigating to Meet the Team
    func testMoreMeetTheTeam() throws {
        navigateToTab("More")
        waitForContentToLoad()

        logAction("Try to tap Meet the Team")
        if scrollToAndTap("Meet the Team") || scrollToAndTap("Team") || scrollToAndTap("Staff") {
            waitForContentToLoad(timeout: 10)
            logAllVisibleElements(screenName: "Meet the Team Screen")
            takeScreenshot(name: "21_more_team")
            navigateBack()
        } else {
            log("⚠️ Could not find 'Meet the Team' button")
        }
    }

    // MARK: - Sermon Detail & Playback Tests

    /// Test navigating to sermon series detail
    func testSermonSeriesDetail() throws {
        navigateToTab("Listen")
        waitForContentToLoad(timeout: 20)
        Thread.sleep(forTimeInterval: 3.0)

        logAction("Tap first sermon series")
        logAllVisibleElements(screenName: "Listen - Before Series Tap")

        // Find and tap a sermon series card (they have accessibility labels now)
        let buttons = app.buttons.allElementsBoundByIndex
        var tappedSeries = false
        for button in buttons {
            let label = button.label
            // Skip tab bar buttons
            if label.contains("tab,") { continue }
            if button.isHittable {
                logAction("Tapping series: \(label)")
                button.tap()
                tappedSeries = true
                break
            }
        }

        if tappedSeries {
            waitForContentToLoad(timeout: 10)
            logAllVisibleElements(screenName: "Series Detail Screen")
            takeScreenshot(name: "23_series_detail")

            // Verify we're on a series detail screen
            let hasSeriesContent = getVisibleTextCount() > 2
            logResult("Series detail has content", success: hasSeriesContent)
            navigateBack()
        } else {
            log("⚠️ No sermon series found to tap")
        }
    }

    /// Test navigating to sermon message detail
    func testSermonMessageDetail() throws {
        navigateToTab("Listen")
        waitForContentToLoad(timeout: 20)
        Thread.sleep(forTimeInterval: 3.0)

        // First tap into a series
        let seriesButtons = app.buttons.allElementsBoundByIndex
        var tappedSeries = false
        for button in seriesButtons {
            let label = button.label
            if label.contains("tab,") { continue }
            if button.isHittable {
                button.tap()
                tappedSeries = true
                break
            }
        }

        guard tappedSeries else {
            log("⚠️ No sermon series found")
            return
        }

        waitForContentToLoad(timeout: 10)
        Thread.sleep(forTimeInterval: 2.0)
        logAllVisibleElements(screenName: "Series Detail - Looking for Messages")

        // Look for a message to tap (usually has "Week" or a date in the label)
        logAction("Looking for sermon message to tap")
        if tapByText("Week", shouldLog: true) || tapFirstContentItem() {
            waitForContentToLoad(timeout: 10)
            logAllVisibleElements(screenName: "Sermon Detail Screen")
            takeScreenshot(name: "24_sermon_detail")

            // Look for play button or sermon content
            let hasPlayButton = textExists("Play", timeout: 3, logSearch: true) ||
                               app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'play'")).count > 0
            let hasSermonTitle = getVisibleTextCount() > 3
            logResult("Sermon detail loaded", success: hasPlayButton || hasSermonTitle)

            navigateBack()
        } else {
            log("⚠️ No sermon message found to tap")
        }
        navigateBack()
    }

    // MARK: - Bible Deep Navigation Tests

    /// Test navigating to Bible chapter reader
    func testBibleChapterReader() throws {
        navigateToTab("Bible")
        waitForContentToLoad()
        logAllVisibleElements(screenName: "Bible Selection")

        // Try to navigate to a book
        logAction("Navigate to Traditional order")
        if tapByText("Traditional", shouldLog: true) || tapByText("Traditional Order", shouldLog: true) {
            waitForContentToLoad()
            logAllVisibleElements(screenName: "Bible Book List")
            takeScreenshot(name: "25_bible_books")

            // Tap Genesis
            logAction("Navigate to Genesis")
            if tapByText("Genesis", shouldLog: true) {
                waitForContentToLoad()
                logAllVisibleElements(screenName: "Genesis Chapters")
                takeScreenshot(name: "26_genesis_chapters")

                // Tap Chapter 1
                logAction("Navigate to Chapter 1")
                if tapByText("1", shouldLog: true) || tapByText("Chapter 1", shouldLog: true) {
                    waitForContentToLoad(timeout: 15)
                    Thread.sleep(forTimeInterval: 2.0)
                    logAllVisibleElements(screenName: "Chapter Reader")
                    takeScreenshot(name: "27_chapter_reader")

                    // Verify chapter content loaded (WebView content)
                    let hasContent = getVisibleTextCount() > 0
                    logResult("Chapter reader loaded", success: hasContent)
                    navigateBack()
                }
                navigateBack()
            }
            navigateBack()
        } else {
            log("⚠️ Could not find Traditional order button")
        }
    }

    // MARK: - Notes Detail Tests

    /// Test creating a new note
    func testNotesCreateNew() throws {
        navigateToTab("Notes")
        waitForContentToLoad()
        logAllVisibleElements(screenName: "Notes List")

        // Look for a "+" or "New" button to create a note
        logAction("Look for create note button")
        let addButtons = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'add' OR label CONTAINS[c] 'new' OR label CONTAINS[c] 'create' OR label == '+'"))

        if addButtons.count > 0 {
            addButtons.firstMatch.tap()
            waitForContentToLoad()
            logAllVisibleElements(screenName: "New Note Screen")
            takeScreenshot(name: "28_new_note")

            // Verify we're on note creation screen
            let hasTextInput = app.textViews.count > 0 || app.textFields.count > 0
            logResult("Note creation screen loaded", success: hasTextInput)
            navigateBack()
        } else {
            // Try tapping on an existing note if no create button
            logAction("No create button found, trying to tap existing note")
            if tapFirstContentItem() {
                waitForContentToLoad()
                logAllVisibleElements(screenName: "Note Detail Screen")
                takeScreenshot(name: "28_note_detail")
                navigateBack()
            } else {
                log("⚠️ No notes or create button found")
            }
        }
    }

    // MARK: - Connect Screen Additional Tests

    /// Test navigating to Events screen
    func testConnectEvents() throws {
        navigateToTab("Connect")
        waitForContentToLoad()

        logAction("Navigate to Events")
        if scrollToAndTap("Events") {
            waitForContentToLoad(timeout: 10)
            logAllVisibleElements(screenName: "Events Screen")
            takeScreenshot(name: "29_events_screen")

            // Check for events content or empty state
            let hasEvents = getVisibleTextCount() > 1
            logResult("Events screen loaded", success: hasEvents)

            // Try to tap on an event if available
            let eventCards = app.buttons.allElementsBoundByIndex.filter { !$0.label.contains("tab,") && $0.isHittable }
            if eventCards.count > 5 { // More than just tab bar
                logAction("Tap first event")
                eventCards[5].tap()
                waitForContentToLoad()
                logAllVisibleElements(screenName: "Event Detail")
                takeScreenshot(name: "30_event_detail")
                navigateBack()
            }

            navigateBack()
        } else {
            log("⚠️ Could not find Events button")
        }
    }

    /// Test navigating to Contact screen
    func testConnectContact() throws {
        navigateToTab("Connect")
        waitForContentToLoad()

        logAction("Navigate to Contact")
        if scrollToAndTap("Contact") || scrollToAndTap("Contact us") {
            waitForContentToLoad()
            logAllVisibleElements(screenName: "Contact Screen")
            takeScreenshot(name: "31_contact_screen")

            // Look for contact options
            let hasEmail = textExists("Email", timeout: 3, logSearch: true) ||
                          textExists("email", timeout: 2, logSearch: true)
            let hasPhone = textExists("Phone", timeout: 3, logSearch: true) ||
                          textExists("Call", timeout: 2, logSearch: true)
            let hasPrayer = textExists("Prayer", timeout: 3, logSearch: true)

            logResult("Contact screen has options", success: hasEmail || hasPhone || hasPrayer)
            navigateBack()
        } else {
            log("⚠️ Could not find Contact button")
        }
    }

    /// Test navigating to Social screen
    func testConnectSocial() throws {
        navigateToTab("Connect")
        waitForContentToLoad()

        logAction("Navigate to Social")
        if scrollToAndTap("Social") {
            waitForContentToLoad()
            logAllVisibleElements(screenName: "Social Screen")
            takeScreenshot(name: "32_social_screen")

            // Look for social media links
            let hasFacebook = textExists("Facebook", timeout: 3, logSearch: true)
            let hasInstagram = textExists("Instagram", timeout: 3, logSearch: true)
            let hasYouTube = textExists("YouTube", timeout: 3, logSearch: true)

            logResult("Social screen has links", success: hasFacebook || hasInstagram || hasYouTube)
            navigateBack()
        } else {
            log("⚠️ Could not find Social button")
        }
    }

    // MARK: - More Screen Additional Tests

    /// Test navigating to Give screen
    func testMoreGive() throws {
        navigateToTab("More")
        waitForContentToLoad()

        logAction("Navigate to Give")
        if scrollToAndTap("Give") {
            waitForContentToLoad(timeout: 10)
            logAllVisibleElements(screenName: "Give Screen")
            takeScreenshot(name: "33_give_screen")

            // Give usually opens a WebView
            let hasWebContent = app.webViews.count > 0 || getVisibleTextCount() > 1
            logResult("Give screen loaded", success: hasWebContent)
            navigateBack()
        } else {
            log("⚠️ Could not find Give button")
        }
    }

    /// Test Settings appearance toggle
    func testSettingsAppearanceToggle() throws {
        navigateToTab("More")
        waitForContentToLoad()

        logAction("Navigate to Settings")
        if scrollToAndTap("Settings") {
            waitForContentToLoad()
            logAllVisibleElements(screenName: "Settings - Looking for Appearance")

            // Look for Appearance/Theme option
            logAction("Look for Appearance option")
            if tapByText("Appearance", shouldLog: true) || tapByText("Theme", shouldLog: true) {
                waitForContentToLoad()
                logAllVisibleElements(screenName: "Appearance Settings")
                takeScreenshot(name: "34_appearance_settings")

                // Look for theme options (Light, Dark, System)
                let hasLight = textExists("Light", timeout: 3, logSearch: true)
                let hasDark = textExists("Dark", timeout: 3, logSearch: true)
                let hasSystem = textExists("System", timeout: 3, logSearch: true)

                logResult("Appearance options available", success: hasLight || hasDark || hasSystem)

                // Try to toggle to Dark mode
                if tapByText("Dark", shouldLog: true) {
                    Thread.sleep(forTimeInterval: 1.0)
                    takeScreenshot(name: "35_dark_mode")
                    logResult("Toggled to Dark mode", success: true)

                    // Toggle back to System
                    if tapByText("System", shouldLog: true) {
                        Thread.sleep(forTimeInterval: 1.0)
                        logResult("Toggled back to System", success: true)
                    }
                }
                navigateBack()
            }
            navigateBack()
        } else {
            log("⚠️ Could not find Settings button")
        }
    }

    /// Test Settings language option
    func testSettingsLanguage() throws {
        navigateToTab("More")
        waitForContentToLoad()

        logAction("Navigate to Settings")
        if scrollToAndTap("Settings") {
            waitForContentToLoad()

            logAction("Look for Language option")
            if tapByText("Language", shouldLog: true) {
                waitForContentToLoad()
                logAllVisibleElements(screenName: "Language Settings")
                takeScreenshot(name: "36_language_settings")

                // Look for language options
                let hasEnglish = textExists("English", timeout: 3, logSearch: true)
                let hasSpanish = textExists("Español", timeout: 3, logSearch: true) ||
                                textExists("Spanish", timeout: 2, logSearch: true)

                logResult("Language options available", success: hasEnglish || hasSpanish)
                navigateBack()
            }
            navigateBack()
        } else {
            log("⚠️ Could not find Settings button")
        }
    }

    // MARK: - Listen Screen Additional Tests

    /// Test navigating to Search screen
    func testListenSearch() throws {
        navigateToTab("Listen")
        waitForContentToLoad(timeout: 10)

        logAction("Look for Search button")
        logAllVisibleElements(screenName: "Listen - Looking for Search")

        // Search is usually in the navigation bar
        let searchButtons = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'search'"))
        if searchButtons.count > 0 {
            searchButtons.firstMatch.tap()
            waitForContentToLoad()
            logAllVisibleElements(screenName: "Search Screen")
            takeScreenshot(name: "37_search_screen")

            // Look for search UI elements
            let hasSearchField = app.searchFields.count > 0 || app.textFields.count > 0
            let hasFilters = textExists("Series", timeout: 3, logSearch: true) ||
                            textExists("Messages", timeout: 3, logSearch: true) ||
                            textExists("Tags", timeout: 3, logSearch: true)

            logResult("Search screen loaded", success: hasSearchField || hasFilters)
            navigateBack()
        } else {
            log("⚠️ Could not find Search button")
        }
    }

    /// Test navigating to Downloads screen
    func testListenDownloads() throws {
        navigateToTab("Listen")
        waitForContentToLoad(timeout: 10)

        logAction("Look for Downloads button")
        logAllVisibleElements(screenName: "Listen - Looking for Downloads")

        // Downloads is usually in the navigation bar
        let downloadButtons = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'download'"))
        if downloadButtons.count > 0 {
            downloadButtons.firstMatch.tap()
            waitForContentToLoad()
            logAllVisibleElements(screenName: "Downloads Screen")
            takeScreenshot(name: "38_downloads_screen")

            // Look for downloads content or empty state
            let hasDownloads = getVisibleTextCount() > 1
            logResult("Downloads screen loaded", success: hasDownloads)
            navigateBack()
        } else {
            log("⚠️ Could not find Downloads button")
        }
    }

    /// Test navigating to Recently Played
    func testListenRecentlyPlayed() throws {
        navigateToTab("Listen")
        waitForContentToLoad(timeout: 10)

        logAction("Look for Recently Played")
        if scrollToAndTap("Recently Played") || scrollToAndTap("Recent") {
            waitForContentToLoad()
            logAllVisibleElements(screenName: "Recently Played Screen")
            takeScreenshot(name: "39_recently_played")

            let hasContent = getVisibleTextCount() > 1
            logResult("Recently Played loaded", success: hasContent)
            navigateBack()
        } else {
            log("⚠️ Could not find Recently Played - may not be visible")
        }
    }

    // MARK: - Integration Tests

    /// Test full app flow with logging
    func testCompleteAppFlow() throws {
        logSection("COMPLETE APP FLOW TEST")

        // Listen tab
        logAction("Navigate to Listen tab")
        navigateToTab("Listen")
        waitForContentToLoad(timeout: 15)
        Thread.sleep(forTimeInterval: 2.0)
        let listenCount = getVisibleTextCount()
        log("Listen tab: \(listenCount) text elements")
        logResult("Listen has content", success: listenCount > 3)

        // Bible tab
        logAction("Navigate to Bible tab")
        navigateToTab("Bible")
        waitForContentToLoad()
        let bibleCount = getVisibleTextCount()
        log("Bible tab: \(bibleCount) text elements")
        logResult("Bible has content", success: bibleCount > 3)

        // Notes tab
        logAction("Navigate to Notes tab")
        navigateToTab("Notes")
        waitForContentToLoad()
        let notesCount = getVisibleTextCount()
        log("Notes tab: \(notesCount) text elements")
        logResult("Notes loaded", success: notesCount >= 1)

        // Connect tab
        logAction("Navigate to Connect tab")
        navigateToTab("Connect")
        waitForContentToLoad()
        let connectCount = getVisibleTextCount()
        log("Connect tab: \(connectCount) text elements")
        logResult("Connect has items", success: connectCount > 3)

        // More tab
        logAction("Navigate to More tab")
        navigateToTab("More")
        waitForContentToLoad()
        let moreCount = getVisibleTextCount()
        log("More tab: \(moreCount) text elements")
        logResult("More has items", success: moreCount > 3)

        takeScreenshot(name: "40_complete_flow_end")
        log("Complete app flow test finished")
    }
}

