/**
 * ConnectScreen
 * Main Connect screen with dynamic config-driven menu
 */

import React, { useState, useCallback } from 'react';
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
import { colors } from '../../theme/colors';
import { ConnectMenuItem, ConfigKeys } from '../../types/config';
import { getConfigSetting } from '../../services/storage/storage';
import { useConfigContext } from '../../providers/ConfigProvider';

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
}

const ConnectCard: React.FC<ConnectCardProps> = ({ item, onPress }) => {
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
  const navigation = useNavigation<NavigationProp>();
  const [menuItems, setMenuItems] = useState<ConnectMenuItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isLoading, hasConfigs: configsExist, refetchConfigs } = useConfigContext();

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
        title: 'Contact us',
        subtitle: 'Email, call, or submit prayer requests',
        action: 'contact',
      });
    }

    // Get Directions
    if (addressConfig) {
      items.push({
        id: 'directions',
        title: 'Get directions',
        subtitle: addressConfig.Value,
        action: 'directions',
        config: addressConfig,
      });
    }

    // Announcements (always show)
    items.push({
      id: 'announcements',
      title: 'Announcements',
      subtitle: 'Latest church news and updates',
      action: 'announcements',
    });

    // Join a small group
    if (smallGroupConfig) {
      items.push({
        id: 'smallgroup',
        title: 'Join a small group',
        subtitle: 'Connect with others in community',
        action: 'webview',
        config: smallGroupConfig,
      });
    }

    // Serve
    if (serveConfig) {
      items.push({
        id: 'serve',
        title: 'Serve',
        subtitle: 'Find ways to get involved',
        action: 'webview',
        config: serveConfig,
      });
    }

    setMenuItems(items);
  }, []);

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
      Alert.alert('Error', 'Failed to refresh configurations. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [refetchConfigs, loadMenuItems]);

  const handleContactUs = async () => {
    const emailConfig = await getConfigSetting(ConfigKeys.EMAIL_MAIN);
    const phoneConfig = await getConfigSetting(ConfigKeys.PHONE_MAIN);
    const prayersConfig = await getConfigSetting(ConfigKeys.PRAYERS);

    const options: string[] = [];
    const actions: (() => void)[] = [];

    if (emailConfig) {
      options.push('Email us');
      actions.push(() => handleEmail(emailConfig.Value));
    }

    if (phoneConfig) {
      options.push('Call us');
      actions.push(() => handlePhone(phoneConfig.Value));
    }

    if (prayersConfig) {
      options.push('Submit a prayer request');
      actions.push(() => handlePrayerRequest(prayersConfig.Value));
    }

    options.push('Cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Contact us',
          message: 'Please select an option',
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
        'Contact us',
        'Please select an option',
        [
          ...actions.map((action, index) => ({
            text: options[index],
            onPress: action,
          })),
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleEmail = (email: string) => {
    const url = `mailto:${email}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open email client');
        }
      })
      .catch((err) => {
        console.error('Error opening email:', err);
        Alert.alert('Error', 'Unable to open email client');
      });
  };

  const handlePhone = (phone: string) => {
    const url = `tel:${phone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to make phone call');
        }
      })
      .catch((err) => {
        console.error('Error opening phone:', err);
        Alert.alert('Error', 'Unable to make phone call');
      });
  };

  const handlePrayerRequest = (url: string) => {
    navigation.navigate('WebViewForm', {
      url,
      title: 'Prayer request',
    });
  };

  const handleDirections = (address: string) => {
    const formattedAddress = address.replace(/ /g, '%20').replace(/\n/g, '%20');
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${formattedAddress}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${formattedAddress}`;

    Linking.openURL(url).catch((err) => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Unable to open maps');
    });
  };

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
    <ConnectCard item={item} onPress={handleItemPress} />
  );

  const keyExtractor = (item: ConnectMenuItem) => item.id;

  // Show loading state only on initial load when no configs exist
  if (isLoading && !configsExist && menuItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.mainBlue} />
        <Text style={styles.loadingText}>Loading configurations...</Text>
      </View>
    );
  }

  // Show empty state if no menu items after loading
  if (!isLoading && menuItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No menu items available</Text>
        <Text style={styles.emptySubtitle}>
          Pull down to refresh configurations
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
            tintColor={colors.mainBlue}
            colors={[colors.mainBlue]}
            title="Pull to refresh configs"
            titleColor={colors.lessLightLightGray}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.almostBlack,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.almostBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Avenir-Book',
    color: colors.lessLightLightGray,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.almostBlack,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Avenir-Medium',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Avenir-Book',
    color: colors.lessLightLightGray,
    textAlign: 'center',
  },
  listContent: {
    padding: 8,
  },
  card: {
    backgroundColor: colors.darkGrey,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
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
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Avenir-Book',
    color: colors.lessLightLightGray,
  },
  chevron: {
    fontSize: 32,
    color: colors.lessLightLightGray,
    marginLeft: 12,
    fontWeight: '300',
  },
});

