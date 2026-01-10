/**
 * Sermon Content Service
 * Handles fetching sermon notes and study guides from the API
 */

import { api } from './client';
import {
  SermonNotesResponse,
  StudyGuideResponse,
} from '../../types/api';

/**
 * Fetch AI-generated sermon notes for a message
 * @param messageId - The unique identifier of the message
 * @returns Promise<SermonNotesResponse | null> - Sermon notes or null if not available
 */
export const getSermonNotes = async (
  messageId: string
): Promise<SermonNotesResponse | null> => {
  try {
    console.log('[SermonContent] Fetching sermon notes for message:', messageId);

    const response = await api.get<SermonNotesResponse>(
      `/api/sermons/series/message/${messageId}/notes`
    );

    console.log('[SermonContent] Sermon notes fetched successfully:', {
      title: response.data?.Title,
      keyPointsCount: response.data?.KeyPoints?.length || 0,
      quotesCount: response.data?.Quotes?.length || 0,
      applicationPointsCount: response.data?.ApplicationPoints?.length || 0,
    });

    return response.data || null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log('[SermonContent] Sermon notes not available for message:', messageId);
      return null;
    }
    console.error('[SermonContent] Error fetching sermon notes:', error);
    throw error;
  }
};

/**
 * Fetch AI-generated study guide for a message
 * @param messageId - The unique identifier of the message
 * @returns Promise<StudyGuideResponse | null> - Study guide or null if not available
 */
export const getStudyGuide = async (
  messageId: string
): Promise<StudyGuideResponse | null> => {
  try {
    console.log('[SermonContent] Fetching study guide for message:', messageId);

    const response = await api.get<StudyGuideResponse>(
      `/api/sermons/series/message/${messageId}/study-guide`
    );

    console.log('[SermonContent] Study guide fetched successfully:', {
      title: response.data?.Title,
      keyPointsCount: response.data?.KeyPoints?.length || 0,
      scriptureRefsCount: response.data?.ScriptureReferences?.length || 0,
      illustrationsCount: response.data?.Illustrations?.length || 0,
      hasDevotional: !!response.data?.Devotional,
      estimatedTime: response.data?.EstimatedStudyTime,
    });

    return response.data || null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log('[SermonContent] Study guide not available for message:', messageId);
      return null;
    }
    console.error('[SermonContent] Error fetching study guide:', error);
    throw error;
  }
};

/**
 * Check if a feature is available for a message
 * @param availableFeatures - Array of available features from the message
 * @param feature - The feature to check ('Transcript' | 'Notes' | 'StudyGuide')
 * @returns boolean - True if the feature is available
 */
export const isFeatureAvailable = (
  availableFeatures: string[] | undefined,
  feature: 'Transcript' | 'Notes' | 'StudyGuide'
): boolean => {
  return availableFeatures?.includes(feature) ?? false;
};

