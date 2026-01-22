import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for download settings
export const DOWNLOAD_SETTINGS_KEY = 'downloadSettings';

// Types
export interface DownloadSettings {
  wifiOnly: boolean;           // Only download on WiFi
  storageLimit: number;        // Max storage in bytes (0 = unlimited)
  storageLimitEnabled: boolean;
  downloadQuality: 'standard' | 'high'; // Future: audio quality option
  hasPromptedWifiOnly: boolean; // Whether user has been shown the first-time WiFi prompt
}

// Default settings
export const DEFAULT_DOWNLOAD_SETTINGS: DownloadSettings = {
  wifiOnly: true,
  storageLimit: 1024 * 1024 * 1024, // 1 GB default
  storageLimitEnabled: false,
  downloadQuality: 'standard',
  hasPromptedWifiOnly: false,
};

// Storage limit options for picker UI
export const STORAGE_LIMIT_OPTIONS = [
  { label: '500 MB', value: 500 * 1024 * 1024 },
  { label: '1 GB', value: 1024 * 1024 * 1024 },
  { label: '2 GB', value: 2 * 1024 * 1024 * 1024 },
  { label: '5 GB', value: 5 * 1024 * 1024 * 1024 },
  { label: '10 GB', value: 10 * 1024 * 1024 * 1024 },
];

/**
 * Get download settings from storage
 * Returns default settings if none are saved or on error
 */
export const getDownloadSettings = async (): Promise<DownloadSettings> => {
  try {
    const data = await AsyncStorage.getItem(DOWNLOAD_SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults to handle any new settings added in updates
      return { ...DEFAULT_DOWNLOAD_SETTINGS, ...parsed };
    }
    return DEFAULT_DOWNLOAD_SETTINGS;
  } catch (error) {
    console.error('Error reading download settings:', error);
    return DEFAULT_DOWNLOAD_SETTINGS;
  }
};

/**
 * Save complete download settings to storage
 */
export const saveDownloadSettings = async (settings: DownloadSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(DOWNLOAD_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving download settings:', error);
    throw error;
  }
};

/**
 * Update a single download setting
 * Returns the updated settings object
 */
export const updateDownloadSetting = async <K extends keyof DownloadSettings>(
  key: K,
  value: DownloadSettings[K]
): Promise<DownloadSettings> => {
  const current = await getDownloadSettings();
  const updated = { ...current, [key]: value };
  await saveDownloadSettings(updated);
  return updated;
};

/**
 * Reset download settings to defaults
 */
export const resetDownloadSettings = async (): Promise<DownloadSettings> => {
  await saveDownloadSettings(DEFAULT_DOWNLOAD_SETTINGS);
  return DEFAULT_DOWNLOAD_SETTINGS;
};

/**
 * Check if WiFi-only download is enabled
 * Convenience function for quick checks
 */
export const isWifiOnlyEnabled = async (): Promise<boolean> => {
  const settings = await getDownloadSettings();
  return settings.wifiOnly;
};

/**
 * Check if storage limit is enabled and get the limit
 * Returns { enabled: boolean, limit: number }
 */
export const getStorageLimitInfo = async (): Promise<{ enabled: boolean; limit: number }> => {
  const settings = await getDownloadSettings();
  return {
    enabled: settings.storageLimitEnabled,
    limit: settings.storageLimit,
  };
};

/**
 * Check if user has been prompted about WiFi-only downloads
 */
export const hasBeenPromptedForWifiOnly = async (): Promise<boolean> => {
  const settings = await getDownloadSettings();
  return settings.hasPromptedWifiOnly;
};

/**
 * Mark that the user has been prompted about WiFi-only downloads
 */
export const markWifiOnlyPrompted = async (): Promise<void> => {
  await updateDownloadSetting('hasPromptedWifiOnly', true);
};
