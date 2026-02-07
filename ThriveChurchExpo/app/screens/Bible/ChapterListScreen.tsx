/**
 * ChapterListScreen
 * Displays grid of chapters for a selected Bible book
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BibleBook } from '../../types/bible';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../theme/types';

type ChapterListRouteParams = {
  ChapterList: {
    book: BibleBook;
  };
};

type ChapterListRouteProp = RouteProp<ChapterListRouteParams, 'ChapterList'>;

type NavigationProp = NativeStackNavigationProp<{
  ChapterReader: { book: BibleBook; chapter: number };
}>;

const NUM_COLUMNS = 5;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 16;
const ITEM_MARGIN = 8;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - ITEM_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface ChapterItemProps {
  chapter: number;
  onPress: (chapter: number) => void;
  theme: Theme;
}

const ChapterItem: React.FC<ChapterItemProps> = ({ chapter, onPress, theme }) => {
  const styles = createStyles(theme);
  return (
    <TouchableOpacity
      style={styles.chapterItem}
      onPress={() => onPress(chapter)}
      activeOpacity={0.7}
    >
      <Text style={styles.chapterNumber}>{chapter}</Text>
    </TouchableOpacity>
  );
};

export const ChapterListScreen: React.FC = () => {
  const route = useRoute<ChapterListRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { book } = route.params;
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Generate array of chapter numbers
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('ChapterListScreen', 'ChapterList');
    logCustomEvent('view_chapter_list', {
      book_name: book.name,
      book_slug: book.slug,
      chapter_count: book.chapters,
      testament: book.testament,
      content_type: 'bible',
    });
  }, [book]);

  const handleChapterPress = useCallback((chapter: number) => {
    logCustomEvent('select_bible_chapter', {
      book_name: book.name,
      book_slug: book.slug,
      chapter: chapter,
      content_type: 'bible',
    });

    navigation.navigate('ChapterReader', { book, chapter });
  }, [book, navigation]);

  const renderChapter = ({ item }: { item: number }) => (
    <ChapterItem chapter={item} onPress={handleChapterPress} theme={theme} />
  );

  const keyExtractor = (item: number) => item.toString();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.bookName}>{book.name}</Text>
        <Text style={styles.chapterCount}>{book.chapters} chapters</Text>
      </View>

      <FlatList
        data={chapters}
        renderItem={renderChapter}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle={theme.isDark ? 'white' : 'black'}
      />
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.separator,
  },
  bookName: {
    fontSize: 24,
    fontFamily: 'Avenir-Heavy',
    color: theme.colors.text,
  },
  chapterCount: {
    fontSize: 14,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  gridContent: {
    padding: GRID_PADDING,
  },
  chapterItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginRight: ITEM_MARGIN,
    marginBottom: ITEM_MARGIN,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chapterNumber: {
    fontSize: 18,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.text,
  },
});

