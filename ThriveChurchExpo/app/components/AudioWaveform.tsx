import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../theme/colors';

interface AudioWaveformProps {
  progress: number; // 0 to 1
  duration: number;
  onSeek?: (position: number) => void;
  amplitudes?: number[]; // Optional: real amplitude data from audio analysis
  isLoading?: boolean; // Optional: show loading state while extracting waveform
  height?: number; // Optional: custom height for the waveform (default: 60)
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  progress,
  duration,
  onSeek,
  amplitudes,
  isLoading = false,
  height = 60,
}) => {
  // Animated value for pulsing effect
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Determine if we should show skeleton (loading OR no amplitude data yet)
  const showSkeleton = isLoading || !amplitudes || amplitudes.length === 0;

  // Start pulse animation when showing skeleton
  useEffect(() => {
    if (showSkeleton) {
      // Create a continuous pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animation when not loading
      pulseAnim.setValue(1);
    }
  }, [showSkeleton, pulseAnim]);

  // Use provided amplitudes or generate fallback waveform
  const waveformBars = useMemo(() => {
    if (amplitudes && amplitudes.length > 0) {
      // Use real amplitude data
      return amplitudes;
    }

    // Fallback: Generate random waveform bars
    const bars = [];
    const barCount = 60;
    for (let i = 0; i < barCount; i++) {
      // Create a wave pattern with some randomness
      const baseHeight = Math.sin(i / 5) * 0.3 + 0.5;
      const randomness = Math.random() * 0.3;
      bars.push(Math.min(1, Math.max(0.2, baseHeight + randomness)));
    }
    return bars;
  }, [amplitudes]);

  // Generate skeleton bars for loading state
  const skeletonBars = useMemo(() => {
    const bars = [];
    const barCount = 60;
    for (let i = 0; i < barCount; i++) {
      // Create varied heights for a more natural skeleton look
      const height = 0.3 + Math.sin(i / 8) * 0.2 + Math.cos(i / 4) * 0.15;
      bars.push(Math.min(0.8, Math.max(0.2, height)));
    }
    return bars;
  }, []);

  const handlePress = (index: number) => {
    if (onSeek && duration > 0 && !showSkeleton) {
      const position = (index / waveformBars.length) * duration;
      onSeek(position);
    }
  };

  // Show skeleton waveform while loading or waiting for amplitude data
  if (showSkeleton) {
    return (
      <View style={[styles.container, { height }]}>
        {skeletonBars.map((barHeight, index) => (
          <View key={index} style={styles.barContainer}>
            <Animated.View
              style={[
                styles.bar,
                styles.skeletonBar,
                {
                  height: `${barHeight * 100}%`,
                  opacity: pulseAnim,
                },
              ]}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {waveformBars.map((barHeight, index) => {
        const isPlayed = index / waveformBars.length <= progress;
        return (
          <TouchableOpacity
            key={index}
            style={styles.barContainer}
            onPress={() => handlePress(index)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.bar,
                {
                  height: `${barHeight * 100}%`,
                  backgroundColor: isPlayed ? colors.mainBlue : colors.darkGrey,
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // height is now dynamic via prop
    width: '100%',
    paddingHorizontal: 4,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
  skeletonBar: {
    backgroundColor: colors.darkGrey,
  },
});

