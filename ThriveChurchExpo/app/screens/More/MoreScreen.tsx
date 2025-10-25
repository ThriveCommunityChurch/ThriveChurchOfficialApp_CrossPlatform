import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  ActionSheetIOS,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Share from 'react-native-share';
import { getConfigSetting } from '../../services/storage/storage';
import { ConfigKeys } from '../../types/config';
import type { ConfigSetting } from '../../types/config';
import { exportLogsToFile, logError, logInfo } from '../../services/logging/logger';
import { setCurrentScreen, logOpenSocial, logCustomEvent } from '../../services/analytics/analyticsService';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../theme/types';

interface MoreMenuItem {
  id: string;
  title: string;
  subtitle: string;
  action: () => void;
}

export const MoreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [menuItems, setMenuItems] = useState<MoreMenuItem[]>([]);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('MoreScreen', 'More');
  }, []);

  const loadMenuItems = useCallback(async () => {
    const items: MoreMenuItem[] = [];

    // Load configs from AsyncStorage
    const imNewConfig = await getConfigSetting(ConfigKeys.IM_NEW);
    const giveConfig = await getConfigSetting(ConfigKeys.GIVE);
    const teamConfig = await getConfigSetting(ConfigKeys.TEAM);
    const fbPageIdConfig = await getConfigSetting(ConfigKeys.FB_PAGE_ID);
    const fbSocialConfig = await getConfigSetting(ConfigKeys.FB_SOCIAL);
    const igUsernameConfig = await getConfigSetting(ConfigKeys.IG_USERNAME);
    const igSocialConfig = await getConfigSetting(ConfigKeys.IG_SOCIAL);
    const twUsernameConfig = await getConfigSetting(ConfigKeys.TW_USERNAME);
    const twSocialConfig = await getConfigSetting(ConfigKeys.TW_SOCIAL);

    // I'm New
    if (imNewConfig) {
      items.push({
        id: 'imnew',
        title: "I'm New",
        subtitle: 'Learn about our church and community',
        action: () => handleImNew(imNewConfig),
      });
    }

    // Give
    if (giveConfig) {
      items.push({
        id: 'give',
        title: 'Give',
        subtitle: 'Support our mission and ministry',
        action: () => handleGive(giveConfig),
      });
    }

    // Social - show if at least one social config exists
    if (fbPageIdConfig || fbSocialConfig || igUsernameConfig || igSocialConfig || twUsernameConfig || twSocialConfig) {
      items.push({
        id: 'social',
        title: 'Social',
        subtitle: 'Follow us on social media',
        action: () => handleSocial(),
      });
    }

    // Meet the team
    if (teamConfig) {
      items.push({
        id: 'team',
        title: 'Meet the team',
        subtitle: 'Get to know our staff and leadership',
        action: () => handleTeam(teamConfig),
      });
    }

    // Bible (always show)
    items.push({
      id: 'bible',
      title: 'Bible',
      subtitle: 'Read scripture with YouVersion integration',
      action: () => handleBible(),
    });

    // Settings (always show)
    items.push({
      id: 'settings',
      title: 'Settings',
      subtitle: 'Manage app preferences and notifications',
      action: () => handleSettings(),
    });

    // Send Logs (always show)
    items.push({
      id: 'sendlogs',
      title: 'Send Logs',
      subtitle: 'Send diagnostic information to support',
      action: () => handleSendLogs(),
    });

    // About (always show)
    items.push({
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      action: () => handleAbout(),
    });

    setMenuItems(items);
  }, [navigation]);

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  // Handler functions
  const handleImNew = (config: ConfigSetting) => {
    navigation.navigate('WebView', {
      url: config.Value,
      title: "I'm New",
    });
  };

  const handleGive = (config: ConfigSetting) => {
    // MUST open in external browser per App Store policy
    Linking.openURL(config.Value).catch((err) => {
      console.error('Error opening Give URL:', err);
      Alert.alert('Error', 'Unable to open the giving page. Please try again later.');
    });
  };

  const handleSocial = async () => {
    const fbPageIdConfig = await getConfigSetting(ConfigKeys.FB_PAGE_ID);
    const fbSocialConfig = await getConfigSetting(ConfigKeys.FB_SOCIAL);
    const igUsernameConfig = await getConfigSetting(ConfigKeys.IG_USERNAME);
    const igSocialConfig = await getConfigSetting(ConfigKeys.IG_SOCIAL);
    const twUsernameConfig = await getConfigSetting(ConfigKeys.TW_USERNAME);
    const twSocialConfig = await getConfigSetting(ConfigKeys.TW_SOCIAL);

    const options: string[] = [];
    const handlers: (() => void)[] = [];

    // Facebook
    if (fbPageIdConfig) {
      options.push('Facebook');
      handlers.push(() => openFacebook(fbPageIdConfig.Value));
    } else if (fbSocialConfig) {
      options.push('Facebook');
      handlers.push(() => Linking.openURL(fbSocialConfig.Value));
    }

    // Instagram
    if (igUsernameConfig) {
      options.push('Instagram');
      handlers.push(() => openInstagram(igUsernameConfig.Value));
    } else if (igSocialConfig) {
      options.push('Instagram');
      handlers.push(() => Linking.openURL(igSocialConfig.Value));
    }

    // X (Twitter)
    if (twUsernameConfig) {
      options.push('X');
      handlers.push(() => openTwitter(twUsernameConfig.Value));
    } else if (twSocialConfig) {
      options.push('X');
      handlers.push(() => Linking.openURL(twSocialConfig.Value));
    }

    options.push('Cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Social',
          message: 'Please select an option',
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex < handlers.length) {
            handlers[buttonIndex]();
          }
        }
      );
    } else {
      // Android - use Alert
      Alert.alert(
        'Social',
        'Please select an option',
        [
          ...handlers.map((handler, index) => ({
            text: options[index],
            onPress: handler,
          })),
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const openFacebook = async (pageId: string) => {
    const appURL = `fb://profile/${pageId}`;
    const webURL = `https://facebook.com/${pageId}`;

    try {
      const canOpen = await Linking.canOpenURL(appURL);
      if (canOpen) {
        await Linking.openURL(appURL);
      } else {
        // Prompt to download Facebook app
        Alert.alert(
          'Alert',
          'You need to download the Facebook app first',
          [
            { text: 'Cancel', style: 'destructive' },
            {
              text: 'Download',
              onPress: () => {
                const storeURL = Platform.OS === 'ios'
                  ? 'itms-apps://itunes.apple.com/app/id284882215'
                  : 'market://details?id=com.facebook.katana';
                Linking.openURL(storeURL);
              },
            },
          ]
        );
      }
    } catch (error) {
      // Fallback to web
      Linking.openURL(webURL);
    }
  };

  const openInstagram = async (username: string) => {
    const appURL = `instagram://user?username=${username}`;
    const webURL = `https://instagram.com/${username}`;

    try {
      const canOpen = await Linking.canOpenURL(appURL);
      if (canOpen) {
        await Linking.openURL(appURL);
      } else {
        Alert.alert(
          'Alert',
          'You need to download the Instagram app first',
          [
            { text: 'Cancel', style: 'destructive' },
            {
              text: 'Download',
              onPress: () => {
                const storeURL = Platform.OS === 'ios'
                  ? 'itms-apps://itunes.apple.com/app/id389801252'
                  : 'market://details?id=com.instagram.android';
                Linking.openURL(storeURL);
              },
            },
          ]
        );
      }
    } catch (error) {
      Linking.openURL(webURL);
    }
  };

  const openTwitter = async (username: string) => {
    const appURL = `twitter://user?screen_name=${username}`;
    const webURL = `https://twitter.com/${username}`;

    try {
      const canOpen = await Linking.canOpenURL(appURL);
      if (canOpen) {
        await Linking.openURL(appURL);
      } else {
        Alert.alert(
          'Alert',
          'You need to download the X app first',
          [
            { text: 'Cancel', style: 'destructive' },
            {
              text: 'Download',
              onPress: () => {
                const storeURL = Platform.OS === 'ios'
                  ? 'itms-apps://itunes.apple.com/app/id409789998'
                  : 'market://details?id=com.twitter.android';
                Linking.openURL(storeURL);
              },
            },
          ]
        );
      }
    } catch (error) {
      Linking.openURL(webURL);
    }
  };

  const handleTeam = (config: ConfigSetting) => {
    navigation.navigate('WebView', {
      url: config.Value,
      title: 'Meet the team',
    });
  };

  const handleBible = () => {
    // Navigate to Bible tab
    navigation.navigate('Bible');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleSendLogs = async () => {
    try {
      // Check if we're on a simulator (simulators often can't send emails)
      const isEmulator = !Device.isDevice;

      // Get device information first (needed for both log export and error messages)
      let deviceInfo;
      let appInfo;

      try {
        deviceInfo = {
          model: Device.modelName || 'Unknown',
          systemName: Device.osName || 'Unknown',
          systemVersion: Device.osVersion || 'Unknown',
          deviceName: Device.deviceName || 'Unknown',
        };

        appInfo = {
          version: Application.nativeApplicationVersion || '1.0.0',
          buildNumber: Application.nativeBuildVersion || '1',
        };
      } catch (error) {
        // If we can't get device info, show error and log it
        const errorMsg = `Failed to retrieve device information: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        await logError(errorMsg);

        Alert.alert(
          'Error',
          'Unable to retrieve device information. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Export logs to file
      let logFilePath: string;
      let feedbackId: string;

      try {
        logFilePath = await exportLogsToFile(deviceInfo, appInfo);

        // Extract feedback ID from filename
        const fileName = logFilePath.split('/').pop() || 'logs.log';
        feedbackId = fileName.replace('.log', '');
      } catch (error) {
        // If log export fails, show error and log it
        const errorMsg = `Failed to export logs to file: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        await logError(errorMsg);

        Alert.alert(
          'Error',
          'Unable to create log file. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Prepare share options for email only
      const shareOptions: any = {
        title: 'Send Logs to Support',
        message: 'Please describe any issues you\'re experiencing with the app:',
        url: `file://${logFilePath}`,
        subject: `Thrive ${Platform.OS === 'ios' ? 'iOS' : 'Android'} - ID: ${feedbackId}`,
        email: 'wyatt@thrive-fl.org',
        social: Share.Social.EMAIL,
        type: 'text/plain',
        filename: `${feedbackId}.log`,
      };

      // Attempt to share/send via email only
      try {
        await Share.shareSingle(shareOptions);

        // If successful, log it (but don't await to avoid blocking)
        logInfo(`User successfully opened share dialog for logs (ID: ${feedbackId})`).catch(() => {
          // Ignore logging errors here
        });
      } catch (shareError) {
        // Handle share-specific errors
        if (shareError && typeof shareError === 'object' && 'message' in shareError) {
          const errorMessage = (shareError as { message: string }).message;

          // User cancelled - this is normal, don't show error
          if (
            errorMessage.includes('User did not share') ||
            errorMessage.includes('cancelled') ||
            errorMessage.includes('cancel') ||
            errorMessage.toLowerCase().includes('user cancelled')
          ) {
            console.log('User cancelled share dialog');
            return;
          }

          // Check for specific error conditions
          if (
            errorMessage.includes('No app') ||
            errorMessage.includes('not available') ||
            errorMessage.includes('not installed')
          ) {
            // No email app available
            const errorMsg = `Share failed - no email app available: ${errorMessage}`;
            console.error(errorMsg);
            await logError(errorMsg);

            Alert.alert(
              'Unable to Send Logs',
              Platform.OS === 'ios'
                ? 'No email app is configured on this device. Please install and configure the Mail app or another email client to send logs.'
                : 'No email app is installed on this device. Please install an email app (such as Gmail) to send logs.',
              [{ text: 'OK' }]
            );
            return;
          }
        }

        // Generic share error
        const errorMsg = `Failed to open share dialog: ${shareError instanceof Error ? shareError.message : 'Unknown error'}`;
        console.error(errorMsg);
        await logError(errorMsg);

        // Show user-friendly error message
        let alertMessage = 'Unable to send logs. ';

        if (isEmulator) {
          alertMessage += 'Email functionality is not available on simulators. Please test on a physical device.';
        } else if (Platform.OS === 'ios') {
          alertMessage += 'Please make sure the Mail app is configured on your device, or try using another email app.';
        } else {
          alertMessage += 'Please make sure you have an email app installed and configured on your device.';
        }

        Alert.alert(
          'Error',
          alertMessage,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Catch-all for any unexpected errors
      const errorMsg = `Unexpected error in handleSendLogs: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg, error);

      // Try to log the error, but don't fail if logging fails
      try {
        await logError(errorMsg);
      } catch (loggingError) {
        console.error('Failed to log error:', loggingError);
      }

      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAbout = () => {
    const version = Application.nativeApplicationVersion || '1.0.0';
    const buildNumber = Application.nativeBuildVersion || '1';
    const year = new Date().getFullYear();

    const message = `Version: ${version} (Build ${buildNumber})\n\n©${year} Thrive Community Church\n\nThis app helps you stay connected with our church community, access sermons, take notes, and more.`;

    if (Platform.OS === 'ios') {
      Alert.alert('About Thrive Church App', message, [{ text: 'OK', style: 'cancel' }]);
    } else {
      Alert.alert('About Thrive Church App', message, [{ text: 'OK' }]);
    }
  };

  const renderItem = ({ item }: { item: MoreMenuItem }) => (
    <MoreMenuCard item={item} theme={theme} />
  );

  const keyExtractor = (item: MoreMenuItem) => item.id;

  return (
    <View style={styles.container}>
      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

// Card Component
const MoreMenuCard: React.FC<{ item: MoreMenuItem; theme: Theme }> = ({ item, theme }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const styles = createStyles(theme);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={item.action}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  listContent: {
    paddingVertical: 8,
  },
  card: {
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: theme.colors.shadowDark, // ← ONLY COLOR CHANGED
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 72,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Avenir-Medium',
    fontSize: 16,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Avenir-Book',
    fontSize: 14,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    lineHeight: 18,
  },
  chevron: {
    fontSize: 24,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginLeft: 12,
  },
});

