package com.thrivefl.ThriveCommunityChurch

import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.ViewInteraction
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import org.hamcrest.Matcher
import org.hamcrest.Matchers.allOf
import org.junit.Before
import org.junit.Rule

/**
 * Base class for UI Tests - provides common utilities and helpers
 * for testing React Native apps with Espresso
 */
abstract class ThriveTestBase {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    protected lateinit var device: UiDevice

    @Before
    open fun setUp() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        // Wait for React Native to initialize
        waitForReactNativeToLoad()
    }

    // MARK: - Wait Helpers

    /**
     * Wait for React Native to fully initialize
     */
    protected fun waitForReactNativeToLoad(timeoutMs: Long = 15000) {
        Thread.sleep(timeoutMs)
    }

    /**
     * Wait for a specific duration
     */
    protected fun wait(ms: Long) {
        Thread.sleep(ms)
    }

    /**
     * Wait for content to settle
     */
    protected fun waitForContentToLoad() {
        wait(2000)
    }

    // MARK: - UiAutomator Helpers (for React Native content)

    /**
     * Find element by text using UiAutomator
     * React Native elements are better found using UiAutomator
     */
    protected fun findByText(text: String, timeoutMs: Long = 10000): Boolean {
        val selector = UiSelector().textContains(text)
        val element = device.findObject(selector)
        return element.waitForExists(timeoutMs)
    }

    /**
     * Click element by text using UiAutomator
     */
    protected fun clickByText(text: String, timeoutMs: Long = 10000): Boolean {
        val selector = UiSelector().textContains(text)
        val element = device.findObject(selector)
        if (element.waitForExists(timeoutMs)) {
            element.click()
            return true
        }
        return false
    }

    /**
     * Find element by description using UiAutomator
     */
    protected fun findByDescription(description: String, timeoutMs: Long = 10000): Boolean {
        val selector = UiSelector().descriptionContains(description)
        val element = device.findObject(selector)
        return element.waitForExists(timeoutMs)
    }

    /**
     * Click element by description using UiAutomator
     */
    protected fun clickByDescription(description: String, timeoutMs: Long = 10000): Boolean {
        val selector = UiSelector().descriptionContains(description)
        val element = device.findObject(selector)
        if (element.waitForExists(timeoutMs)) {
            element.click()
            return true
        }
        return false
    }

    // MARK: - Tab Navigation

    /**
     * Navigate to a specific tab by name
     */
    protected fun navigateToTab(tabName: String): Boolean {
        return clickByText(tabName) || clickByDescription(tabName)
    }

    /**
     * Verify all tabs exist
     */
    protected fun verifyTabsExist(): Boolean {
        val tabs = listOf("Listen", "Bible", "Notes", "Connect", "More")
        return tabs.all { findByText(it, 5000) || findByDescription(it, 5000) }
    }

    // MARK: - Onboarding Helpers

    /**
     * Dismiss onboarding if present
     */
    protected fun dismissOnboardingIfPresent() {
        // Look for Skip button
        if (findByText("Skip", 5000)) {
            clickByText("Skip")
            waitForContentToLoad()
        }
    }

    /**
     * Check if onboarding is present
     */
    protected fun isOnboardingPresent(): Boolean {
        return findByText("Skip", 3000)
    }

    // MARK: - Screenshot Helpers

    /**
     * Take a screenshot with a given name
     * Note: Requires screenshot permission or use adb
     */
    protected fun takeScreenshot(name: String) {
        // Screenshots in Espresso tests are typically done via test orchestrator
        // or by using libraries like Falcon or Screenshot
        // For basic testing, we just log the event
        println("📸 Screenshot: $name")
    }

    // MARK: - Activity Helpers

    /**
     * Verify the activity is still running
     */
    protected fun verifyActivityRunning(): Boolean {
        var isRunning = false
        activityRule.scenario.onActivity { activity ->
            isRunning = !activity.isFinishing && !activity.isDestroyed
        }
        return isRunning
    }
}

