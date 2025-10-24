import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './app/navigation/RootNavigator';
import { AppProviders } from './app/providers/AppProviders';
import { useTheme } from './app/hooks/useTheme';

/**
 * AppContent component that has access to theme context
 */
function AppContent() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <AppContent />
      </AppProviders>
    </GestureHandlerRootView>
  );
}
