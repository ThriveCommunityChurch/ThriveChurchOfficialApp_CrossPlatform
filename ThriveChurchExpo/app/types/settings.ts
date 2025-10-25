/**
 * Settings Types
 * User preferences and configuration settings
 */

/**
 * Bible Translation Configuration
 * Represents a Bible translation available on Bible.com (YouVersion)
 */
export interface BibleTranslation {
  /** Short name/code (e.g., "ESV", "NIV") */
  name: string;
  /** Full display name (e.g., "English Standard Version") */
  fullName: string;
  /** Bible.com version ID used in URLs */
  id: number;
  /** Translation code for URLs (e.g., "ESV") */
  code: string;
}

/**
 * Theme mode options
 * - 'light': Force light theme
 * - 'dark': Force dark theme
 * - 'auto': Follow system preference (default)
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * User Settings
 * Complete user preferences for the app
 */
export interface UserSettings {
  /** Selected Bible translation */
  bibleTranslation: BibleTranslation;
  /** Theme mode preference */
  themeMode: ThemeMode;
}

/**
 * Default Bible Translation
 * ESV (English Standard Version) - ID 59 on Bible.com
 */
export const DEFAULT_BIBLE_TRANSLATION: BibleTranslation = {
  name: 'ESV',
  fullName: 'English Standard Version',
  id: 59,
  code: 'ESV',
};

/**
 * Default Theme Mode
 * Auto mode follows system appearance preference
 */
export const DEFAULT_THEME_MODE: ThemeMode = 'auto';

/**
 * Default Settings
 * Used when no user preferences are saved
 */
export const DEFAULT_SETTINGS: UserSettings = {
  bibleTranslation: DEFAULT_BIBLE_TRANSLATION,
  themeMode: DEFAULT_THEME_MODE,
};

