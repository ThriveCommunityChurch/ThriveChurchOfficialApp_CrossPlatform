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
}

const BookItem: React.FC<BookItemProps> = ({ book, onPress }) => {
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

const ItemSeparator = () => <View style={styles.separator} />;

export const BookListScreen: React.FC = () => {
  const route = useRoute<BookListRouteProp>();
  const { orderType } = route.params;
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
    <BookItem book={item} onPress={handleBookPress} />
  );

  const keyExtractor = (item: BibleBook) => item.slug;

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        renderItem={renderBook}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(27, 27, 27)', // #1B1B1B
  },
  listContent: {
    paddingVertical: 0,
  },
  bookItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgb(27, 27, 27)',
  },
  bookName: {
    fontSize: 16,
    fontFamily: 'Avenir-Medium',
    color: '#FFFFFF',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

