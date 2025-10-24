/**
 * BookListScreen
 * Displays list of Bible books in traditional or alphabetical order
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { BibleOrderType, BibleBook } from '../../types/bible';
import { getTraditionalBooks, getAlphabeticalBooks } from '../../data/bibleBooks';
import { openBibleBook } from '../../utils/bibleLinks';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../theme/types';

type BookListRouteParams = {
  BookList: {
    orderType: BibleOrderType;
    title: string;
  };
};

type BookListRouteProp = RouteProp<BookListRouteParams, 'BookList'>;

interface BookItemProps {
  book: BibleBook;
  onPress: (book: BibleBook) => void;
  theme: Theme;
}

const BookItem: React.FC<BookItemProps> = ({ book, onPress, theme }) => {
  const styles = createStyles(theme);
  return (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => onPress(book)}
      activeOpacity={0.7}
    >
      <Text style={styles.bookName}>{book.name}</Text>
    </TouchableOpacity>
  );
};

const ItemSeparator: React.FC<{ theme: Theme }> = ({ theme }) => {
  const styles = createStyles(theme);
  return <View style={styles.separator} />;
};

export const BookListScreen: React.FC = () => {
  const route = useRoute<BookListRouteProp>();
  const { orderType } = route.params;
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = React.useState(false);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('BookListScreen', 'BookList');
    logCustomEvent('view_book_list', {
      order_type: orderType,
      content_type: 'bible',
    });
  }, [orderType]);

  // Get books based on order type
  const books = React.useMemo(() => {
    return orderType === 'traditional'
      ? getTraditionalBooks()
      : getAlphabeticalBooks();
  }, [orderType]);

  const handleBookPress = async (book: BibleBook) => {
    setLoading(true);
    try {
      // Track book selection
      await logCustomEvent('select_bible_book', {
        book_name: book.name,
        book_slug: book.slug,
        order_type: orderType,
        content_type: 'bible',
      });

      await openBibleBook(book.slug, book.name);
    } finally {
      // Small delay to show loading state
      setTimeout(() => setLoading(false), 500);
    }
  };

  const renderBook = ({ item }: { item: BibleBook }) => (
    <BookItem book={item} onPress={handleBookPress} theme={theme} />
  );

  const keyExtractor = (item: BibleBook) => item.slug;

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        renderItem={renderBook}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={() => <ItemSeparator theme={theme} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle={theme.isDark ? "white" : "black"}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  listContent: {
    paddingVertical: 0,
  },
  bookItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  bookName: {
    fontSize: 16,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.separator, // ← ONLY COLOR CHANGED
    marginLeft: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlayMedium, // ← ONLY COLOR CHANGED
    justifyContent: 'center',
    alignItems: 'center',
  },
});

