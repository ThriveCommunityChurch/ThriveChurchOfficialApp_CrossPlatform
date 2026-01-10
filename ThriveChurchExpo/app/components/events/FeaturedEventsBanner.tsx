/**
 * FeaturedEventsBanner Component
 * Horizontal scrollable carousel for showcasing featured events
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { EventSummary } from '../../types/events';
import { formatEventDate, formatEventTime } from '../../services/api/eventService';

interface FeaturedEventsBannerProps {
  events: EventSummary[];
  onEventPress: (event: EventSummary) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = 180;

export const FeaturedEventsBanner: React.FC<FeaturedEventsBannerProps> = ({
  events,
  onEventPress,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const flatListRef = useRef<FlatList>(null);

  if (events.length === 0) return null;

  const renderItem = ({ item, index }: { item: EventSummary; index: number }) => {
    const isFirstItem = index === 0;
    const isLastItem = index === events.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isFirstItem && styles.cardFirst,
          isLastItem && styles.cardLast,
        ]}
        onPress={() => onEventPress(item)}
        activeOpacity={0.9}
        accessibilityLabel={`Featured event: ${item.Title}`}
        accessibilityRole="button"
      >
        {/* Background Image or Gradient */}
        {item.ThumbnailUrl ? (
          <FastImage
            source={{ uri: item.ThumbnailUrl }}
            style={styles.backgroundImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View style={styles.gradientBackground}>
            <Ionicons name="calendar" size={60} color="rgba(255,255,255,0.2)" />
          </View>
        )}

        {/* Overlay */}
        <View style={styles.overlay} />

        {/* Content */}
        <View style={styles.content}>
          {/* Featured Badge */}
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.featuredBadgeText}>{t('events.badges.featured')}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {item.Title}
          </Text>

          {/* Date and Time */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.dateText}>
              {formatEventDate(item.StartTime)}
              {!item.IsAllDay && ` • ${formatEventTime(item.StartTime)}`}
            </Text>
          </View>

          {/* Location */}
          {(item.LocationName || item.IsOnline) && (
            <View style={styles.locationRow}>
              <Ionicons
                name={item.IsOnline ? 'videocam-outline' : 'location-outline'}
                size={14}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.IsOnline ? t('events.detail.online') : item.LocationName}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('events.featured')}</Text>
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={events}
        renderItem={renderItem}
        keyExtractor={(item) => item.Id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
      />

      {/* Page Indicators */}
      {events.length > 1 && (
        <View style={styles.indicators}>
          {events.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === 0 && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
    },
    listContent: {
      paddingHorizontal: 8,
    },
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      marginHorizontal: 6,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.colors.primary,
    },
    cardFirst: {
      marginLeft: 16,
    },
    cardLast: {
      marginRight: 16,
    },
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
    },
    gradientBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    content: {
      flex: 1,
      justifyContent: 'flex-end',
      padding: 16,
    },
    featuredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginBottom: 8,
      gap: 4,
    },
    featuredBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: '#FFD700',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: '#FFFFFF',
      marginBottom: 8,
      lineHeight: 26,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    dateText: {
      fontSize: 13,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: 'rgba(255, 255, 255, 0.95)',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    locationText: {
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: 'rgba(255, 255, 255, 0.85)',
      flex: 1,
    },
    indicators: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 12,
      gap: 6,
    },
    indicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.textTertiary,
    },
    indicatorActive: {
      width: 20,
      backgroundColor: theme.colors.primary,
    },
  });

/**
 * FeaturedEventsBannerSkeleton - Loading placeholder
 */
export const FeaturedEventsBannerSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const styles = createSkeletonStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.headerPlaceholder} />
      <View style={styles.cardPlaceholder} />
    </View>
  );
};

const createSkeletonStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    headerPlaceholder: {
      width: 150,
      height: 24,
      borderRadius: 4,
      backgroundColor: theme.colors.backgroundSecondary,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    cardPlaceholder: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 16,
      backgroundColor: theme.colors.backgroundSecondary,
      marginLeft: 16,
    },
  });

