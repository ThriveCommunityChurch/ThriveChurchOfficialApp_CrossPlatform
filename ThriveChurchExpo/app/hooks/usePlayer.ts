import { useState, useEffect, useCallback } from 'react';
import TrackPlayer, { 
  State, 
  Event, 
  useTrackPlayerEvents,
  useProgress as useTrackPlayerProgress,
  Track,
} from 'react-native-track-player';
import {
  setupPlayer,
  playAudio,
  pauseAudio,
  resumeAudio,
  stopAudio,
  seekTo,
  skipForward,
  skipBackward,
  PlayAudioOptions,
} from '../services/audio/trackPlayerService';

export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  isLoading: boolean;
  currentTrack: Track | null;
  position: number;
  duration: number;
  buffered: number;
}

export const usePlayer = () => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isPaused: false,
    isStopped: true,
    isLoading: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    buffered: 0,
  });

  const progress = useTrackPlayerProgress();

  // Update progress in state
  useEffect(() => {
    setPlayerState(prev => ({
      ...prev,
      position: progress.position,
      duration: progress.duration,
      buffered: progress.buffered,
    }));
  }, [progress]);

  // Listen to playback state changes
  useTrackPlayerEvents([Event.PlaybackState], async (event) => {
    const state = event.state;
    
    setPlayerState(prev => ({
      ...prev,
      isPlaying: state === State.Playing,
      isPaused: state === State.Paused,
      isStopped: state === State.Stopped || state === State.None,
      isLoading: state === State.Buffering || state === State.Loading,
    }));
  });

  // Listen to track changes
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async () => {
    const track = await TrackPlayer.getActiveTrack();
    setPlayerState(prev => ({
      ...prev,
      currentTrack: track || null,
    }));
  });

  // Load current track on mount
  useEffect(() => {
    const loadCurrentTrack = async () => {
      try {
        // Ensure player is set up before accessing it
        await setupPlayer();

        const track = await TrackPlayer.getActiveTrack();
        const playbackState = await TrackPlayer.getPlaybackState();
        const state = playbackState.state;

        setPlayerState(prev => ({
          ...prev,
          currentTrack: track || null,
          isPlaying: state === State.Playing,
          isPaused: state === State.Paused,
          isStopped: state === State.Stopped || state === State.None,
          isLoading: state === State.Buffering || state === State.Loading,
        }));
      } catch (error) {
        console.error('Error loading current track:', error);
      }
    };

    loadCurrentTrack();
  }, []);

  const play = useCallback(async (options: PlayAudioOptions) => {
    try {
      await playAudio(options);
    } catch (error) {
      console.error('Error in play:', error);
      throw error;
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await pauseAudio();
    } catch (error) {
      console.error('Error in pause:', error);
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      await resumeAudio();
    } catch (error) {
      console.error('Error in resume:', error);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await stopAudio();
    } catch (error) {
      console.error('Error in stop:', error);
    }
  }, []);

  const seek = useCallback(async (position: number) => {
    try {
      await seekTo(position);
    } catch (error) {
      console.error('Error in seek:', error);
    }
  }, []);

  const forward = useCallback(async (seconds: number = 15) => {
    try {
      await skipForward(seconds);
    } catch (error) {
      console.error('Error in forward:', error);
    }
  }, []);

  const backward = useCallback(async (seconds: number = 15) => {
    try {
      await skipBackward(seconds);
    } catch (error) {
      console.error('Error in backward:', error);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (playerState.isPlaying) {
      await pause();
    } else if (playerState.isPaused) {
      await resume();
    }
  }, [playerState.isPlaying, playerState.isPaused, pause, resume]);

  return {
    ...playerState,
    play,
    pause,
    resume,
    stop,
    seek,
    forward,
    backward,
    togglePlayPause,
  };
};

