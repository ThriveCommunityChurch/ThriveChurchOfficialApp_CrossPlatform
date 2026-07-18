/**
 * Deep Linking Configuration
 * Handles external URLs and routes them to correct screens
 */

import { LinkingOptions } from '@react-navigation/native';
import { deepLinkConfig } from '../config/app.config';
import { BIBLE_BOOKS } from '../data/bibleBooks';

/**
 * Deep linking configuration for React Navigation
 * Supports URLs like:
 * - thrivechurch://listen/series/123
 * - thrivechurch://bible/book/Genesis
 * - thrivechurch://notes/123
 * - https://thrive-fl.org/app/listen/series/123
 */
export const linking: LinkingOptions<any> = {
  prefixes: deepLinkConfig.prefixes,
  config: {
    screens: {
      // Listen Tab
      Listen: {
        screens: {
          ListenHome: 'listen',
          SeriesDetail: {
            path: 'listen/series/:seriesId',
            parse: {
              seriesId: (seriesId: string) => seriesId,
            },
          },
          SermonDetail: {
            path: 'listen/series/:seriesId/message/:messageId',
            parse: {
              seriesId: (seriesId: string) => seriesId,
              messageId: (messageId: string) => messageId,
            },
          },
          NowPlaying: 'listen/now-playing',
          RecentlyPlayed: 'listen/recently-played',
          Downloads: 'listen/downloads',
          Live: 'listen/live',
        },
      },
      // Bible Tab
      Bible: {
        screens: {
          BibleSelection: 'bible',
          BookList: {
            path: 'bible/:order',
            parse: {
              order: (order: string) => order,
            },
          },
        },
      },
      // Notes Tab
      Notes: {
        screens: {
          NotesList: 'notes',
          NoteDetail: {
            path: 'notes/:noteId',
            parse: {
              noteId: (noteId: string) => noteId,
            },
          },
        },
      },
      // Connect Tab
      Connect: {
        screens: {
          ConnectHome: 'connect',
          RSSAnnouncements: 'connect/announcements',
          RSSDetail: {
            path: 'connect/announcements/:date',
            parse: {
              date: (date: string) => date,
            },
          },
          WebViewForm: {
            path: 'connect/form/:title',
            parse: {
              title: (title: string) => decodeURIComponent(title),
            },
          },
          Events: 'connect/events',
          EventDetail: {
            path: 'connect/events/:eventId',
            parse: {
              eventId: (eventId: string) => eventId,
            },
          },
        },
      },
      // More Tab
      More: {
        screens: {
          MoreHome: 'more',
          Settings: 'more/settings',
          WebView: {
            path: 'more/:title',
            parse: {
              title: (title: string) => decodeURIComponent(title),
            },
          },
        },
      },
    },
  },
};

/**
 * Handle deep link navigation
 * Call this when a notification is opened or deep link is received
 */
export const handleDeepLink = (
  url: string,
  navigation: any
): void => {
  try {
    if (__DEV__) {
      console.log('Deep Link: Handling URL:', url);
    }

    // Parse URL
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Pre-resolve bible chapter deep links (needs a resolved book object)
    let chapterDeepLink: { book: (typeof BIBLE_BOOKS)[number]; chapter: number } | null = null;
    const chapterMatch = path.match(/\/bible\/chapter\/([^/]+)\/([^/]+)$/);
    if (chapterMatch) {
      const [, bookSlug, chapterStr] = chapterMatch;
      const book = BIBLE_BOOKS.find(
        (b) => b.slug.toLowerCase() === bookSlug.toLowerCase()
      );
      // Only resolve a fully-numeric chapter within the book's range; leave
      // invalid links (e.g. "3abc", "0", out-of-range) unresolved.
      const chapter = Number(chapterStr);
      if (book && Number.isInteger(chapter) && chapter >= 1 && chapter <= book.chapters) {
        chapterDeepLink = { book, chapter };
      }
    }

    // Listen tab deep links
    const sermonMatch = path.match(/\/listen\/series\/([^/]+)\/message\/([^/]+)/);
    if (sermonMatch) {
      const [, seriesId, messageId] = sermonMatch;
      navigation.navigate('Listen', {
        screen: 'SermonDetail',
        params: { seriesId, messageId },
      });
    } else if (path.includes('/listen/series/')) {
      const seriesId = path.split('/listen/series/')[1];
      navigation.navigate('Listen', {
        screen: 'SeriesDetail',
        params: { seriesId },
      });
    } else if (path.includes('/listen/now-playing')) {
      navigation.navigate('Listen', { screen: 'NowPlaying' });
    } else if (path.includes('/listen/recently-played')) {
      navigation.navigate('Listen', { screen: 'RecentlyPlayed' });
    } else if (path.includes('/listen/downloads')) {
      navigation.navigate('Listen', { screen: 'Downloads' });
    } else if (path.includes('/listen/live')) {
      navigation.navigate('Listen', { screen: 'Live' });
    } else if (path.includes('/listen')) {
      navigation.navigate('Listen', { screen: 'ListenHome' });
    }
    // Bible tab deep links
    else if (chapterDeepLink) {
      navigation.navigate('Bible', {
        screen: 'ChapterReader',
        params: { book: chapterDeepLink.book, chapter: chapterDeepLink.chapter },
      });
    }
    else if (path.includes('/bible/')) {
      const order = path.split('/bible/')[1];
      navigation.navigate('Bible', {
        screen: 'BookList',
        params: { order },
      });
    } else if (path.includes('/bible')) {
      navigation.navigate('Bible', { screen: 'BibleSelection' });
    }
    // Notes tab deep links
    else if (path.includes('/notes/')) {
      const noteId = path.split('/notes/')[1];
      navigation.navigate('Notes', {
        screen: 'NoteDetail',
        params: { noteId },
      });
    } else if (path.includes('/notes')) {
      navigation.navigate('Notes', { screen: 'NotesList' });
    }
    // Connect tab deep links
    else if (path.includes('/connect/events/')) {
      const eventId = path.split('/connect/events/')[1];
      navigation.navigate('Connect', {
        screen: 'EventDetail',
        params: { eventId },
      });
    } else if (path.includes('/connect/events')) {
      navigation.navigate('Connect', { screen: 'Events' });
    } else if (path.includes('/connect/announcements/')) {
      const date = path.split('/connect/announcements/')[1];
      navigation.navigate('Connect', {
        screen: 'RSSDetail',
        params: { date },
      });
    } else if (path.includes('/connect/announcements')) {
      navigation.navigate('Connect', { screen: 'RSSAnnouncements' });
    } else if (path.includes('/connect/form/')) {
      const title = decodeURIComponent(path.split('/connect/form/')[1]);
      navigation.navigate('Connect', {
        screen: 'WebViewForm',
        params: { title },
      });
    } else if (path.includes('/connect')) {
      navigation.navigate('Connect', { screen: 'ConnectHome' });
    }
    // More tab deep links
    else if (path.includes('/more/settings')) {
      navigation.navigate('More', { screen: 'Settings' });
    } else if (path.includes('/more/')) {
      const title = decodeURIComponent(path.split('/more/')[1]);
      navigation.navigate('More', {
        screen: 'WebView',
        params: { title },
      });
    } else if (path.includes('/more')) {
      navigation.navigate('More', { screen: 'MoreHome' });
    }
    // Default: go to Listen tab
    else {
      navigation.navigate('Listen', { screen: 'ListenHome' });
    }

    if (__DEV__) {
      console.log('Deep Link: Navigation completed');
    }
  } catch (error) {
    console.error('Deep Link: Error handling URL:', error);
    // Fallback to Listen tab
    navigation.navigate('Listen', { screen: 'ListenHome' });
  }
};

/**
 * Parse notification data and navigate
 */
export const handleNotificationNavigation = (
  data: any,
  navigation: any
): void => {
  try {
    if (__DEV__) {
      console.log('Deep Link: Handling notification data:', data);
    }

    // Check for deep link URL in notification data
    if (data.url) {
      handleDeepLink(data.url, navigation);
      return;
    }

    // Check for specific navigation params
    if (data.screen) {
      const { screen, tab, params } = data;

      if (tab) {
        navigation.navigate(tab, { screen, params });
      } else {
        navigation.navigate(screen, params);
      }
      return;
    }

    // Default: go to Listen tab
    navigation.navigate('Listen', { screen: 'ListenHome' });
  } catch (error) {
    console.error('Deep Link: Error handling notification navigation:', error);
    navigation.navigate('Listen', { screen: 'ListenHome' });
  }
};

/**
 * Share URL builders
 * Used by sermon/series screens to build shareable links
 */
export const buildSeriesShareUrl = (seriesId: string) =>
  `https://${deepLinkConfig.host}/app/listen/series/${seriesId}`;

export const buildSermonShareUrl = (seriesId: string, messageId: string) =>
  `https://${deepLinkConfig.host}/app/listen/series/${seriesId}/message/${messageId}`;

export default {
  linking,
  handleDeepLink,
  handleNotificationNavigation,
  buildSeriesShareUrl,
  buildSermonShareUrl,
};

