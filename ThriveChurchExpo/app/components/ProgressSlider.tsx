import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { colors } from '../theme/colors';

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
  minimumTrackTintColor = colors.mainBlue,
  maximumTrackTintColor = colors.darkGrey,
  thumbTintColor = colors.mainBlue,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const progress = maximumValue > 0 ? value / maximumValue : 0;

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
      setIsDragging(false);
      const newValue = calculateValue(evt.nativeEvent.locationX);
      onSlidingComplete?.(newValue);
    },
  });

  const handleTouch = (evt: GestureResponderEvent) => {
    const newValue = calculateValue(evt.nativeEvent.locationX);
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
      <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]} />
      
      {/* Progress track */}
      <View
        style={[
          styles.track,
          styles.progressTrack,
          {
            width: `${progress * 100}%`,
            backgroundColor: minimumTrackTintColor,
          },
        ]}
      />
      
      {/* Thumb */}
      <View
        style={[
          styles.thumb,
          {
            left: `${progress * 100}%`,
            backgroundColor: thumbTintColor,
            transform: [{ scale: isDragging ? 1.2 : 1 }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

