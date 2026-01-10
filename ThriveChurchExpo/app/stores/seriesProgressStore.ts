/**
 * Series Progress Store
 * Zustand store for tracking sermon completion and series progress
 * Persists to AsyncStorage for local-only progress tracking
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SeriesProgressMap, SeriesCompletionData } from '../types/seriesProgress';

interface SeriesProgressState {
  // Data
  progress: SeriesProgressMap;

  // Actions
  markMessageCompleted: (seriesId: string, messageId: string) => void;
  isMessageCompleted: (seriesId: string, messageId: string) => boolean;
  getCompletedMessageIds: (seriesId: string) => string[];
  getSeriesCompletionData: (seriesId: string) => SeriesCompletionData | undefined;
  markSeriesCompleted: (seriesId: string) => void;
  resetSeriesProgress: (seriesId: string) => void;
  resetAllProgress: () => void;
}

export const useSeriesProgressStore = create<SeriesProgressState>()(
  persist(
    (set, get) => ({
      progress: {},

      markMessageCompleted: (seriesId: string, messageId: string) => {
        set((state) => {
          const existing = state.progress[seriesId];
          const now = Date.now();

          if (existing) {
            // Check if already completed
            if (existing.completedMessageIds.includes(messageId)) {
              return state; // No change needed
            }

            return {
              progress: {
                ...state.progress,
                [seriesId]: {
                  ...existing,
                  completedMessageIds: [...existing.completedMessageIds, messageId],
                },
              },
            };
          }

          // Create new entry for series
          return {
            progress: {
              ...state.progress,
              [seriesId]: {
                completedMessageIds: [messageId],
                startedAt: now,
              },
            },
          };
        });
      },

      isMessageCompleted: (seriesId: string, messageId: string) => {
        const { progress } = get();
        const seriesData = progress[seriesId];
        return seriesData?.completedMessageIds.includes(messageId) ?? false;
      },

      getCompletedMessageIds: (seriesId: string) => {
        const { progress } = get();
        return progress[seriesId]?.completedMessageIds ?? [];
      },

      getSeriesCompletionData: (seriesId: string) => {
        const { progress } = get();
        return progress[seriesId];
      },

      markSeriesCompleted: (seriesId: string) => {
        set((state) => {
          const existing = state.progress[seriesId];
          if (!existing || existing.completedAt) {
            return state; // No change needed
          }

          return {
            progress: {
              ...state.progress,
              [seriesId]: {
                ...existing,
                completedAt: Date.now(),
              },
            },
          };
        });
      },

      resetSeriesProgress: (seriesId: string) => {
        set((state) => {
          const { [seriesId]: _, ...rest } = state.progress;
          return { progress: rest };
        });
      },

      resetAllProgress: () => {
        set({ progress: {} });
      },
    }),
    {
      name: 'series-progress-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selector functions for convenience
export const selectSeriesProgress = (state: SeriesProgressState, seriesId: string) =>
  state.progress[seriesId];

export const selectCompletedCount = (state: SeriesProgressState, seriesId: string) =>
  state.progress[seriesId]?.completedMessageIds.length ?? 0;

