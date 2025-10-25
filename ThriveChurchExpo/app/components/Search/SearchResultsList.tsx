/**
 * SearchResultsList Component
 * Displays search results using FlashList for optimal performance
 */

import React, { useMemo, useRef, useEffect } from 'react';
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
  const styles = createStyles(theme);

  // Animated value for skeleton shimmer effect
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  // Determine if results are series or messages
  const isSeries = searchTarget === SearchTarget.Series;

  // Estimated item size for FlashList
  const estimatedItemSize = isSeries ? 280 : 200;

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

  // Render loading skeletons with shimmer animation
  const renderLoadingSkeletons = () => {
    return (
      <View style={styles.skeletonsContainer}>
        {[1, 2, 3, 4, 5].map((index) => (
          <View
            key={index}
            style={[
              styles.skeleton,
              isSeries ? styles.skeletonSeries : styles.skeletonMessage,
            ]}
          >
            <View style={styles.skeletonContent}>
              <Animated.View
                style={[
                  styles.skeletonImage,
                  { opacity: shimmerAnim },
                ]}
              />
              <View style={styles.skeletonText}>
                <Animated.View
                  style={[
                    styles.skeletonLine,
                    { opacity: shimmerAnim },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.skeletonLine,
                    styles.skeletonLineShort,
                    { opacity: shimmerAnim },
                  ]}
                />
              </View>
            </View>
          </View>
        ))}
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
        <Text style={styles.emptyText}>No results found</Text>
        <Text style={styles.emptySubtext}>
          Try selecting different tags
        </Text>
      </View>
    );
  };

  // Render result count header
  const renderHeader = () => {
    if (isLoading || results.length === 0) return null;

    const targetLabel = isSeries ? 'Series' : 'Messages';
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>
          {results.length} {targetLabel} Found
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

  // Show loading skeletons
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
      <FlashList
        key={`${searchTarget}-${results.length}`}
        data={results}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={estimatedItemSize}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        extraData={results}
        removeClippedSubviews={false}
      />
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
      marginBottom: 16,
      overflow: 'hidden',
    },
    skeletonSeries: {
      height: 260,
    },
    skeletonMessage: {
      height: 100,
    },
    skeletonContent: {
      padding: 16,
    },
    skeletonImage: {
      width: '100%',
      height: 120,
      backgroundColor: theme.colors.border,
      borderRadius: 8,
      marginBottom: 12,
    },
    skeletonText: {
      gap: 8,
    },
    skeletonLine: {
      height: 16,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
    },
    skeletonLineShort: {
      width: '60%',
    },
  });

