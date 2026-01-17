/**
 * EventCalendar Component
 * A calendar month view for displaying events with navigation
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { EventSummary, CalendarDay } from '../../types/events';
import { eventOccursOnDate } from '../../services/api/eventService';

interface EventCalendarProps {
  events: EventSummary[];
  onDateSelect: (date: Date, events: EventSummary[]) => void;
  selectedDate?: Date;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const EventCalendar: React.FC<EventCalendarProps> = ({
  events,
  onDateSelect,
  selectedDate,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = useMemo(() => new Date(), []);

  // Generate calendar days for current month
  const calendarDays = useMemo((): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const days: CalendarDay[] = [];

    // Previous month days to fill grid
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        events: events.filter((e) => eventOccursOnDate(e, date)),
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        events: events.filter((e) => eventOccursOnDate(e, date)),
      });
    }

    // Next month days to complete grid (6 rows)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        events: events.filter((e) => eventOccursOnDate(e, date)),
      });
    }

    return days;
  }, [currentMonth, events]);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
    onDateSelect(new Date(), events.filter((e) => eventOccursOnDate(e, new Date())));
  }, [events, onDateSelect]);

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDayPress = (day: CalendarDay) => {
    onDateSelect(day.date, day.events);
  };

  return (
    <View style={styles.container}>
      {/* Header with month navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goToPrevMonth}
          style={styles.navButton}
          accessibilityLabel={t('events.calendar.prevMonth')}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToToday} style={styles.monthTitle}>
          <Text style={styles.monthText}>{formatMonthYear(currentMonth)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToNextMonth}
          style={styles.navButton}
          accessibilityLabel={t('events.calendar.nextMonth')}
        >
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Days of week header */}
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {calendarDays.map((day, index) => {
          const hasEvents = day.events.length > 0;
          const dayIsToday = isToday(day.date);
          const dayIsSelected = isSelected(day.date);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                !day.isCurrentMonth && styles.dayCellOtherMonth,
                dayIsSelected && styles.dayCellSelected,
              ]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dayNumber,
                  dayIsToday && styles.dayNumberToday,
                  dayIsSelected && styles.dayNumberSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.dayTextOtherMonth,
                    dayIsToday && styles.dayTextToday,
                    dayIsSelected && !dayIsToday && styles.dayTextSelected,
                  ]}
                >
                  {day.date.getDate()}
                </Text>
              </View>
              {/* Event indicator dots */}
              {hasEvents && (
                <View style={styles.eventDotsContainer}>
                  {day.events.slice(0, 3).map((event, i) => (
                    <View
                      key={event.Id}
                      style={[
                        styles.eventDot,
                        event.IsFeatured && styles.eventDotFeatured,
                      ]}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Today button */}
      <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
        <Ionicons name="today" size={16} color={theme.colors.primary} />
        <Text style={styles.todayButtonText}>{t('events.calendar.today')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    navButton: {
      padding: 8,
      borderRadius: 8,
    },
    monthTitle: {
      flex: 1,
      alignItems: 'center',
    },
    monthText: {
      fontSize: 18,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Lato-Bold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    weekHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 12,
      marginBottom: 8,
    },
    weekDayCell: {
      flex: 1,
      alignItems: 'center',
    },
    weekDayText: {
      fontSize: 13,
      fontWeight: '500',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCellOtherMonth: {
      opacity: 0.35,
    },
    dayCellSelected: {
      // No background on selected cell - the circle handles it
    },
    dayNumber: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
    },
    dayNumberToday: {
      backgroundColor: theme.colors.primary,
    },
    dayNumberSelected: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight || 'rgba(0, 122, 153, 0.1)',
    },
    dayText: {
      fontSize: 15,
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Lato-Regular',
      color: theme.colors.text,
      textAlign: 'center',
    },
    dayTextOtherMonth: {
      color: theme.colors.textTertiary,
    },
    dayTextToday: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    dayTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    eventDotsContainer: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: 2,
      gap: 3,
    },
    eventDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: theme.colors.primary,
    },
    eventDotFeatured: {
      backgroundColor: theme.colors.warning,
    },
    todayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: 8,
    },
    todayButtonText: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.primary,
    },
  });

