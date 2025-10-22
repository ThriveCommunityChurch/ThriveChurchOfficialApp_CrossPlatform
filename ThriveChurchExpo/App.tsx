import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './app/navigation/RootNavigator';
import { colors } from './app/theme/colors';
import { AppProviders } from './app/providers/AppProviders';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <StatusBar barStyle="light-content" backgroundColor={colors.almostBlack} />
        <RootNavigator />
      </AppProviders>
    </GestureHandlerRootView>
  );
}
