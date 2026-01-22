/**
 * RelatedSeriesCard Component
 * 
 * Displays a related sermon series card with artwork, title, summary, metadata, and tags.
 * Used in the Related Series section on tablet devices.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import type { Theme } from '../theme/types';
import { SermonSeriesWithMatchCount } from '../types/api';
import { getTagDisplayLabel } from '../types/messageTag';

interface RelatedSeriesCardProps {
  series: SermonSeriesWithMatchCount;
  onPress: () => void;
  showTags?: boolean; // Whether to show tags (default: true)
  summaryLines?: number; // Number of lines for summary (default: 4)
}

export const RelatedSeriesCard: React.FC<RelatedSeriesCardProps> = ({
  series,
  onPress,
  showTags = true,
  summaryLines = 4,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const formatDateRange = (): string => {
    const startDate = new Date(series.StartDate).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    if (!series.EndDate) {
      return t('components.relatedSeries.currentSeries');
    }

    const endDate = new Date(series.EndDate).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    return `${startDate} - ${endDate}`;
  };

  const messageCount = series.Messages?.length || 0;
  // Display up to 5 tags from the series
  const displayTags = series.Tags?.slice(0, 5) || [];

  // Always use full-size layout with metadata under image
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Artwork and Metadata Container */}
      <View style={styles.artworkContainer}>
        {/* Series Artwork */}
        <FastImage
          source={{ uri: series.ArtUrl }}
          style={styles.artwork}
          resizeMode={FastImage.resizeMode.cover}
        />

        {/* Metadata Row */}
        <View style={styles.metadataRowVertical}>
          <View style={styles.metadataItem}>
            <Ionicons name="albums" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.metadataText}>
              {messageCount} {messageCount === 1 ? t('components.relatedSeries.message') : t('components.relatedSeries.messages')}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.metadataText}>{formatDateRange()}</Text>
          </View>
        </View>
      </View>

      {/* Series Info */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {series.Name}
        </Text>

        {/* Summary */}
        {series.Summary && (
          <Text style={styles.summary} numberOfLines={summaryLines}>
            {series.Summary}
          </Text>
        )}

        {/* Tags */}
        {showTags && displayTags.length > 0 && (
          <View style={styles.tagsContainer}>
            {displayTags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{getTagDisplayLabel(tag)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  artworkContainer: {
    flexDirection: 'column',
  },
  artwork: {
    width: 160,
    height: 90, // 16:9 aspect ratio (160 / 16 * 9 = 90)
    borderRadius: 8,
    backgroundColor: theme.colors.border,
    marginBottom: 8,
  },
  content: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  metadataRowVertical: {
    flexDirection: 'column',
    gap: 4,
    width: 160,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  tagText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

