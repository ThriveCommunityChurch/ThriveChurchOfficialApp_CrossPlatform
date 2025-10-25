/**
 * Bible Deep Linking Utilities
 * Handles opening Bible passages in YouVersion app or browser
 */

import { Linking, Alert } from 'react-native';
import { getYouVersionUrl } from '../data/bibleBooks';
import { getBibleTranslation } from '../services/storage/storage';
import { DEFAULT_BIBLE_TRANSLATION } from '../types/settings';

/**
 * Open a Bible book in YouVersion app or browser
 * Uses the user's preferred Bible translation from settings
 * @param slug - Book slug (e.g., 'gen', 'mat')
 * @param bookName - Display name of the book for analytics
 */
export const openBibleBook = async (slug: string, bookName: string): Promise<void> => {
  // Load user's preferred translation
  const translation = await getBibleTranslation();
  const url = getYouVersionUrl(slug, translation || DEFAULT_BIBLE_TRANSLATION);

  try {
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);

      // TODO: Add analytics tracking when analytics service is implemented
      // Analytics.logEvent('bible_book_opened', {
      //   book_name: bookName,
      //   book_slug: slug,
      //   translation: translation?.name || 'ESV',
      //   url: url,
      // });
    } else {
      // Fallback: show alert if URL can't be opened
      Alert.alert(
        'Unable to Open',
        'Please install the YouVersion Bible app or check your internet connection.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Error opening Bible book:', error);
    Alert.alert(
      'Error',
      'Unable to open Bible passage. Please try again.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Check if YouVersion app is installed
 * Note: This may not work reliably on all platforms due to privacy restrictions
 */
export const isYouVersionInstalled = async (): Promise<boolean> => {
  try {
    const url = 'bible://';
    return await Linking.canOpenURL(url);
  } catch {
    return false;
  }
};

