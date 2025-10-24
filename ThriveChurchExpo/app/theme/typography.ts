import { Platform } from 'react-native';
import type { ThemeColors, TypographyTheme } from './types';

const ios = Platform.OS === 'ios';

/**
 * Create Typography Theme
 *
 * Generates typography styles with dynamic colors based on the current theme.
 *
 * ⚠️ IMPORTANT: ONLY the color property is dynamic.
 * All other properties (fontSize, lineHeight, letterSpacing, fontFamily, fontWeight)
 * remain unchanged regardless of theme.
 *
 * @param colors - Theme colors object
 * @returns Typography theme with dynamic colors
 */
export const createTypography = (colors: ThemeColors): TypographyTheme => ({
  families: {
    heading: ios ? 'Avenir-Heavy' : 'Lato-Bold',
    subheading: ios ? 'Avenir-Medium' : 'Lato-Semibold',
    body: ios ? 'Avenir-Book' : 'Lato-Regular',
  },
  h1: {
    fontFamily: ios ? 'Avenir-Heavy' : 'Lato-Bold',
    fontSize: 24,
    lineHeight: 29, // +1 on Android for rhythm
    letterSpacing: ios ? -0.2 : -0.15,
    color: colors.text, // ← ONLY THIS CHANGES
  },
  h2: {
    fontFamily: ios ? 'Avenir-Heavy' : 'Lato-Bold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: ios ? -0.1 : -0.1,
    color: colors.text, // ← ONLY THIS CHANGES
  },
  h3: {
    fontFamily: ios ? 'Avenir-Medium' : 'Lato-Semibold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: ios ? -0.1 : -0.05,
    color: colors.text, // ← ONLY THIS CHANGES
  },
  body: {
    fontFamily: ios ? 'Avenir-Book' : 'Lato-Regular',
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: 0,
    color: colors.text, // ← ONLY THIS CHANGES
  },
  caption: {
    fontFamily: ios ? 'Avenir-Book' : 'Lato-Regular',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.text, // ← ONLY THIS CHANGES
  },
  label: {
    fontFamily: ios ? 'Avenir-Medium' : 'Lato-Semibold',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: ios ? 0 : -0.05,
    color: colors.text, // ← ONLY THIS CHANGES
  },
  button: {
    fontFamily: ios ? 'Avenir-Medium' : 'Lato-Semibold',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: ios ? 0 : -0.05,
    color: colors.text, // ← ONLY THIS CHANGES
    fontWeight: '600',
  },
});

/**
 * Legacy typography export for backward compatibility
 *
 * This uses hard-coded white color (#FFFFFF) to maintain compatibility
 * with existing code during migration. Will be deprecated after all
 * components are migrated to use theme.
 *
 * @deprecated Use createTypography(colors) with theme colors instead
 */
export const typography = {
  families: {
    heading: ios ? 'Avenir-Heavy' : 'Lato-Bold',
    subheading: ios ? 'Avenir-Medium' : 'Lato-Semibold',
    body: ios ? 'Avenir-Book' : 'Lato-Regular',
  },
  h1: {
    fontFamily: ios ? 'Avenir-Heavy' : 'Lato-Bold',
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: ios ? -0.2 : -0.15,
    color: '#FFFFFF',
  },
  h2: {
    fontFamily: ios ? 'Avenir-Heavy' : 'Lato-Bold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: ios ? -0.1 : -0.1,
    color: '#FFFFFF',
  },
  h3: {
    fontFamily: ios ? 'Avenir-Medium' : 'Lato-Semibold',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: ios ? -0.1 : -0.05,
    color: '#FFFFFF',
  },
  body: {
    fontFamily: ios ? 'Avenir-Book' : 'Lato-Regular',
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: 0,
    color: '#FFFFFF',
  },
  caption: {
    fontFamily: ios ? 'Avenir-Book' : 'Lato-Regular',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    color: '#FFFFFF',
  },
  label: {
    fontFamily: ios ? 'Avenir-Medium' : 'Lato-Semibold',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: ios ? 0 : -0.05,
    color: '#FFFFFF',
  },
  button: {
    fontFamily: ios ? 'Avenir-Medium' : 'Lato-Semibold',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: ios ? 0 : -0.05,
    color: '#FFFFFF',
    fontWeight: '600',
  },
} as const;

