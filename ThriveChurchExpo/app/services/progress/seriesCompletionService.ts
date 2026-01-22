/**
 * Series Completion Service
 * 
 * Handles tracking sermon message completion for series progress.
 * Integrates with the audio playback system to mark messages as completed
 * when the user listens to at least COMPLETION_THRESHOLD_PERCENT of the audio.
 */

import { useSeriesProgressStore } from '../../stores/seriesProgressStore';
import { COMPLETION_THRESHOLD_PERCENT } from '../../types/seriesProgress';

// Track which messages have already been marked complete this session
// to avoid redundant store updates
const completedThisSession = new Set<string>();

// Current series context for tracking
let currentSeriesId: string | null = null;
let currentMessageId: string | null = null;

/**
 * Set the current playback context for completion tracking
 * Call this when starting playback of a sermon message
 */
export const setCompletionContext = (seriesId: string | undefined, messageId: string): void => {
  currentSeriesId = seriesId ?? null;
  currentMessageId = messageId;
};

/**
 * Clear the current playback context
 * Call this when stopping playback
 */
export const clearCompletionContext = (): void => {
  currentSeriesId = null;
  currentMessageId = null;
};

/**
 * Check and mark message completion based on playback progress
 * Call this periodically during playback (e.g., during progress save)
 * 
 * @param messageId - The message being played
 * @param positionSeconds - Current playback position in seconds
 * @param durationSeconds - Total audio duration in seconds
 */
export const checkAndMarkCompletion = (
  messageId: string,
  positionSeconds: number,
  durationSeconds: number
): void => {
  // Skip if no valid context or already completed
  if (!currentSeriesId || !currentMessageId) {
    return;
  }

  // Skip if this isn't the current message
  if (messageId !== currentMessageId) {
    return;
  }

  // Skip if already marked completed this session
  const completionKey = `${currentSeriesId}:${messageId}`;
  if (completedThisSession.has(completionKey)) {
    return;
  }

  // Skip if duration is invalid
  if (durationSeconds <= 0) {
    return;
  }

  // Check if threshold is met
  const progressPercent = positionSeconds / durationSeconds;
  if (progressPercent >= COMPLETION_THRESHOLD_PERCENT) {
    // Mark as completed
    const store = useSeriesProgressStore.getState();
    
    // Only mark if not already in store
    if (!store.isMessageCompleted(currentSeriesId, messageId)) {
      console.log(`[SeriesCompletion] Marking message ${messageId} as completed (${Math.round(progressPercent * 100)}%)`);
      store.markMessageCompleted(currentSeriesId, messageId);
    }
    
    // Remember for this session to avoid repeat checks
    completedThisSession.add(completionKey);
  }
};

/**
 * Force mark a message as completed
 * Use this for manual completion or when completion should be immediate
 */
export const forceMarkCompleted = (seriesId: string, messageId: string): void => {
  const store = useSeriesProgressStore.getState();
  store.markMessageCompleted(seriesId, messageId);
  completedThisSession.add(`${seriesId}:${messageId}`);
};

/**
 * Check if a message is completed (from store, not session cache)
 */
export const isMessageCompleted = (seriesId: string, messageId: string): boolean => {
  const store = useSeriesProgressStore.getState();
  return store.isMessageCompleted(seriesId, messageId);
};

/**
 * Reset session cache (for testing or app restart)
 */
export const resetSessionCache = (): void => {
  completedThisSession.clear();
};

