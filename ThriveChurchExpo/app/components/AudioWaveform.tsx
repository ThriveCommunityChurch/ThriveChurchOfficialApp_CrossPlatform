import React, { useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { Theme } from '../theme/types';

interface AudioWaveformProps {
  progress: number; // 0 to 1
  duration: number;
  onSeek?: (position: number) => void;
  amplitudes?: number[]; // Optional: real amplitude data from audio analysis
  isLoading?: boolean; // Optional: show loading state while extracting waveform
  height?: number; // Optional: custom height for the waveform (default: 60)
  isSeeking?: boolean; // Optional: skip updates during active seeking for better performance
}

const AudioWaveformComponent: React.FC<AudioWaveformProps> = ({
  progress,
  duration,
  onSeek,
  amplitudes,
  isLoading = false,
  height = 60,
  isSeeking = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
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

  // Memoize handlePress to avoid recreating on every render
  const handlePress = useCallback((index: number) => {
    if (onSeek && duration > 0 && !showSkeleton) {
      const position = (index / waveformBars.length) * duration;
      onSeek(position);
    }
  }, [onSeek, duration, showSkeleton, waveformBars.length]);

  // Memoize the rendered bars to avoid recalculating on every render
  // Only recalculate when progress, waveformBars, or theme colors change
  // IMPORTANT: This must be called before any conditional returns to satisfy Rules of Hooks
  const renderedBars = useMemo(() => {
    return waveformBars.map((barHeight, index) => {
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
                backgroundColor: isPlayed ? theme.colors.primary : theme.colors.textTertiary,
              },
            ]}
          />
        </TouchableOpacity>
      );
    });
  }, [progress, waveformBars, theme.colors.primary, theme.colors.textTertiary, styles, handlePress]);

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
      {renderedBars}
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
// Only re-render if progress changes by >= 0.5% or other props change meaningfully
export const AudioWaveform = memo(AudioWaveformComponent, (prevProps, nextProps) => {
  // Always re-render if loading state changes
  if (prevProps.isLoading !== nextProps.isLoading) {
    return false;
  }

  // Always re-render if amplitudes change (new track loaded)
  if (prevProps.amplitudes !== nextProps.amplitudes) {
    return false;
  }

  // Always re-render if duration changes (new track)
  if (prevProps.duration !== nextProps.duration) {
    return false;
  }

  // Always re-render if height changes
  if (prevProps.height !== nextProps.height) {
    return false;
  }

  // Skip updates during active seeking for better performance
  if (nextProps.isSeeking) {
    return true; // Don't re-render
  }

  // Only re-render if progress changes by >= 0.5% (0.005)
  // This reduces re-renders from 60fps to ~2fps during playback
  const progressDiff = Math.abs(nextProps.progress - prevProps.progress);
  if (progressDiff < 0.005) {
    return true; // Don't re-render (props are "equal")
  }

  // Re-render for significant progress changes
  return false;
});

const createStyles = (theme: Theme) => StyleSheet.create({
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
    paddingHorizontal: 0, // Removed padding to support high bar counts (240-480 bars)
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
  skeletonBar: {
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
  },
});

