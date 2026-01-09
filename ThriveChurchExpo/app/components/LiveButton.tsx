/**
 * LiveButton Component
 * A header button that shows live streaming status and navigates to the Live screen
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { useLiveStream } from '../hooks/useLiveStream';
import { LiveBadge } from './LiveBadge';
import type { Theme } from '../theme/types';

// Navigation type for Listen stack
type ListenStackParamList = {
  ListenHome: undefined;
  Live: undefined;
};

type NavigationProp = NativeStackNavigationProp<ListenStackParamList>;

interface LiveButtonProps {
  /** Optional style override for the container */
  style?: object;
}

export const LiveButton: React.FC<LiveButtonProps> = ({ style }) => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { data, isLoading } = useLiveStream();
  const styles = createStyles(theme);

  const isLive = data?.isLive ?? false;

  const handlePress = () => {
    navigation.navigate('Live');
  };

  // Loading state - show subtle indicator
  if (isLoading && !data) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.offlineButton, style]}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel="Live streaming"
        accessibilityRole="button"
      >
        <ActivityIndicator size="small" color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  // Live state - show pulsing LiveBadge
  if (isLive) {
    return (
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel="Watch live stream"
        accessibilityRole="button"
        accessibilityHint="Thrive is currently live streaming"
      >
        <LiveBadge size="small" />
      </TouchableOpacity>
    );
  }

  // Offline state - show plain "Live" text
  return (
    <TouchableOpacity
      style={[styles.button, styles.offlineButton, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel="Live streaming"
      accessibilityRole="button"
      accessibilityHint="Check if Thrive is live streaming"
    >
      <Text style={styles.offlineText}>Live</Text>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      marginRight: 8,
      borderRadius: 6,
      overflow: 'hidden',
    },
    offlineButton: {
      backgroundColor: theme.colors.backgroundSecondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    offlineText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
  });

export default LiveButton;

