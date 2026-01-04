import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
  State,
} from 'react-native-track-player';
import { SermonMessage } from '../../types/api';
import { addToRecentlyPlayed, savePlaybackProgress, getPlaybackProgressForMessage, clearPlaybackProgress } from '../storage/storage';
import { markMessageAsPlayed } from '../api/messagePlayedService';
import { MIN_POSITION_TO_SAVE, END_THRESHOLD, PROGRESS_SAVE_INTERVAL_MS } from '../../types/playback';
import { getPlaybackSettings, type SkipInterval } from '../playback/playbackSettings';

let isServiceInitialized = false;
let currentMessageId: string | null = null;
let progressSaveInterval: ReturnType<typeof setInterval> | null = null;
// Track current skip intervals for lock screen
let currentSkipForward: SkipInterval = 15;
let currentSkipBackward: SkipInterval = 15;

export const setupPlayer = async (): Promise<void> => {
  if (isServiceInitialized) {
    return;
  }

  try {
    // Load saved skip intervals from settings
    const settings = await getPlaybackSettings();
    currentSkipForward = settings.skipForwardInterval;
    currentSkipBackward = settings.skipBackwardInterval;

    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
      // Ensure audio plays through media stream at proper volume
      androidAudioContentType: 2, // CONTENT_TYPE_MUSIC
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SeekTo,
        Capability.JumpForward,
        Capability.JumpBackward,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.JumpForward,
        Capability.JumpBackward,
      ],
      progressUpdateEventInterval: 1,
      // Set jump intervals from user settings (affects lock screen controls)
      forwardJumpInterval: currentSkipForward,
      backwardJumpInterval: currentSkipBackward,
    });

    isServiceInitialized = true;
    console.log(`Track Player initialized with skip intervals: forward=${currentSkipForward}s, backward=${currentSkipBackward}s`);
  } catch (error) {
    // Handle case where player was already initialized (e.g., after hot reload)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('already been initialized')) {
      isServiceInitialized = true;
      console.log('Track Player was already initialized');
      return;
    }
    console.error('Error setting up Track Player:', error);
    throw error;
  }
};

/**
 * Update skip intervals for lock screen controls
 * Call this when user changes settings
 */
export const updatePlayerSkipIntervals = async (
  forward: SkipInterval,
  backward: SkipInterval
): Promise<void> => {
  try {
    currentSkipForward = forward;
    currentSkipBackward = backward;

    await TrackPlayer.updateOptions({
      forwardJumpInterval: forward,
      backwardJumpInterval: backward,
    });

    console.log(`Updated skip intervals: forward=${forward}s, backward=${backward}s`);
  } catch (error) {
    console.error('Error updating skip intervals:', error);
  }
};

/**
 * Get current skip intervals
 */
export const getCurrentSkipIntervals = (): { forward: SkipInterval; backward: SkipInterval } => {
  return {
    forward: currentSkipForward,
    backward: currentSkipBackward,
  };
};

/**
 * Save current playback progress if a track is playing
 */
const saveCurrentProgress = async (): Promise<void> => {
  if (!currentMessageId) return;

  try {
    const progress = await TrackPlayer.getProgress();
    if (progress.position > 0 && progress.duration > 0) {
      await savePlaybackProgress(currentMessageId, progress.position, progress.duration);
    }
  } catch (error) {
    console.warn('Error saving playback progress:', error);
  }
};

/**
 * Start periodic progress saving while playing
 */
const startProgressSaving = (): void => {
  stopProgressSaving();
  progressSaveInterval = setInterval(saveCurrentProgress, PROGRESS_SAVE_INTERVAL_MS);
};

/**
 * Stop periodic progress saving
 */
const stopProgressSaving = (): void => {
  if (progressSaveInterval) {
    clearInterval(progressSaveInterval);
    progressSaveInterval = null;
  }
};

export const playbackService = async (): Promise<void> => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
    startProgressSaving();
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    await saveCurrentProgress();
    stopProgressSaving();
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    await saveCurrentProgress();
    stopProgressSaving();
    TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => {
    TrackPlayer.seekTo(position);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpForward, async ({ interval }) => {
    const progress = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(progress.position + (interval || 15));
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async ({ interval }) => {
    const progress = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(Math.max(0, progress.position - (interval || 15)));
  });

  // Handle playback state changes
  TrackPlayer.addEventListener(Event.PlaybackState, async (event) => {
    if (event.state === State.Playing) {
      startProgressSaving();
    } else if (event.state === State.Paused || event.state === State.Stopped) {
      await saveCurrentProgress();
      stopProgressSaving();
    }
  });
};

export interface PlayAudioOptions {
  message: SermonMessage;
  seriesTitle?: string;
  seriesArt?: string;
  isLocal?: boolean;
}

export const playAudio = async (options: PlayAudioOptions): Promise<void> => {
  const { message, seriesTitle, seriesArt, isLocal = false } = options;

  try {
    // Ensure player is set up
    await setupPlayer();

    // Determine the audio URL
    const audioUrl = isLocal && message.LocalAudioURI
      ? message.LocalAudioURI
      : message.AudioUrl;

    if (!audioUrl) {
      throw new Error('No audio URL available');
    }

    // Stop progress saving for previous track if any
    stopProgressSaving();

    // Reset the player
    await TrackPlayer.reset();

    // Set current message ID for progress tracking
    currentMessageId = message.MessageId;

    // Check for saved progress
    const savedProgress = await getPlaybackProgressForMessage(message.MessageId);

    // Add track to player with extended metadata
    await TrackPlayer.add({
      id: message.MessageId,
      url: audioUrl,
      title: message.Title,
      artist: message.Speaker,
      artwork: seriesArt || message.seriesArt,
      duration: message.AudioDuration,
      date: message.Date,
      description: `${seriesTitle || message.seriesTitle || 'Sermon'} - Week ${message.WeekNum || ''}`,
      // Custom metadata fields for NowPlayingScreen
      seriesTitle: seriesTitle || message.seriesTitle,
      weekNum: message.WeekNum,
      audioFileSize: message.AudioFileSize,
      passageRef: message.PassageRef,
    } as any); // Use 'as any' to allow custom fields beyond Track type

    // Start playback
    await TrackPlayer.play();

    // Resume from saved position if available
    // Only resume if position is meaningful (> MIN_POSITION_TO_SAVE and not too close to end)
    if (savedProgress) {
      const { positionSeconds, durationSeconds } = savedProgress;
      const timeRemaining = durationSeconds - positionSeconds;

      if (positionSeconds >= MIN_POSITION_TO_SAVE && timeRemaining > END_THRESHOLD) {
        console.log(`Resuming playback at ${positionSeconds}s (saved progress)`);
        await TrackPlayer.seekTo(positionSeconds);
      } else {
        // Clear progress if it's too close to the start or end
        await clearPlaybackProgress(message.MessageId);
      }
    }

    // Start periodic progress saving
    startProgressSaving();

    // Add to recently played
    await addToRecentlyPlayed(message, seriesArt || message.seriesArt);

    // Mark message as played via API (fire and forget - don't block playback)
    markMessageAsPlayed(message.MessageId).catch(err => {
      // Error already logged in markMessageAsPlayed, this is just extra safety
      console.warn('[TrackPlayer] Failed to mark message as played:', err);
    });

    console.log('Playing audio:', message.Title);
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};

export const pauseAudio = async (): Promise<void> => {
  try {
    await saveCurrentProgress();
    stopProgressSaving();
    await TrackPlayer.pause();
  } catch (error) {
    console.error('Error pausing audio:', error);
  }
};

export const resumeAudio = async (): Promise<void> => {
  try {
    await TrackPlayer.play();
    startProgressSaving();
  } catch (error) {
    console.error('Error resuming audio:', error);
  }
};

export const stopAudio = async (): Promise<void> => {
  try {
    await saveCurrentProgress();
    stopProgressSaving();
    await TrackPlayer.stop();
    await TrackPlayer.reset();
    currentMessageId = null;
  } catch (error) {
    console.error('Error stopping audio:', error);
  }
};

export const seekTo = async (position: number): Promise<void> => {
  try {
    await TrackPlayer.seekTo(position);
  } catch (error) {
    console.error('Error seeking:', error);
  }
};

export const skipForward = async (seconds: number = 15): Promise<void> => {
  try {
    const progress = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(progress.position + seconds);
  } catch (error) {
    console.error('Error skipping forward:', error);
  }
};

export const skipBackward = async (seconds: number = 15): Promise<void> => {
  try {
    const progress = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(Math.max(0, progress.position - seconds));
  } catch (error) {
    console.error('Error skipping backward:', error);
  }
};

export const getPlaybackState = async (): Promise<State> => {
  try {
    const playbackState = await TrackPlayer.getPlaybackState();
    return playbackState.state;
  } catch (error) {
    console.error('Error getting playback state:', error);
    return State.None;
  }
};

export const getCurrentTrack = async () => {
  try {
    const track = await TrackPlayer.getActiveTrack();
    return track || null;
  } catch (error) {
    console.error('Error getting current track:', error);
    return null;
  }
};

export const getProgress = async () => {
  try {
    const progress = await TrackPlayer.getProgress();
    return progress;
  } catch (error) {
    console.error('Error getting progress:', error);
    return { position: 0, duration: 0, buffered: 0 };
  }
};

export const setRepeatMode = async (mode: RepeatMode): Promise<void> => {
  try {
    await TrackPlayer.setRepeatMode(mode);
  } catch (error) {
    console.error('Error setting repeat mode:', error);
  }
};

// Queue management for series playback
export const addToQueue = async (messages: SermonMessage[], seriesArt?: string): Promise<void> => {
  try {
    const tracks = messages.map(message => ({
      id: message.MessageId,
      url: message.LocalAudioURI || message.AudioUrl || '',
      title: message.Title,
      artist: message.Speaker,
      artwork: seriesArt || message.seriesArt,
      duration: message.AudioDuration,
      date: message.Date,
    }));

    await TrackPlayer.add(tracks);
  } catch (error) {
    console.error('Error adding to queue:', error);
  }
};

export const clearQueue = async (): Promise<void> => {
  try {
    await TrackPlayer.reset();
  } catch (error) {
    console.error('Error clearing queue:', error);
  }
};

export const getQueue = async () => {
  try {
    const queue = await TrackPlayer.getQueue();
    return queue;
  } catch (error) {
    console.error('Error getting queue:', error);
    return [];
  }
};

