/**
 * ConnectScreen
 * Main Connect screen with dynamic config-driven menu
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Alert,
  Linking,
  ActionSheetIOS,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { ConnectMenuItem, ConfigKeys } from '../../types/config';
import { getConfigSetting } from '../../services/storage/storage';
import { useConfigContext } from '../../providers/ConfigProvider';
import { setCurrentScreen, logContactChurch, logCustomEvent } from '../../services/analytics/analyticsService';

type ConnectStackParamList = {
  ConnectHome: undefined;
  RSSAnnouncements: undefined;
  RSSDetail: { title: string; content: string; date: string };
  WebViewForm: { url: string; title: string };
};

type NavigationProp = NativeStackNavigationProp<ConnectStackParamList>;

interface ConnectCardProps {
  item: ConnectMenuItem;
  onPress: (item: ConnectMenuItem) => void;
  theme: Theme;
}

const ConnectCard: React.FC<ConnectCardProps> = ({ item, onPress, theme }) => {
  const styles = createStyles(theme);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(item)}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.subtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
            )}
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const ConnectScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const navigation = useNavigation<NavigationProp>();
  const [menuItems, setMenuItems] = useState<ConnectMenuItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isLoading, hasConfigs: configsExist, refetchConfigs } = useConfigContext();

  // Track screen view
  useEffect(() => {
    setCurrentScreen('ConnectScreen', 'Connect');
  }, []);

  const loadMenuItems = useCallback(async () => {
    const items: ConnectMenuItem[] = [];

    // Load configs from AsyncStorage
    const emailConfig = await getConfigSetting(ConfigKeys.EMAIL_MAIN);
    const phoneConfig = await getConfigSetting(ConfigKeys.PHONE_MAIN);
    const prayersConfig = await getConfigSetting(ConfigKeys.PRAYERS);
    const addressConfig = await getConfigSetting(ConfigKeys.ADDRESS_MAIN);
    const smallGroupConfig = await getConfigSetting(ConfigKeys.SMALL_GROUP);
    const serveConfig = await getConfigSetting(ConfigKeys.SERVE);

    // Contact Us - show if at least one contact method is available
    if (emailConfig || phoneConfig || prayersConfig) {
      items.push({
        id: 'contact',
        title: t('connect.menu.contactTitle'),
        subtitle: t('connect.menu.contactSubtitle'),
        action: 'contact',
      });
    }

    // Get Directions
    if (addressConfig) {
      items.push({
        id: 'directions',
        title: t('connect.menu.directionsTitle'),
        subtitle: addressConfig.Value,
        action: 'directions',
        config: addressConfig,
      });
    }

    // Announcements (always show)
    items.push({
      id: 'announcements',
      title: t('connect.menu.announcementsTitle'),
      subtitle: t('connect.menu.announcementsSubtitle'),
      action: 'announcements',
    });

    // Join a small group
    if (smallGroupConfig) {
      items.push({
        id: 'smallgroup',
        title: t('connect.menu.smallGroupTitle'),
        subtitle: t('connect.menu.smallGroupSubtitle'),
        action: 'webview',
        config: smallGroupConfig,
      });
    }

    // Serve
    if (serveConfig) {
      items.push({
        id: 'serve',
        title: t('connect.menu.serveTitle'),
        subtitle: t('connect.menu.serveSubtitle'),
        action: 'webview',
        config: serveConfig,
      });
    }

    setMenuItems(items);
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadMenuItems();
    }, [loadMenuItems])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchConfigs();
      loadMenuItems();
    } catch (error) {
      console.error('Error refreshing configs:', error);
      Alert.alert(t('connect.menu.refreshError'), t('connect.menu.refreshErrorMessage'));
    } finally {
      setRefreshing(false);
    }
  }, [refetchConfigs, loadMenuItems, t]);

  const handleContactUs = useCallback(async () => {
    const emailConfig = await getConfigSetting(ConfigKeys.EMAIL_MAIN);
    const phoneConfig = await getConfigSetting(ConfigKeys.PHONE_MAIN);
    const prayersConfig = await getConfigSetting(ConfigKeys.PRAYERS);

    const options: string[] = [];
    const actions: (() => void)[] = [];

    if (emailConfig) {
      options.push(t('connect.contact.emailUs'));
      actions.push(() => handleEmail(emailConfig.Value));
    }

    if (phoneConfig) {
      options.push(t('connect.contact.callUs'));
      actions.push(() => handlePhone(phoneConfig.Value));
    }

    if (prayersConfig) {
      options.push(t('connect.contact.prayerRequest'));
      actions.push(() => handlePrayerRequest(prayersConfig.Value));
    }

    options.push(t('connect.contact.cancel'));

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('connect.contact.title'),
          message: t('connect.contact.message'),
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex < actions.length) {
            actions[buttonIndex]();
          }
        }
      );
    } else {
      // For Android, show a simple alert with buttons
      Alert.alert(
        t('connect.contact.title'),
        t('connect.contact.message'),
        [
          ...actions.map((action, index) => ({
            text: options[index],
            onPress: action,
          })),
          { text: t('connect.contact.cancel'), style: 'cancel' },
        ]
      );
    }
  }, [t]);

  const handleEmail = useCallback((email: string) => {
    const url = `mailto:${email}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(t('connect.contact.emailError'), t('connect.contact.emailErrorMessage'));
        }
      })
      .catch((err) => {
        console.error('Error opening email:', err);
        Alert.alert(t('connect.contact.emailError'), t('connect.contact.emailErrorMessage'));
      });
  }, [t]);

  const handlePhone = useCallback((phone: string) => {
    const url = `tel:${phone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(t('connect.contact.phoneError'), t('connect.contact.phoneErrorMessage'));
        }
      })
      .catch((err) => {
        console.error('Error opening phone:', err);
        Alert.alert(t('connect.contact.phoneError'), t('connect.contact.phoneErrorMessage'));
      });
  }, [t]);

  const handlePrayerRequest = useCallback((url: string) => {
    navigation.navigate('WebViewForm', {
      url,
      title: t('connect.contact.prayerRequestTitle'),
    });
  }, [navigation, t]);

  const handleDirections = useCallback((address: string) => {
    const formattedAddress = address.replace(/ /g, '%20').replace(/\n/g, '%20');
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${formattedAddress}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${formattedAddress}`;

    Linking.openURL(url).catch((err) => {
      console.error('Error opening maps:', err);
      Alert.alert(t('connect.contact.mapsError'), t('connect.contact.mapsErrorMessage'));
    });
  }, [t]);

  const handleItemPress = (item: ConnectMenuItem) => {
    switch (item.action) {
      case 'contact':
        handleContactUs();
        break;
      case 'directions':
        if (item.config) {
          handleDirections(item.config.Value);
        }
        break;
      case 'announcements':
        navigation.navigate('RSSAnnouncements');
        break;
      case 'webview':
        if (item.config) {
          navigation.navigate('WebViewForm', {
            url: item.config.Value,
            title: item.title,
          });
        }
        break;
    }
  };

  const renderItem = ({ item }: { item: ConnectMenuItem }) => (
    <ConnectCard item={item} onPress={handleItemPress} theme={theme} />
  );

  const keyExtractor = (item: ConnectMenuItem) => item.id;

  // Show loading state only on initial load when no configs exist
  if (isLoading && !configsExist && menuItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('connect.menu.loadingConfigs')}</Text>
      </View>
    );
  }

  // Show empty state if no menu items after loading
  if (!isLoading && menuItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>{t('connect.menu.emptyTitle')}</Text>
        <Text style={styles.emptySubtitle}>
          {t('connect.menu.emptySubtitle')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            title={t('connect.menu.refreshTitle')}
            titleColor={theme.colors.textSecondary}
          />
        }
      />
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Avenir-Book',
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Avenir-Book',
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    textAlign: 'center',
  },
  listContent: {
    padding: 8,
  },
  card: {
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: theme.colors.shadowDark, // ← ONLY COLOR CHANGED
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 72,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Avenir-Book',
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
  },
  chevron: {
    fontSize: 32,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginLeft: 12,
    fontWeight: '300',
  },
});

