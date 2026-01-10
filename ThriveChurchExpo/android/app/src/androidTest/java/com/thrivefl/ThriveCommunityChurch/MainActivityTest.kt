package com.thrivefl.ThriveCommunityChurch

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
import org.hamcrest.Matchers.anyOf
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * UI Tests for Thrive Church Official App (Android)
 * 
 * These tests verify basic app functionality and navigation.
 * Run with: ./gradlew connectedAndroidTest
 */
@RunWith(AndroidJUnit4::class)
@LargeTest
class MainActivityTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    /**
     * Test that the app launches successfully
     */
    @Test
    fun testAppLaunches() {
        // Verify the app context is correct
        val appContext = InstrumentationRegistry.getInstrumentation().targetContext
        assert(appContext.packageName == "com.thrivefl.ThriveCommunityChurch")
    }

    /**
     * Test that the main activity is displayed
     */
    @Test
    fun testMainActivityDisplayed() {
        // Give the app time to load React Native
        Thread.sleep(5000)
        
        // The activity should be in a resumed state
        activityRule.scenario.onActivity { activity ->
            assert(!activity.isFinishing)
        }
    }

    /**
     * Test that either onboarding or main content appears
     * Note: React Native content is rendered in a ReactRootView,
     * so we're mainly testing that the app doesn't crash during launch
     */
    @Test
    fun testContentLoads() {
        // Wait for React Native to initialize
        Thread.sleep(10000)
        
        // Verify the activity is still running (didn't crash)
        activityRule.scenario.onActivity { activity ->
            assert(!activity.isDestroyed)
            assert(!activity.isFinishing)
        }
    }
}

