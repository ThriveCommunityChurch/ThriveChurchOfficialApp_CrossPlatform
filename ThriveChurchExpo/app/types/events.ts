/**
 * Events Type Definitions
 * Types for Events feature matching API responses
 */

/**
 * Recurrence pattern for recurring events
 * Matches API enum values
 */
export enum RecurrencePattern {
  None = 0,
  Daily = 1,
  Weekly = 2,
  BiWeekly = 3,
  Monthly = 4,
  Yearly = 5,
}

/**
 * Event location details for physical events
 */
export interface EventLocation {
  Name?: string;
  Address?: string;
  City?: string;
  State?: string;
  ZipCode?: string;
  Latitude?: number;
  Longitude?: number;
}

/**
 * Event recurrence configuration
 */
export interface EventRecurrence {
  Pattern: RecurrencePattern;
  Interval: number;
  DayOfWeek?: number; // 0 = Sunday, 6 = Saturday
  DayOfMonth?: number; // 1-31
  EndDate?: string; // ISO date string
}

/**
 * Event summary returned by GET /api/Events (list view)
 * Uses PascalCase to match API response format
 */
export interface EventSummary {
  Id: string;
  Title: string;
  Summary: string;
  StartTime: string; // ISO date string
  EndTime?: string;
  IsAllDay: boolean;
  IsRecurring: boolean;
  RecurrencePattern: RecurrencePattern;
  IsOnline: boolean;
  LocationName?: string;
  IsFeatured: boolean;
  IsActive: boolean;
  ThumbnailUrl?: string;
  IconName?: string;
}

/**
 * Full event details returned by GET /api/Events/{id}
 */
export interface Event extends EventSummary {
  Description?: string;
  ImageUrl?: string;
  Recurrence?: EventRecurrence;
  OnlineLink?: string;
  OnlinePlatform?: string;
  Location?: EventLocation;
  ContactEmail?: string;
  ContactPhone?: string;
  RegistrationUrl?: string;
  Tags?: string[];
  CreatedAt: string;
  UpdatedAt: string;
}

/**
 * API Response for all events
 */
export interface AllEventsResponse {
  Events: EventSummary[];
  TotalCount?: number;
  HasErrors: boolean;
  ErrorMessage?: string | null;
}

/**
 * API Response for single event
 */
export interface EventResponse {
  Event: Event;
  HasErrors: boolean;
  ErrorMessage?: string | null;
}

/**
 * Calendar day structure for calendar view
 */
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  events: EventSummary[];
}

/**
 * Route params for event detail screen
 */
export interface EventDetailRouteParams {
  eventId: string;
  eventTitle?: string;
}

