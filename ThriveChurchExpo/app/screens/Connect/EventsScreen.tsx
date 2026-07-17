/**
 * EventsScreen
 * Main events listing with calendar/list view toggle
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { EventSummary } from '../../types/events';
import { getAllEvents, eventOccursOnDate, getNextOccurrence } from '../../services/api/eventService';
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
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NavigationProp>();

  // State
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

  // Fetch events (cached via react-query - see AppProviders for staleTime/gcTime config)
  const {
    data: eventsResponse,
    isLoading: loading,
    isRefetching: refreshing,
    refetch,
  } = useQuery({
    queryKey: ['events'],
    queryFn: () => getAllEvents(false),
  });

  // Derive sorted events + featured events, precomputing each event's next
  // occurrence once (instead of recomputing it repeatedly inside the sort comparator)
  const { events, featuredEvents } = useMemo(() => {
    if (!eventsResponse || eventsResponse.HasErrors) {
      if (eventsResponse?.HasErrors) {
        // Treat API errors as empty data - show empty state instead of error
        console.warn('Events API returned error:', eventsResponse.ErrorMessage);
      }
      return { events: [] as EventSummary[], featuredEvents: [] as EventSummary[] };
    }

    const today = new Date();

    // Precompute next occurrence once per event
    const withNextOccurrence = eventsResponse.Events.map((event) => ({
      event,
      nextOccurrence: getNextOccurrence(event, today),
    }));

    // Sort events by next occurrence date (soonest first)
    // Events with no upcoming occurrence go to the end
    withNextOccurrence.sort((a, b) => {
      if (!a.nextOccurrence && !b.nextOccurrence) {
        return new Date(a.event.StartTime).getTime() - new Date(b.event.StartTime).getTime();
      }
      if (!a.nextOccurrence) return 1;
      if (!b.nextOccurrence) return -1;
      return a.nextOccurrence.getTime() - b.nextOccurrence.getTime();
    });

    const sortedEvents = withNextOccurrence.map((w) => w.event);

    // Filter featured events - only show upcoming/current ones
    const featured = withNextOccurrence
      .filter((w) => w.event.IsFeatured && w.event.IsActive && w.nextOccurrence !== null)
      .map((w) => w.event);

    return { events: sortedEvents, featuredEvents: featured };
  }, [eventsResponse]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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

  // Toggle view mode - auto-select today when switching to calendar
  const switchToCalendar = useCallback(() => {
    setViewMode('calendar');
    // Auto-select today's date and find events for today
    const today = new Date();
    setSelectedDate(today);
    const todayEvents = events.filter((e) => eventOccursOnDate(e, today));
    setSelectedDateEvents(todayEvents);
    logCustomEvent('toggle_events_view', { view_mode: 'calendar' });
  }, [events]);

  const switchToList = useCallback(() => {
    setViewMode('list');
    logCustomEvent('toggle_events_view', { view_mode: 'list' });
  }, []);

  // Get events for list display
  const getDisplayEvents = (): EventSummary[] => {
    if (viewMode === 'calendar' && selectedDate) {
      return selectedDateEvents;
    }
    // Filter to upcoming events only for list view
    const now = new Date();
    const upcomingEvents = events.filter((e) => new Date(e.StartTime) >= now || e.IsRecurring);

    // In list view, don't show featured events in the main list since they're in the carousel
    if (viewMode === 'list' && featuredEvents.length > 0) {
      const featuredIds = new Set(featuredEvents.map(e => e.Id));
      return upcomingEvents.filter(e => !featuredIds.has(e.Id));
    }

    return upcomingEvents;
  };

  // Render view mode toggle
  const renderViewToggle = () => (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
        onPress={switchToList}
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
        onPress={switchToCalendar}
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
    if (viewMode === 'calendar') {
      if (selectedDate) {
        return (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>{t('events.noEvents')}</Text>
            <Text style={styles.emptyText}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        );
      }
      // Calendar view but no date selected - prompt user
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={theme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('events.selectDate') || 'Select a Date'}</Text>
          <Text style={styles.emptyText}>{t('events.selectDateDescription') || 'Tap on a date to see events'}</Text>
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
    <EventCard
      event={item}
      onPress={() => handleEventPress(item)}
      hideFeaturedBadge={viewMode === 'list' && featuredEvents.length > 0}
    />
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
          onRetry={refetch}
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
      marginTop: 16,
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    selectedDateText: {
      fontSize: 17,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
    },
    selectedDateCount: {
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Regular',
      color: theme.colors.textSecondary,
      backgroundColor: theme.colors.backgroundSecondary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
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

