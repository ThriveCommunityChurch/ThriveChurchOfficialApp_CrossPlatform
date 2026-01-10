/**
 * useSettings Hook
 * 
 * Custom hook for managing user settings and preferences.
 * Handles loading, updating, and persisting settings to AsyncStorage.
 * 
 * Features:
 * - Loads settings from AsyncStorage on mount
 * - Provides current settings state
 * - Updates Bible translation preference
 * - Updates theme mode preference (integrates with ThemeProvider)
 * - Automatic persistence on changes
 * - Loading state management
 * 
 * Usage:
 * ```tsx
 * import { useSettings } from '../hooks/useSettings';
 * 
 * const SettingsScreen = () => {
 *   const { settings, isLoading, updateBibleTranslation, updateThemeMode } = useSettings();
 * 
 *   if (isLoading) {
 *     return <ActivityIndicator />;
 *   }
 * 
 *   return (
 *     <View>
 *       <Text>Current Translation: {settings.bibleTranslation.fullName}</Text>
 *       <Text>Theme Mode: {settings.themeMode}</Text>
 *     </View>
 *   );
 * };
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from './useTheme';
import { useTranslation } from './useTranslation';
import {
  getBibleTranslation,
  setBibleTranslation,
  getThemeMode,
  getLanguage,
  setLanguage as saveLanguage,
} from '../services/storage/storage';
import type {
  UserSettings,
  BibleTranslation,
  ThemeMode,
  DEFAULT_SETTINGS,
} from '../types/settings';
import { DEFAULT_SETTINGS as DEFAULTS } from '../types/settings';
import type { Language } from '../i18n/types';

/**
 * Return type for useSettings hook
 */
export interface UseSettingsReturn {
  /** Current user settings */
  settings: UserSettings;
  /** Loading state - true while initial settings are being loaded */
  isLoading: boolean;
  /** Update Bible translation preference */
  updateBibleTranslation: (translation: BibleTranslation) => Promise<void>;
  /** Update theme mode preference */
  updateThemeMode: (mode: ThemeMode) => Promise<void>;
  /** Update language preference */
  updateLanguage: (language: Language) => Promise<void>;
}

/**
 * useSettings Hook
 * 
 * Manages user settings with automatic persistence to AsyncStorage.
 * Integrates with ThemeProvider for real-time theme updates.
 * 
 * @returns Settings state and update functions
 */
export const useSettings = (): UseSettingsReturn => {
  // Settings state - initialized with defaults
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);

  // Loading state - true until initial load completes
  const [isLoading, setIsLoading] = useState(true);

  // Get setThemeMode from ThemeProvider for real-time theme updates
  const { setThemeMode } = useTheme();

  // Get setLanguage from I18nProvider for real-time language updates
  const { setLanguage } = useTranslation();

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);

        // Load all settings in parallel
        const [bibleTranslation, themeMode, language] = await Promise.all([
          getBibleTranslation(),
          getThemeMode(),
          getLanguage(),
        ]);

        // Update settings state with loaded values
        setSettings({
          bibleTranslation,
          themeMode,
          language: language || DEFAULTS.language,
        });
      } catch (error) {
        console.error('Error loading settings:', error);
        // Keep default settings on error
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  /**
   * Update Bible translation preference
   * Updates local state and persists to AsyncStorage
   * 
   * @param translation - New Bible translation to use
   */
  const updateBibleTranslation = useCallback(async (translation: BibleTranslation) => {
    try {
      // Update local state immediately for responsive UI
      setSettings(prev => ({
        ...prev,
        bibleTranslation: translation,
      }));

      // Persist to AsyncStorage
      await setBibleTranslation(translation);
    } catch (error) {
      console.error('Error updating Bible translation:', error);
      // Could revert state here if needed, but we'll keep the optimistic update
    }
  }, []);

  /**
   * Update theme mode preference
   * Updates local state, persists to AsyncStorage, and updates ThemeProvider
   *
   * @param mode - New theme mode ('auto', 'light', or 'dark')
   */
  const updateThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      // Update local state immediately for responsive UI
      setSettings(prev => ({
        ...prev,
        themeMode: mode,
      }));

      // Update ThemeProvider for real-time theme change
      // This also persists to AsyncStorage via ThemeProvider's handleSetThemeMode
      if (setThemeMode) {
        await setThemeMode(mode);
      }
    } catch (error) {
      console.error('Error updating theme mode:', error);
      // Could revert state here if needed, but we'll keep the optimistic update
    }
  }, [setThemeMode]);

  /**
   * Update language preference
   * Updates local state, persists to AsyncStorage, and updates I18nProvider
   *
   * @param language - New language ('en' or 'es')
   */
  const updateLanguage = useCallback(async (language: Language) => {
    try {
      // Update local state immediately for responsive UI
      setSettings(prev => ({
        ...prev,
        language,
      }));

      // Update I18nProvider for real-time language change
      // This also persists to AsyncStorage via I18nProvider's handleSetLanguage
      if (setLanguage) {
        await setLanguage(language);
      }
    } catch (error) {
      console.error('Error updating language:', error);
      // Could revert state here if needed, but we'll keep the optimistic update
    }
  }, [setLanguage]);

  return {
    settings,
    isLoading,
    updateBibleTranslation,
    updateThemeMode,
    updateLanguage,
  };
};

