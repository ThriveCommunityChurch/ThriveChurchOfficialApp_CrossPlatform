/**
 * Playback Types
 * Data models for playback progress tracking feature
 */

/**
 * Represents saved playback progress for a sermon message
 * Used to resume playback from where the user left off
 */
export interface PlaybackProgress {
  /** The unique ID of the sermon message */
  messageId: string;
  /** Current playback position in seconds */
  positionSeconds: number;
  /** Total duration of the audio in seconds */
  durationSeconds: number;
  /** Timestamp when progress was last saved (epoch milliseconds) */
  updatedAt: number;
}

/**
 * Map of message IDs to their playback progress
 * Stored in AsyncStorage
 */
export interface PlaybackProgressMap {
  [messageId: string]: PlaybackProgress;
}

/** Minimum position (in seconds) to save - don't save if user only listened briefly */
export const MIN_POSITION_TO_SAVE = 30;

/** Threshold from end (in seconds) - clear progress if user is near the end */
export const END_THRESHOLD = 30;

/** Interval (in milliseconds) for periodic progress saves during playback */
export const PROGRESS_SAVE_INTERVAL_MS = 15000;

