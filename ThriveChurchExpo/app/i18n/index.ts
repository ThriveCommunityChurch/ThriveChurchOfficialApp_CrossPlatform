import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation resources
import en from './resources/en.json';
import es from './resources/es.json';

/**
 * i18n Configuration
 * 
 * Provides internationalization support for the app with:
 * - Language detection from device locale
 * - Fallback to English
 * - AsyncStorage persistence for user language preference
 * - Support for English (en) and Spanish (es)
 */

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'language';

// Get device locale
const getDeviceLocale = (): string => {
  try {
    // Get the first locale from the device
    const locale = Localization.getLocales()[0];
    
    // Extract language code (e.g., 'en' from 'en-US')
    const languageCode = locale?.languageCode || 'en';
    
    // Only return 'es' if Spanish, otherwise default to 'en'
    return languageCode === 'es' ? 'es' : 'en';
  } catch (error) {
    console.error('Error detecting device locale:', error);
    return 'en';
  }
};

// Custom language detector plugin for i18next
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Try to get saved language preference from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedLanguage) {
        // Use saved preference if available
        callback(savedLanguage);
      } else {
        // Otherwise, detect from device locale
        const deviceLocale = getDeviceLocale();
        callback(deviceLocale);
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      // Fallback to English on error
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      // Save language preference to AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  },
};

// Initialize i18next
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    // Translation resources
    resources: {
      en: {
        translation: en,
      },
      es: {
        translation: es,
      },
    },
    
    // Fallback language
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: ['en', 'es'],
    
    // Debug mode (disable in production)
    debug: __DEV__,
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React options
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
    
    // Compatibility options
    compatibilityJSON: 'v3', // Use i18next v3 JSON format
  });

export default i18n;

