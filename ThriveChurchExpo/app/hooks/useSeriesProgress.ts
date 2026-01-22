/**
 * useSeriesProgress Hook
 *
 * Provides series progress information for a given series.
 * Calculates completion percentage, determines eligibility, and provides
 * helper data for UI display.
 */

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useSeriesProgressStore } from '../stores/seriesProgressStore';
import { useShallow } from 'zustand/react/shallow';
import {
  SeriesProgressInfo,
  isSeriesEligibleForProgress,
  COMPLETION_THRESHOLD_PERCENT,
} from '../types/seriesProgress';
import type { SermonSeries } from '../types/api';
import type { PlaybackProgressMap } from '../types/playback';
import { getPlaybackProgressMap } from '../services/storage/storage';

// Stable empty array reference to prevent infinite re-renders
const EMPTY_ARRAY: string[] = [];

interface UseSeriesProgressOptions {
  /** The full series object */
  series: SermonSeries | null | undefined;
}

interface UseSeriesProgressReturn extends SeriesProgressInfo {
  /** Mark a message as completed */
  markCompleted: (messageId: string) => void;
  /** Check if a specific message is completed */
  isMessageCompleted: (messageId: string) => boolean;
  /** Reset progress for this series */
  resetProgress: () => void;
}

/**
 * Hook for accessing and managing series progress
 *
 * @example
 * ```tsx
 * const { percentage, isCompleted, showProgress, markCompleted } = useSeriesProgress({ series });
 *
 * if (showProgress) {
 *   return <ProgressBar percentage={percentage} />;
 * }
 * ```
 */
export const useSeriesProgress = ({ series }: UseSeriesProgressOptions): UseSeriesProgressReturn => {
	const seriesId = series?.Id;

	// Local cached playback progress map so we can include partial listening
	// time (seconds played) when calculating series progress percentage.
	const [playbackProgressMap, setPlaybackProgressMap] = useState<PlaybackProgressMap>({});

	// Load playback progress once so that series progress can reflect
	// partially listened messages, not just fully completed ones.
	useEffect(() => {
		let isMounted = true;

		const loadProgress = async () => {
			try {
				const map = await getPlaybackProgressMap();
				if (isMounted) {
					setPlaybackProgressMap(map);
				}
			} catch (error) {
				if (isMounted) {
					console.warn('[SeriesProgress] Failed to load playback progress map', error);
					setPlaybackProgressMap({});
				}
			}
		};

		loadProgress();

		return () => {
			isMounted = false;
		};
	}, []);

	// Get store actions (these are stable references)
  const markMessageCompleted = useSeriesProgressStore((state) => state.markMessageCompleted);
  const checkMessageCompleted = useSeriesProgressStore((state) => state.isMessageCompleted);
  const resetSeriesProgress = useSeriesProgressStore((state) => state.resetSeriesProgress);
  const markSeriesCompleted = useSeriesProgressStore((state) => state.markSeriesCompleted);

  // Get completed IDs with shallow comparison to prevent unnecessary re-renders
  const completedIds = useSeriesProgressStore(
    useShallow((state) => {
      if (!seriesId) return EMPTY_ARRAY;
      return state.progress[seriesId]?.completedMessageIds ?? EMPTY_ARRAY;
    })
  );

	const progressInfo = useMemo((): SeriesProgressInfo => {
    // Check eligibility first
    const showProgress = series
      ? isSeriesEligibleForProgress(series.StartDate, series.EndDate, series.Slug)
      : false;

    if (!showProgress || !series) {
      return {
        completedCount: 0,
        totalCount: 0,
        percentage: 0,
        isCompleted: false,
        showProgress: false,
        nextMessageId: undefined,
      };
    }

		const messages = series.Messages ?? [];
		const totalCount = messages.length;
		const completedCount = completedIds.length;

		// Calculate fractional progress based on seconds listened per message.
		// Each message contributes between 0 and 1. Completed messages always
		// count as 1 so that stored completion state remains the source of truth
		// for full credit.
		let accumulatedProgress = 0;

		if (totalCount > 0) {
			for (const message of messages) {
				const messageId = message.MessageId;

				// If the message is already marked completed in the store, treat it
				// as fully complete regardless of any saved playback snapshot.
				if (completedIds.includes(messageId)) {
					accumulatedProgress += 1;
					continue;
				}

				const playback = playbackProgressMap[messageId];
				if (!playback || playback.durationSeconds <= 0) {
					continue;
				}

				const rawFraction = playback.positionSeconds / playback.durationSeconds;
				const clampedFraction = Math.max(0, Math.min(1, rawFraction));

				// Once the user crosses the completion threshold for this message,
				// treat it as fully complete for the purposes of the series
				// percentage so progress feels responsive.
				const effectiveFraction =
					clampedFraction >= COMPLETION_THRESHOLD_PERCENT ? 1 : clampedFraction;

				accumulatedProgress += effectiveFraction;
			}
		}

		const percentage =
			totalCount > 0 ? Math.round((accumulatedProgress / totalCount) * 100) : 0;
		const isCompleted = totalCount > 0 && completedCount >= totalCount;

    // Find next incomplete message (first one not in completed list)
    const nextMessage = messages.find((msg) => !completedIds.includes(msg.MessageId));

		return {
		  completedCount,
		  totalCount,
		  percentage,
		  isCompleted,
		  showProgress,
		  nextMessageId: nextMessage?.MessageId,
		};
	}, [series, completedIds, playbackProgressMap]);

  // Action handlers - memoized to prevent unnecessary re-renders
  const markCompleted = useCallback((messageId: string) => {
    if (!seriesId) return;
    markMessageCompleted(seriesId, messageId);

    // Check if series is now complete
    const messages = series?.Messages ?? [];
    const newCompletedIds = [...completedIds, messageId];
    const uniqueCompleted = new Set(newCompletedIds);
    if (messages.length > 0 && uniqueCompleted.size >= messages.length) {
      markSeriesCompleted(seriesId);
    }
  }, [seriesId, markMessageCompleted, markSeriesCompleted, series?.Messages, completedIds]);

  const isMessageCompleted = useCallback((messageId: string) => {
    if (!seriesId) return false;
    return checkMessageCompleted(seriesId, messageId);
  }, [seriesId, checkMessageCompleted]);

  const resetProgress = useCallback(() => {
    if (!seriesId) return;
    resetSeriesProgress(seriesId);
  }, [seriesId, resetSeriesProgress]);

  return {
    ...progressInfo,
    markCompleted,
    isMessageCompleted,
    resetProgress,
  };
};

/**
 * Lightweight hook for just checking if a series shows progress
 * Use this when you only need to conditionally render progress UI
 */
export const useShowSeriesProgress = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  slug: string | null | undefined
): boolean => {
  return useMemo(
    () => isSeriesEligibleForProgress(startDate, endDate, slug),
    [startDate, endDate, slug]
  );
};

