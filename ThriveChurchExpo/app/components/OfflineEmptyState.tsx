/**
 * OfflineEmptyState Component
 * A reusable component that displays a friendly offline state with CTAs
 * for accessing offline content like downloaded sermons and Bible.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import type { Theme } from '../theme/types';

interface OfflineEmptyStateProps {
  /** Optional custom message to display */
  message?: string;
  /** Show "View Downloads" CTA button */
  showDownloadsCta?: boolean;
  /** Show "Read Bible" CTA button */
  showBibleCta?: boolean;
  /** Show retry button */
  showRetry?: boolean;
  /** Callback when retry is pressed */
  onRetry?: () => void;
  /** Icon to display (default: cloud-offline) */
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function OfflineEmptyState({
  message,
  showDownloadsCta = true,
  showBibleCta = true,
  showRetry = true,
  onRetry,
  icon = 'cloud-offline-outline',
}: OfflineEmptyStateProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const styles = createStyles(theme);

  const handleViewDownloads = () => {
    navigation.navigate('Listen', { screen: 'Downloads' });
  };

  const handleReadBible = () => {
    navigation.navigate('Bible');
  };

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={theme.colors.textTertiary} />
      </View>

      {/* Title */}
      <Text style={styles.title}>{t('offline.title')}</Text>

      {/* Message */}
      <Text style={styles.message}>
        {message || t('offline.message')}
      </Text>

      {/* CTA Buttons */}
      <View style={styles.ctaContainer}>
        {showDownloadsCta && (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleViewDownloads}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.ctaText}>{t('offline.viewDownloads')}</Text>
          </TouchableOpacity>
        )}

        {showBibleCta && (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleReadBible}
            activeOpacity={0.7}
          >
            <Ionicons name="book-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.ctaText}>{t('offline.readBible')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Retry Button */}
      {showRetry && onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={18} color={theme.colors.textInverse} />
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.cardSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    message: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 22,
    },
    ctaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 24,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    ctaText: {
      ...theme.typography.body,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      gap: 8,
    },
    retryText: {
      ...theme.typography.body,
      color: theme.colors.textInverse,
      fontWeight: '600',
    },
  });

