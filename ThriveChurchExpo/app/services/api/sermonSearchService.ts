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
  SermonSeries,
  SermonMessage
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

/**
 * Search for sermon content (series or messages) based on tags
 * @param searchTarget - SearchTarget enum (Series or Message)
 * @param tags - Array of tag string names to search for
 * @param sortDirection - SortDirection enum (Ascending or Descending), defaults to Descending
 * @returns Promise<SermonSeries[] | SermonMessage[]> - Array of matching content
 */
export const searchContent = async (
  searchTarget: SearchTarget,
  tags: string[],
  sortDirection: SortDirection = SortDirection.Descending
): Promise<SermonSeries[] | SermonMessage[]> => {
  try {
    // Validate input
    if (!tags || tags.length === 0) {
      console.log('[Search] No tags provided, returning empty array');
      return [];
    }

    // Validate tags array size for very large requests
    if (tags.length > 100) {
      console.warn('[Search] Large number of tags provided:', tags.length);
    }

    // Build request payload
    const requestPayload: SermonSearchRequest = {
      SearchTarget: searchTarget,
      SortDirection: sortDirection,
      Tags: tags,
    };

    console.log('[Search] Searching content:', {
      target: searchTarget,
      sortDirection,
      tagCount: tags.length,
      tags: tags.slice(0, 5), // Log first 5 tags for debugging
    });

    // Make POST request
    const response = await api.post<SermonSearchResponse>(
      '/api/sermons/search',
      requestPayload
    );

    // Extract results based on search target
    let results: SermonSeries[] | SermonMessage[];

    if (searchTarget === SearchTarget.Series) {
      results = response.data?.Series || [];
      console.log('[Search] Series results:', {
        count: results.length,
        sortDirection,
        firstItem: results[0]?.Name,
        lastItem: results[results.length - 1]?.Name,
      });
    } else {
      results = response.data?.Messages || [];
      console.log('[Search] Message results:', {
        count: results.length,
        sortDirection,
        firstItem: results[0]?.Title,
        lastItem: results[results.length - 1]?.Title,
      });
    }

    // Handle very large result sets
    if (results.length > 500) {
      console.warn('[Search] Large result set returned:', results.length);
    }

    return results;
  } catch (error) {
    // Log detailed error information
    if (error && typeof error === 'object') {
      const err = error as any;
      if (err.response) {
        // API returned an error response
        console.error('[Search] API error response:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
        });
      } else if (err.request) {
        // Request was made but no response received (network error)
        console.error('[Search] Network error - no response received');
      } else {
        // Something else went wrong
        console.error('[Search] Error:', err.message);
      }
    } else {
      console.error('[Search] Unknown error:', error);
    }

    // Return empty array on error to gracefully handle failures
    // This ensures the UI can display the "No results found" state
    return [];
  }
};
