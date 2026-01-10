import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme, Appearance, ColorSchemeName } from 'react-native';
import { darkTheme, lightTheme } from '../theme';
import type { ThemeContextValue, ThemeMode } from '../theme/types';
import { getThemeMode, setThemeMode as saveThemeMode } from '../services/storage/storage';

/**
 * Theme Context
 *
 * Provides theme object and related utilities to all child components.
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * ThemeProvider Props
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider Component
 *
 * Detects the device's OS color scheme preference and provides the appropriate
 * theme to all child components via React Context.
 *
 * Features:
 * - Automatic OS theme detection using useColorScheme hook
 * - Manual theme override (light, dark, or auto)
 * - Real-time theme updates when system appearance changes
 * - Persistent theme preference using AsyncStorage
 * - Provides theme object with colors and typography
 * - Provides isDark flag for conditional logic
 * - Provides themeMode and setThemeMode for manual control
 *
 * Usage:
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Detect system color scheme preference
  // Returns 'light', 'dark', or null (if not supported)
  const systemColorScheme = useColorScheme();

  // Use state to ensure re-renders when appearance changes
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(systemColorScheme);

  // User's theme mode preference (auto, light, or dark)
  const [userThemeMode, setUserThemeMode] = useState<ThemeMode>('auto');

  // Load user's theme preference from AsyncStorage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      const savedMode = await getThemeMode();
      setUserThemeMode(savedMode);
    };
    loadThemePreference();
  }, []);

  // Listen for system appearance changes
  useEffect(() => {
    // Update state when useColorScheme changes
    setColorScheme(systemColorScheme);
  }, [systemColorScheme]);

  // Also listen to Appearance changes as a fallback
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      console.log('Appearance changed to:', newColorScheme);
      setColorScheme(newColorScheme);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Determine effective color scheme based on user preference
  // If user selected 'auto', use system preference
  // Otherwise, use the user's explicit choice (light or dark)
  const effectiveColorScheme = useMemo(() => {
    if (userThemeMode === 'auto') {
      return colorScheme;
    }
    return userThemeMode;
  }, [userThemeMode, colorScheme]);

  // Select theme based on effective color scheme
  // Default to dark theme if effective color scheme is null or 'dark'
  const theme = effectiveColorScheme === 'light' ? lightTheme : darkTheme;
  const isDark = theme.isDark;

  // Handle theme mode changes
  // Updates local state and persists to AsyncStorage
  const handleSetThemeMode = useCallback(async (mode: ThemeMode) => {
    setUserThemeMode(mode);
    await saveThemeMode(mode);
  }, []);

  const contextValue: ThemeContextValue = useMemo(() => ({
    theme,
    isDark,
    themeMode: userThemeMode,
    setThemeMode: handleSetThemeMode,
  }), [theme, isDark, userThemeMode, handleSetThemeMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useThemeContext Hook
 * 
 * Internal hook to access the ThemeContext.
 * Use the exported useTheme hook from hooks/useTheme.ts instead.
 * 
 * @throws Error if used outside of ThemeProvider
 */
export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error(
      'useThemeContext must be used within a ThemeProvider. ' +
      'Make sure your component is wrapped with <ThemeProvider>.'
    );
  }
  
  return context;
};

