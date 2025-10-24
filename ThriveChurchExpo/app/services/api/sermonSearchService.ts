/**
 * Sermon Search Service
 * Handles sermon search API endpoint for finding related series based on tags
 */

import { api } from './client';
import { 
  SermonSearchRequest, 
  SermonSearchResponse, 
  SearchTarget, 
  SortDirection,
  SermonSeries 
} from '../../types/api';

/**
 * Search for related sermon series based on tags
 * @param messageTags - Array of tag string names from the current message
 * @returns Promise<SermonSeries[]> - Array of related series
 */
export const searchRelatedSeries = async (
  messageTags: string[]
): Promise<SermonSeries[]> => {
  try {
    // Validate input
    if (!messageTags || messageTags.length === 0) {
      return [];
    }

    // Build request payload
    const requestPayload: SermonSearchRequest = {
      SearchTarget: SearchTarget.Series,
      SortDirection: SortDirection.Descending,
      Tags: messageTags,
    };

    // Make POST request
    const response = await api.post<SermonSearchResponse>(
      '/api/sermons/search',
      requestPayload
    );

    const series = response.data?.Series || [];

    // Return series array or empty array if no results
    return series;
  } catch (error) {
    console.error('[RelatedSeries] Error searching related series:', error);
    // Return empty array on error to gracefully handle failures
    return [];
  }
};

