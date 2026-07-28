import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Alert, Linking, SafeAreaView, StatusBar } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewMessageEventNativeEvent } from 'react-native-webview';
import { useTheme } from '@react-navigation/native';
import { useChapterReader } from '../../hooks/useChapterReader';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { Chapter, ChapterReaderProps } from '../../types/chapter';
import { AudioPlayer, AudioPlayerProps } from '../components/AudioPlayer';
import { Header } from '../components/Header';
import { ChapterNavigation } from '../components/ChapterNavigation';
import { AudioControls } from '../components/AudioControls';
import { FontSizeControls } from '../components/FontSizeControls';
import { NightModeToggle } from '../components/NightModeToggle';
import { useNavigation, StackNavigationProp } from '@react-navigation/native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useNotes } from '../../hooks/useNotes';
import { Bookmark } from '../../types/bookmark';
import { Note } from '../../types/note';
import { FontSizeControls } from '../components/FontSizeControls';
import { NightModeToggle } from '../components/NightModeToggle';
import { AudioPlayer } from '../components/AudioPlayer';
import { Header } from '../components/Header';
import { ChapterNavigation } from '../components/ChapterNavigation';
import { AudioControls } from '../components/AudioControls';
import { FontSizeControls } from '../components/FontSizeControls';
import { NightModeToggle } from '../components/NightModeToggle';
import { BookmarkButton } from '../components/BookmarkButton';
import { NoteButton } from '../components/NoteButton';
import { HighlightButton } from '../components/HighlightButton';
import { useHighlight } from '../../hooks/useHighlight';
import { Highlight } from '../../types/highlight';

type ChapterReaderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChapterReader'>;

interface ChapterReaderScreenProps extends ChapterReaderProps {
  navigation: ChapterReaderScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'ChapterReader'>;
}

export const ChapterReaderScreen: React.FC<ChapterReaderScreenProps> = ({
  navigation,
  route,
}) => {
  const { chapterId, bookId, chapterNumber } = route.params;
  const { colors } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isNightMode, setIsNightMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showFontControls, setShowFontControls] = useState(false);
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [showBookmarkOptions, setShowBookmarkOptions] = useState(false);
  const [showNoteOptions, setShowNoteOptions] = useState(false);
  const [showHighlightOptions, setShowHighlightOptions] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectedTextRange, setSelectedTextRange] = useState<{ start: number; end: number } | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audioPlayerProps, setAudioPlayerProps] = useState<AudioPlayerProps | null>(null);

  const { chapter, loading: chapterLoading, error: chapterError, loadChapter, nextChapter, previousChapter, hasNextChapter, hasPreviousChapter } = useChapterReader({ chapterId, bookId, chapterNumber });
  const { progress, saveProgress, loading: progressLoading } = useReadingProgress({ chapterId, bookId });
  const { bookmarks, addBookmark, removeBookmark, loading: bookmarksLoading } = useBookmarks({ bookId, chapterId });
  const { notes, addNote, updateNote, deleteNote, loading: notesLoading } = useNotes({ bookId, chapterId });
  const { highlights, addHighlight, removeHighlight, loading: highlightsLoading } = useHighlight({ bookId, chapterId });

  const navigation = useNavigation<ChapterReaderScreenNavigationProp>();

  const loadChapterContent = useCallback(async () => {
    if (chapter) {
      setIsLoading(true);
      try {
        await loadChapter();
      } catch (error) {
        console.error('Failed to load chapter:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [chapter, loadChapter]);

  useEffect(() => {
    loadChapterContent();
  }, [loadChapterContent]);

  const onLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const onLoadEnd = useCallback(() => {
    setIsLoading(false);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        document.body.style.fontSize = '${fontSize}px';
        document.body.style.backgroundColor = '${isNightMode ? '#1a1a1a' : '#ffffff'}';
        document.body.style.color = '${isNightMode ? '#ffffff' : '#000000'}';
        document.body.style.lineHeight = '1.6';
        document.body.style.padding = '20px';
      `);
    }
  }, [fontSize, isNightMode]);

  const onLoad = useCallback(() => {
    setIsLoading(false);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        document.body.style.fontSize = '${fontSize}px';
        document.body.style.backgroundColor = '${isNightMode ? '#1a1a1a' : '#ffffff'}';
        document.body.style.color = '${isNightMode ? '#ffffff' : '#000000'}';
        document.body.style.lineHeight = '1.6';
        document.body.style.padding = '20px';
      `);
    }
  }, [fontSize, isNightMode]);

  const onNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
  }, []);

  const onShouldStartLoadWithRequest = useCallback((request: { url: string; isTopFrame: boolean }) => {
    const { url, isTopFrame } = request;
    if (isTopFrame && (url.startsWith('http://') || url.startsWith('https://'))) {
      Linking.openURL(url);
      return false;
    }
    return true;
  }, []);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    const { data } = event.nativeEvent;
    if (data?.type === 'textSelected') {
      setSelectedText(data.text);
      setSelectedTextRange({ start: data.start, end: data.end });
      setShowHighlightOptions(true);
    } else if (data?.type === 'scrollPosition') {
      saveProgress(data.position);
    }
  }, [saveProgress]);

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`document.body.style.fontSize = '${size}px';`);
    }
  };

  const handleNightModeToggle = (enabled: boolean) => {
    setIsNightMode(enabled);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        document.body.style.backgroundColor = '${enabled ? '#1a1a1a' : '#ffffff'}';
        document.body.style.color = '${enabled ? '#ffffff' : '#000000'}';
      `);
    }
  };

  const handleBookmarkPress = () => {
    if (chapter) {
      const existingBookmark = bookmarks.find(b => b.chapterId === chapter.id);
      if (existingBookmark) {
        removeBookmark(existingBookmark.id);
      } else {
        addBookmark({
          bookId: chapter.bookId,
          chapterId: chapter.id,
          chapterNumber: chapter.chapterNumber,
          bookName: chapter.bookName,
          chapterTitle: chapter.title,
        });
      }
    }
  };

  const handleNotePress = () => {
    if (selectedText && selectedTextRange) {
      setShowNoteOptions(true);
    }
  };

  const handleHighlightPress = () => {
    if (selectedText && selectedTextRange) {
      addHighlight({
        bookId: chapter?.bookId || '',
        chapterId: chapter?.id || '',
        text: selectedText,
        startOffset: selectedTextRange.start,
        endOffset: selectedTextRange.end,
        color: '#FFFF00',
      });
      setShowHighlightOptions(false);
      setSelectedText('');
      setSelectedTextRange(null);
    }
  };

  const handleAudioPress = () => {
    if (chapter?.audioUrl) {
      setAudioPlayerProps({
        audioUrl: chapter.audioUrl,
        chapterTitle: chapter.title,
        bookName: chapter.bookName,
        onClose: () => setShowAudioPlayer(false),
      });
      setShowAudioPlayer(true);
    } else {
      Alert.alert('Audio Not Available', 'Audio is not available for this chapter.');
    }
  };

  const handleNextChapter = () => {
    if (hasNextChapter) {
      nextChapter();
    }
  };

  const handlePreviousChapter = () => {
    if (hasPreviousChapter) {
      previousChapter();
    }
  };

  const renderChapterContent = () => {
    if (chapterLoading || isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading chapter...</Text>
        </View>
      );
    }

    if (chapterError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Failed to load chapter</Text>
          <Text style={[styles.errorDetail, { color: colors.textSecondary }]}>{chapterError}</Text>
        </View>
      );
    }

    if (!chapter) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Chapter not found</Text>
        </View>
      );
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: ${fontSize}px;
              line-height: 1.6;
              color: ${isNightMode ? '#ffffff' : '#000000'};
              background-color: ${isNightMode ? '#1a1a1a' : '#ffffff'};
              padding: 20px;
              margin: 0;
            }
            h1, h2, h3, h4, h5, h6 {
              color: ${isNightMode ? '#ffffff' : '#000000'};
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            p { margin-bottom: 1em; }
            a { color: ${colors.primary}; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .verse-number {
              font-size: 0.8em;
              vertical-align: super;
              color: ${colors.primary};
              font-weight: bold;
              margin-right: 4px;
            }
            .chapter-title {
              text-align: center;
              font-size: 1.5em;
              font-weight: bold;
              margin-bottom: 0.5em;
            }
            .chapter-subtitle {
              text-align: center;
              font-size: 1.1em;
              color: ${colors.textSecondary};
              margin-bottom: 1.5em;
            }
            .footnote {
              font-size: 0.85em;
              color: ${colors.textSecondary};
              border-top: 1px solid ${colors.border};
              padding-top: 1em;
              margin-top: 2em;
            }
          </style>
        </head>
        <body>
          <div class="chapter-title">${chapter.title}</div>
          <div class="chapter-subtitle">${chapter.bookName} ${chapter.chapterNumber}</div>
          ${chapter.content}
        </body>
      </html>
    `;

    return (
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onLoad={onLoad}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        style={styles.webView}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
      />
    );
  };

  const renderControls = () => {
    if (!showControls) return null;

    return (
      <View style={[styles.controlsContainer]}>
        <View style={styles.controlsRow}>
          <Header
            title={chapter?.title || 'Chapter'}
            onBackPress={() => navigation.goBack()}
            rightActions={[
              {
                icon: 'bookmark',
                onPress: handleBookmarkPress,
                active: bookmarks.some(b => b.chapterId === chapter?.id),
              },
              {
                icon: 'volume-2',
                onPress: handleAudioPress,
                disabled: !chapter?.audioUrl,
              },
            ]}
          />
        </View>
        <View style={styles.controlsRow}>
          <ChapterNavigation
            onPrevious={handlePreviousChapter}
            onNext={handleNextChapter}
            hasPrevious={hasPreviousChapter}
            hasNext={hasNextChapter}
            disabled={chapterLoading}
          />
        </View>
        <View style={styles.controlsRow}>
          <FontSizeControls
            fontSize={fontSize}
            onChange={handleFontSizeChange}
            show={showFontControls}
            onToggle={() => setShowFontControls(!showFontControls)}
          />
          <NightModeToggle
            enabled={isNightMode}
            onToggle={handleNightModeToggle}
          />
        </View>
      </View>
    );
  };

  const renderModals = () => (
    <>
      {showAudioPlayer && audioPlayerProps && (
        <AudioPlayer {...audioPlayerProps} />
      )}
      {showFontControls && (
        <FontSizeControls
          fontSize={fontSize}
          onChange={handleFontSizeChange}
          show={showFontControls}
          onClose={() => setShowFontControls(false)}
        />
      )}
      {showBookmarkOptions && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Bookmark Options</Text>
            <Text style={styles.modalText}>Bookmark functionality coming soon</Text>
            <View style={styles.modalButtons}>
              <Text style={styles.modalButton} onPress={() => setShowBookmarkOptions(false)}>Close</Text>
            </View>
          </View>
        </View>
      )}
      {showNoteOptions && selectedText && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Note</Text>
            <Text style={styles.modalText}>"{selectedText}"</Text>
            <NoteButton
              text={selectedText}
              range={selectedTextRange!}
              onClose={() => {
                setShowNoteOptions(false);
                setSelectedText('');
                setSelectedTextRange(null);
              }}
            />
          </View>
        </View>
      )}
      {showHighlightOptions && selectedText && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Highlight</Text>
            <Text style={styles.modalText}>"{selectedText}"</Text>
            <HighlightButton
              text={selectedText}
              range={selectedTextRange!}
              onClose={() => {
                setShowHighlightOptions(false);
                setSelectedText('');
                setSelectedTextRange(null);
              }}
            />
          </View>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isNightMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {renderChapterContent()}
      {renderControls()}
      {renderModals()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    textAlign: 'center',
  },
  webView: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    paddingBottom: 32,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    color: 'white',
    fontWeight: '600',
  },
});

export default ChapterReaderScreen;