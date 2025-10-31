import { Dimensions } from 'react-native';

/**
 * Calculate optimal bar count for current screen.
 * Returns 480, 240, 120, or 60 based on screen size.
 */
export function calculateOptimalBarCount(): number {
  const screenWidth = Dimensions.get('window').width;

  // Tablets: show all 480 bars
  if (screenWidth >= 768) return 480;

  // Large phones: show 240 bars
  if (screenWidth >= 390) return 240;

  // Regular phones: show 120 bars
  if (screenWidth >= 360) return 120;

  // Small phones: show 60 bars
  return 60;
}

/**
 * Downsample waveform using max value in each bucket.
 * This preserves peaks better than averaging.
 */
export function downsampleMax(data: number[], targetCount: number): number[] {
  if (data.length <= targetCount) {
    return data; // Already at or below target
  }

  const bucketSize = data.length / targetCount;
  const result: number[] = [];

  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.floor((i + 1) * bucketSize);

    // Find maximum value in this bucket
    let max = data[start];
    for (let j = start + 1; j < end; j++) {
      if (data[j] > max) {
        max = data[j];
      }
    }
    result.push(max);
  }

  return result;
}

/**
 * Adapt waveform data to current screen size.
 * Takes 480 values from API and downsamples to optimal count.
 */
export function adaptWaveformToScreen(waveformData: number[]): number[] {
  if (!waveformData || waveformData.length === 0) {
    return [];
  }

  const targetCount = calculateOptimalBarCount();

  // If already at target, return as-is
  if (waveformData.length === targetCount) {
    return waveformData;
  }

  // Downsample to target count
  return downsampleMax(waveformData, targetCount);
}

/**
 * Get debug info about current waveform adaptation.
 */
export function getWaveformAdaptationInfo(): {
  screenWidth: number;
  optimalBarCount: number;
  pixelsPerBar: number;
} {
  const screenWidth = Dimensions.get('window').width;
  const optimalBarCount = calculateOptimalBarCount();
  const pixelsPerBar = screenWidth / optimalBarCount;

  return { screenWidth, optimalBarCount, pixelsPerBar };
}
