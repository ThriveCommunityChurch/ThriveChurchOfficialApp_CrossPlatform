/**
 * Series Progress Types
 * Data models for tracking sermon completion and series progress
 */

/**
 * Represents completion data for a single series
 */
export interface SeriesCompletionData {
	/** Set of message IDs that have been completed (listened to most of the message) */
	completedMessageIds: string[];
  /** Timestamp when the series was first started */
  startedAt: number;
  /** Timestamp when the series was completed (all messages listened) */
  completedAt?: number;
}

/**
 * Map of series IDs to their completion data
 */
export interface SeriesProgressMap {
  [seriesId: string]: SeriesCompletionData;
}

/**
 * Progress info for a specific series
 */
export interface SeriesProgressInfo {
  /** Number of messages completed */
  completedCount: number;
  /** Total number of messages in the series */
  totalCount: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Whether the series is fully completed */
  isCompleted: boolean;
  /** Whether progress should be shown for this series */
  showProgress: boolean;
  /** The next message to continue with (first incomplete) */
  nextMessageId?: string;
}

/**
	 * Threshold fraction for marking a message as completed.
	 * User must listen to at least this fraction of the audio duration.
	 *
	 * Example: 0.7 = 70% of the message must be played before it is
	 * counted as completed for series progress.
	 */
export const COMPLETION_THRESHOLD_PERCENT = 0.7;

/**
 * Slug for the guest speakers series (excluded from progress tracking)
 */
export const GUEST_SPEAKERS_SLUG = 'guest-speakers';

/**
 * Check if a series is eligible for progress tracking
 * @param startDate - Series start date
 * @param endDate - Series end date (null/undefined for current series)
 * @param slug - Series slug
 * @returns true if series should show progress
 */
export const isSeriesEligibleForProgress = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  slug: string | null | undefined
): boolean => {
  // Must have both start and end date (past series)
  const isPastSeries = !!startDate && !!endDate;
  // Must not be guest speakers series
  const isGuestSpeakers = slug === GUEST_SPEAKERS_SLUG;
  
  return isPastSeries && !isGuestSpeakers;
};

