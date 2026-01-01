/**
 * RelatedSeriesSection Component
 * 
 * Fetches and displays related sermon series based on the current message's tags.
 * Implements client-side sorting by match count and date.
 * Tablet-only feature that appears in SermonDetailScreen.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import type { Theme } from '../theme/types';
import { SermonSeries } from '../types/api';
import { searchRelatedSeries } from '../services/api/sermonSearchService';
import { RelatedSeriesCard } from './RelatedSeriesCard';
import { logCustomEvent } from '../services/analytics/analyticsService';

interface RelatedSeriesSectionProps {
  currentMessageTags: string[];
  currentSeriesId: string;
}

export const RelatedSeriesSection: React.FC<RelatedSeriesSectionProps> = ({
  currentMessageTags,
  currentSeriesId,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const navigation = useNavigation<StackNavigationProp<any>>();

  // Don't render if no tags
  if (!currentMessageTags || currentMessageTags.length === 0) {
    return null;
  }

  // Fetch related series with React Query
  const { data: relatedSeries, isLoading, isError } = useQuery({
    queryKey: ['relatedSeries', currentMessageTags.join(',')],
    queryFn: async () => {
      const series = await searchRelatedSeries(currentMessageTags);
      return series;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sort and filter series
  const sortedSeries = useMemo(() => {
    if (!relatedSeries) return [];

    // Calculate match count for each series
    const seriesWithMatchCount = relatedSeries
      .filter(s => s.Id !== currentSeriesId) // Exclude current series by Id
      .map(s => {
        const matchingTags = s.Tags?.filter(tag =>
          currentMessageTags.includes(tag)
        ) || [];
        const matchCount = matchingTags.length;

        return {
          ...s,
          matchCount,
          matchingTags // Store the matching tags for display
        };
      });

    // Filter out series with 0 matches
    const withMatches = seriesWithMatchCount.filter(s => s.matchCount > 0);

    // Sort by match count (desc), then by StartDate (desc)
    const sorted = withMatches.sort((a, b) => {
      // Primary sort: match count (higher is better)
      if (a.matchCount !== b.matchCount) {
        return b.matchCount - a.matchCount;
      }

      // Secondary sort: date (newer is better)
      const dateA = new Date(a.StartDate).getTime();
      const dateB = new Date(b.StartDate).getTime();
      return dateB - dateA;
    });

    // Return top 3
    const top3 = sorted.slice(0, 3);

    return top3;
  }, [relatedSeries, currentMessageTags, currentSeriesId]);

  // Log when series are displayed
  React.useEffect(() => {
    if (sortedSeries.length > 0) {
      logCustomEvent('related_series_displayed', {
        series_count: sortedSeries.length,
        tags: currentMessageTags,
      });
    }
  }, [sortedSeries, currentMessageTags]);

  // Don't render if loading failed or no results
  if (isError || (!isLoading && sortedSeries.length === 0)) {
    return null;
  }

  const handleSeriesPress = (series: SermonSeries, index: number) => {
    // Log analytics event
    logCustomEvent('related_series_tap', {
      to_series_id: series.Id,
      to_series_name: series.Name,
      position: index,
    });

    // Navigate to series detail
    navigation.navigate('SeriesDetail', {
      seriesId: series.Id,
      seriesArtUrl: series.ArtUrl,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('components.relatedSeries.title')}</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {sortedSeries.map((series, index) => (
            <RelatedSeriesCard
              key={series.Id}
              series={series}
              onPress={() => handleSeriesPress(series, index)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    color: theme.colors.text,
    marginBottom: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsContainer: {
    gap: 0, // Gap is handled by marginBottom in card
  },
});

