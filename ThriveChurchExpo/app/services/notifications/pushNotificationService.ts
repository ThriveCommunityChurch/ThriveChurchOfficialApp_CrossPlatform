/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging and local notifications
 * Matches iOS implementation in AppDelegate.swift
 *
 * NOTE: Firebase Messaging temporarily disabled due to Expo SDK 54 compatibility issues
 * TODO: Re-enable when upgrading to compatible version or downgrading React Native Firebase
 */

// import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform, Alert } from 'react-native';
import { logError, logWarning } from '../logging/logger';

// Stub type for FirebaseMessagingTypes.RemoteMessage since Firebase Messaging is disabled
type RemoteMessage = {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: { [key: string]: string };
};

/**
 * Request notification permissions
 * Matches iOS: UNUserNotificationCenter.current().requestAuthorization
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  console.log('Push: Notification permission (disabled - Firebase Messaging not available)');
  return false;
};

/**
 * Get FCM token
 * Matches iOS: Messaging.messaging().token
 */
export const getFCMToken = async (): Promise<string | null> => {
  console.log('Push: FCM Token (disabled - Firebase Messaging not available)');
  return null;
};

/**
 * Register for remote notifications
 * Matches iOS: application.registerForRemoteNotifications()
 */
export const registerForRemoteNotifications = async (): Promise<void> => {
  console.log('Push: Register for remote notifications (disabled - Firebase Messaging not available)');
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
export const setupForegroundMessageHandler = (): void => {
  console.log('Push: Foreground message handler (disabled - Firebase Messaging not available)');
};

/**
 * Handle background messages
 * Matches iOS: userNotificationCenter(_:didReceive:withCompletionHandler:)
 */
export const setupBackgroundMessageHandler = (): void => {
  console.log('Push: Background message handler (disabled - Firebase Messaging not available)');
};

/**
 * Handle notification opened (user tapped notification)
 */
export const setupNotificationOpenedHandler = (
  onNotificationOpened: (remoteMessage: RemoteMessage) => void
): void => {
  console.log('Push: Notification opened handler (disabled - Firebase Messaging not available)');

  // Handle Notifee notification press (still works without Firebase Messaging)
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('Push: Notifee notification pressed:', detail);
      // Handle notification press
      if (detail.notification?.data) {
        onNotificationOpened(detail.notification.data as any);
      }
    }
  });
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
 */
export const initializePushNotifications = async (
  onNotificationOpened?: (remoteMessage: RemoteMessage) => void
): Promise<void> => {
  try {
    console.log('Push: Initializing push notifications (Firebase Messaging disabled)...');

    // Register for remote notifications
    await registerForRemoteNotifications();

    // Setup message handlers
    setupForegroundMessageHandler();
    setupBackgroundMessageHandler();

    // Setup notification opened handler
    if (onNotificationOpened) {
      setupNotificationOpenedHandler(onNotificationOpened);
    }

    // Clear badge on app open (matches iOS behavior)
    await setBadgeCount(0);

    console.log('Push: Push notifications initialized (limited functionality without Firebase Messaging)');
  } catch (error) {
    console.error('Push: Error initializing push notifications:', error);
    logError(`Failed to initialize push notifications: ${error instanceof Error ? error.message : 'Unknown error'}`).catch(() => {
      // Ignore logging errors
    });
  }
};

/**
 * Check if notifications are enabled
 */
export const checkNotificationPermission = async (): Promise<boolean> => {
  console.log('Push: Check notification permission (disabled - Firebase Messaging not available)');
  return false;
};

/**
 * Prompt user to enable notifications if disabled
 */
export const promptForNotificationPermission = async (): Promise<void> => {
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
              await requestNotificationPermission();
            },
          },
        ]
      );
    }
  } catch (error) {
    console.error('Push: Error prompting for notification permission:', error);
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

