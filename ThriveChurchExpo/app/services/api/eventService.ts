/**
 * Event Service
 * Fetches event data from backend API
 */

import { api } from './client';
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
 */
export function getRecurrencePatternLabel(pattern: RecurrencePattern): string {
  switch (pattern) {
    case RecurrencePattern.Daily:
      return 'Daily';
    case RecurrencePattern.Weekly:
      return 'Weekly';
    case RecurrencePattern.BiWeekly:
      return 'Bi-Weekly';
    case RecurrencePattern.Monthly:
      return 'Monthly';
    case RecurrencePattern.Yearly:
      return 'Yearly';
    default:
      return '';
  }
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
 * Check if an event occurs on a specific date (handles recurrence)
 */
export function eventOccursOnDate(event: EventSummary, date: Date): boolean {
  const eventStart = new Date(event.StartTime);

  // Non-recurring: exact date match
  if (!event.IsRecurring || event.RecurrencePattern === RecurrencePattern.None) {
    return (
      date.getFullYear() === eventStart.getFullYear() &&
      date.getMonth() === eventStart.getMonth() &&
      date.getDate() === eventStart.getDate()
    );
  }

  // Recurring events
  switch (event.RecurrencePattern) {
    case RecurrencePattern.Daily:
      return date >= eventStart;
    case RecurrencePattern.Weekly:
      return date.getDay() === eventStart.getDay() && date >= eventStart;
    case RecurrencePattern.BiWeekly: {
      const diffWeeks = Math.floor(
        (date.getTime() - eventStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      return date.getDay() === eventStart.getDay() && diffWeeks % 2 === 0 && date >= eventStart;
    }
    case RecurrencePattern.Monthly:
      return date.getDate() === eventStart.getDate() && date >= eventStart;
    case RecurrencePattern.Yearly:
      return (
        date.getMonth() === eventStart.getMonth() &&
        date.getDate() === eventStart.getDate() &&
        date >= eventStart
      );
    default:
      return false;
  }
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

