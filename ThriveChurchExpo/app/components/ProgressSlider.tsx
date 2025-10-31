import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../theme/types';

interface ProgressSliderProps {
  value: number; // Current position in seconds
  maximumValue: number; // Duration in seconds
  onSlidingStart?: () => void;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
}

export const ProgressSlider: React.FC<ProgressSliderProps> = ({
  value,
  maximumValue,
  onSlidingStart,
  onValueChange,
  onSlidingComplete,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbTintColor,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(value);

  // Use theme colors as defaults if not provided
  const minTrackColor = minimumTrackTintColor || theme.colors.primary;
  const maxTrackColor = maximumTrackTintColor || theme.colors.card;
  const thumbColor = thumbTintColor || theme.colors.primary;

  // Sync dragValue with external value when NOT dragging
  // This keeps the slider in sync with playback position during normal playback
  useEffect(() => {
    if (!isDragging) {
      setDragValue(value);
    }
  }, [value, isDragging]);

  // Use dragValue while dragging (uncontrolled), otherwise use external value (controlled)
  // This prevents the slider from fighting against incoming prop updates during drag
  const currentValue = isDragging ? dragValue : value;
  const progress = maximumValue > 0 ? currentValue / maximumValue : 0;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt: GestureResponderEvent) => {
      setIsDragging(true);
      onSlidingStart?.();
      handleTouch(evt);
    },
    onPanResponderMove: (evt: GestureResponderEvent) => {
      handleTouch(evt);
    },
    onPanResponderRelease: (evt: GestureResponderEvent) => {
      const newValue = calculateValue(evt.nativeEvent.locationX);
      setIsDragging(false);
      // Reset dragValue to sync with external value after drag completes
      setDragValue(newValue);
      onSlidingComplete?.(newValue);
    },
  });

  const handleTouch = (evt: GestureResponderEvent) => {
    const newValue = calculateValue(evt.nativeEvent.locationX);
    // Update internal drag value immediately for responsive UI
    setDragValue(newValue);
    // Notify parent of the change
    onValueChange?.(newValue);
  };

  const calculateValue = (x: number): number => {
    const clampedX = Math.max(0, Math.min(x, sliderWidth));
    const ratio = clampedX / sliderWidth;
    return ratio * maximumValue;
  };

  return (
    <View
      style={styles.container}
      onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      {/* Track background */}
      <View style={[styles.track, { backgroundColor: maxTrackColor }]} />

      {/* Progress track */}
      <View
        style={[
          styles.track,
          styles.progressTrack,
          {
            width: `${progress * 100}%`,
            backgroundColor: minTrackColor,
          },
        ]}
      />

      {/* Thumb */}
      <View
        style={[
          styles.thumb,
          {
            left: `${progress * 100}%`,
            backgroundColor: thumbColor,
            transform: [{ scale: isDragging ? 1.2 : 1 }],
          },
        ]}
      />
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    position: 'absolute',
    height: 4,
    width: '100%',
    borderRadius: 2,
  },
  progressTrack: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    shadowColor: theme.colors.shadowDark, // ← ONLY COLOR CHANGED
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

