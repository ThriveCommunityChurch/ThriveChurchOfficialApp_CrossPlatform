import { Platform } from 'react-native';
import type { ThemeColors, TypographyTheme } from './types';

const ios = Platform.OS === 'ios';

/**
 * MAX_FONT_SCALE
 *
 * Accessibility guardrail for OS-level font scaling (Dynamic Type / Android
 * font size settings). Fixed-height components (buttons, tab bars, chips,
 * single-line rows, etc.) can clip or overlap text when the user enlarges
 * the system font size to very large multiples.
 *
 * Apply this as the `maxFontSizeMultiplier` prop on any `<Text>` that lives
 * inside a fixed-height/fixed-width container, e.g.:
 *
 *   <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={typography.label}>
 *
 * This still allows meaningful growth for low-vision users (up to 130% of
 * the base font size) while preventing layout-breaking clipping at the
 * largest OS accessibility text sizes. It intentionally does NOT cap
 * free-flowing body text in scrollable content, where components should be
 * left to grow naturally - only apply it where a fixed layout would break.
 *
 * This constant is not applied automatically anywhere; each screen/component
 * opts in explicitly by passing it to the Text components that need it.
 */
export const MAX_FONT_SCALE = 1.3;

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

