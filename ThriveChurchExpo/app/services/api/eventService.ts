/**
 * Event Service
 * Fetches event data from backend API
 */

import { api } from './client';
import * as Calendar from 'expo-calendar';
import {
  AllEventsResponse,
  Event,
  EventResponse,
  EventSummary,
  RecurrencePattern,
} from '../../types/events';

/**
 * Get all active events
 * @param includeInactive - Include inactive events (default: false)
 */
export async function getAllEvents(includeInactive = false): Promise<AllEventsResponse> {
  try {
    const response = await api.get<AllEventsResponse>(
      `api/Events?includeInactive=${includeInactive}`
    );
    return response.data || { Events: [], HasErrors: false, ErrorMessage: null };
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return {
      Events: [],
      HasErrors: true,
      ErrorMessage: 'Failed to load events. Please try again.',
    };
  }
}

/**
 * Get a single event by ID
 */
export async function getEventById(eventId: string): Promise<EventResponse> {
  try {
    const response = await api.get<EventResponse>(`api/Events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch event:', error);
    throw error;
  }
}

/**
 * Get featured events only
 */
export async function getFeaturedEvents(): Promise<EventSummary[]> {
  const response = await getAllEvents(false);
  if (response.HasErrors) return [];
  return response.Events.filter((e) => e.IsFeatured && e.IsActive);
}

/**
 * Get upcoming events (next 60 days)
 */
export async function getUpcomingEvents(): Promise<EventSummary[]> {
  const response = await getAllEvents(false);
  if (response.HasErrors) return [];

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 60);

  return response.Events
    .filter((e) => new Date(e.StartTime) >= now && new Date(e.StartTime) <= futureDate)
    .sort((a, b) => new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime());
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get recurrence pattern display label
 * Handles both numeric enum values and string values from API
 */
export function getRecurrencePatternLabel(pattern: RecurrencePattern | string | number | undefined): string {
  // Handle undefined or null
  if (pattern === undefined || pattern === null) {
    return '';
  }

  // If it's a string, check for string representations
  if (typeof pattern === 'string') {
    const lowerPattern = pattern.toLowerCase();
    switch (lowerPattern) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'biweekly':
      case 'bi-weekly':
        return 'Bi-Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'none':
        return '';
      default:
        // If it's a numeric string, parse it
        const numericPattern = parseInt(pattern, 10);
        if (!isNaN(numericPattern)) {
          return getRecurrencePatternLabel(numericPattern);
        }
        return '';
    }
  }

  // Handle numeric enum values
  switch (pattern) {
    case RecurrencePattern.Daily:
    case 1:
      return 'Daily';
    case RecurrencePattern.Weekly:
    case 2:
      return 'Weekly';
    case RecurrencePattern.BiWeekly:
    case 3:
      return 'Bi-Weekly';
    case RecurrencePattern.Monthly:
    case 4:
      return 'Monthly';
    case RecurrencePattern.Yearly:
    case 5:
      return 'Yearly';
    case RecurrencePattern.None:
    case 0:
    default:
      return '';
  }
}

/**
 * Normalize a recurrence pattern to a numeric value
 * Handles both string and numeric values from API
 */
function normalizeRecurrencePattern(pattern: RecurrencePattern | string | number | undefined): number {
  if (pattern === undefined || pattern === null) {
    return RecurrencePattern.None;
  }

  if (typeof pattern === 'string') {
    const lowerPattern = pattern.toLowerCase();
    switch (lowerPattern) {
      case 'daily':
        return RecurrencePattern.Daily;
      case 'weekly':
        return RecurrencePattern.Weekly;
      case 'biweekly':
      case 'bi-weekly':
        return RecurrencePattern.BiWeekly;
      case 'monthly':
        return RecurrencePattern.Monthly;
      case 'yearly':
        return RecurrencePattern.Yearly;
      case 'none':
        return RecurrencePattern.None;
      default:
        const numericPattern = parseInt(pattern, 10);
        return isNaN(numericPattern) ? RecurrencePattern.None : numericPattern;
    }
  }

  return pattern as number;
}

/**
 * Convert app RecurrencePattern to expo-calendar RecurrenceRule
 * @param pattern - The app's recurrence pattern (string or number)
 * @param endDate - Optional end date for the recurring event
 * @returns RecurrenceRule object for expo-calendar, or null if not recurring
 */
export function getCalendarRecurrenceRule(
  pattern: RecurrencePattern | string | number | undefined,
  endDate?: string
): Calendar.RecurrenceRule | null {
  const normalizedPattern = normalizeRecurrencePattern(pattern);
  let frequency: Calendar.Frequency;
  let interval = 1;

  switch (normalizedPattern) {
    case RecurrencePattern.Daily:
      frequency = Calendar.Frequency.DAILY;
      break;
    case RecurrencePattern.Weekly:
      frequency = Calendar.Frequency.WEEKLY;
      break;
    case RecurrencePattern.BiWeekly:
      frequency = Calendar.Frequency.WEEKLY;
      interval = 2;
      break;
    case RecurrencePattern.Monthly:
      frequency = Calendar.Frequency.MONTHLY;
      break;
    case RecurrencePattern.Yearly:
      frequency = Calendar.Frequency.YEARLY;
      break;
    default:
      return null;
  }

  const rule: Calendar.RecurrenceRule = {
    frequency,
    interval,
  };

  // Add end date if provided
  if (endDate) {
    rule.endDate = new Date(endDate);
  }

  return rule;
}

/**
 * Format event date for display
 */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format event time for display
 */
export function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format full event date and time
 */
export function formatEventDateTime(
  startTime: string,
  endTime?: string,
  isAllDay?: boolean
): string {
  if (isAllDay) {
    return `${formatEventDate(startTime)} • All Day`;
  }

  const start = formatEventDate(startTime);
  const startTimeStr = formatEventTime(startTime);

  if (!endTime) {
    return `${start} at ${startTimeStr}`;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  // Same day
  if (startDate.toDateString() === endDate.toDateString()) {
    return `${start}, ${startTimeStr} - ${formatEventTime(endTime)}`;
  }

  // Multi-day
  return `${start} ${startTimeStr} - ${formatEventDate(endTime)} ${formatEventTime(endTime)}`;
}

/**
 * Normalize a date to midnight (start of day) in local time
 * This helps with date comparisons by ignoring time components
 */
function normalizeToMidnight(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Check if two dates are the same day (ignoring time)
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date1 is on or after date2 (comparing dates only, not times)
 */
function isDateOnOrAfter(date1: Date, date2: Date): boolean {
  const d1 = normalizeToMidnight(date1);
  const d2 = normalizeToMidnight(date2);
  return d1.getTime() >= d2.getTime();
}

/**
 * Check if an event occurs on a specific date (handles recurrence)
 * Handles both numeric and string recurrence patterns from API
 */
export function eventOccursOnDate(event: EventSummary, date: Date): boolean {
  const eventStart = new Date(event.StartTime);

  // Normalize the pattern to a number (handles string values from API)
  const normalizedPattern = normalizeRecurrencePattern(event.RecurrencePattern);

  // Non-recurring: exact date match
  if (!event.IsRecurring || normalizedPattern === RecurrencePattern.None) {
    return isSameDay(date, eventStart);
  }

  // Check if date is before event start
  if (!isDateOnOrAfter(date, eventStart)) {
    return false;
  }

  // Recurring events - check pattern match
  let matches = false;
  switch (normalizedPattern) {
    case RecurrencePattern.Daily:
      matches = true; // Every day after start
      break;
    case RecurrencePattern.Weekly:
      matches = date.getDay() === eventStart.getDay();
      break;
    case RecurrencePattern.BiWeekly: {
      // Calculate weeks difference from start date
      const startNormalized = normalizeToMidnight(eventStart);
      const dateNormalized = normalizeToMidnight(date);
      const diffMs = dateNormalized.getTime() - startNormalized.getTime();
      const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
      matches = date.getDay() === eventStart.getDay() && diffWeeks % 2 === 0;
      break;
    }
    case RecurrencePattern.Monthly:
      matches = date.getDate() === eventStart.getDate();
      break;
    case RecurrencePattern.Yearly:
      matches = date.getMonth() === eventStart.getMonth() && date.getDate() === eventStart.getDate();
      break;
    default:
      return false;
  }

  return matches;
}

/**
 * Get the next occurrence date for an event (from today or a given date)
 * For non-recurring events, returns the event start date if it's in the future, otherwise null
 * For recurring events, finds the next occurrence
 * @param event - The event to check
 * @param fromDate - The date to start searching from (defaults to today)
 * @param maxDaysToSearch - Maximum days to search ahead for recurring events (default 365)
 * @returns The next occurrence date, or null if no future occurrence exists
 */
export function getNextOccurrence(
  event: EventSummary,
  fromDate: Date = new Date(),
  maxDaysToSearch: number = 365
): Date | null {
  const eventStart = new Date(event.StartTime);
  const normalizedPattern = normalizeRecurrencePattern(event.RecurrencePattern);
  const from = normalizeToMidnight(fromDate);

  // Non-recurring: return start date if it's today or in the future
  if (!event.IsRecurring || normalizedPattern === RecurrencePattern.None) {
    const eventDateNormalized = normalizeToMidnight(eventStart);
    return eventDateNormalized >= from ? eventDateNormalized : null;
  }

  // Recurring events: find the next occurrence
  for (let i = 0; i < maxDaysToSearch; i++) {
    const checkDate = new Date(from);
    checkDate.setDate(from.getDate() + i);
    if (eventOccursOnDate(event, checkDate)) {
      return checkDate;
    }
  }

  return null;
}

/**
 * Get formatted location string from EventLocation
 */
export function formatEventLocation(
  location?: {
    Name?: string;
    Address?: string;
    City?: string;
    State?: string;
    ZipCode?: string;
  },
  locationName?: string
): string {
  if (!location && !locationName) return '';

  if (locationName && !location) return locationName;

  const parts: string[] = [];
  if (location?.Name) parts.push(location.Name);
  if (location?.Address) parts.push(location.Address);
  if (location?.City && location?.State) {
    parts.push(`${location.City}, ${location.State}${location.ZipCode ? ` ${location.ZipCode}` : ''}`);
  }

  return parts.join('\n');
}

