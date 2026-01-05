/**
 * EventCard Component
 * Displays an event summary in list views with badges for featured/online/recurring
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { EventSummary } from '../../types/events';
import { formatEventDateTime, getRecurrencePatternLabel } from '../../services/api/eventService';

interface EventCardProps {
  event: EventSummary;
  onPress: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
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

  const dateTimeDisplay = formatEventDateTime(
    event.StartTime,
    event.EndTime,
    event.IsAllDay
  );

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      accessibilityLabel={`${event.Title}, ${dateTimeDisplay}`}
      accessibilityHint={t('events.detail.viewEvent') || 'Tap to view event details'}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        {/* Badges Row */}
        <View style={styles.badgesRow}>
          {event.IsFeatured && (
            <View style={[styles.badge, styles.featuredBadge]}>
              <Ionicons name="star" size={10} color={theme.colors.warning} />
              <Text style={[styles.badgeText, styles.featuredBadgeText]}>
                {t('events.badges.featured')}
              </Text>
            </View>
          )}
          {event.IsOnline && (
            <View style={[styles.badge, styles.onlineBadge]}>
              <Ionicons name="videocam" size={10} color={theme.colors.info} />
              <Text style={[styles.badgeText, styles.onlineBadgeText]}>
                {t('events.badges.online')}
              </Text>
            </View>
          )}
          {event.IsRecurring && (
            <View style={[styles.badge, styles.recurringBadge]}>
              <Ionicons name="repeat" size={10} color={theme.colors.primary} />
              <Text style={[styles.badgeText, styles.recurringBadgeText]}>
                {getRecurrencePatternLabel(event.RecurrencePattern)}
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {event.Title}
        </Text>

        {/* Summary */}
        {event.Summary && (
          <Text style={styles.summary} numberOfLines={2}>
            {event.Summary}
          </Text>
        )}

        {/* Date/Time Row */}
        <View style={styles.metadataRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={theme.colors.primary}
            style={styles.metadataIcon}
          />
          <Text style={styles.dateTime}>{dateTimeDisplay}</Text>
        </View>

        {/* Location Row */}
        {(event.LocationName || event.IsOnline) && (
          <View style={styles.metadataRow}>
            <Ionicons
              name={event.IsOnline ? 'globe-outline' : 'location-outline'}
              size={16}
              color={theme.colors.textSecondary}
              style={styles.metadataIcon}
            />
            <Text style={styles.location} numberOfLines={1}>
              {event.IsOnline ? t('events.detail.online') : event.LocationName}
            </Text>
          </View>
        )}

        {/* Chevron */}
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadowDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      position: 'relative',
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      gap: 4,
    },
    featuredBadge: {
      backgroundColor: 'rgba(237, 108, 2, 0.12)',
    },
    onlineBadge: {
      backgroundColor: 'rgba(0, 122, 153, 0.12)',
    },
    recurringBadge: {
      backgroundColor: theme.colors.primaryLight || 'rgba(0, 122, 153, 0.12)',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
    },
    featuredBadgeText: {
      color: theme.colors.warning,
    },
    onlineBadgeText: {
      color: theme.colors.info,
    },
    recurringBadgeText: {
      color: theme.colors.primary,
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
      marginBottom: 4,
      lineHeight: 22,
      paddingRight: 24,
    },
    summary: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 10,
    },
    metadataRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    metadataIcon: {
      marginRight: 8,
      width: 16,
    },
    dateTime: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.primary,
      flex: 1,
    },
    location: {
      fontSize: 13,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.textSecondary,
      flex: 1,
    },
    chevronContainer: {
      position: 'absolute',
      right: 12,
      top: '50%',
      marginTop: -10,
    },
  });

/**
 * EventCardSkeleton - Loading placeholder for EventCard
 */
export const EventCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = createSkeletonStyles(theme);

  return (
    <View style={styles.container}>
      {/* Badge placeholder */}
      <View style={styles.badgePlaceholder} />
      {/* Title placeholder */}
      <View style={styles.titlePlaceholder} />
      {/* Summary placeholder */}
      <View style={styles.summaryPlaceholder} />
      {/* Metadata placeholders */}
      <View style={styles.metadataPlaceholder} />
      <View style={[styles.metadataPlaceholder, { width: '50%' }]} />
    </View>
  );
};

const createSkeletonStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    badgePlaceholder: {
      width: 80,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.backgroundSecondary,
      marginBottom: 10,
    },
    titlePlaceholder: {
      width: '85%',
      height: 20,
      borderRadius: 4,
      backgroundColor: theme.colors.backgroundSecondary,
      marginBottom: 8,
    },
    summaryPlaceholder: {
      width: '100%',
      height: 16,
      borderRadius: 4,
      backgroundColor: theme.colors.backgroundSecondary,
      marginBottom: 12,
    },
    metadataPlaceholder: {
      width: '70%',
      height: 14,
      borderRadius: 4,
      backgroundColor: theme.colors.backgroundSecondary,
      marginBottom: 6,
    },
  });

