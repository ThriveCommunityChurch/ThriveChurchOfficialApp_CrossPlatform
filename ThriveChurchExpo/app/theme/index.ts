/**
 * Theme System Barrel Export
 * 
 * Central export point for all theme-related types, themes, and utilities.
 */

// Export all type definitions
export type {
  Theme,
  ThemeColors,
  ThemeMode,
  ThemeContextValue,
  TypographyStyle,
  TypographyTheme,
} from './types';

// Export theme configurations
export { darkTheme, darkColors, darkTypography } from './themes/dark';
export { lightTheme, lightColors, lightTypography } from './themes/light';

// Re-export legacy colors for backward compatibility during migration
// This will be deprecated after all components are migrated to use theme
export { colors } from './colors';
export { typography } from './typography';

