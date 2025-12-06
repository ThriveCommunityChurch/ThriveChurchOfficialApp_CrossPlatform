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
import { useTranslation } from '../../hooks/useTranslation';
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
  const { t } = useTranslation();
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
        title: t('more.menu.imNewTitle'),
        subtitle: t('more.menu.imNewSubtitle'),
        action: () => handleImNew(imNewConfig),
      });
    }

    // Give
    if (giveConfig) {
      items.push({
        id: 'give',
        title: t('more.menu.giveTitle'),
        subtitle: t('more.menu.giveSubtitle'),
        action: () => handleGive(giveConfig),
      });
    }

    // Social - show if at least one social config exists
    if (fbPageIdConfig || fbSocialConfig || igUsernameConfig || igSocialConfig || twUsernameConfig || twSocialConfig) {
      items.push({
        id: 'social',
        title: t('more.menu.socialTitle'),
        subtitle: t('more.menu.socialSubtitle'),
        action: () => handleSocial(),
      });
    }

    // Meet the team
    if (teamConfig) {
      items.push({
        id: 'team',
        title: t('more.menu.teamTitle'),
        subtitle: t('more.menu.teamSubtitle'),
        action: () => handleTeam(teamConfig),
      });
    }

    // Bible (always show)
    items.push({
      id: 'bible',
      title: t('more.menu.bibleTitle'),
      subtitle: t('more.menu.bibleSubtitle'),
      action: () => handleBible(),
    });

    // Settings (always show)
    items.push({
      id: 'settings',
      title: t('more.menu.settingsTitle'),
      subtitle: t('more.menu.settingsSubtitle'),
      action: () => handleSettings(),
    });

    // Send Logs (always show)
    items.push({
      id: 'sendlogs',
      title: t('more.menu.sendLogsTitle'),
      subtitle: t('more.menu.sendLogsSubtitle'),
      action: () => handleSendLogs(),
    });

    // About (always show)
    items.push({
      id: 'about',
      title: t('more.menu.aboutTitle'),
      subtitle: t('more.menu.aboutSubtitle'),
      action: () => handleAbout(),
    });

    setMenuItems(items);
  }, [navigation, t]);

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  // Handler functions
  const handleImNew = useCallback((config: ConfigSetting) => {
    navigation.navigate('WebView', {
      url: config.Value,
      title: t('more.menu.imNewTitle'),
    });
  }, [navigation, t]);

  const handleGive = useCallback((config: ConfigSetting) => {
    // MUST open in external browser per App Store policy
    Linking.openURL(config.Value).catch((err) => {
      console.error('Error opening Give URL:', err);
      Alert.alert(t('more.give.error'), t('more.give.errorMessage'));
    });
  }, [t]);

  const handleSocial = useCallback(async () => {
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
      options.push(t('more.social.facebook'));
      handlers.push(() => openFacebook(fbPageIdConfig.Value));
    } else if (fbSocialConfig) {
      options.push(t('more.social.facebook'));
      handlers.push(() => Linking.openURL(fbSocialConfig.Value));
    }

    // Instagram
    if (igUsernameConfig) {
      options.push(t('more.social.instagram'));
      handlers.push(() => openInstagram(igUsernameConfig.Value));
    } else if (igSocialConfig) {
      options.push(t('more.social.instagram'));
      handlers.push(() => Linking.openURL(igSocialConfig.Value));
    }

    // X (Twitter)
    if (twUsernameConfig) {
      options.push(t('more.social.x'));
      handlers.push(() => openTwitter(twUsernameConfig.Value));
    } else if (twSocialConfig) {
      options.push(t('more.social.x'));
      handlers.push(() => Linking.openURL(twSocialConfig.Value));
    }

    options.push(t('more.social.cancel'));

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('more.social.title'),
          message: t('more.social.message'),
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
        t('more.social.title'),
        t('more.social.message'),
        [
          ...handlers.map((handler, index) => ({
            text: options[index],
            onPress: handler,
          })),
          { text: t('more.social.cancel'), style: 'cancel' },
        ]
      );
    }
  }, [t]);

  const openFacebook = useCallback(async (pageId: string) => {
    const appURL = `fb://profile/${pageId}`;
    const webURL = `https://facebook.com/${pageId}`;

    try {
      const canOpen = await Linking.canOpenURL(appURL);
      if (canOpen) {
        await Linking.openURL(appURL);
      } else {
        // Prompt to download Facebook app
        Alert.alert(
          t('more.social.downloadAlert'),
          t('more.social.downloadFacebook'),
          [
            { text: t('more.social.cancel'), style: 'destructive' },
            {
              text: t('more.social.download'),
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
  }, [t]);

  const openInstagram = useCallback(async (username: string) => {
    const appURL = `instagram://user?username=${username}`;
    const webURL = `https://instagram.com/${username}`;

    try {
      const canOpen = await Linking.canOpenURL(appURL);
      if (canOpen) {
        await Linking.openURL(appURL);
      } else {
        Alert.alert(
          t('more.social.downloadAlert'),
          t('more.social.downloadInstagram'),
          [
            { text: t('more.social.cancel'), style: 'destructive' },
            {
              text: t('more.social.download'),
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
  }, [t]);

  const openTwitter = useCallback(async (username: string) => {
    const appURL = `twitter://user?screen_name=${username}`;
    const webURL = `https://twitter.com/${username}`;

    try {
      const canOpen = await Linking.canOpenURL(appURL);
      if (canOpen) {
        await Linking.openURL(appURL);
      } else {
        Alert.alert(
          t('more.social.downloadAlert'),
          t('more.social.downloadX'),
          [
            { text: t('more.social.cancel'), style: 'destructive' },
            {
              text: t('more.social.download'),
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
  }, [t]);

  const handleTeam = useCallback((config: ConfigSetting) => {
    navigation.navigate('WebView', {
      url: config.Value,
      title: t('more.menu.teamTitle'),
    });
  }, [navigation, t]);

  const handleBible = () => {
    // Navigate to Bible tab
    navigation.navigate('Bible');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleSendLogs = useCallback(async () => {
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
          t('more.sendLogs.deviceInfoError'),
          t('more.sendLogs.deviceInfoErrorMessage'),
          [{ text: t('more.sendLogs.ok') }]
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
          t('more.sendLogs.exportError'),
          t('more.sendLogs.exportErrorMessage'),
          [{ text: t('more.sendLogs.ok') }]
        );
        return;
      }

      // Prepare share options for email only
      const shareOptions: any = {
        title: t('more.sendLogs.title'),
        message: t('more.sendLogs.message'),
        url: `file://${logFilePath}`,
        subject: t('more.sendLogs.subject', {
          platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
          feedbackId
        }),
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
              t('more.sendLogs.unableToSend'),
              Platform.OS === 'ios'
                ? t('more.sendLogs.noEmailIOS')
                : t('more.sendLogs.noEmailAndroid'),
              [{ text: t('more.sendLogs.ok') }]
            );
            return;
          }
        }

        // Generic share error
        const errorMsg = `Failed to open share dialog: ${shareError instanceof Error ? shareError.message : 'Unknown error'}`;
        console.error(errorMsg);
        await logError(errorMsg);

        // Show user-friendly error message
        let alertMessage: string;

        if (isEmulator) {
          alertMessage = t('more.sendLogs.genericErrorSimulator');
        } else if (Platform.OS === 'ios') {
          alertMessage = t('more.sendLogs.genericErrorIOS');
        } else {
          alertMessage = t('more.sendLogs.genericErrorAndroid');
        }

        Alert.alert(
          t('more.sendLogs.genericError'),
          alertMessage,
          [{ text: t('more.sendLogs.ok') }]
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
        t('more.sendLogs.unexpectedError'),
        t('more.sendLogs.unexpectedErrorMessage'),
        [{ text: t('more.sendLogs.ok') }]
      );
    }
  }, [t]);

  const handleAbout = useCallback(() => {
    const version = Application.nativeApplicationVersion || '1.0.0';
    const buildNumber = Application.nativeBuildVersion || '1';
    const year = new Date().getFullYear();

    const message = t('more.about.message', { version, buildNumber, year });

    if (Platform.OS === 'ios') {
      Alert.alert(t('more.about.title'), message, [{ text: t('more.about.ok'), style: 'cancel' }]);
    } else {
      Alert.alert(t('more.about.title'), message, [{ text: t('more.about.ok') }]);
    }
  }, [t]);

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

