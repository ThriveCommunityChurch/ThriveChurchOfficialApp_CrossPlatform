import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useColorScheme, Appearance, ColorSchemeName } from 'react-native';
import { darkTheme, lightTheme } from '../theme';
import type { ThemeContextValue, ThemeMode } from '../theme/types';

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
 * - Real-time theme updates when system appearance changes
 * - Provides theme object with colors and typography
 * - Provides isDark flag for conditional logic
 * - Provides themeMode for future manual override capability
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

  // Select theme based on system preference
  // Default to dark theme if system preference is null or 'dark'
  const theme = colorScheme === 'light' ? lightTheme : darkTheme;
  const isDark = theme.isDark;
  const themeMode: ThemeMode = 'auto'; // Currently always auto, can be extended for manual override

  const contextValue: ThemeContextValue = {
    theme,
    isDark,
    themeMode,
    // setThemeMode can be added in the future for manual theme toggle
  };

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

