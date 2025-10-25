/**
 * SearchTypeToggle Component
 * Segmented control to toggle between 'Messages' and 'Series' search targets
 * Features smooth animated transition between states
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../theme/types';
import { SearchTarget } from '../../types/api';

interface SearchTypeToggleProps {
  value: SearchTarget;
  onChange: (value: SearchTarget) => void;
}

export const SearchTypeToggle: React.FC<SearchTypeToggleProps> = ({
  value,
  onChange,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Animated value for smooth transition (0 = Series, 1 = Message)
  const slideAnim = useRef(new Animated.Value(value === SearchTarget.Series ? 0 : 1)).current;

  // Animate when value changes
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: value === SearchTarget.Series ? 0 : 1,
      duration: 200,
      useNativeDriver: false, // Can't use native driver for backgroundColor
    }).start();
  }, [value, slideAnim]);

  const handlePress = (target: SearchTarget) => {
    if (target !== value) {
      // TODO: Add haptic feedback when react-native-haptic-feedback is installed
      // Example:
      // if (Platform.OS === 'ios') {
      //   ReactNativeHapticFeedback.trigger('impactLight', {
      //     enableVibrateFallback: false,
      //     ignoreAndroidSystemSettings: false
      //   });
      // }
      onChange(target);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          styles.leftButton,
          value === SearchTarget.Series && styles.activeButton,
        ]}
        onPress={() => handlePress(SearchTarget.Series)}
        activeOpacity={0.7}
        accessibilityLabel="Search for sermon series"
        accessibilityRole="button"
        accessibilityState={{ selected: value === SearchTarget.Series }}
      >
        <Text
          style={[
            styles.buttonText,
            value === SearchTarget.Series && styles.activeButtonText,
          ]}
        >
          Series
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.rightButton,
          value === SearchTarget.Message && styles.activeButton,
        ]}
        onPress={() => handlePress(SearchTarget.Message)}
        activeOpacity={0.7}
        accessibilityLabel="Search for sermon messages"
        accessibilityRole="button"
        accessibilityState={{ selected: value === SearchTarget.Message }}
      >
        <Text
          style={[
            styles.buttonText,
            value === SearchTarget.Message && styles.activeButtonText,
          ]}
        >
          Messages
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.colors.card,
      padding: 2,
    },
    button: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 6,
    },
    leftButton: {
      marginRight: 1,
    },
    rightButton: {
      marginLeft: 1,
    },
    activeButton: {
      backgroundColor: theme.colors.primary,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Lato-Semibold',
      color: theme.colors.textSecondary,
    },
    activeButtonText: {
      color: '#FFFFFF',
    },
  });

