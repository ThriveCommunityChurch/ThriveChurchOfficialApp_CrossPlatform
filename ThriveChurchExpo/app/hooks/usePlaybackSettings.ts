import { useState, useEffect, useCallback } from 'react';
import {
  PlaybackSettings,
  PlaybackSpeed,
  SkipInterval,
  getPlaybackSettings,
  updatePlaybackSetting,
  DEFAULT_PLAYBACK_SETTINGS,
} from '../services/playback/playbackSettings';
import { updatePlayerSkipIntervals, getCurrentSkipIntervals } from '../services/audio/trackPlayerService';

/**
 * Hook for accessing and managing playback settings
 * Provides easy access to skip intervals and playback speed settings
 * with automatic state management
 */
export const usePlaybackSettings = () => {
  const [settings, setSettings] = useState<PlaybackSettings>(DEFAULT_PLAYBACK_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedSettings = await getPlaybackSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading playback settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSkipForward = useCallback(async (value: SkipInterval) => {
    try {
      const updated = await updatePlaybackSetting('skipForwardInterval', value);
      setSettings(updated);
      await updatePlayerSkipIntervals(value, updated.skipBackwardInterval);
    } catch (error) {
      console.error('Error updating skip forward interval:', error);
    }
  }, []);

  const updateSkipBackward = useCallback(async (value: SkipInterval) => {
    try {
      const updated = await updatePlaybackSetting('skipBackwardInterval', value);
      setSettings(updated);
      await updatePlayerSkipIntervals(updated.skipForwardInterval, value);
    } catch (error) {
      console.error('Error updating skip backward interval:', error);
    }
  }, []);

  const updateDefaultSpeed = useCallback(async (value: PlaybackSpeed) => {
    try {
      const updated = await updatePlaybackSetting('defaultPlaybackSpeed', value);
      setSettings(updated);
    } catch (error) {
      console.error('Error updating default playback speed:', error);
    }
  }, []);

  return {
    settings,
    isLoading,
    skipForward: settings.skipForwardInterval,
    skipBackward: settings.skipBackwardInterval,
    defaultSpeed: settings.defaultPlaybackSpeed,
    updateSkipForward,
    updateSkipBackward,
    updateDefaultSpeed,
    refresh: loadSettings,
  };
};

/**
 * Lightweight hook for components that just need to read skip intervals
 * Does not trigger re-renders on settings changes (reads once)
 */
export const useSkipIntervals = () => {
  const [intervals, setIntervals] = useState<{ forward: SkipInterval; backward: SkipInterval }>({
    forward: 15,
    backward: 15,
  });

  useEffect(() => {
    const loadIntervals = async () => {
      try {
        const settings = await getPlaybackSettings();
        setIntervals({
          forward: settings.skipForwardInterval,
          backward: settings.skipBackwardInterval,
        });
      } catch (error) {
        console.error('Error loading skip intervals:', error);
      }
    };
    loadIntervals();
  }, []);

  return intervals;
};

/**
 * Get current skip intervals synchronously (uses cached values from TrackPlayer)
 * Useful for immediate access without async
 */
export const useCurrentSkipIntervals = () => {
  return getCurrentSkipIntervals();
};

export default usePlaybackSettings;

