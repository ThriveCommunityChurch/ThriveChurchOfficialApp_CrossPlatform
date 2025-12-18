/**
 * Waveform Service
 * Handles fetching pre-computed waveform data from the API
 * 
 * This service fetches waveform data on-demand when the NowPlayingScreen loads.
 * It's designed to fail gracefully - if the API call fails, the app will fall back
 * to on-device waveform extraction.
 */

import { api } from './client';

/**
 * Fetch pre-computed waveform data for a sermon message
 * 
 * This function fetches a 480-value waveform array from the server.
 * The endpoint returns a raw JSON array of floating-point numbers (not wrapped in an object).
 * 
 * @param messageId - The unique identifier of the message
 * @returns Promise<number[]> - Array of 480 amplitude values (0.15-1.0), or empty array on error
 */
export const fetchWaveformData = async (messageId: string): Promise<number[]> => {
  try {
    // Validate input
    if (!messageId || messageId.trim() === '') {
      console.warn('[WaveformService] Cannot fetch waveform - no messageId provided');
      return [];
    }

    console.log('[WaveformService] Fetching waveform data for message:', messageId);

    // Make GET request to fetch waveform data
    // Endpoint: /api/sermons/series/message/{messageId}/waveforms
    // Response: Raw JSON array of 480 numbers
    const response = await api.get<number[]>(`/api/sermons/series/message/${messageId}/waveforms`);

    const waveformData = response.data;

    // Validate response
    if (!Array.isArray(waveformData)) {
      console.warn('[WaveformService] Invalid response format - expected array, got:', typeof waveformData);
      return [];
    }

    if (waveformData.length === 0) {
      console.warn('[WaveformService] Empty waveform data returned for message:', messageId);
      return [];
    }

    // Validate that all values are numbers in expected range
    const invalidValues = waveformData.filter(v => typeof v !== 'number' || v < 0 || v > 1);
    if (invalidValues.length > 0) {
      console.warn('[WaveformService] Waveform contains invalid values:', {
        messageId,
        invalidCount: invalidValues.length,
        totalCount: waveformData.length,
      });
    }

    console.log('[WaveformService] Successfully fetched waveform data:', {
      messageId,
      valueCount: waveformData.length,
      sampleValues: waveformData.slice(0, 5),
    });

    return waveformData;
  } catch (error) {
    // Log error but don't throw - we want to fall back to on-device extraction
    if (error && typeof error === 'object') {
      const err = error as any;
      if (err.response) {
        // API returned an error response
        if (err.response.status === 404) {
          console.log('[WaveformService] No pre-computed waveform available for message:', messageId);
        } else {
          console.warn('[WaveformService] API error response:', {
            messageId,
            status: err.response.status,
            statusText: err.response.statusText,
          });
        }
      } else if (err.request) {
        // Request was made but no response received (network error)
        console.warn('[WaveformService] Network error - no response received for messageId:', messageId);
      } else {
        // Something else went wrong
        console.warn('[WaveformService] Error fetching waveform data:', {
          messageId,
          error: err.message,
        });
      }
    } else {
      console.warn('[WaveformService] Unknown error fetching waveform data:', {
        messageId,
        error,
      });
    }
    
    // Return empty array to trigger fallback to on-device extraction
    return [];
  }
};

