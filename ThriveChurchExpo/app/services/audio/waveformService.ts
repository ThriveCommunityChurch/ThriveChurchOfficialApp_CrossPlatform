import { computeAmplitude, load } from 'react-native-audio-analyzer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WAVEFORM_CACHE_PREFIX = 'waveform_cache_';
const DEFAULT_SAMPLE_COUNT = 60; // Number of bars in waveform

interface WaveformCache {
  amplitudes: number[];
  timestamp: number;
}

/**
 * Service for extracting and caching audio waveform data
 */
class WaveformService {
  /**
   * Extract waveform amplitude data from an audio URL
   * @param audioUrl - URL of the audio file (can be remote or local)
   * @param sampleCount - Number of amplitude samples to extract (default: 60)
   * @returns Array of amplitude values between 0 and 1
   */
  async extractWaveform(
    audioUrl: string,
    sampleCount: number = DEFAULT_SAMPLE_COUNT
  ): Promise<number[]> {
    try {
      // Check cache first
      const cached = await this.getCachedWaveform(audioUrl);
      if (cached && cached.length === sampleCount) {
        console.log('[WaveformService] Using cached waveform for:', audioUrl);
        return cached;
      }

      console.log('[WaveformService] Extracting waveform for:', audioUrl);

      // Determine if URL is remote or local
      let filePath: string;
      if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
        // Download and cache remote file
        console.log('[WaveformService] Downloading remote audio file...');
        filePath = await load(audioUrl);
        console.log('[WaveformService] Downloaded to:', filePath);
      } else {
        // Use local file path directly
        filePath = audioUrl;
      }

      // Extract amplitude data
      console.log('[WaveformService] Computing amplitude data...');
      const rawAmplitudes = computeAmplitude(filePath, sampleCount);
      console.log('[WaveformService] Extracted', rawAmplitudes.length, 'amplitude values');

      // Normalize and scale the amplitudes to fill the available space
      const normalizedAmplitudes = this.normalizeAmplitudes(rawAmplitudes);
      console.log('[WaveformService] Normalized amplitude range:',
        Math.min(...normalizedAmplitudes).toFixed(3),
        'to',
        Math.max(...normalizedAmplitudes).toFixed(3)
      );

      // Cache the result
      await this.cacheWaveform(audioUrl, normalizedAmplitudes);

      return normalizedAmplitudes;
    } catch (error) {
      console.error('[WaveformService] Error extracting waveform:', error);
      // Return fallback waveform on error
      return this.generateFallbackWaveform(sampleCount);
    }
  }

  /**
   * Get cached waveform data for an audio URL
   */
  private async getCachedWaveform(audioUrl: string): Promise<number[] | null> {
    try {
      const cacheKey = this.getCacheKey(audioUrl);
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const data: WaveformCache = JSON.parse(cached);
        // Cache is valid for 30 days
        const isExpired = Date.now() - data.timestamp > 30 * 24 * 60 * 60 * 1000;
        
        if (!isExpired) {
          return data.amplitudes;
        } else {
          // Remove expired cache
          await AsyncStorage.removeItem(cacheKey);
        }
      }
      
      return null;
    } catch (error) {
      console.error('[WaveformService] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Cache waveform data for an audio URL
   */
  private async cacheWaveform(audioUrl: string, amplitudes: number[]): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(audioUrl);
      const data: WaveformCache = {
        amplitudes,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      console.log('[WaveformService] Cached waveform data');
    } catch (error) {
      console.error('[WaveformService] Error caching waveform:', error);
    }
  }

  /**
   * Generate cache key from audio URL
   */
  private getCacheKey(audioUrl: string): string {
    // Simple hash function for URL
    let hash = 0;
    for (let i = 0; i < audioUrl.length; i++) {
      const char = audioUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${WAVEFORM_CACHE_PREFIX}${Math.abs(hash)}`;
  }

  /**
   * Normalize amplitude values to fill the available space
   * Scales values to use the full 0-1 range while maintaining relative differences
   */
  private normalizeAmplitudes(amplitudes: number[]): number[] {
    if (amplitudes.length === 0) {
      return [];
    }

    // Find min and max values
    const min = Math.min(...amplitudes);
    const max = Math.max(...amplitudes);

    console.log('[WaveformService] Raw amplitude range:', min.toFixed(6), 'to', max.toFixed(6));

    // If all values are the same or very close, return uniform heights
    if (max - min < 0.0001) {
      console.log('[WaveformService] Uniform amplitudes detected, using default heights');
      return amplitudes.map(() => 0.7);
    }

    // Normalize to 0-1 range, then scale to use more of the available space
    // We use a minimum height of 0.15 (15%) and maximum of 1.0 (100%)
    const minHeight = 0.15;
    const maxHeight = 1.0;

    return amplitudes.map(value => {
      // Normalize to 0-1
      const normalized = (value - min) / (max - min);
      // Scale to minHeight-maxHeight range
      return minHeight + (normalized * (maxHeight - minHeight));
    });
  }

  /**
   * Generate a fallback waveform pattern when extraction fails
   */
  private generateFallbackWaveform(sampleCount: number): number[] {
    const bars = [];
    for (let i = 0; i < sampleCount; i++) {
      // Create a wave pattern with some variation
      const baseHeight = Math.sin(i / 5) * 0.3 + 0.5;
      const randomness = Math.random() * 0.3;
      bars.push(Math.min(1, Math.max(0.2, baseHeight + randomness)));
    }
    return bars;
  }

  /**
   * Clear all cached waveform data
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const waveformKeys = keys.filter(key => key.startsWith(WAVEFORM_CACHE_PREFIX));
      await AsyncStorage.multiRemove(waveformKeys);
      console.log('[WaveformService] Cleared', waveformKeys.length, 'cached waveforms');
    } catch (error) {
      console.error('[WaveformService] Error clearing cache:', error);
    }
  }
}

// Export singleton instance
export const waveformService = new WaveformService();

