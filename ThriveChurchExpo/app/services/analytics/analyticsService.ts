/**
 * Analytics Service
 * Wrapper for Firebase Analytics to match iOS implementation
 *
 * NOTE: Firebase Analytics temporarily disabled due to Expo SDK 54 compatibility issues
 * TODO: Re-enable when upgrading to compatible version or downgrading React Native Firebase
 */

// import analytics from '@react-native-firebase/analytics';

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
  CREATE_NOTE: 'create_note',
  SHARE_NOTE: 'share_note',
  VIEW_BIBLE: 'view_bible',
  CONTACT_CHURCH: 'contact_church',
  VIEW_ANNOUNCEMENTS: 'view_announcements',
  OPEN_SOCIAL: 'open_social',
} as const;

/**
 * Log app open event
 * Matches iOS: Analytics.logEvent(AnalyticsEventAppOpen, ...)
 */
export const logAppOpen = async (): Promise<void> => {
  // Firebase Analytics temporarily disabled
  console.log('Analytics: App Open (disabled)');
};

/**
 * Log app in background event
 * Matches iOS: Analytics.logEvent(AnalyticsEventSelectContent, ...)
 */
export const logAppInBackground = async (): Promise<void> => {
  console.log('Analytics: App In Background (disabled)');
};

/**
 * Log tutorial begin event (onboarding start)
 * Matches iOS: Analytics.logEvent(AnalyticsEventTutorialBegin, ...)
 */
export const logTutorialBegin = async (): Promise<void> => {
  console.log('Analytics: Tutorial Begin (disabled)');
};

/**
 * Log tutorial complete event (onboarding complete)
 */
export const logTutorialComplete = async (): Promise<void> => {
  console.log('Analytics: Tutorial Complete (disabled)');
};

/**
 * Log sermon play event
 */
export const logPlaySermon = async (sermonId: string, sermonTitle: string): Promise<void> => {
  console.log('Analytics: Play Sermon (disabled):', sermonTitle);
};

/**
 * Log sermon download event
 */
export const logDownloadSermon = async (sermonId: string, sermonTitle: string): Promise<void> => {
  console.log('Analytics: Download Sermon (disabled):', sermonTitle);
};

/**
 * Log note creation event
 */
export const logCreateNote = async (noteId: string): Promise<void> => {
  console.log('Analytics: Create Note (disabled)');
};

/**
 * Log note share event
 */
export const logShareNote = async (noteId: string): Promise<void> => {
  console.log('Analytics: Share Note (disabled)');
};

/**
 * Log Bible view event
 */
export const logViewBible = async (book: string): Promise<void> => {
  console.log('Analytics: View Bible (disabled):', book);
};

/**
 * Log contact church event
 */
export const logContactChurch = async (method: string): Promise<void> => {
  console.log('Analytics: Contact Church (disabled):', method);
};

/**
 * Log view announcements event
 */
export const logViewAnnouncements = async (): Promise<void> => {
  console.log('Analytics: View Announcements (disabled)');
};

/**
 * Log open social event
 */
export const logOpenSocial = async (platform: string): Promise<void> => {
  console.log('Analytics: Open Social (disabled):', platform);
};

/**
 * Log custom event
 */
export const logCustomEvent = async (
  eventName: string,
  params?: { [key: string]: any }
): Promise<void> => {
  console.log('Analytics: Custom event (disabled):', eventName, params);
};

/**
 * Set user ID for analytics
 */
export const setUserId = async (userId: string): Promise<void> => {
  console.log('Analytics: User ID (disabled):', userId);
};

/**
 * Set user property
 */
export const setUserProperty = async (name: string, value: string): Promise<void> => {
  console.log('Analytics: User property (disabled):', name, value);
};

/**
 * Set current screen name
 */
export const setCurrentScreen = async (screenName: string, screenClass?: string): Promise<void> => {
  console.log('Analytics: Screen view (disabled):', screenName);
};

export default {
  logAppOpen,
  logAppInBackground,
  logTutorialBegin,
  logTutorialComplete,
  logPlaySermon,
  logDownloadSermon,
  logCreateNote,
  logShareNote,
  logViewBible,
  logContactChurch,
  logViewAnnouncements,
  logOpenSocial,
  logCustomEvent,
  setUserId,
  setUserProperty,
  setCurrentScreen,
};

