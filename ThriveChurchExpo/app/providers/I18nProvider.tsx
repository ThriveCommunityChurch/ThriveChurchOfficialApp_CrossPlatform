import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { getLocales } from 'expo-localization';
import i18n from '../i18n';
import { Language, DEFAULT_LANGUAGE } from '../i18n/types';
import { getLanguage, setLanguage as saveLanguage } from '../services/storage/storage';

/**
 * I18n Context Value
 */
interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, options?: any) => string;
}

/**
 * I18n Context
 *
 * Provides i18n instance and language utilities to all child components.
 */
const I18nContext = createContext<I18nContextValue | undefined>(undefined);

/**
 * I18nProvider Props
 */
interface I18nProviderProps {
  children: ReactNode;
}

/**
 * I18nProvider Component
 *
 * Detects the device's language preference and provides i18n functionality
 * to all child components via React Context.
 *
 * Features:
 * - Automatic device language detection using expo-localization
 * - Manual language override (English or Spanish)
 * - Real-time language updates when user changes preference
 * - Persistent language preference using AsyncStorage
 * - Provides translation function (t) for accessing translations
 * - Fallback to English for unsupported languages
 *
 * Usage:
 * ```tsx
 * <I18nProvider>
 *   <App />
 * </I18nProvider>
 * ```
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  // Current language state
  const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  // Detect device locale
  const getDeviceLocale = useCallback((): Language => {
    try {
      const locales = getLocales();
      const deviceLocale = locales[0];
      const languageCode = deviceLocale?.languageCode || 'en';
      
      // Return 'es' for Spanish, 'en' for everything else
      return languageCode === 'es' ? 'es' : 'en';
    } catch (error) {
      console.error('Error detecting device locale:', error);
      return DEFAULT_LANGUAGE;
    }
  }, []);

  // Load user's language preference from AsyncStorage on mount
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await getLanguage();
        
        if (savedLanguage) {
          // Use saved language preference
          setCurrentLanguage(savedLanguage);
          await i18n.changeLanguage(savedLanguage);
        } else {
          // No saved preference, detect device locale
          const deviceLocale = getDeviceLocale();
          setCurrentLanguage(deviceLocale);
          await i18n.changeLanguage(deviceLocale);
          // Save detected language for future launches
          await saveLanguage(deviceLocale);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
        // Fallback to default language
        setCurrentLanguage(DEFAULT_LANGUAGE);
        await i18n.changeLanguage(DEFAULT_LANGUAGE);
      }
    };

    loadLanguagePreference();
  }, [getDeviceLocale]);

  // Handle language changes
  // Updates local state, i18n instance, and persists to AsyncStorage
  const handleSetLanguage = useCallback(async (language: Language) => {
    try {
      setCurrentLanguage(language);
      await i18n.changeLanguage(language);
      await saveLanguage(language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }, []);

  // Translation function wrapper
  const t = useCallback((key: string, options?: any): string => {
    return i18n.t(key, options) as string;
  }, []);

  const contextValue: I18nContextValue = useMemo(() => ({
    language: currentLanguage,
    setLanguage: handleSetLanguage,
    t,
  }), [currentLanguage, handleSetLanguage, t]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

/**
 * useI18nContext Hook
 * 
 * Internal hook to access the I18nContext.
 * Use the exported useTranslation hook from hooks/useTranslation.ts instead.
 * 
 * @throws Error if used outside of I18nProvider
 */
export const useI18nContext = (): I18nContextValue => {
  const context = useContext(I18nContext);
  
  if (context === undefined) {
    throw new Error(
      'useI18nContext must be used within an I18nProvider. ' +
      'Make sure your component is wrapped with <I18nProvider>.'
    );
  }
  
  return context;
};

