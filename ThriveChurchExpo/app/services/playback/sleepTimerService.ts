import TrackPlayer, { Event, State } from 'react-native-track-player';
import { logInfo, logWarning } from '../logging/logger';

type SleepTimerValue = number | 'endOfEpisode' | null;

interface SleepTimerState {
  value: SleepTimerValue;
  remainingMinutes: number | null;
  endAt: number | null;
  targetTrackId: string | null;
}

const initialState: SleepTimerState = {
  value: null,
  remainingMinutes: null,
  endAt: null,
  targetTrackId: null,
};

let state = { ...initialState };
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let listeners: Set<(state: SleepTimerState) => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...state }));
}

function clearTimer() {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  state.endAt = null;
}

function updateRemainingMinutes() {
  if (state.endAt) {
    const remainingMs = state.endAt - Date.now();
    state.remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
  } else {
    state.remainingMinutes = null;
  }
}

export const sleepTimerService = {
  subscribe: (listener: (state: SleepTimerState) => void) => {
    listeners.add(listener);
    listener({ ...state });
    return () => {
      listeners.delete(listener);
    };
  },

  getState: (): SleepTimerState => ({ ...state }),

  setTimer: async (value: SleepTimerValue, currentTrackId: string | null) => {
    clearTimer();

    if (value === null) {
      state = { ...initialState };
      notifyListeners();
      return;
    }

    if (value === 'endOfEpisode') {
      state = {
        ...initialState,
        value: 'endOfEpisode',
        targetTrackId: currentTrackId,
      };
      notifyListeners();
      return;
    }

    const durationMs = value * 60 * 1000;
    state = {
      ...initialState,
      value,
      remainingMinutes: value,
      endAt: Date.now() + durationMs,
    };

    timeoutId = setTimeout(async () => {
      try {
        await TrackPlayer.pause();
        await logInfo('Sleep timer paused playback');
      } catch (err) {
        await logWarning(`Error pausing for sleep timer: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      sleepTimerService.clear();
    }, durationMs);

    intervalId = setInterval(() => {
      updateRemainingMinutes();
      notifyListeners();
    }, 30000);

    notifyListeners();
  },

  clear: () => {
    clearTimer();
    state = { ...initialState };
    notifyListeners();
  },

  // Call when track changes to check if endOfEpisode timer should trigger
  onTrackChange: async (newTrackId: string | null) => {
    if (state.value === 'endOfEpisode' && state.targetTrackId && state.targetTrackId !== newTrackId) {
      try {
        await TrackPlayer.pause();
        await logInfo('End-of-episode sleep timer paused playback');
      } catch (err) {
        await logWarning(`Error pausing for end-of-episode timer: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      sleepTimerService.clear();
    }
  },

  // Call when queue ends to handle endOfEpisode
  onQueueEnded: async () => {
    if (state.value === 'endOfEpisode') {
      try {
        await TrackPlayer.pause();
        await logInfo('End-of-episode sleep timer (queue ended) paused playback');
      } catch (err) {
        await logWarning(`Error pausing for end-of-episode timer: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      sleepTimerService.clear();
    }
  },
};

export type { SleepTimerValue, SleepTimerState };