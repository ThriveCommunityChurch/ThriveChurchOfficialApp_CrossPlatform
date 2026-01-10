/**
 * SeriesProgressBadge Component
 *
 * Displays series completion progress as a badge overlay on series cards.
 * Shows a progress bar and completion percentage for eligible past series.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import type { Theme } from '../theme/types';

interface SeriesProgressBadgeProps {
  /** Number of completed messages */
  completedCount: number;
  /** Total number of messages in the series */
  totalCount: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Whether the series is fully completed */
  isCompleted: boolean;
  /** Variant for different display contexts */
  variant?: 'card' | 'header' | 'compact';
  /** Use light text/track for dark backgrounds (e.g., tablet hero with overlay) */
  darkBackground?: boolean;
}

export const SeriesProgressBadge: React.FC<SeriesProgressBadgeProps> = ({
  completedCount,
  totalCount,
  percentage,
  isCompleted,
  variant = 'card',
  darkBackground = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  if (variant === 'compact') {
    // Compact badge for small spaces
    return (
      <View style={styles.compactContainer}>
        {isCompleted ? (
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
        ) : (
          <Text style={styles.compactText}>{percentage}%</Text>
        )}
      </View>
    );
  }

  if (variant === 'header') {
    // Header variant for series detail screen
    // Track and text colors adapt based on darkBackground prop
    const trackColor = darkBackground ? 'rgba(255,255,255,0.3)' : 'rgba(128,128,128,0.3)';
    const textColor = darkBackground ? '#FFFFFF' : theme.colors.textSecondary;

    return (
      <View style={styles.headerContainer}>
        <View style={[styles.headerProgressBar, { backgroundColor: trackColor }]}>
          <View style={[styles.headerProgressFill, { width: `${percentage}%` }]} />
        </View>
        <View style={styles.headerTextRow}>
          {isCompleted ? (
            <>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Text style={[styles.headerCompletedText, darkBackground && { color: theme.colors.success }]}>
                {t('listen.series.progress.completed')}
              </Text>
            </>
          ) : (
            <Text style={[styles.headerProgressText, { color: textColor }]}>
              {t('listen.series.progress.messagesProgress', { completed: completedCount, total: totalCount })} ({percentage}%)
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Default card variant - overlay on series card
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardProgressBar}>
        <View style={[styles.cardProgressFill, { width: `${percentage}%` }]} />
      </View>
      {isCompleted && (
        <View style={styles.cardCompletedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // Compact variant
    compactContainer: {
      backgroundColor: theme.colors.overlayDark,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    compactText: {
      color: theme.colors.textInverse,
      fontSize: 11,
      fontWeight: '600',
    },

    // Header variant
    headerContainer: {
      marginTop: 8,
    },
    headerProgressBar: {
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    headerProgressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
    headerTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      gap: 4,
    },
    headerProgressText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
    },
    headerCompletedText: {
      color: theme.colors.success,
      fontSize: 13,
      fontWeight: '600',
    },

    // Card variant
    cardContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    cardProgressBar: {
      height: 3,
      backgroundColor: theme.colors.overlayMedium,
    },
    cardProgressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
    },
    cardCompletedBadge: {
      position: 'absolute',
      top: -20,
      right: 6,
      backgroundColor: theme.colors.overlayDark,
      borderRadius: 12,
      padding: 4,
    },
  });

export default SeriesProgressBadge;

