import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
  State,
} from 'react-native-track-player';
import { SermonMessage } from '../../types/api';
import { addToRecentlyPlayed } from '../storage/storage';

let isServiceInitialized = false;

export const setupPlayer = async (): Promise<void> => {
  if (isServiceInitialized) {
    return;
  }

  try {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
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
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.JumpForward,
        Capability.JumpBackward,
      ],
      progressUpdateEventInterval: 1,
      // Set jump intervals to 15 seconds
      forwardJumpInterval: 15,
      backwardJumpInterval: 15,
    });

    isServiceInitialized = true;
    console.log('Track Player initialized successfully');
  } catch (error) {
    console.error('Error setting up Track Player:', error);
    throw error;
  }
};

export const playbackService = async (): Promise<void> => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => {
    TrackPlayer.seekTo(position);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpForward, async ({ interval }) => {
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(position + (interval || 15));
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async ({ interval }) => {
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(Math.max(0, position - (interval || 15)));
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

    // Reset the player
    await TrackPlayer.reset();

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

    // Add to recently played
    await addToRecentlyPlayed(message, seriesArt || message.seriesArt);

    // TODO: Mark message as played via API
    console.log('Playing audio:', message.Title);
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};

export const pauseAudio = async (): Promise<void> => {
  try {
    await TrackPlayer.pause();
  } catch (error) {
    console.error('Error pausing audio:', error);
  }
};

export const resumeAudio = async (): Promise<void> => {
  try {
    await TrackPlayer.play();
  } catch (error) {
    console.error('Error resuming audio:', error);
  }
};

export const stopAudio = async (): Promise<void> => {
  try {
    await TrackPlayer.stop();
    await TrackPlayer.reset();
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
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(position + seconds);
  } catch (error) {
    console.error('Error skipping forward:', error);
  }
};

export const skipBackward = async (seconds: number = 15): Promise<void> => {
  try {
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(Math.max(0, position - seconds));
  } catch (error) {
    console.error('Error skipping backward:', error);
  }
};

export const getPlaybackState = async (): Promise<State> => {
  try {
    const state = await TrackPlayer.getState();
    return state;
  } catch (error) {
    console.error('Error getting playback state:', error);
    return State.None;
  }
};

export const getCurrentTrack = async () => {
  try {
    const trackIndex = await TrackPlayer.getCurrentTrack();
    if (trackIndex !== null) {
      const track = await TrackPlayer.getTrack(trackIndex);
      return track;
    }
    return null;
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

