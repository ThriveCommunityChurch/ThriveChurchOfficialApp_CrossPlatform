import { useI18nContext } from '../providers/I18nProvider';
import type { Language } from '../i18n/types';

/**
 * useTranslation Hook
 * 
 * Custom hook to access translations and language utilities in any component.
 * 
 * Returns:
 * - t: Translation function to get translated strings by key
 * - language: Current language code ('en' or 'es')
 * - setLanguage: Function to change the app language
 * 
 * Usage:
 * ```tsx
 * import { useTranslation } from '../hooks/useTranslation';
 * 
 * const MyComponent = () => {
 *   const { t, language, setLanguage } = useTranslation();
 * 
 *   return (
 *     <View>
 *       <Text>{t('common.loading')}</Text>
 *       <Text>Current language: {language}</Text>
 *       <Button 
 *         title="Switch to Spanish" 
 *         onPress={() => setLanguage('es')} 
 *       />
 *     </View>
 *   );
 * };
 * ```
 * 
 * Translation keys support dot notation for nested objects:
 * - t('common.loading') → "Loading..." or "Cargando..."
 * - t('settings.title') → "Settings" or "Ajustes"
 * - t('navigation.listen') → "Listen" or "Escuchar"
 * 
 * Translation keys also support interpolation:
 * - t('more.aboutMessage', { version: '1.0.0', year: 2024 })
 * 
 * @throws Error if used outside of I18nProvider
 */
export const useTranslation = () => {
  return useI18nContext();
};

/**
 * Type exports for convenience
 */
export type { Language };

/**
 * Type for the translation function
 */
export type TFunction = (key: string, options?: any) => string;

