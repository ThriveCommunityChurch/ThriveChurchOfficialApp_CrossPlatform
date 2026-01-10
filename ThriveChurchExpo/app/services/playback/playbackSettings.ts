import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for playback settings
export const PLAYBACK_SETTINGS_KEY = 'playbackSettings';

// Skip interval options (in seconds)
export type SkipInterval = 10 | 15 | 30;

// Playback speed options
export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

// Types
export interface PlaybackSettings {
  skipForwardInterval: SkipInterval;    // Seconds to skip forward
  skipBackwardInterval: SkipInterval;   // Seconds to skip backward
  defaultPlaybackSpeed: PlaybackSpeed;  // Default playback speed (can be overridden in player)
}

// Default settings
export const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettings = {
  skipForwardInterval: 15,
  skipBackwardInterval: 15,
  defaultPlaybackSpeed: 1,
};

// Skip interval options for picker UI
export const SKIP_INTERVAL_OPTIONS: { label: string; value: SkipInterval }[] = [
  { label: '10 seconds', value: 10 },
  { label: '15 seconds', value: 15 },
  { label: '30 seconds', value: 30 },
];

// Playback speed options for picker UI
export const PLAYBACK_SPEED_OPTIONS: { label: string; value: PlaybackSpeed }[] = [
  { label: '0.5×', value: 0.5 },
  { label: '0.75×', value: 0.75 },
  { label: '1× (Normal)', value: 1 },
  { label: '1.25×', value: 1.25 },
  { label: '1.5×', value: 1.5 },
  { label: '1.75×', value: 1.75 },
  { label: '2×', value: 2 },
];

/**
 * Get playback settings from storage
 * Returns default settings if none are saved or on error
 */
export const getPlaybackSettings = async (): Promise<PlaybackSettings> => {
  try {
    const data = await AsyncStorage.getItem(PLAYBACK_SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults to handle any new settings added in updates
      return { ...DEFAULT_PLAYBACK_SETTINGS, ...parsed };
    }
    return DEFAULT_PLAYBACK_SETTINGS;
  } catch (error) {
    console.error('Error reading playback settings:', error);
    return DEFAULT_PLAYBACK_SETTINGS;
  }
};

/**
 * Save complete playback settings to storage
 */
export const savePlaybackSettings = async (settings: PlaybackSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(PLAYBACK_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving playback settings:', error);
    throw error;
  }
};

/**
 * Update a single playback setting
 * Returns the updated settings object
 */
export const updatePlaybackSetting = async <K extends keyof PlaybackSettings>(
  key: K,
  value: PlaybackSettings[K]
): Promise<PlaybackSettings> => {
  const current = await getPlaybackSettings();
  const updated = { ...current, [key]: value };
  await savePlaybackSettings(updated);
  return updated;
};

/**
 * Reset playback settings to defaults
 */
export const resetPlaybackSettings = async (): Promise<PlaybackSettings> => {
  await savePlaybackSettings(DEFAULT_PLAYBACK_SETTINGS);
  return DEFAULT_PLAYBACK_SETTINGS;
};

/**
 * Get skip intervals (convenience function)
 */
export const getSkipIntervals = async (): Promise<{ forward: SkipInterval; backward: SkipInterval }> => {
  const settings = await getPlaybackSettings();
  return {
    forward: settings.skipForwardInterval,
    backward: settings.skipBackwardInterval,
  };
};

/**
 * Get default playback speed (convenience function)
 */
export const getDefaultPlaybackSpeed = async (): Promise<PlaybackSpeed> => {
  const settings = await getPlaybackSettings();
  return settings.defaultPlaybackSpeed;
};

/**
 * Format playback speed for display
 */
export const formatPlaybackSpeed = (speed: PlaybackSpeed): string => {
  if (speed === 1) return '1×';
  return `${speed}×`;
};

/**
 * Format skip interval for display
 */
export const formatSkipInterval = (seconds: SkipInterval): string => {
  return `${seconds}s`;
};

