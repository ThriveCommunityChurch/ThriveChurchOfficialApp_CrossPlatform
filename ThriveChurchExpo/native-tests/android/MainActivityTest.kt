package com.thrivefl.ThriveCommunityChurch

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

/**
 * UI Tests for Thrive Church Official App (Android)
 *
 * These tests verify basic app functionality and navigation.
 * Run with: ./gradlew connectedAndroidTest
 *
 * Note: React Native content is rendered in a ReactRootView,
 * so we use UiAutomator (via ThriveTestBase) to interact with
 * React Native elements by their text or accessibility labels.
 */
@RunWith(AndroidJUnit4::class)
@LargeTest
class MainActivityTest : ThriveTestBase() {

    // MARK: - Smoke Tests

    /**
     * Test that the app launches successfully
     */
    @Test
    fun testAppLaunches() {
        // Verify the app context is correct
        val appContext = InstrumentationRegistry.getInstrumentation().targetContext
        assertEquals("com.thrivefl.ThriveCommunityChurch", appContext.packageName)

        // Verify activity is running
        assertTrue("Activity should be running", verifyActivityRunning())
        takeScreenshot("app_launch")
    }

    /**
     * Test that the main activity is displayed and stable
     */
    @Test
    fun testMainActivityDisplayed() {
        // The activity should be in a resumed state
        assertTrue("Activity should not be finishing", verifyActivityRunning())
    }

    /**
     * Test that either onboarding or main content appears
     */
    @Test
    fun testContentLoads() {
        // Check for either Skip button (onboarding) or tab bar content
        val onboardingPresent = isOnboardingPresent()
        val tabsPresent = verifyTabsExist()

        assertTrue(
            "Either onboarding or main content should appear",
            onboardingPresent || tabsPresent
        )

        // Verify the activity is still running
        assertTrue("Activity should still be running", verifyActivityRunning())
    }

    // MARK: - Tab Navigation Tests

    /**
     * Test navigation to Listen tab
     */
    @Test
    fun testNavigateToListenTab() {
        dismissOnboardingIfPresent()
        assertTrue("Listen tab should be accessible", navigateToTab("Listen"))
        waitForContentToLoad()
        takeScreenshot("listen_tab")
    }

    /**
     * Test navigation to Bible tab
     */
    @Test
    fun testNavigateToBibleTab() {
        dismissOnboardingIfPresent()
        assertTrue("Bible tab should be accessible", navigateToTab("Bible"))
        waitForContentToLoad()
        takeScreenshot("bible_tab")
    }

    /**
     * Test navigation to Notes tab
     */
    @Test
    fun testNavigateToNotesTab() {
        dismissOnboardingIfPresent()
        assertTrue("Notes tab should be accessible", navigateToTab("Notes"))
        waitForContentToLoad()
        takeScreenshot("notes_tab")
    }

    /**
     * Test navigation to Connect tab
     */
    @Test
    fun testNavigateToConnectTab() {
        dismissOnboardingIfPresent()
        assertTrue("Connect tab should be accessible", navigateToTab("Connect"))
        waitForContentToLoad()
        takeScreenshot("connect_tab")
    }

    /**
     * Test navigation to More tab
     */
    @Test
    fun testNavigateToMoreTab() {
        dismissOnboardingIfPresent()
        assertTrue("More tab should be accessible", navigateToTab("More"))
        waitForContentToLoad()
        takeScreenshot("more_tab")
    }

    /**
     * Test all tabs exist
     */
    @Test
    fun testAllTabsExist() {
        dismissOnboardingIfPresent()
        assertTrue("All tabs should be visible", verifyTabsExist())
        takeScreenshot("all_tabs_validated")
    }

    /**
     * Test cycling through all tabs
     */
    @Test
    fun testTabCycling() {
        dismissOnboardingIfPresent()

        val tabs = listOf("Listen", "Bible", "Notes", "Connect", "More")
        for (tab in tabs) {
            assertTrue("Should navigate to $tab tab", navigateToTab(tab))
            waitForContentToLoad()
            takeScreenshot("tab_cycle_${tab.lowercase()}")
        }
    }

    // MARK: - Listen Screen Tests

    /**
     * Test sermon series list loads
     */
    @Test
    fun testSermonSeriesLoads() {
        dismissOnboardingIfPresent()
        navigateToTab("Listen")

        // Wait for content to load (extra time for network)
        wait(5000)

        // Activity should still be running
        assertTrue("Activity should still be running after loading sermons", verifyActivityRunning())
        takeScreenshot("sermon_series_list")
    }

    // MARK: - Settings Tests

    /**
     * Test Settings navigation
     */
    @Test
    fun testSettingsNavigation() {
        dismissOnboardingIfPresent()
        navigateToTab("More")
        waitForContentToLoad()

        // Try to find and tap Settings
        if (clickByText("Settings")) {
            waitForContentToLoad()
            takeScreenshot("settings_screen")

            // Navigate back
            device.pressBack()
            waitForContentToLoad()
        }
    }

    /**
     * Test About screen navigation
     */
    @Test
    fun testAboutNavigation() {
        dismissOnboardingIfPresent()
        navigateToTab("More")
        waitForContentToLoad()

        // Try to find and tap About
        if (clickByText("About")) {
            waitForContentToLoad()
            takeScreenshot("about_screen")

            // Navigate back
            device.pressBack()
            waitForContentToLoad()
        }
    }
}

