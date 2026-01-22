/**
 * i18n Type Definitions
 * 
 * Provides type safety for internationalization throughout the app.
 */

/**
 * Supported languages in the app
 */
export type Language = 'en' | 'es';

/**
 * Language display information
 */
export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
}

/**
 * Available languages with display information
 */
export const LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
  },
];

/**
 * Default language
 */
export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Get language info by code
 */
export const getLanguageInfo = (code: Language): LanguageInfo | undefined => {
  return LANGUAGES.find(lang => lang.code === code);
};

