package com.thrivefl.ThriveCommunityChurch

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * UI Tests for the Onboarding flow
 * 
 * Note: These tests require a fresh app state (onboarding not completed).
 * In CI, you may need to clear app data before running these tests.
 * 
 * Run with: ./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.thrivefl.ThriveCommunityChurch.OnboardingTest
 */
@RunWith(AndroidJUnit4::class)
@LargeTest
class OnboardingTest : ThriveTestBase() {

    // MARK: - Onboarding Flow Tests

    /**
     * Test onboarding screen structure when present
     */
    @Test
    fun testOnboardingStructure() {
        // Skip if onboarding is not present
        assumeTrue("Onboarding should be present", isOnboardingPresent())
        
        // Verify Skip button exists
        assertTrue("Skip button should be visible", findByText("Skip"))
        takeScreenshot("onboarding_page_1")
    }

    /**
     * Test onboarding navigation through pages
     */
    @Test
    fun testOnboardingPageNavigation() {
        assumeTrue("Onboarding should be present", isOnboardingPresent())
        
        var pageNumber = 1
        takeScreenshot("onboarding_page_$pageNumber")
        
        // Navigate through pages with Next button
        while (findByText("NEXT", 2000)) {
            if (clickByText("NEXT")) {
                wait(500)
                pageNumber++
                takeScreenshot("onboarding_page_$pageNumber")
                
                // Safety limit
                if (pageNumber > 10) break
            } else {
                break
            }
        }
        
        assertTrue("Should navigate through multiple pages", pageNumber > 1)
    }

    /**
     * Test Skip button functionality
     */
    @Test
    fun testOnboardingSkip() {
        assumeTrue("Onboarding should be present", isOnboardingPresent())
        
        // Tap Skip
        assertTrue("Should click Skip button", clickByText("Skip"))
        
        // Verify we're taken to the main app (tabs visible)
        waitForContentToLoad()
        assertTrue("Tabs should be visible after skipping", verifyTabsExist())
        
        takeScreenshot("onboarding_skipped_main_screen")
    }

    /**
     * Test completing onboarding to the end
     */
    @Test
    fun testOnboardingComplete() {
        assumeTrue("Onboarding should be present", isOnboardingPresent())
        
        // Navigate through all pages
        while (findByText("NEXT", 2000)) {
            if (!clickByText("NEXT")) break
            wait(500)
        }
        
        // Tap Done button on last page
        if (findByText("Done", 3000)) {
            clickByText("Done")
        }
        
        // Verify we're taken to the main app
        waitForContentToLoad()
        assertTrue("Tabs should be visible after completing onboarding", verifyTabsExist())
        
        takeScreenshot("onboarding_complete_main_screen")
    }

    /**
     * Test Previous button navigation
     */
    @Test
    fun testOnboardingPreviousButton() {
        assumeTrue("Onboarding should be present", isOnboardingPresent())
        
        // Navigate to page 2
        if (findByText("NEXT", 2000)) {
            clickByText("NEXT")
            wait(500)
        }
        
        takeScreenshot("onboarding_page_2_before_prev")
        
        // Navigate back with Prev button
        if (findByText("Prev", 2000)) {
            clickByText("Prev")
            wait(500)
            takeScreenshot("onboarding_page_1_after_prev")
        }
    }

    /**
     * Test swipe navigation between pages
     */
    @Test
    fun testOnboardingSwipeNavigation() {
        assumeTrue("Onboarding should be present", isOnboardingPresent())
        
        takeScreenshot("onboarding_swipe_page_1")
        
        // Swipe left to go to next page
        device.swipe(
            device.displayWidth * 3 / 4,
            device.displayHeight / 2,
            device.displayWidth / 4,
            device.displayHeight / 2,
            10
        )
        wait(500)
        takeScreenshot("onboarding_swipe_page_2")
        
        // Swipe right to go back
        device.swipe(
            device.displayWidth / 4,
            device.displayHeight / 2,
            device.displayWidth * 3 / 4,
            device.displayHeight / 2,
            10
        )
        wait(500)
        takeScreenshot("onboarding_swipe_back_page_1")
    }
}

