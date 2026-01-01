/**
 * SearchMessageCard Component
 * Displays a sermon message in search results with summary and metadata
 * Optimized for search results display (no week badge, shows summary)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SermonMessage } from '../../types/api';

interface SearchMessageCardProps {
  message: SermonMessage;
  onPress: () => void;
}

export const SearchMessageCard: React.FC<SearchMessageCardProps> = ({
  message,
  onPress,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (seconds: number): string => {
    const totalSeconds = Math.floor(seconds); // Remove decimal places
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const hasAudio = !!message.AudioUrl;
  const hasVideo = !!message.VideoUrl;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${message.Title}, ${message.Speaker}, ${formatDate(message.Date)}`}
      accessibilityHint={t('components.searchMessageCard.accessibilityHint')}
      accessibilityRole="button"
    >
      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {message.Title}
      </Text>

      {/* Summary */}
      {message.Summary && (
        <Text style={styles.summary} numberOfLines={5}>
          {message.Summary}
        </Text>
      )}

      {/* Metadata Row */}
      <View style={styles.metadataContainer}>
        {/* Speaker */}
        <View style={styles.metadataItem}>
          <Ionicons name="person" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.metadataText} numberOfLines={1}>
            {message.Speaker}
          </Text>
        </View>

        {/* Date */}
        <View style={styles.metadataItem}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.metadataText}>
            {formatDate(message.Date)}
          </Text>
        </View>
      </View>

      {/* Media Row */}
      <View style={styles.mediaContainer}>
        {/* Audio Icon */}
        <View style={styles.mediaItem}>
          <Ionicons
            name={hasAudio ? 'headset' : 'headset-outline'}
            size={18}
            color={hasAudio ? theme.colors.primary : theme.colors.textTertiary}
          />
          <Text style={[styles.mediaLabel, { color: hasAudio ? theme.colors.primary : theme.colors.textTertiary }]}>
            {t('components.searchMessageCard.audio')}
          </Text>
        </View>

        {/* Video Icon */}
        <View style={styles.mediaItem}>
          <Ionicons
            name={hasVideo ? 'play-circle' : 'play-circle-outline'}
            size={18}
            color={hasVideo ? theme.colors.primary : theme.colors.textTertiary}
          />
          <Text style={[styles.mediaLabel, { color: hasVideo ? theme.colors.primary : theme.colors.textTertiary }]}>
            {t('components.searchMessageCard.video')}
          </Text>
        </View>

        {/* Duration */}
        {message.AudioDuration && (
          <View style={styles.mediaItem}>
            <Ionicons
              name="time-outline"
              size={18}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.duration}>
              {formatDuration(message.AudioDuration)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
    color: theme.colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  summary: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metadataText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
    color: theme.colors.textSecondary,
    flex: 1,
  },
  mediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mediaLabel: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
  },
  duration: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
    color: theme.colors.textSecondary,
  },
});

