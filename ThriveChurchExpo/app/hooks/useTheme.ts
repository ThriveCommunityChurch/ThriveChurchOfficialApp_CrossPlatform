import { useThemeContext } from '../providers/ThemeProvider';
import type { Theme, ThemeMode } from '../theme/types';

/**
 * useTheme Hook
 * 
 * Custom hook to access the current theme in any component.
 * 
 * Returns:
 * - theme: Complete theme object with colors and typography
 * - isDark: Boolean flag indicating if current theme is dark
 * - themeMode: Current theme mode ('light', 'dark', or 'auto')
 * - setThemeMode: Function to change theme mode (optional, for future use)
 * 
 * Usage:
 * ```tsx
 * import { useTheme } from '../hooks/useTheme';
 * 
 * const MyComponent = () => {
 *   const { theme, isDark } = useTheme();
 * 
 *   return (
 *     <View style={{ backgroundColor: theme.colors.background }}>
 *       <Text style={{ color: theme.colors.text }}>
 *         Current theme: {isDark ? 'Dark' : 'Light'}
 *       </Text>
 *     </View>
 *   );
 * };
 * ```
 * 
 * @throws Error if used outside of ThemeProvider
 */
export const useTheme = () => {
  return useThemeContext();
};

/**
 * Type exports for convenience
 */
export type { Theme, ThemeMode };

