/**
 * LiveBadge Component
 * A pulsing "LIVE" badge that indicates active streaming status
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../theme/types';

// Size variants for the badge
export type LiveBadgeSize = 'small' | 'medium' | 'large';

interface LiveBadgeProps {
  /** Size variant of the badge */
  size?: LiveBadgeSize;
  /** Whether to show the pulsing animation */
  animated?: boolean;
}

// Size configurations
const sizeConfig = {
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    borderRadius: 4,
    dotSize: 6,
    dotMargin: 4,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    borderRadius: 6,
    dotSize: 8,
    dotMargin: 6,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    borderRadius: 8,
    dotSize: 10,
    dotMargin: 8,
  },
};

export const LiveBadge: React.FC<LiveBadgeProps> = ({
  size = 'medium',
  animated = true,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const config = sizeConfig[size];
  
  // Animated value for pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (!animated) {
      pulseAnim.setValue(1);
      return;
    }
    
    // Create pulsing animation loop (opacity 0.7 to 1.0)
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulse.start();
    
    return () => {
      pulse.stop();
    };
  }, [animated, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingHorizontal: config.paddingHorizontal,
          paddingVertical: config.paddingVertical,
          borderRadius: config.borderRadius,
          opacity: pulseAnim,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            width: config.dotSize,
            height: config.dotSize,
            borderRadius: config.dotSize / 2,
            marginRight: config.dotMargin,
          },
        ]}
      />
      <Text
        style={[
          styles.text,
          { fontSize: config.fontSize },
        ]}
      >
        LIVE
      </Text>
    </Animated.View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.error, // Red background
    },
    dot: {
      backgroundColor: '#FFFFFF', // White dot
    },
    text: {
      color: '#FFFFFF', // White text
      fontWeight: 'bold',
      letterSpacing: 1,
    },
  });

export default LiveBadge;

