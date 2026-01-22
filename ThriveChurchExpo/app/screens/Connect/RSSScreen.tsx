/**
 * RSSScreen (Announcements)
 * Displays RSS feed from MailChimp with card design
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as rssParser from 'react-native-rss-parser';
import { FlashList } from '@shopify/flash-list';
import { useNetInfo } from '@react-native-community/netinfo';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import OfflineEmptyState from '../../components/OfflineEmptyState';
import { setCurrentScreen, logViewAnnouncements } from '../../services/analytics/analyticsService';

const feedURL = 'https://us4.campaign-archive.com/feed?u=1c5116a71792ef373ee131ea0&id=e6caee03a4';

type ConnectStackParamList = {
  RSSAnnouncements: undefined;
  RSSDetail: { title: string; content: string; date: string };
};

type NavigationProp = NativeStackNavigationProp<ConnectStackParamList>;

interface RSSItem {
  title?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  link?: string;
}

interface RSSCardProps {
  item: RSSItem;
  onPress: (item: RSSItem) => void;
  theme: Theme;
  t: (key: string) => string;
}

const RSSCard: React.FC<RSSCardProps> = ({ item, onPress, theme, t }) => {
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

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });

    return formatter.format(date);
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
            <Text style={styles.title} numberOfLines={2}>
              {item.title || t('connect.rss.untitled')}
            </Text>
            <Text style={styles.date}>
              {formatDate(item.pubDate)}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function RSSScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<RSSItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // Network status for offline detection
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  // Track screen view
  useEffect(() => {
    setCurrentScreen('RSSScreen', 'Announcements');
    logViewAnnouncements();
  }, []);

  const fetchRSS = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(feedURL)
      .then((response) => response.text())
      .then((responseData) => rssParser.parse(responseData))
      .then((rss) => {
        const parsedItems = rss.items.map((item: any) => ({
          title: item.title,
          pubDate: item.published,
          content: item.content,
          contentSnippet: item.description,
          link: item.id || item.links[0]?.url,
        }));
        setItems(parsedItems);
        setError(null);
      })
      .catch((err) => {
        console.error('RSS Feed parsing failed:', err);
        setError(t('connect.rss.errorMessage'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  // Initial fetch on mount
  React.useEffect(() => {
    fetchRSS();
  }, [fetchRSS]);

  const handleItemPress = (item: RSSItem) => {
    const date = item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }) : '';

    navigation.navigate('RSSDetail', {
      title: item.title || t('connect.rss.announcement'),
      content: item.content || item.contentSnippet || '',
      date,
    });
  };

  const renderItem = ({ item }: { item: RSSItem }) => (
    <RSSCard item={item} onPress={handleItemPress} theme={theme} t={t} />
  );

  const keyExtractor = (item: RSSItem, index: number) =>
    item.link || item.title || index.toString();

  // Render offline state or error
  const renderErrorOrOffline = () => {
    if (isOffline) {
      return (
        <OfflineEmptyState
          message={t('offline.noAnnouncementsMessage')}
          showDownloadsCta={true}
          showBibleCta={true}
          showRetry={true}
          onRetry={fetchRSS}
        />
      );
    }

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loading} color={theme.colors.text} size="large" />
      ) : error ? (
        renderErrorOrOffline()
      ) : (
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          indicatorStyle={theme.isDark ? 'white' : 'black'}
        />
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  loading: {
    marginTop: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    ...theme.typography.body,
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
    fontSize: 14,
    fontFamily: 'Avenir-Book',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
  },
  chevron: {
    fontSize: 32,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginLeft: 12,
    fontWeight: '300',
  },
});

