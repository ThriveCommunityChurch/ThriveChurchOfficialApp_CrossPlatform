/**
 * ChapterReaderScreen
 * Displays a Bible chapter using WebView with ESV HTML content
 * Includes audio playback and note-taking functionality
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import TrackPlayer, { State } from 'react-native-track-player';
import { BibleBook } from '../../types/bible';
import { esvApiService } from '../../services/bible/esvApiService';
import { setupPlayer } from '../../services/audio/trackPlayerService';
import { setCurrentScreen, logCustomEvent, logBibleChapterRead, logPlayBibleAudio } from '../../services/analytics/analyticsService';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { BIBLE_BOOKS } from '../../data/bibleBooks';
import type { Theme } from '../../theme/types';

// ESV Bible reference image for control center and Now Playing screen
const ESV_REFERENCE_IMAGE = Image.resolveAssetSource(require('../../../assets/ESV_Reference.png'));

type ChapterReaderRouteParams = {
  ChapterReader: {
    book: BibleBook;
    chapter: number;
  };
};

type ChapterReaderRouteProp = RouteProp<ChapterReaderRouteParams, 'ChapterReader'>;
type NavigationProp = NativeStackNavigationProp<ChapterReaderRouteParams>;

/**
 * Generate CSS for the Bible reader WebView
 */
const getReaderCSS = (theme: Theme): string => `
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 18px;
    line-height: 1.8;
    color: ${theme.colors.text};
    background-color: ${theme.colors.background};
    padding: 16px;
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }
  h2 {
    font-family: -apple-system, 'Helvetica Neue', sans-serif;
    font-size: 24px;
    color: ${theme.colors.text};
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid ${theme.colors.separator};
  }
  h3, h4 {
    font-family: -apple-system, 'Helvetica Neue', sans-serif;
    font-size: 16px;
    color: ${theme.colors.textSecondary};
    margin: 24px 0 8px 0;
    font-weight: 600;
  }
  p { margin: 0 0 16px 0; }
  .verse-num, b.verse-num {
    font-family: -apple-system, sans-serif;
    font-size: 12px;
    font-weight: bold;
    color: ${theme.colors.primary};
    vertical-align: super;
    margin-right: 2px;
  }
  .chapter-num {
    font-family: -apple-system, sans-serif;
    font-size: 36px;
    font-weight: bold;
    color: ${theme.colors.primary};
    float: left;
    line-height: 1;
    margin-right: 8px;
    margin-top: 4px;
  }
  a { color: ${theme.colors.primary}; text-decoration: underline; }
  .block-indent { margin-left: 24px; }
  small { font-size: 14px; color: ${theme.colors.textSecondary}; }
  .copyright { font-size: 12px; color: ${theme.colors.textTertiary}; text-decoration: none; }
  .audio { display: none; }
`;

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, padding: 24 },
  webview: { flex: 1, backgroundColor: theme.colors.background },
  loadingText: { marginTop: 12, fontSize: 16, fontFamily: 'Avenir-Medium', color: theme.colors.textSecondary },
  errorText: { marginTop: 12, fontSize: 16, fontFamily: 'Avenir-Medium', color: theme.colors.error, textAlign: 'center' },
  retryButton: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: theme.colors.primary, borderRadius: 8 },
  retryButtonText: { fontSize: 16, fontFamily: 'Avenir-Medium', color: '#FFFFFF' },
  // Toolbar with audio and notes buttons
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: theme.colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.separator, gap: 24 },
  toolbarButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: theme.colors.primaryLight, borderRadius: 20, gap: 6 },
  toolbarButtonText: { fontSize: 14, fontFamily: 'Avenir-Medium', color: theme.colors.primary },
  // Navigation bar
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.separator },
  navButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  navButtonDisabled: { opacity: 0.5 },
  navButtonText: { fontSize: 16, fontFamily: 'Avenir-Medium', color: theme.colors.primary },
  navButtonTextDisabled: { color: theme.colors.textTertiary },
  chapterIndicator: { flex: 1, alignItems: 'center' },
  chapterIndicatorText: { fontSize: 16, fontFamily: 'Avenir-Medium', color: theme.colors.text },
  // Cross-reference modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontFamily: 'Avenir-Heavy', color: theme.colors.text, marginBottom: 6 },
  modalSubtitle: { fontSize: 14, fontFamily: 'Avenir-Medium', color: theme.colors.textSecondary, marginBottom: 20 },
  modalPassageList: { marginBottom: 12 },
  modalPassageItem: { paddingVertical: 16, paddingHorizontal: 18, backgroundColor: theme.colors.background, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.separator },
  modalPassageReference: { fontSize: 16, fontFamily: 'Avenir-Heavy', color: theme.colors.primary, marginBottom: 8 },
  modalPassageText: { fontSize: 15, fontFamily: 'Georgia', color: theme.colors.text, lineHeight: 22 },
  modalPassageLoading: { fontSize: 14, fontFamily: 'Avenir-Medium', color: theme.colors.textTertiary, fontStyle: 'italic' },
  modalGoButton: { marginTop: 12, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, backgroundColor: theme.colors.primaryLight, borderRadius: 8 },
  modalGoButtonText: { fontSize: 14, fontFamily: 'Avenir-Medium', color: theme.colors.primary },
  modalCloseButton: { paddingVertical: 14, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.separator, marginTop: 12 },
  modalCloseText: { fontSize: 16, fontFamily: 'Avenir-Medium', color: theme.colors.textSecondary },
});

export const ChapterReaderScreen: React.FC = () => {
  const route = useRoute<ChapterReaderRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { book, chapter } = route.params;
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const webViewRef = useRef<WebView>(null);

  const [loading, setLoading] = useState(true);
  const [html, setHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Cross-reference modal state
  const [crossRefModalVisible, setCrossRefModalVisible] = useState(false);
  const [crossRefPassages, setCrossRefPassages] = useState<Array<{ reference: string; text: string; loading: boolean }>>([]);
  const [crossRefLabel, setCrossRefLabel] = useState<string>('');

  // Get the chapter reference for audio/notes
  const chapterReference = `${book.name} ${chapter}`;

  const loadChapter = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await esvApiService.getChapterHtml(book.name, chapter);
      if (result.error) {
        setError(result.error);
      } else {
        setHtml(result.html);
      }
    } catch (err) {
      setError('Failed to load chapter');
    } finally {
      setLoading(false);
    }
  }, [book.name, chapter]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  useEffect(() => {
    setCurrentScreen('ChapterReaderScreen', 'ChapterReader');
    logCustomEvent('view_bible_chapter', {
      book_name: book.name,
      chapter: chapter,
      testament: book.testament,
      content_type: 'bible',
    });
    logBibleChapterRead(book.name, chapter);
  }, [book, chapter]);

  // Poll for playback state
  useEffect(() => {
    const checkPlaybackState = async () => {
      try {
        const state = await TrackPlayer.getPlaybackState();
        const currentTrack = await TrackPlayer.getActiveTrack();
        const isCurrentChapter = currentTrack?.id === `bible-${chapterReference}`;

        if (isCurrentChapter) {
          setIsPlaying(state.state === State.Playing);
          if (state.state === State.Playing || state.state === State.Paused) {
            setIsLoadingAudio(false);
          }
        } else {
          setIsPlaying(false);
        }
      } catch (err) {
        // Player not initialized
      }
    };

    const interval = setInterval(checkPlaybackState, 500);
    checkPlaybackState();

    return () => clearInterval(interval);
  }, [chapterReference]);

  // Handle audio playback
  const handlePlayAudio = useCallback(async () => {
    try {
      setIsLoadingAudio(true);

      // Check if ESV API is configured
      const apiStatus = esvApiService.getApiStatus();
      if (!apiStatus.isConfigured) {
        Alert.alert(
          t('biblePassage.esvApiNotConfigured'),
          t('biblePassage.esvApiMessage'),
          [{ text: t('biblePassage.ok') }]
        );
        setIsLoadingAudio(false);
        return;
      }

      // Track Bible audio play event
      await logPlayBibleAudio(chapterReference);

      // Get audio URL
      const audioUrl = esvApiService.getAudioUrl(chapterReference);
      const authHeaders = esvApiService.getAuthHeaders();

      // Setup player
      await setupPlayer();

      // Stop any current playback
      await TrackPlayer.reset();

      // Add track with authorization headers and ESV reference image
      await TrackPlayer.add({
        id: `bible-${chapterReference}`,
        url: audioUrl,
        title: chapterReference,
        artist: 'ESV Bible',
        artwork: ESV_REFERENCE_IMAGE.uri,
        headers: authHeaders,
      });

      // Play audio
      await TrackPlayer.play();

    } catch (err) {
      console.error('Error playing Bible audio:', err);
      setIsLoadingAudio(false);
      Alert.alert(
        t('biblePassage.audioPlaybackError'),
        t('biblePassage.unableToPlayAudio'),
        [{ text: t('biblePassage.ok') }]
      );
    }
  }, [chapterReference, t]);

  const handleStopAudio = useCallback(async () => {
    try {
      setIsLoadingAudio(false);
      await TrackPlayer.pause();
      setIsPlaying(false);
    } catch (err) {
      console.error('Error stopping audio:', err);
    }
  }, []);

  // Handle notes navigation
  const handleTakeNotes = useCallback(() => {
    logCustomEvent('take_bible_chapter_notes', {
      book_name: book.name,
      chapter: chapter,
      content_type: 'bible',
    });

    // Navigate to notes with Bible chapter context
    (navigation as any).navigate('Notes', {
      screen: 'NoteDetail',
      params: {
        messageId: `bible-${chapterReference}`,
        messageTitle: chapterReference,
        seriesTitle: 'ESV Bible',
        seriesArt: ESV_REFERENCE_IMAGE.uri,
        speaker: 'ESV Bible',
        messageDate: new Date().toISOString(),
        seriesId: `bible-${book.slug}`,
      },
    });
  }, [book, chapter, chapterReference, navigation]);

  // Fetch passage text for cross-references
  const fetchCrossRefPassages = useCallback(async (references: string[]) => {
    // Initialize with loading state
    const initialPassages = references.map(ref => ({
      reference: ref,
      text: '',
      loading: true,
    }));
    setCrossRefPassages(initialPassages);

    // Fetch each passage text
    const updatedPassages = await Promise.all(
      references.map(async (ref) => {
        try {
          const result = await esvApiService.getPassage(ref);
          let text = result.text || result.error || '';

          // Strip the passage reference from the beginning of the text
          // The API returns text like "2 Samuel 15:2 [2] And Absalom..."
          // We want just "And Absalom..." without the reference or verse number
          const canonical = result.canonical || ref;
          if (text.startsWith(canonical)) {
            text = text.substring(canonical.length).trim();
          }
          // Remove the verse number in brackets like [2], [16], etc.
          text = text.replace(/^\[\d+\]\s*/, '').trim();
          // Also remove the (ESV) copyright at the end (handle various formats)
          text = text.replace(/\s*\(ESV\)\s*$/i, '').trim();
          text = text.replace(/\s*ESV\s*$/i, '').trim();

          return {
            reference: canonical,
            text: text,
            loading: false,
          };
        } catch (err) {
          return {
            reference: ref,
            text: 'Unable to load passage',
            loading: false,
          };
        }
      })
    );

    setCrossRefPassages(updatedPassages);
  }, []);

  // Handle cross-reference link clicks - show modal with passage options
  const handleCrossReferenceUrl = useCallback((url: string): boolean => {
    // Only handle esv.org links (cross-references)
    if (!url.includes('esv.org')) {
      return true; // Allow other URLs to load
    }

    try {
      // Extract the passage reference from the URL
      // URL format: https://www.esv.org/Genesis+38%3A1/ or https://www.esv.org/John+3:16/
      const urlObj = new URL(url);
      const pathname = decodeURIComponent(urlObj.pathname);

      // Remove leading/trailing slashes and get the passage part
      const passageRef = pathname.replace(/^\/|\/$/g, '').replace(/\+/g, ' ');

      if (!passageRef || passageRef === 'copyright') {
        return false; // Block navigation for empty or copyright links
      }

      // The passageRef might contain multiple references separated by semicolons
      // e.g., "Genesis 37:25; Proverbs 7:16; Isaiah 23:18"
      const passages = passageRef.split(';').map(p => p.trim()).filter(p => p.length > 0);

      if (passages.length === 0) {
        return false;
      }

      // Log analytics
      logCustomEvent('tap_cross_reference', {
        from_book: book.name,
        from_chapter: chapter,
        references: passages.join(', '),
      });

      // Show modal and fetch passage text
      setCrossRefLabel(passages.length === 1 ? 'Cross Reference' : 'Cross References');
      setCrossRefModalVisible(true);
      fetchCrossRefPassages(passages);

      return false; // Block the WebView from loading the URL
    } catch (err) {
      console.error('Error parsing cross-reference URL:', err);
      return false; // Block the navigation on error
    }
  }, [book.name, chapter, fetchCrossRefPassages]);

  // Navigate to a passage from the cross-reference modal
  const navigateToPassage = useCallback((passageRef: string) => {
    // Parse the reference to extract book and chapter
    // Handles formats like: "Genesis 38:1", "1 John 3:16", "Psalm 23:1", "Genesis 38:1-3"
    const match = passageRef.match(/^(\d?\s?[A-Za-z]+)\s+(\d+)(?:[:\-].*)?$/);

    if (!match) {
      console.log('Could not parse passage reference:', passageRef);
      return;
    }

    const bookName = match[1].trim();
    const chapterNum = parseInt(match[2], 10);

    // Find the book in our BIBLE_BOOKS data
    const targetBook = BIBLE_BOOKS.find(b =>
      b.name.toLowerCase() === bookName.toLowerCase() ||
      b.name.toLowerCase().startsWith(bookName.toLowerCase())
    );

    if (!targetBook) {
      console.log('Book not found:', bookName);
      return;
    }

    // Validate chapter number
    if (chapterNum < 1 || chapterNum > targetBook.chapters) {
      console.log('Invalid chapter:', chapterNum, 'for book:', targetBook.name);
      return;
    }

    // Close modal and navigate
    setCrossRefModalVisible(false);
    navigation.setParams({ book: targetBook, chapter: chapterNum });
  }, [navigation]);

  const navigateToChapter = useCallback((newChapter: number) => {
    navigation.setParams({ chapter: newChapter });
  }, [navigation]);

  const goToPrevChapter = useCallback(() => {
    if (chapter > 1) {
      navigateToChapter(chapter - 1);
    } else {
      const currentIndex = BIBLE_BOOKS.findIndex(b => b.slug === book.slug);
      if (currentIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentIndex - 1];
        navigation.setParams({ book: prevBook, chapter: prevBook.chapters });
      }
    }
  }, [chapter, book, navigation, navigateToChapter]);

  const goToNextChapter = useCallback(() => {
    if (chapter < book.chapters) {
      navigateToChapter(chapter + 1);
    } else {
      const currentIndex = BIBLE_BOOKS.findIndex(b => b.slug === book.slug);
      if (currentIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentIndex + 1];
        navigation.setParams({ book: nextBook, chapter: 1 });
      }
    }
  }, [chapter, book, navigation, navigateToChapter]);

  const getThemedHtml = () => {
    const css = getReaderCSS(theme);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes"><style>${css}</style></head><body class="${theme.isDark ? 'dark' : 'light'}">${html}</body></html>`;
  };

  const canGoPrev = chapter > 1 || BIBLE_BOOKS.findIndex(b => b.slug === book.slug) > 0;
  const canGoNext = chapter < book.chapters || BIBLE_BOOKS.findIndex(b => b.slug === book.slug) < BIBLE_BOOKS.length - 1;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading {book.name} {chapter}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadChapter}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: getThemedHtml(), baseUrl: 'https://api.esv.org' }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        showsVerticalScrollIndicator={true}
        onShouldStartLoadWithRequest={(request) => {
          // Allow initial HTML load (about:blank, data:, or the baseUrl)
          if (
            request.url === 'about:blank' ||
            request.url.startsWith('data:') ||
            request.url === 'https://api.esv.org' ||
            request.url === 'https://api.esv.org/' ||
            request.isTopFrame === false
          ) {
            return true;
          }
          // Handle cross-reference links (esv.org URLs)
          if (request.url.includes('esv.org')) {
            return handleCrossReferenceUrl(request.url);
          }
          // Block any other external navigation
          return false;
        }}
      />
      {/* Toolbar with audio and notes buttons */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={isPlaying || isLoadingAudio ? handleStopAudio : handlePlayAudio}
        >
          <Ionicons
            name={isLoadingAudio ? 'hourglass' : isPlaying ? 'stop' : 'play'}
            size={18}
            color={theme.colors.primary}
          />
          <Text style={styles.toolbarButtonText}>
            {isLoadingAudio ? 'Loading...' : isPlaying ? 'Stop' : 'Listen'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleTakeNotes}>
          <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.toolbarButtonText}>Take Notes</Text>
        </TouchableOpacity>
      </View>
      {/* Navigation bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={[styles.navButton, !canGoPrev && styles.navButtonDisabled]} onPress={goToPrevChapter} disabled={!canGoPrev}>
          <Ionicons name="chevron-back" size={24} color={canGoPrev ? theme.colors.primary : theme.colors.textTertiary} />
          <Text style={[styles.navButtonText, !canGoPrev && styles.navButtonTextDisabled]}>Prev</Text>
        </TouchableOpacity>
        <View style={styles.chapterIndicator}>
          <Text style={styles.chapterIndicatorText}>{book.name} {chapter}</Text>
        </View>
        <TouchableOpacity style={[styles.navButton, !canGoNext && styles.navButtonDisabled]} onPress={goToNextChapter} disabled={!canGoNext}>
          <Text style={[styles.navButtonText, !canGoNext && styles.navButtonTextDisabled]}>Next</Text>
          <Ionicons name="chevron-forward" size={24} color={canGoNext ? theme.colors.primary : theme.colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Cross-reference Modal */}
      <Modal
        visible={crossRefModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCrossRefModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setCrossRefModalVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{crossRefLabel}</Text>
            <Text style={styles.modalSubtitle}>Tap "Read Chapter" to navigate</Text>
            <ScrollView
              style={styles.modalPassageList}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {crossRefPassages.map((passage, index) => (
                <View key={index} style={styles.modalPassageItem}>
                  <Text style={styles.modalPassageReference}>{passage.reference}</Text>
                  {passage.loading ? (
                    <Text style={styles.modalPassageLoading}>Loading...</Text>
                  ) : (
                    <Text style={styles.modalPassageText} numberOfLines={4}>
                      {passage.text}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.modalGoButton}
                    onPress={() => navigateToPassage(passage.reference)}
                  >
                    <Text style={styles.modalGoButtonText}>Read Chapter →</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCrossRefModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

