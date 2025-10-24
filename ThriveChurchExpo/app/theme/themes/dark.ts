import { Platform } from 'react-native';
import type { Theme, ThemeColors, TypographyTheme } from '../types';
import { createTypography } from '../typography';

const ios = Platform.OS === 'ios';

/**
 * Dark Theme Color Palette
 * 
 * This theme represents the current app's dark mode colors.
 * All colors are mapped from the existing colors.ts file to semantic names.
 */
export const darkColors: ThemeColors = {
  // ===== Backgrounds =====
  background: 'rgb(25,25,25)', // almostBlack
  backgroundSecondary: 'rgb(27,41,51)', // bgDarkBlue
  backgroundTertiary: 'rgb(63,63,63)', // darkGrey

  // ===== Cards & Surfaces =====
  surface: 'rgb(27,41,51)', // bgDarkBlue - for navigation headers and tab bars
  card: 'rgb(63,63,63)', // darkGrey
  cardSecondary: 'rgb(27,41,51)', // bgDarkBlue
  cardTertiary: 'rgb(40,40,40)', // Slightly lighter than almostBlack, used in Bible screens
  cardOverlay: 'rgba(27,41,51,0.9)', // Semi-transparent card for overlays

  // ===== Text Colors =====
  text: '#FFFFFF', // white
  textSecondary: '#D3D3D3', // lightGray
  textTertiary: 'rgb(200,200,200)', // lessLightLightGray
  textInverse: '#FFFFFF', // White text for dark backgrounds

  // ===== Borders & Dividers =====
  border: 'rgb(63,63,63)', // darkGrey
  divider: 'rgb(100,100,100)', // mediumGrey
  separator: 'rgba(255,255,255,0.1)', // Subtle white separator for lists

  // ===== Accents & Actions =====
  primary: 'rgb(46,190,216)', // mainBlue
  primaryLight: 'rgba(46,190,216,0.35)', // bgBlue

  // ===== Status & Feedback =====
  success: 'rgb(196,214,118)', // bgGreen
  successLight: 'rgba(76,175,80,0.15)', // Light green tint for success states
  warning: 'rgb(255,193,7)', // Standard warning color
  error: 'rgb(244,67,54)', // Standard error color
  errorDark: '#FF3B30', // iOS-style red for delete actions
  info: 'rgb(46,190,216)', // mainBlue

  // ===== Overlays & Shadows =====
  overlay: 'rgba(25,25,25,0.5)', // transparentAlmostBlack
  overlayDark: 'rgba(0,0,0,0.4)', // Darker overlay for text readability
  overlayMedium: 'rgba(0,0,0,0.5)', // Medium overlay for loading states
  shadow: 'rgba(0,0,0,0.4)', // black with opacity
  shadowDark: '#000', // Pure black for shadows

  // ===== Navigation Specific =====
  tabBarBackground: 'rgb(25,25,25)', // almostBlack
  tabBarActive: 'rgb(46,190,216)', // mainBlue
  tabBarInactive: '#D3D3D3', // lightGray
  headerBackground: 'rgb(27,41,51)', // bgDarkBlue
  headerText: '#FFFFFF', // white
};

/**
 * Dark Theme Typography
 *
 * Typography styles with colors from dark theme.
 * Font sizes, families, and other properties remain unchanged.
 */
export const darkTypography: TypographyTheme = createTypography(darkColors);

/**
 * Complete Dark Theme
 * 
 * Combines colors and typography into a complete theme object.
 */
export const darkTheme: Theme = {
  colors: darkColors,
  typography: darkTypography,
  isDark: true,
};

