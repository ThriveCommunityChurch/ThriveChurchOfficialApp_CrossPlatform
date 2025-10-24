/**
 * Theme Type Definitions
 * 
 * ⚠️ CRITICAL: This theme system provides ONLY color values.
 * NO spacing, typography sizes, border radius, or other design tokens.
 * 
 * When migrating components, ONLY move color-related properties to use theme values.
 * All other properties stay exactly as they are.
 */

/**
 * Theme color palette interface
 * Contains all semantic color names used throughout the app
 */
export interface ThemeColors {
  // ===== Backgrounds =====
  /** Primary background color for screens */
  background: string;
  /** Secondary background color for sections/panels */
  backgroundSecondary: string;
  /** Tertiary background color for subtle differentiation */
  backgroundTertiary: string;

  // ===== Cards & Surfaces =====
  /** Surface color for navigation headers, tab bars, and elevated surfaces */
  surface: string;
  /** Primary card background color */
  card: string;
  /** Secondary card background color for nested cards */
  cardSecondary: string;
  /** Tertiary card background color for subtle variations */
  cardTertiary: string;
  /** Semi-transparent card overlay for modal/overlay contexts */
  cardOverlay: string;

  // ===== Text Colors =====
  /** Primary text color for body text and headings */
  text: string;
  /** Secondary text color for less prominent text */
  textSecondary: string;
  /** Tertiary text color for disabled or subtle text */
  textTertiary: string;
  /** Inverse text color (for use on colored backgrounds) */
  textInverse: string;

  // ===== Borders & Dividers =====
  /** Border color for inputs, cards, and containers */
  border: string;
  /** Divider color for separating content */
  divider: string;
  /** Separator color for list items */
  separator: string;

  // ===== Accents & Actions =====
  /** Primary brand color for buttons, links, and active states */
  primary: string;
  /** Light version of primary color for backgrounds and highlights */
  primaryLight: string;

  // ===== Status & Feedback =====
  /** Success state color */
  success: string;
  /** Light success tint for backgrounds */
  successLight: string;
  /** Warning state color */
  warning: string;
  /** Error state color */
  error: string;
  /** Dark error color for delete actions */
  errorDark: string;
  /** Info state color */
  info: string;

  // ===== Overlays & Shadows =====
  /** Overlay color for modals and dialogs */
  overlay: string;
  /** Dark overlay for text readability on images */
  overlayDark: string;
  /** Medium overlay for loading states */
  overlayMedium: string;
  /** Shadow color for elevation effects */
  shadow: string;
  /** Pure black shadow for strong elevation */
  shadowDark: string;

  // ===== Navigation Specific =====
  /** Tab bar background color */
  tabBarBackground: string;
  /** Active tab bar item color */
  tabBarActive: string;
  /** Inactive tab bar item color */
  tabBarInactive: string;
  /** Header background color */
  headerBackground: string;
  /** Header text color */
  headerText: string;
}

/**
 * Typography style interface
 * Includes font properties and dynamic color
 */
export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  fontWeight?: string;
}

/**
 * Typography theme interface
 * Contains all typography styles with dynamic colors
 */
export interface TypographyTheme {
  families: {
    heading: string;
    subheading: string;
    body: string;
  };
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  body: TypographyStyle;
  caption: TypographyStyle;
  label: TypographyStyle;
  button: TypographyStyle;
}

/**
 * Complete theme interface
 * 
 * NOTE: No SpacingTheme or BorderRadiusTheme included.
 * These values remain as constants in existing stylesheets.
 * ONLY colors are part of the theme system.
 */
export interface Theme {
  /** Color palette for the theme */
  colors: ThemeColors;
  /** Typography styles with dynamic colors */
  typography: TypographyTheme;
  /** Flag indicating if this is a dark theme */
  isDark: boolean;
}

/**
 * Theme mode type
 * - 'light': Force light theme
 * - 'dark': Force dark theme
 * - 'auto': Follow system preference (default)
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Theme context value interface
 * Provided by ThemeProvider to all consuming components
 */
export interface ThemeContextValue {
  /** Current active theme object */
  theme: Theme;
  /** Flag indicating if current theme is dark */
  isDark: boolean;
  /** Current theme mode setting */
  themeMode: ThemeMode;
  /** Function to change theme mode (optional, for future manual toggle) */
  setThemeMode?: (mode: ThemeMode) => void;
}

