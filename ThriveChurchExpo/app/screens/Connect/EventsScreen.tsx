/**
 * EventsScreen
 * Main events listing with calendar/list view toggle
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { EventSummary } from '../../types/events';
import { getAllEvents, eventOccursOnDate } from '../../services/api/eventService';
import { EventCard, EventCardSkeleton, EventCalendar, FeaturedEventsBanner } from '../../components/events';
import OfflineEmptyState from '../../components/OfflineEmptyState';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';

type ConnectStackParamList = {
  ConnectHome: undefined;
  Events: undefined;
  EventDetail: { eventId: string; eventTitle?: string };
};

type NavigationProp = NativeStackNavigationProp<ConnectStackParamList>;

type ViewMode = 'list' | 'calendar';

export const EventsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const navigation = useNavigation<NavigationProp>();

  // State
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateEvents, setSelectedDateEvents] = useState<EventSummary[]>([]);

  // Network status
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  // Track screen view
  useEffect(() => {
    setCurrentScreen('EventsScreen', 'Events');
    logCustomEvent('view_events', { view_mode: viewMode });
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      const response = await getAllEvents(false);

      if (response.HasErrors) {
        // Treat API errors as empty data - show empty state instead of error
        console.warn('Events API returned error:', response.ErrorMessage);
        setEvents([]);
        setFeaturedEvents([]);
        return;
      }

      // Sort events by start time
      const sortedEvents = response.Events.sort(
        (a, b) => new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime()
      );

      // Filter featured events
      const featured = sortedEvents.filter((e) => e.IsFeatured && e.IsActive);

      setEvents(sortedEvents);
      setFeaturedEvents(featured);
    } catch (err) {
      // Treat network/API errors as empty data - show empty state instead of error
      console.warn('Failed to fetch events:', err);
      setEvents([]);
      setFeaturedEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, [fetchEvents]);

  // Handle event press
  const handleEventPress = useCallback((event: EventSummary) => {
    logCustomEvent('select_event', {
      event_id: event.Id,
      event_title: event.Title,
      is_featured: event.IsFeatured,
    });
    navigation.navigate('EventDetail', {
      eventId: event.Id,
      eventTitle: event.Title,
    });
  }, [navigation]);

  // Handle date select in calendar
  const handleDateSelect = useCallback((date: Date, eventsOnDate: EventSummary[]) => {
    setSelectedDate(date);
    setSelectedDateEvents(eventsOnDate);
  }, []);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    const newMode = viewMode === 'list' ? 'calendar' : 'list';
    setViewMode(newMode);
    logCustomEvent('toggle_events_view', { view_mode: newMode });
  }, [viewMode]);

  // Get events for list display
  const getDisplayEvents = (): EventSummary[] => {
    if (viewMode === 'calendar' && selectedDate) {
      return selectedDateEvents;
    }
    // Filter to upcoming events only for list view
    const now = new Date();
    return events.filter((e) => new Date(e.StartTime) >= now || e.IsRecurring);
  };

  // Render view mode toggle
  const renderViewToggle = () => (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
        onPress={() => setViewMode('list')}
        accessibilityLabel={t('events.viewMode.list')}
      >
        <Ionicons
          name="list"
          size={18}
          color={viewMode === 'list' ? '#FFFFFF' : theme.colors.textSecondary}
        />
        <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
          {t('events.viewMode.list')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleButtonActive]}
        onPress={() => setViewMode('calendar')}
        accessibilityLabel={t('events.viewMode.calendar')}
      >
        <Ionicons
          name="calendar"
          size={18}
          color={viewMode === 'calendar' ? '#FFFFFF' : theme.colors.textSecondary}
        />
        <Text style={[styles.toggleText, viewMode === 'calendar' && styles.toggleTextActive]}>
          {t('events.viewMode.calendar')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render skeleton loading
  const renderSkeletons = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((i) => (
        <EventCardSkeleton key={i} />
      ))}
    </View>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (viewMode === 'calendar' && selectedDate && selectedDateEvents.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={theme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('events.noEvents')}</Text>
          <Text style={styles.emptyText}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Ionicons name="calendar-outline" size={48} color={theme.colors.textTertiary} />
        <Text style={styles.emptyTitle}>{t('events.noEvents')}</Text>
        <Text style={styles.emptyText}>{t('events.noEventsDescription')}</Text>
      </View>
    );
  };

  // Render event item
  const renderItem = ({ item }: { item: EventSummary }) => (
    <EventCard event={item} onPress={() => handleEventPress(item)} />
  );

  // Render list header
  const renderListHeader = () => (
    <View>
      {/* Featured Events Banner (only in list view) */}
      {viewMode === 'list' && featuredEvents.length > 0 && (
        <FeaturedEventsBanner events={featuredEvents} onEventPress={handleEventPress} />
      )}

      {/* View Toggle */}
      {renderViewToggle()}

      {/* Calendar (in calendar view) */}
      {viewMode === 'calendar' && (
        <EventCalendar
          events={events}
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate}
        />
      )}

      {/* Selected date header (in calendar view) */}
      {viewMode === 'calendar' && selectedDate && (
        <View style={styles.selectedDateHeader}>
          <Text style={styles.selectedDateText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          {selectedDateEvents.length > 0 && (
            <Text style={styles.selectedDateCount}>
              {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'event' : 'events'}
            </Text>
          )}
        </View>
      )}

      {/* Section title (in list view) */}
      {viewMode === 'list' && events.length > 0 && (
        <Text style={styles.sectionTitle}>{t('events.allEvents')}</Text>
      )}
    </View>
  );

  // Handle offline state
  if (isOffline && events.length === 0) {
    return (
      <View style={styles.container}>
        <OfflineEmptyState
          message={t('events.errorDescription')}
          showRetry={true}
          onRetry={fetchEvents}
        />
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        {renderViewToggle()}
        {renderSkeletons()}
      </View>
    );
  }

  const displayEvents = getDisplayEvents();

  return (
    <View style={styles.container}>
      <FlashList
        data={displayEvents}
        renderItem={renderItem}
        keyExtractor={(item) => item.Id}
        estimatedItemSize={140}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContent: {
      paddingBottom: 24,
    },
    toggleContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginVertical: 12,
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 2,
    },
    toggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 6,
      gap: 6,
    },
    toggleButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    toggleText: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.textSecondary,
    },
    toggleTextActive: {
      color: '#FFFFFF',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
    },
    selectedDateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
    },
    selectedDateText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
    },
    selectedDateCount: {
      fontSize: 13,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.textSecondary,
    },
    skeletonContainer: {
      paddingTop: 8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

export default EventsScreen;

