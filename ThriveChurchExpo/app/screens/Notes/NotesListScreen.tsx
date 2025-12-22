/**
 * NotesListScreen
 * Master list view of both sermon notes and general notes
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Note, SermonNote } from '../../types/notes';
import { getSermonNotes, deleteSermonNote, getNotes, deleteNote } from '../../services/storage/storage';
import { setCurrentScreen } from '../../services/analytics/analyticsService';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { Ionicons } from '@expo/vector-icons';

type NotesStackParamList = {
  NotesList: undefined;
  NoteDetail: {
    noteId?: string;
    messageId?: string;
    messageTitle?: string;
    seriesTitle?: string;
    seriesArt?: string;
    speaker?: string;
    messageDate?: string;
    seriesId?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<NotesStackParamList>;

// Union type for both note types
interface SermonNoteCardProps {
  note: SermonNote;
  onPress: (note: SermonNote) => void;
  onDelete: (note: SermonNote) => void;
  isEditMode: boolean;
  theme: Theme;
  t: (key: string) => string;
}

interface GeneralNoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onDelete: (note: Note) => void;
  isEditMode: boolean;
  theme: Theme;
  t: (key: string) => string;
}

const SermonNoteCard: React.FC<SermonNoteCardProps> = ({ note, onPress, onDelete, isEditMode, theme, t }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const styles = createStyles(theme);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  // Extract preview from content - let numberOfLines handle truncation
  const getPreview = () => {
    const content = note.content.trim();
    if (!content) {
      return t('notes.list.tapToStart');
    }
    return content;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(note)}
    >
      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.cardContent}>
          {/* Series Art Thumbnail */}
          {note.seriesArt ? (
            <Image
              source={{ uri: note.seriesArt }}
              style={styles.seriesArt}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.seriesArt, styles.seriesArtPlaceholder]}>
              <Ionicons name="document-text" size={24} color={theme.colors.textSecondary} />
            </View>
          )}

          {/* Note Info */}
          <View style={styles.textContainer}>
            <Text style={styles.messageTitle} numberOfLines={1}>
              {note.messageTitle}
            </Text>
            <Text style={styles.seriesTitle} numberOfLines={1}>
              {note.seriesTitle || 'Sermon'} • {note.speaker}
            </Text>
            <Text style={styles.notePreview} numberOfLines={1}>
              {getPreview()}
            </Text>
            <Text style={styles.dateText}>
              {formatDate(note.messageDate)}
            </Text>
          </View>
        </View>

        {isEditMode && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(note)}
          >
            <Text style={styles.deleteButtonText}>{t('notes.list.delete')}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// General note card (no sermon context)
const GeneralNoteCard: React.FC<GeneralNoteCardProps> = ({ note, onPress, onDelete, isEditMode, theme, t }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const styles = createStyles(theme);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  // Extract preview from content - let numberOfLines handle truncation
  const getPreview = () => {
    const content = note.content.trim();
    if (!content) {
      return t('notes.list.tapToStart');
    }
    return content;
  };

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(note)}
    >
      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.cardContent}>
          {/* Note icon placeholder */}
          <View style={[styles.seriesArt, styles.seriesArtPlaceholder]}>
            <Ionicons name="document-text" size={24} color={theme.colors.textSecondary} />
          </View>

          {/* Note Info */}
          <View style={styles.textContainer}>
            {note.title ? (
              <>
                <Text style={styles.messageTitle} numberOfLines={1}>
                  {note.title}
                </Text>
                <Text style={styles.notePreview} numberOfLines={2}>
                  {getPreview()}
                </Text>
              </>
            ) : (
              <Text style={styles.notePreview} numberOfLines={4}>
                {getPreview()}
              </Text>
            )}
            <Text style={styles.dateText}>
              {formatDate(note.updatedAt)}
            </Text>
          </View>
        </View>

        {isEditMode && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(note)}
          >
            <Text style={styles.deleteButtonText}>{t('notes.list.delete')}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const NotesListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [sermonNotes, setSermonNotes] = useState<SermonNote[]>([]);
  const [generalNotes, setGeneralNotes] = useState<Note[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('NotesListScreen', 'NotesList');
  }, []);

  const loadNotes = useCallback(async () => {
    const [loadedSermonNotes, loadedGeneralNotes] = await Promise.all([
      getSermonNotes(),
      getNotes(),
    ]);
    setSermonNotes(loadedSermonNotes);
    setGeneralNotes(loadedGeneralNotes);
  }, []);

  // Load notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  // Combined notes list for display, sorted by most recent activity (createdAt or updatedAt)
  const allNotes = [
    ...sermonNotes.map(n => ({ ...n, type: 'sermon' as const })),
    ...generalNotes.map(n => ({ ...n, type: 'general' as const })),
  ].sort((a, b) => {
    const aRecent = Math.max(a.createdAt, a.updatedAt);
    const bRecent = Math.max(b.createdAt, b.updatedAt);
    return bRecent - aRecent; // Most recent first
  });
  const hasNotes = allNotes.length > 0;

  useEffect(() => {
    // Set up navigation buttons - only show edit when there are notes
    navigation.setOptions({
      headerLeft: hasNotes ? () => (
        <TouchableOpacity
          onPress={() => setIsEditMode(!isEditMode)}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>
            {isEditMode ? t('notes.list.done') : t('notes.list.edit')}
          </Text>
        </TouchableOpacity>
      ) : undefined,
      headerRight: undefined,
    });
  }, [navigation, isEditMode, hasNotes, t, styles]);

  const handleSermonNotePress = (note: SermonNote) => {
    if (!isEditMode) {
      navigation.navigate('NoteDetail', {
        noteId: note.id,
        messageId: note.messageId,
        messageTitle: note.messageTitle,
        seriesTitle: note.seriesTitle,
        seriesArt: note.seriesArt,
        speaker: note.speaker,
        messageDate: note.messageDate,
        seriesId: note.seriesId,
      });
    }
  };

  const handleGeneralNotePress = (note: Note) => {
    if (!isEditMode) {
      navigation.navigate('NoteDetail', {
        noteId: note.id,
        // No sermon context - general note
      });
    }
  };

  const handleDeleteSermonNote = useCallback((note: SermonNote) => {
    Alert.alert(
      t('notes.list.deleteTitle'),
      t('notes.list.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('notes.list.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteSermonNote(note.id);
            await loadNotes();
          },
        },
      ]
    );
  }, [t, loadNotes]);

  const handleDeleteGeneralNote = useCallback((note: Note) => {
    Alert.alert(
      t('notes.list.deleteTitle'),
      t('notes.list.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('notes.list.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteNote(note.id);
            await loadNotes();
          },
        },
      ]
    );
  }, [t, loadNotes]);

  const handleCreateGeneralNote = () => {
    // Check if there's already an empty general note - if so, open it instead of creating a new one
    const emptyNote = generalNotes.find(note => !note.content || note.content.trim() === '');
    if (emptyNote) {
      navigation.navigate('NoteDetail', { noteId: emptyNote.id });
    } else {
      // Navigate to create new general note (no messageId = general note)
      navigation.navigate('NoteDetail', {});
    }
  };

  const renderNote = ({ item }: { item: (SermonNote & { type: 'sermon' }) | (Note & { type: 'general' }) }) => {
    if (item.type === 'sermon') {
      return (
        <SermonNoteCard
          note={item}
          onPress={handleSermonNotePress}
          onDelete={handleDeleteSermonNote}
          isEditMode={isEditMode}
          theme={theme}
          t={t}
        />
      );
    } else {
      return (
        <GeneralNoteCard
          note={item}
          onPress={handleGeneralNotePress}
          onDelete={handleDeleteGeneralNote}
          isEditMode={isEditMode}
          theme={theme}
          t={t}
        />
      );
    }
  };

  const keyExtractor = (item: (SermonNote & { type: 'sermon' }) | (Note & { type: 'general' })) => item.id;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>{t('notes.list.emptyTitle')}</Text>
      <Text style={styles.emptyDescription}>{t('notes.list.emptyDescription')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={allNotes}
        renderItem={renderNote}
        keyExtractor={keyExtractor}
        contentContainerStyle={!hasNotes ? styles.emptyListContent : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
      />

      {/* FAB for creating general notes */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateGeneralNote}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={theme.colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: 12,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: theme.colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  seriesArt: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  seriesArtPlaceholder: {
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  messageTitle: {
    fontSize: 16,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.text,
    marginBottom: 2,
  },
  seriesTitle: {
    fontSize: 13,
    fontFamily: 'Avenir-Book',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  notePreview: {
    fontSize: 14,
    fontFamily: 'Avenir-Book',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Avenir-Book',
    color: theme.colors.textTertiary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontFamily: 'Avenir-Medium',
    textAlign: 'center',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Avenir-Medium',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    fontFamily: 'Avenir-Book',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

