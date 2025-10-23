/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging and local notifications
 * Matches iOS implementation in AppDelegate.swift
 */

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType, AuthorizationStatus } from '@notifee/react-native';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { logError, logWarning, logInfo } from '../logging/logger';
import { featureFlags } from '../../config/firebase.config';

// Type alias for convenience
type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;

/**
 * Check if running on a simulator/emulator
 * Push notifications don't work on simulators
 */
const isRunningOnSimulator = (): boolean => {
  // Check if running on iOS Simulator
  if (Platform.OS === 'ios') {
    return Constants.platform?.ios?.simulator ?? false;
  }

  // Check if running on Android Emulator
  if (Platform.OS === 'android') {
    return Constants.platform?.android?.isDevice === false;
  }

  return false;
};

/**
 * Check if push notifications are enabled via feature flag
 */
const isPushNotificationsEnabled = (): boolean => {
  return featureFlags.pushNotifications;
};

/**
 * Request notification permissions
 * Matches iOS: UNUserNotificationCenter.current().requestAuthorization
 * NOTE: Firebase automatically registers for remote messages, no need to call registerDeviceForRemoteMessages()
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isPushNotificationsEnabled()) {
    console.log('Push: Notification permission (disabled by feature flag)');
    return false;
  }

  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Push: Notification permission granted');
      await logInfo('Push notification permission granted');
    } else {
      console.log('Push: Notification permission denied');
      await logWarning('Push notification permission denied');
    }

    return enabled;
  } catch (error) {
    console.error('Push: Error requesting notification permission:', error);
    await logError(`Failed to request notification permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Get FCM token
 * Matches iOS: Messaging.messaging().token
 * NOTE: On iOS, APNS token must be registered first before FCM token is available
 * WARNING: FCM tokens are not available on iOS Simulator - requires physical device
 */
export const getFCMToken = async (): Promise<string | null> => {
  if (!isPushNotificationsEnabled()) {
    console.log('Push: FCM Token (disabled by feature flag)');
    return null;
  }

  try {
    const token = await messaging().getToken();
    if (token) {
      console.log('Push: ✅ FCM Token obtained:', token.substring(0, 20) + '...');
      console.log('Push: Full FCM Token:', token);
      await logInfo('FCM token obtained successfully');
    } else {
      console.log('Push: No FCM token available yet (waiting for APNS token)');
      await logWarning('No FCM token available');
    }
    return token;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.log('Push: getToken() threw error:', errorMessage);

    // Check if this is an APNS token not ready error
    if (errorMessage.includes('No APNS token') || errorMessage.includes('APNS device token not set')) {
      console.log('Push: ⚠️ Waiting for APNS token registration. FCM token will be available via onTokenRefresh listener.');
      await logWarning('Waiting for APNS token registration');
    } else if (errorMessage.includes('unregistered') || errorMessage.includes('simulator')) {
      console.log('Push: ⚠️ FCM token not available in development build - this is expected.');
      console.log('Push: To get FCM token, build a release version or check Firebase Console for registered devices.');
      await logWarning('FCM token not available in development build');
    } else {
      console.error('Push: Error getting FCM token:', error);
      await logError(`Failed to get FCM token: ${errorMessage}`);
    }
    return null;
  }
};

/**
 * Register for remote notifications
 * Matches iOS: application.registerForRemoteNotifications()
 */
export const registerForRemoteNotifications = async (): Promise<void> => {
  if (!isPushNotificationsEnabled()) {
    console.log('Push: Register for remote notifications (disabled by feature flag)');
    return;
  }

  try {
    // Request permission first
    const hasPermission = await requestNotificationPermission();

    if (hasPermission) {
      // Get FCM token
      const token = await getFCMToken();

      if (token) {
        console.log('Push: Successfully registered for remote notifications');
        await logInfo('Successfully registered for remote notifications');

        // TODO: Send token to your backend server
        // await sendTokenToServer(token);
      }
    } else {
      console.log('Push: Cannot register - permission not granted');
      await logWarning('Cannot register for remote notifications - permission not granted');
    }
  } catch (error) {
    console.error('Push: Error registering for remote notifications:', error);
    await logError(`Failed to register for remote notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Display notification using Notifee
 * Provides better UX than default Firebase notifications
 */
export const displayNotification = async (
  remoteMessage: RemoteMessage
): Promise<void> => {
  try {
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    await notifee.displayNotification({
      title: remoteMessage.notification?.title || 'Thrive Church',
      body: remoteMessage.notification?.body || '',
      data: remoteMessage.data,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        sound: 'default',
      },
      ios: {
        sound: 'default',
        badgeCount: 1,
      },
    });

    console.log('Push: Notification displayed');
  } catch (error) {
    console.error('Push: Error displaying notification:', error);
  }
};

/**
 * Handle foreground messages
 * Matches iOS: userNotificationCenter(_:willPresent:withCompletionHandler:)
 */
export const setupForegroundMessageHandler = (): (() => void) | undefined => {
  if (!isPushNotificationsEnabled()) {
    console.log('Push: Foreground message handler (disabled by feature flag)');
    return undefined;
  }

  try {
    // Handle messages when app is in foreground
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Push: Foreground message received:', remoteMessage);

      // Display notification using Notifee for better UX
      await displayNotification(remoteMessage);

      // Log to Firebase Analytics (matches iOS behavior)
      await logInfo(`Foreground notification received: ${remoteMessage.notification?.title || 'No title'}`);
    });

    console.log('Push: Foreground message handler registered');
    return unsubscribe;
  } catch (error) {
    console.error('Push: Error setting up foreground message handler:', error);
    logError(`Failed to setup foreground message handler: ${error instanceof Error ? error.message : 'Unknown error'}`).catch(() => {});
    return undefined;
  }
};

/**
 * Handle background messages
 * Matches iOS: userNotificationCenter(_:didReceive:withCompletionHandler:)
 * NOTE: This must be called at the top level (in index.js) for background messages to work
 */
export const setupBackgroundMessageHandler = (): void => {
  if (!isPushNotificationsEnabled()) {
    console.log('Push: Background message handler (disabled by feature flag)');
    return;
  }

  try {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Push: Background message received:', remoteMessage);

      // Display notification using Notifee
      await displayNotification(remoteMessage);

      // Log to Firebase Analytics (matches iOS behavior)
      await logInfo(`Background notification received: ${remoteMessage.notification?.title || 'No title'}`);
    });

    console.log('Push: Background message handler registered');
  } catch (error) {
    console.error('Push: Error setting up background message handler:', error);
    logError(`Failed to setup background message handler: ${error instanceof Error ? error.message : 'Unknown error'}`).catch(() => {});
  }
};

/**
 * Handle notification opened (user tapped notification)
 */
export const setupNotificationOpenedHandler = (
  onNotificationOpened: (remoteMessage: RemoteMessage) => void
): void => {
  if (!isPushNotificationsEnabled()) {
    console.log('Push: Notification opened handler (disabled by feature flag)');
    return;
  }

  try {
    // Handle notification opened when app was in background or quit
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Push: Notification opened app from background:', remoteMessage);
      onNotificationOpened(remoteMessage);
    });

    // Handle notification opened when app was quit
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Push: Notification opened app from quit state:', remoteMessage);
          onNotificationOpened(remoteMessage);
        }
      });

    // Handle Notifee notification press (for foreground notifications)
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Push: Notifee notification pressed:', detail);
        // Handle notification press
        if (detail.notification?.data) {
          onNotificationOpened(detail.notification.data as any);
        }
      }
    });

    console.log('Push: Notification opened handler registered');
  } catch (error) {
    console.error('Push: Error setting up notification opened handler:', error);
    logError(`Failed to setup notification opened handler: ${error instanceof Error ? error.message : 'Unknown error'}`).catch(() => {});
  }
};

/**
 * Set badge count (iOS only)
 * Matches iOS: UIApplication.shared.applicationIconBadgeNumber = 0
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await notifee.setBadgeCount(count);
      console.log('Push: Badge count set to:', count);
    }
  } catch (error) {
    console.error('Push: Error setting badge count:', error);
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (): Promise<void> => {
  try {
    await notifee.cancelAllNotifications();
    await setBadgeCount(0);
    console.log('Push: All notifications cleared');
  } catch (error) {
    console.error('Push: Error clearing notifications:', error);
  }
};

/**
 * Initialize push notifications
 * Call this on app startup
 * NOTE: Skips initialization on simulators/emulators (push notifications don't work there)
 */
export const initializePushNotifications = async (
  onNotificationOpened?: (remoteMessage: RemoteMessage) => void
): Promise<void> => {
  // Check if running on simulator/emulator
  if (isRunningOnSimulator()) {
    console.log('Push: Skipping push notification initialization (running on simulator/emulator)');
    console.log('Push: Push notifications require a physical device with valid APNS/FCM configuration');
    return;
  }

  if (!isPushNotificationsEnabled()) {
    console.log('Push: Push notifications disabled by feature flag');
    return;
  }

  try {
    console.log('Push: Initializing push notifications...');

    // Register for remote notifications
    await registerForRemoteNotifications();

    // Setup foreground message handler
    setupForegroundMessageHandler();

    // Setup notification opened handler
    if (onNotificationOpened) {
      setupNotificationOpenedHandler(onNotificationOpened);
    }

    // Listen for token refresh (this will fire when APNS token is registered)
    messaging().onTokenRefresh(async (token) => {
      console.log('Push: ✅ FCM Token received via onTokenRefresh!');
      console.log('Push: FCM Token (first 20 chars):', token.substring(0, 20) + '...');
      console.log('Push: Full FCM Token:', token);
      await logInfo('FCM token refreshed');
      // TODO: Send new token to your backend server
      // await sendTokenToServer(token);
    });

    // Clear badge on app open (matches iOS behavior)
    await setBadgeCount(0);

    console.log('Push: Push notifications initialized successfully');
    await logInfo('Push notifications initialized successfully');
  } catch (error) {
    console.error('Push: Error initializing push notifications:', error);
    await logError(`Failed to initialize push notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if notifications are enabled
 */
export const checkNotificationPermission = async (): Promise<boolean> => {
  if (!isPushNotificationsEnabled()) {
    console.log('Push: Check notification permission (disabled by feature flag)');
    return false;
  }

  try {
    const authStatus = await messaging().hasPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    console.log('Push: Notification permission status:', enabled ? 'Enabled' : 'Disabled');
    return enabled;
  } catch (error) {
    console.error('Push: Error checking notification permission:', error);
    await logError(`Failed to check notification permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Prompt user to enable notifications if disabled
 */
export const promptForNotificationPermission = async (): Promise<void> => {
  if (!isPushNotificationsEnabled()) {
    console.log('Push: Prompt for notification permission (disabled by feature flag)');
    return;
  }

  try {
    const hasPermission = await checkNotificationPermission();

    if (!hasPermission) {
      Alert.alert(
        'Enable Notifications',
        'Stay updated with the latest sermons, events, and announcements from Thrive Church.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
          },
          {
            text: 'Enable',
            onPress: async () => {
              const granted = await requestNotificationPermission();
              if (granted) {
                await logInfo('User enabled push notifications via prompt');
              }
            },
          },
        ]
      );
    }
  } catch (error) {
    console.error('Push: Error prompting for notification permission:', error);
    await logError(`Failed to prompt for notification permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default {
  initializePushNotifications,
  requestNotificationPermission,
  getFCMToken,
  registerForRemoteNotifications,
  displayNotification,
  setupForegroundMessageHandler,
  setupBackgroundMessageHandler,
  setupNotificationOpenedHandler,
  setBadgeCount,
  clearAllNotifications,
  checkNotificationPermission,
  promptForNotificationPermission,
};

