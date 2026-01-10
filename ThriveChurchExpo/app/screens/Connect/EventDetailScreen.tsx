/**
 * EventDetailScreen
 * Displays full event details with action buttons
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import * as Calendar from 'expo-calendar';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { Event, EventDetailRouteParams } from '../../types/events';
import {
  getEventById,
  formatEventDateTime,
  formatEventLocation,
  getRecurrencePatternLabel,
} from '../../services/api/eventService';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';

type ConnectStackParamList = {
  Events: undefined;
  EventDetail: EventDetailRouteParams;
};

type EventDetailRouteProp = RouteProp<ConnectStackParamList, 'EventDetail'>;

export const EventDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const route = useRoute<EventDetailRouteProp>();
  const { eventId, eventTitle } = route.params;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('EventDetailScreen', 'EventDetail');
    logCustomEvent('view_event_detail', {
      event_id: eventId,
      event_title: eventTitle,
    });
  }, [eventId, eventTitle]);

  // Fetch event details
  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEventById(eventId);
      setEvent(response.Event);
    } catch (err) {
      console.error('Failed to fetch event:', err);
      setError(t('events.error'));
    } finally {
      setLoading(false);
    }
  }, [eventId, t]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Handle share
  const handleShare = async () => {
    if (!event) return;

    try {
      const dateTime = formatEventDateTime(event.StartTime, event.EndTime, event.IsAllDay);
      const message = `${event.Title}\n${dateTime}${event.LocationName ? `\n${event.LocationName}` : ''}\n\n${event.Summary || ''}`;

      await Share.share({
        message,
        title: event.Title,
      });

      logCustomEvent('share_event', { event_id: eventId });
    } catch (err) {
      console.error('Error sharing event:', err);
      Alert.alert(t('events.alerts.shareError'));
    }
  };

  // Handle add to calendar
  const handleAddToCalendar = async () => {
    if (!event) return;

    try {
      // Request calendar permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('events.alerts.calendarPermission'));
        return;
      }

      // Get default calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(
        (cal) => cal.allowsModifications && cal.source?.name === 'Default'
      ) || calendars.find((cal) => cal.allowsModifications);

      if (!defaultCalendar) {
        Alert.alert(t('events.alerts.calendarError'));
        return;
      }

      // Create event
      const startDate = new Date(event.StartTime);
      const endDate = event.EndTime
        ? new Date(event.EndTime)
        : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.Title,
        startDate,
        endDate,
        allDay: event.IsAllDay,
        location: formatEventLocation(event.Location, event.LocationName),
        notes: event.Description || event.Summary,
        url: event.OnlineLink,
      });

      Alert.alert(t('events.alerts.calendarSuccess'));
      logCustomEvent('add_to_calendar', { event_id: eventId });
    } catch (err) {
      console.error('Error adding to calendar:', err);
      Alert.alert(t('events.alerts.calendarError'));
    }
  };

  // Handle get directions
  const handleGetDirections = () => {
    if (!event?.Location && !event?.LocationName) return;

    const address = event.Location
      ? [event.Location.Address, event.Location.City, event.Location.State, event.Location.ZipCode]
          .filter(Boolean)
          .join(', ')
      : event.LocationName;

    if (!address) return;

    const encodedAddress = encodeURIComponent(address);
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

    Linking.openURL(url).catch(() => {
      Alert.alert(t('events.alerts.mapsError'));
    });

    logCustomEvent('get_directions', { event_id: eventId });
  };

  // Handle join online
  const handleJoinOnline = () => {
    if (!event?.OnlineLink) return;
    Linking.openURL(event.OnlineLink).catch(() => {
      Alert.alert(t('events.alerts.mapsError'));
    });
    logCustomEvent('join_online_event', { event_id: eventId });
  };

  // Handle registration
  const handleRegister = () => {
    if (!event?.RegistrationUrl) return;
    Linking.openURL(event.RegistrationUrl).catch(() => {
      Alert.alert(t('events.alerts.mapsError'));
    });
    logCustomEvent('register_for_event', { event_id: eventId });
  };

  // Render action button
  const renderActionButton = (
    icon: string,
    label: string,
    onPress: () => void,
    variant: 'primary' | 'secondary' = 'secondary'
  ) => (
    <TouchableOpacity
      style={[styles.actionButton, variant === 'primary' && styles.actionButtonPrimary]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={variant === 'primary' ? '#FFFFFF' : theme.colors.primary}
      />
      <Text style={[styles.actionButtonText, variant === 'primary' && styles.actionButtonTextPrimary]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Render info row
  const renderInfoRow = (icon: string, label: string, value: string, multiline = false) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, multiline && styles.infoValueMultiline]}>{value}</Text>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Text style={styles.errorTitle}>{t('events.error')}</Text>
        <Text style={styles.errorText}>{error || t('events.errorDescription')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEvent}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dateTimeDisplay = formatEventDateTime(event.StartTime, event.EndTime, event.IsAllDay);
  const locationDisplay = formatEventLocation(event.Location, event.LocationName);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {/* Hero Image */}
      {event.ImageUrl && (
        <FastImage
          source={{ uri: event.ImageUrl }}
          style={styles.heroImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Badges */}
        <View style={styles.badgesRow}>
          {event.IsFeatured && (
            <View style={[styles.badge, styles.featuredBadge]}>
              <Ionicons name="star" size={12} color={theme.colors.warning} />
              <Text style={styles.featuredBadgeText}>{t('events.badges.featured')}</Text>
            </View>
          )}
          {event.IsOnline && (
            <View style={[styles.badge, styles.onlineBadge]}>
              <Ionicons name="videocam" size={12} color={theme.colors.info} />
              <Text style={styles.onlineBadgeText}>{t('events.badges.online')}</Text>
            </View>
          )}
          {event.IsRecurring && (
            <View style={[styles.badge, styles.recurringBadge]}>
              <Ionicons name="repeat" size={12} color={theme.colors.primary} />
              <Text style={styles.recurringBadgeText}>
                {getRecurrencePatternLabel(event.RecurrencePattern)}
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{event.Title}</Text>

        {/* Info Section */}
        <View style={styles.infoSection}>
          {renderInfoRow('calendar-outline', t('events.detail.when'), dateTimeDisplay)}
          {locationDisplay && renderInfoRow(
            event.IsOnline ? 'globe-outline' : 'location-outline',
            t('events.detail.where'),
            locationDisplay,
            true
          )}
          {event.IsOnline && event.OnlinePlatform && renderInfoRow(
            'laptop-outline',
            t('events.detail.online'),
            event.OnlinePlatform
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {event.RegistrationUrl && renderActionButton(
            'ticket-outline',
            t('events.detail.register'),
            handleRegister,
            'primary'
          )}
          {event.IsOnline && event.OnlineLink && renderActionButton(
            'videocam-outline',
            t('events.detail.joinOnline'),
            handleJoinOnline
          )}
          {!event.IsOnline && locationDisplay && renderActionButton(
            'navigate-outline',
            t('events.detail.getDirections'),
            handleGetDirections
          )}
          {renderActionButton('calendar-outline', t('events.detail.addToCalendar'), handleAddToCalendar)}
          {renderActionButton('share-outline', t('events.detail.share'), handleShare)}
        </View>

        {/* Description */}
        {(event.Description || event.Summary) && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>{t('events.detail.description')}</Text>
            <Text style={styles.descriptionText}>{event.Description || event.Summary}</Text>
          </View>
        )}

        {/* Contact */}
        {(event.ContactEmail || event.ContactPhone) && (
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>{t('events.detail.contact')}</Text>
            {event.ContactEmail && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${event.ContactEmail}`)}
              >
                <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.contactText}>{event.ContactEmail}</Text>
              </TouchableOpacity>
            )}
            {event.ContactPhone && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${event.ContactPhone}`)}
              >
                <Ionicons name="call-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.contactText}>{event.ContactPhone}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: theme.colors.background,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: '#FFFFFF',
    },
    heroImage: {
      width: '100%',
      height: 200,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    content: {
      padding: 16,
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    featuredBadge: {
      backgroundColor: 'rgba(237, 108, 2, 0.12)',
    },
    featuredBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.warning,
    },
    onlineBadge: {
      backgroundColor: 'rgba(0, 122, 153, 0.12)',
    },
    onlineBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.info,
    },
    recurringBadge: {
      backgroundColor: theme.colors.primaryLight || 'rgba(0, 122, 153, 0.12)',
    },
    recurringBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
      marginBottom: 16,
      lineHeight: 30,
    },
    infoSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    infoIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primaryLight || 'rgba(0, 122, 153, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 15,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.text,
      lineHeight: 20,
    },
    infoValueMultiline: {
      lineHeight: 22,
    },
    actionsSection: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 24,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      gap: 6,
    },
    actionButtonPrimary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.primary,
    },
    actionButtonTextPrimary: {
      color: '#FFFFFF',
    },
    descriptionSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
      marginBottom: 12,
    },
    descriptionText: {
      fontSize: 15,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },
    contactSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 24,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      gap: 12,
    },
    contactText: {
      fontSize: 15,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.primary,
    },
  });

export default EventDetailScreen;

