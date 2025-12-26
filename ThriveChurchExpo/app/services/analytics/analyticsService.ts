/**
 * Analytics Service
 * Wrapper for Firebase Analytics to match iOS implementation
 */

import analytics from '@react-native-firebase/analytics';
import { featureFlags } from '../../config/firebase.config';

/**
 * Analytics Events matching iOS implementation
 */
export const AnalyticsEvents = {
  APP_OPEN: 'app_open',
  APP_IN_BACKGROUND: 'app_in_background',
  TUTORIAL_BEGIN: 'tutorial_begin',
  TUTORIAL_COMPLETE: 'tutorial_complete',
  SELECT_CONTENT: 'select_content',
  VIEW_ITEM: 'view_item',
  PLAY_SERMON: 'play_sermon',
  DOWNLOAD_SERMON: 'download_sermon',
  // Enhanced download queue events
  DOWNLOAD_QUEUE_ADD: 'download_queue_add',
  DOWNLOAD_COMPLETE: 'download_complete',
  DOWNLOAD_FAILED: 'download_failed',
  CREATE_NOTE: 'create_note',
  SHARE_NOTE: 'share_note',
  VIEW_BIBLE: 'view_bible',
  PLAY_BIBLE_AUDIO: 'play_bible_audio',
  // Enhanced Bible event
  BIBLE_CHAPTER_READ: 'bible_chapter_read',
  CONTACT_CHURCH: 'contact_church',
  VIEW_ANNOUNCEMENTS: 'view_announcements',
  OPEN_SOCIAL: 'open_social',
} as const;

/**
 * Check if analytics is enabled
 */
const isAnalyticsEnabled = (): boolean => {
  return featureFlags.analytics;
};

/**
 * Log app open event
 * Matches iOS: Analytics.logEvent(AnalyticsEventAppOpen, ...)
 */
export const logAppOpen = async (): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: App Open (disabled by feature flag)');
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.APP_OPEN);
    console.log('Analytics: App Open');
  } catch (error) {
    console.error('Analytics error (logAppOpen):', error);
  }
};

/**
 * Log app in background event
 * Matches iOS: Analytics.logEvent(AnalyticsEventSelectContent, ...)
 */
export const logAppInBackground = async (): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: App In Background (disabled by feature flag)');
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.APP_IN_BACKGROUND);
    console.log('Analytics: App In Background');
  } catch (error) {
    console.error('Analytics error (logAppInBackground):', error);
  }
};

/**
 * Log tutorial begin event (onboarding start)
 * Matches iOS: Analytics.logEvent(AnalyticsEventTutorialBegin, ...)
 */
export const logTutorialBegin = async (): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Tutorial Begin (disabled by feature flag)');
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.TUTORIAL_BEGIN);
    console.log('Analytics: Tutorial Begin');
  } catch (error) {
    console.error('Analytics error (logTutorialBegin):', error);
  }
};

/**
 * Log tutorial complete event (onboarding complete)
 */
export const logTutorialComplete = async (): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Tutorial Complete (disabled by feature flag)');
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.TUTORIAL_COMPLETE);
    console.log('Analytics: Tutorial Complete');
  } catch (error) {
    console.error('Analytics error (logTutorialComplete):', error);
  }
};

/**
 * Log sermon play event
 */
export const logPlaySermon = async (sermonId: string, sermonTitle: string): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Play Sermon (disabled by feature flag):', sermonTitle);
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.PLAY_SERMON, {
      sermon_id: sermonId,
      sermon_title: sermonTitle,
      content_type: 'sermon',
    });
    console.log('Analytics: Play Sermon:', sermonTitle);
  } catch (error) {
    console.error('Analytics error (logPlaySermon):', error);
  }
};

/**
 * Log sermon download event
 */
export const logDownloadSermon = async (sermonId: string, sermonTitle: string): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Download Sermon (disabled by feature flag):', sermonTitle);
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.DOWNLOAD_SERMON, {
      sermon_id: sermonId,
      sermon_title: sermonTitle,
      content_type: 'sermon',
    });
    console.log('Analytics: Download Sermon:', sermonTitle);
  } catch (error) {
    console.error('Analytics error (logDownloadSermon):', error);
  }
};

/**
 * Parameters for enhanced download events
 */
export interface DownloadEventParams {
  messageId: string;
  seriesId?: string;
  networkType: 'wifi' | 'cellular' | 'unknown';
  wifiOnlySetting: boolean;
  fileSize?: number;
}

/**
 * Log download queue add event
 * Tracks when a sermon is added to the download queue
 */
export const logDownloadQueueAdd = async (params: DownloadEventParams): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Download Queue Add (disabled by feature flag):', params.messageId);
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.DOWNLOAD_QUEUE_ADD, {
      message_id: params.messageId,
      series_id: params.seriesId || '',
      network_type: params.networkType,
      wifi_only_setting: params.wifiOnlySetting,
      content_type: 'sermon',
    });
    console.log('Analytics: Download Queue Add:', params.messageId);
  } catch (error) {
    console.error('Analytics error (logDownloadQueueAdd):', error);
  }
};

/**
 * Log download complete event
 * Tracks successful download completion with metadata
 */
export const logDownloadComplete = async (params: DownloadEventParams): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Download Complete (disabled by feature flag):', params.messageId);
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.DOWNLOAD_COMPLETE, {
      message_id: params.messageId,
      series_id: params.seriesId || '',
      network_type: params.networkType,
      wifi_only_setting: params.wifiOnlySetting,
      file_size: params.fileSize || 0,
      content_type: 'sermon',
    });
    console.log('Analytics: Download Complete:', params.messageId);
  } catch (error) {
    console.error('Analytics error (logDownloadComplete):', error);
  }
};

/**
 * Log download failed event
 * Tracks download failures with error context
 */
export const logDownloadFailed = async (
  params: DownloadEventParams,
  errorReason: string
): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Download Failed (disabled by feature flag):', params.messageId);
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.DOWNLOAD_FAILED, {
      message_id: params.messageId,
      series_id: params.seriesId || '',
      network_type: params.networkType,
      wifi_only_setting: params.wifiOnlySetting,
      error_reason: errorReason.substring(0, 100), // Truncate long errors
      content_type: 'sermon',
    });
    console.log('Analytics: Download Failed:', params.messageId, errorReason);
  } catch (error) {
    console.error('Analytics error (logDownloadFailed):', error);
  }
};

/**
 * Log note creation event
 */
export const logCreateNote = async (noteId: string): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Create Note (disabled by feature flag)');
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.CREATE_NOTE, {
      note_id: noteId,
      content_type: 'note',
    });
    console.log('Analytics: Create Note');
  } catch (error) {
    console.error('Analytics error (logCreateNote):', error);
  }
};

/**
 * Log note share event
 */
export const logShareNote = async (noteId: string): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Share Note (disabled by feature flag)');
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.SHARE_NOTE, {
      note_id: noteId,
      content_type: 'note',
    });
    console.log('Analytics: Share Note');
  } catch (error) {
    console.error('Analytics error (logShareNote):', error);
  }
};

/**
 * Log Bible view event
 */
export const logViewBible = async (book: string): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: View Bible (disabled by feature flag):', book);
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.VIEW_BIBLE, {
      book: book,
      content_type: 'bible',
    });
    console.log('Analytics: View Bible:', book);
  } catch (error) {
    console.error('Analytics error (logViewBible):', error);
  }
};

/**
 * Log Bible audio play event
 */
export const logPlayBibleAudio = async (passage: string): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Play Bible Audio (disabled by feature flag):', passage);
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.PLAY_BIBLE_AUDIO, {
      passage: passage,
      content_type: 'bible_audio',
    });
    console.log('Analytics: Play Bible Audio:', passage);
  } catch (error) {
    console.error('Analytics error (logPlayBibleAudio):', error);
  }
};

/**
 * Log Bible chapter read event
 * Tracks when a user reads a Bible chapter/passage
 */
export const logBibleChapterRead = async (
  book: string,
  chapter?: number,
  reference?: string
): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Bible Chapter Read (disabled by feature flag):', book, chapter);
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.BIBLE_CHAPTER_READ, {
      book: book,
      chapter: chapter || 0,
      reference: reference || `${book}${chapter ? ' ' + chapter : ''}`,
      content_type: 'bible',
    });
    console.log('Analytics: Bible Chapter Read:', book, chapter);
  } catch (error) {
    console.error('Analytics error (logBibleChapterRead):', error);
  }
};

/**
 * Log contact church event
 */
export const logContactChurch = async (method: string): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Contact Church (disabled by feature flag):', method);
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.CONTACT_CHURCH, {
      method: method,
    });
    console.log('Analytics: Contact Church:', method);
  } catch (error) {
    console.error('Analytics error (logContactChurch):', error);
  }
};

/**
 * Log view announcements event
 */
export const logViewAnnouncements = async (): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: View Announcements (disabled by feature flag)');
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.VIEW_ANNOUNCEMENTS);
    console.log('Analytics: View Announcements');
  } catch (error) {
    console.error('Analytics error (logViewAnnouncements):', error);
  }
};

/**
 * Log open social event
 */
export const logOpenSocial = async (platform: string): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Open Social (disabled by feature flag):', platform);
    return;
  }

  try {
    await analytics().logEvent(AnalyticsEvents.OPEN_SOCIAL, {
      platform: platform,
    });
    console.log('Analytics: Open Social:', platform);
  } catch (error) {
    console.error('Analytics error (logOpenSocial):', error);
  }
};

/**
 * Log custom event
 */
export const logCustomEvent = async (
  eventName: string,
  params?: { [key: string]: any }
): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Custom event (disabled by feature flag):', eventName, params);
    return;
  }

  try {
    await analytics().logEvent(eventName, params);
    console.log('Analytics: Custom event:', eventName, params);
  } catch (error) {
    console.error('Analytics error (logCustomEvent):', error);
  }
};

/**
 * Set user ID for analytics
 */
export const setUserId = async (userId: string): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: User ID (disabled by feature flag):', userId);
    return;
  }

  try {
    await analytics().setUserId(userId);
    console.log('Analytics: User ID set:', userId);
  } catch (error) {
    console.error('Analytics error (setUserId):', error);
  }
};

/**
 * Set user property
 */
export const setUserProperty = async (name: string, value: string): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: User property (disabled by feature flag):', name, value);
    return;
  }

  try {
    await analytics().setUserProperty(name, value);
    console.log('Analytics: User property set:', name, value);
  } catch (error) {
    console.error('Analytics error (setUserProperty):', error);
  }
};

/**
 * Set current screen name
 */
export const setCurrentScreen = async (screenName: string, screenClass?: string): Promise<void> => {
  if (!isAnalyticsEnabled()) {
    console.log('Analytics: Screen view (disabled by feature flag):', screenName);
    return;
  }

  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
    console.log('Analytics: Screen view:', screenName);
  } catch (error) {
    console.error('Analytics error (setCurrentScreen):', error);
  }
};

export default {
  logAppOpen,
  logAppInBackground,
  logTutorialBegin,
  logTutorialComplete,
  logPlaySermon,
  logDownloadSermon,
  logDownloadQueueAdd,
  logDownloadComplete,
  logDownloadFailed,
  logCreateNote,
  logShareNote,
  logViewBible,
  logPlayBibleAudio,
  logBibleChapterRead,
  logContactChurch,
  logViewAnnouncements,
  logOpenSocial,
  logCustomEvent,
  setUserId,
  setUserProperty,
  setCurrentScreen,
};

