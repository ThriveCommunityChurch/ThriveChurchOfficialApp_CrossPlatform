/**
 * SearchResultsList Component
 * Displays search results using FlashList for optimal performance
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SearchTarget, SermonSeries, SermonMessage } from '../../types/api';
import { RelatedSeriesCard } from '../RelatedSeriesCard';
import { SearchMessageCard } from './SearchMessageCard';

interface SearchResultsListProps {
  results: SermonSeries[] | SermonMessage[];
  searchTarget: SearchTarget;
  isLoading: boolean;
  onResultPress: (result: SermonSeries | SermonMessage) => void;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  results,
  searchTarget,
  isLoading,
  onResultPress,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  // Track if FlashList has completed its first render cycle
  const [flashListLoaded, setFlashListLoaded] = useState(false);

  // Animated value for skeleton shimmer effect
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  // Determine if results are series or messages
  const isSeries = searchTarget === SearchTarget.Series;

  // Estimated item size for FlashList
  const estimatedItemSize = isSeries ? 280 : 200;

  // Reset FlashList loaded state when results change
  useEffect(() => {
    setFlashListLoaded(false);
  }, [results]);

  // Start shimmer animation when loading
  useEffect(() => {
    if (isLoading) {
      // Create a continuous pulsing shimmer animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animation when not loading
      shimmerAnim.setValue(1);
    }
  }, [isLoading, shimmerAnim]);

  // Handle FlashList onLoad - called after first render cycle completes
  const handleFlashListLoad = () => {
    setFlashListLoaded(true);
  };

  // Render message skeleton that matches SearchMessageCard structure
  const renderMessageSkeleton = (index: number) => (
    <View key={index} style={styles.skeleton}>
      <Animated.View style={{ opacity: shimmerAnim }}>
        {/* Title - 2 lines */}
        <View style={[styles.skeletonLine, { height: 20, marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { height: 20, width: '70%', marginBottom: 12 }]} />

        {/* Summary - 3 lines */}
        <View style={[styles.skeletonLine, { height: 14, marginBottom: 6 }]} />
        <View style={[styles.skeletonLine, { height: 14, marginBottom: 6 }]} />
        <View style={[styles.skeletonLine, { height: 14, width: '80%', marginBottom: 12 }]} />

        {/* Metadata row - speaker and date */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
          <View style={[styles.skeletonLine, { height: 14, width: 100 }]} />
          <View style={[styles.skeletonLine, { height: 14, width: 80 }]} />
        </View>

        {/* Media row - audio, video, duration */}
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={[styles.skeletonLine, { height: 14, width: 60 }]} />
          <View style={[styles.skeletonLine, { height: 14, width: 60 }]} />
          <View style={[styles.skeletonLine, { height: 14, width: 50 }]} />
        </View>
      </Animated.View>
    </View>
  );

  // Render series skeleton that matches RelatedSeriesCard structure
  const renderSeriesSkeleton = (index: number) => (
    <View key={index} style={[styles.skeleton, { flexDirection: 'row' }]}>
      <Animated.View style={{ opacity: shimmerAnim }}>
        {/* Artwork */}
        <View style={[styles.skeletonImage, { width: 160, height: 90, marginBottom: 0 }]} />
      </Animated.View>

      <View style={{ flex: 1, marginLeft: 16 }}>
        <Animated.View style={{ opacity: shimmerAnim }}>
          {/* Title - 2 lines */}
          <View style={[styles.skeletonLine, { height: 16, marginBottom: 4 }]} />
          <View style={[styles.skeletonLine, { height: 16, width: '60%', marginBottom: 8 }]} />

          {/* Summary - 2 lines */}
          <View style={[styles.skeletonLine, { height: 13, marginBottom: 4 }]} />
          <View style={[styles.skeletonLine, { height: 13, width: '75%', marginBottom: 8 }]} />

          {/* Metadata row */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
            <View style={[styles.skeletonLine, { height: 12, width: 90 }]} />
            <View style={[styles.skeletonLine, { height: 12, width: 110 }]} />
          </View>

          {/* Tags */}
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <View style={[styles.skeletonLine, { height: 22, width: 70, borderRadius: 12 }]} />
            <View style={[styles.skeletonLine, { height: 22, width: 90, borderRadius: 12 }]} />
            <View style={[styles.skeletonLine, { height: 22, width: 60, borderRadius: 12 }]} />
          </View>
        </Animated.View>
      </View>
    </View>
  );

  // Render loading skeletons with shimmer animation
  const renderLoadingSkeletons = () => {
    return (
      <View style={styles.skeletonsContainer}>
        {[1, 2, 3, 4, 5].map((index) =>
          isSeries ? renderSeriesSkeleton(index) : renderMessageSkeleton(index)
        )}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="file-tray-outline"
          size={64}
          color={theme.colors.textTertiary}
        />
        <Text style={styles.emptyText}>{t('components.searchResultsList.noResults')}</Text>
        <Text style={styles.emptySubtext}>
          {t('components.searchResultsList.tryDifferentTags')}
        </Text>
      </View>
    );
  };

  // Render result count header
  const renderHeader = () => {
    if (isLoading || results.length === 0) return null;

    const targetLabel = isSeries ? t('components.searchResultsList.series') : t('components.searchResultsList.messages');
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>
          {results.length} {targetLabel} {t('components.searchResultsList.found')}
        </Text>
      </View>
    );
  };

  // Render individual result item
  const renderItem = ({ item }: { item: SermonSeries | SermonMessage }) => {
    if (isSeries) {
      const series = item as SermonSeries;
      return (
        <View style={styles.seriesCardContainer}>
          <RelatedSeriesCard
            series={{ ...series, matchCount: 0, matchingTags: [] }}
            onPress={() => onResultPress(series)}
            showTags={false}
            summaryLines={5}
          />
        </View>
      );
    } else {
      const message = item as SermonMessage;
      return (
        <View style={styles.messageCardContainer}>
          <SearchMessageCard
            message={message}
            onPress={() => onResultPress(message)}
          />
        </View>
      );
    }
  };

  // Key extractor
  const keyExtractor = (item: SermonSeries | SermonMessage) => {
    if (isSeries) {
      return (item as SermonSeries).Id;
    } else {
      return (item as SermonMessage).MessageId;
    }
  };

  // Show loading skeletons during API fetch
  if (isLoading) {
    return renderLoadingSkeletons();
  }

  // Show empty state if no results
  if (results.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <View style={{ flex: 1, position: 'relative' }}>
        <FlashList
          key={searchTarget}
          data={results}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={estimatedItemSize}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          removeClippedSubviews={true}
          onLoad={handleFlashListLoad}
        />
        {/* Show skeletons overlay during FlashList's first render cycle */}
        {!flashListLoaded && (
          <View style={styles.skeletonOverlay}>
            {renderLoadingSkeletons()}
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.background,
    },
    headerText: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    listContent: {
      paddingBottom: 16,
    },
    seriesCardContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    messageCardContainer: {
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 64,
    },
    emptyText: {
      fontSize: 20,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 16,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.textTertiary,
      marginTop: 8,
      textAlign: 'center',
    },
    skeletonsContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    skeleton: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadowDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    skeletonImage: {
      width: '100%',
      height: 140,
      backgroundColor: theme.colors.border,
      borderRadius: 8,
      marginBottom: 12,
    },
    skeletonLine: {
      backgroundColor: theme.colors.border,
      borderRadius: 4,
    },
    skeletonOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.background,
      zIndex: 10,
    },
  });

