/**
 * Message Played Service
 * Handles marking sermon messages as played via the API
 * 
 * This service is designed to be transparent to users - it works when possible
 * but never interrupts playback. All errors are logged but not thrown.
 */

import { api } from './client';

/**
 * Mark a sermon message as played
 * 
 * This function makes a fire-and-forget API call to track message playback.
 * It's designed to fail silently - if the API call fails for any reason
 * (network error, API error, etc.), it will log the error but not throw,
 * ensuring that playback is never interrupted.
 * 
 * @param messageId - The unique identifier of the message to mark as played
 * @returns Promise<void> - Resolves when the API call completes (or fails)
 */
export const markMessageAsPlayed = async (messageId: string): Promise<void> => {
  try {
    // Validate input
    if (!messageId || messageId.trim() === '') {
      console.warn('[MessagePlayed] Cannot mark message as played - no messageId provided');
      return;
    }

    console.log('[MessagePlayed] Marking message as played:', messageId);

    // Make GET request to mark message as played
    // Endpoint: /api/sermons/series/message/{messageId}/played
    await api.get(`/api/sermons/series/message/${messageId}/played`);

    console.log('[MessagePlayed] Successfully marked message as played:', messageId);
  } catch (error) {
    // Log error but don't throw - we never want to interrupt playback
    if (error && typeof error === 'object') {
      const err = error as any;
      if (err.response) {
        // API returned an error response
        console.warn('[MessagePlayed] API error response:', {
          messageId,
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
        });
      } else if (err.request) {
        // Request was made but no response received (network error)
        console.warn('[MessagePlayed] Network error - no response received for messageId:', messageId);
      } else {
        // Something else went wrong
        console.warn('[MessagePlayed] Error marking message as played:', {
          messageId,
          error: err.message,
        });
      }
    } else {
      console.warn('[MessagePlayed] Unknown error marking message as played:', {
        messageId,
        error,
      });
    }
    
    // Explicitly return to ensure the function completes without throwing
    return;
  }
};

