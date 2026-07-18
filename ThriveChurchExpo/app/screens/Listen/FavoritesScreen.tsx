import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SermonMessageCard } from '../../components/SermonMessageCard';
import { useFavoritesStore, FavoriteItem } from '../../stores/favoritesStore';
import { isMessageDownloaded } from '../../services/storage/storage';
import { setCurrentScreen } from '../../services/analytics/analyticsService';

const CARD_ESTIMATED_HEIGHT = 150;

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  // Sort newest-favorited first; shallow-compared so re-renders only happen
  // when the derived, sorted array actually changes.
  const favorites = useFavoritesStore(
    useShallow((state) => [...state.items].sort((a, b) => b.favoritedAt - a.favoritedAt))
  );

  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  // Track screen view
  useEffect(() => {
    setCurrentScreen('FavoritesScreen', 'Favorites');
  }, []);

  // Load download status for each favorited message so the card can show
  // its "downloaded" checkmark accurately.
  useEffect(() => {
    let cancelled = false;

    const loadDownloadedStatus = async () => {
      const downloaded = new Set<string>();
      for (const item of favorites) {
        if (await isMessageDownloaded(item.messageId)) {
          downloaded.add(item.messageId);
        }
      }
      if (!cancelled) {
        setDownloadedIds(downloaded);
      }
    };

    loadDownloadedStatus().catch((error) => {
      console.error('Failed to load favorite download status:', error);
      if (!cancelled) {
        setDownloadedIds(new Set());
      }
    });

    return () => {
      cancelled = true;
    };
  }, [favorites]);

  const handleMessagePress = useCallback((item: FavoriteItem) => {
    (navigation as any).navigate('SermonDetail', {
      message: item.message,
      seriesTitle: item.seriesTitle,
      seriesArtUrl: item.seriesArt,
      seriesId: item.message.SeriesId,
    });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: FavoriteItem }) => (
    <SermonMessageCard
      message={item.message}
      downloaded={downloadedIds.has(item.messageId)}
      downloading={false}
      onPress={() => handleMessagePress(item)}
    />
  ), [downloadedIds, handleMessagePress]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>
        {t('listen.favorites.empty')}
      </Text>
      <Text style={styles.emptyDescription}>
        {t('listen.favorites.emptyDescription')}
      </Text>
    </View>
  ), [theme, t, styles]);

  return (
    <View style={styles.container}>
      {favorites.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlashList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.messageId}
          estimatedItemSize={CARD_ESTIMATED_HEIGHT}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    ...theme.typography.h2,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    color: theme.colors.text,
  },
  emptyDescription: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.textTertiary,
  },
});
