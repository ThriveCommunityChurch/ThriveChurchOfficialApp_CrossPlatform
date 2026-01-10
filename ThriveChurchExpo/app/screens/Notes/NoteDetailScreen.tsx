/**
 * NoteDetailScreen
 * Full-screen editor for viewing and editing notes (both sermon notes and general notes)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  Share,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getSermonNote,
  getSermonNoteByMessageId,
  createSermonNote,
  updateSermonNote,
  getNote,
  createNote,
  updateNote,
  CreateSermonNoteParams,
} from '../../services/storage/storage';
import { setCurrentScreen, logShareNote, logCustomEvent, logCreateNote } from '../../services/analytics/analyticsService';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { Ionicons } from '@expo/vector-icons';

type NotesStackParamList = {
  NotesList: undefined;
  NoteDetail: {
    noteId?: string;
    // Sermon note params (all optional for general notes)
    messageId?: string;
    messageTitle?: string;
    seriesTitle?: string;
    seriesArt?: string;
    speaker?: string;
    messageDate?: string;
    seriesId?: string;
  };
};

type NoteDetailRouteProp = RouteProp<NotesStackParamList, 'NoteDetail'>;
type NavigationProp = NativeStackNavigationProp<NotesStackParamList>;

export const NoteDetailScreen: React.FC = () => {
  const route = useRoute<NoteDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const {
    noteId,
    messageId,
    messageTitle,
    seriesTitle,
    seriesArt,
    speaker,
    messageDate,
    seriesId,
  } = route.params || {};
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  // Determine if this is a sermon note or general note
  const isSermonNote = !!messageId;

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [currentNoteId, setCurrentNoteId] = useState<string | undefined>(noteId);
  const [isSermonNoteType, setIsSermonNoteType] = useState(isSermonNote);
  const textInputRef = useRef<TextInput>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for cleanup effect to avoid stale closures
  const contentRef = useRef(content);
  const titleRef = useRef(title);
  const currentNoteIdRef = useRef(currentNoteId);
  const isSermonNoteTypeRef = useRef(isSermonNoteType);

  // Keep refs in sync with state
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    currentNoteIdRef.current = currentNoteId;
  }, [currentNoteId]);

  useEffect(() => {
    isSermonNoteTypeRef.current = isSermonNoteType;
  }, [isSermonNoteType]);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('NoteDetailScreen', 'NoteDetail');
    logCustomEvent(isSermonNote ? 'view_sermon_note' : 'view_general_note', {
      note_id: noteId,
      message_id: messageId,
      content_type: isSermonNote ? 'sermon_note' : 'general_note',
    });
  }, [noteId, messageId, isSermonNote]);

  useEffect(() => {
    // Load or create note
    const loadOrCreateNote = async () => {
      if (isSermonNote) {
        // Sermon note flow
        let note = null;

        // Try to load existing note by ID or messageId
        if (noteId) {
          note = await getSermonNote(noteId);
        }
        if (!note && messageId) {
          note = await getSermonNoteByMessageId(messageId);
        }

        if (note) {
          setContent(note.content);
          setCurrentNoteId(note.id);
          setIsSermonNoteType(true);
        } else {
          // Create new sermon note
          const params: CreateSermonNoteParams = {
            messageId: messageId!,
            seriesId,
            messageTitle: messageTitle || 'Untitled',
            seriesTitle,
            seriesArt,
            speaker: speaker || 'Unknown',
            messageDate: messageDate || new Date().toISOString(),
          };
          const newNote = await createSermonNote(params);
          setCurrentNoteId(newNote.id);
          setIsSermonNoteType(true);
          setContent('');

          // Track new sermon note creation
          logCreateNote(newNote.id);

          // Auto-focus for new notes
          setTimeout(() => {
            textInputRef.current?.focus();
          }, 300);
        }
      } else {
        // General note flow
        if (noteId) {
          // Load existing general note
          const note = await getNote(noteId);
          if (note) {
            setContent(note.content);
            setTitle(note.title || '');
            setCurrentNoteId(note.id);
            setIsSermonNoteType(false);
          }
        } else {
          // Create new general note
          const newNote = await createNote('');
          setCurrentNoteId(newNote.id);
          setIsSermonNoteType(false);
          setContent('');
          setTitle('');

          // Track new general note creation
          logCreateNote(newNote.id);

          // Auto-focus for new notes
          setTimeout(() => {
            textInputRef.current?.focus();
          }, 300);
        }
      }
    };
    loadOrCreateNote();
  }, [noteId, messageId, isSermonNote]);

  useEffect(() => {
    // Set up share button in header
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShare}
          style={styles.headerButton}
        >
          <Ionicons name="share-outline" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, content, t, theme]);

  const handleTextChange = (text: string) => {
    setContent(text);
    triggerDebouncedSave();
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    triggerDebouncedSave();
  };

  const triggerDebouncedSave = () => {
    // Debounced auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNoteContent();
    }, 500); // Save 500ms after user stops typing
  };

  const saveNoteContent = async () => {
    if (currentNoteId) {
      if (isSermonNoteType) {
        await updateSermonNote(currentNoteId, contentRef.current);
      } else {
        await updateNote(currentNoteId, contentRef.current, titleRef.current || undefined);
      }
    }
  };

  const handleShare = async () => {
    if (!content || content.trim() === '') {
      Alert.alert(t('notes.detail.emptyNote'), t('notes.detail.emptyNoteMessage'));
      return;
    }

    try {
      // Include context in shared content
      let shareContent = content;
      if (isSermonNoteType && messageTitle) {
        shareContent = `${messageTitle}\n${seriesTitle ? seriesTitle + ' • ' : ''}${speaker || ''}\n\n${content}`;
      } else if (!isSermonNoteType && title) {
        // Include title for general notes
        shareContent = `${title}\n\n${content}`;
      }
      await Share.share({
        message: shareContent,
      });

      // Track note share event
      if (currentNoteId) {
        await logShareNote(currentNoteId);
      }
    } catch (error) {
      console.error('Error sharing note:', error);
      Alert.alert(t('notes.detail.shareError'), t('notes.detail.shareErrorMessage'));
    }
  };

  // Save on unmount - use refs to get latest values and avoid stale closures
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Use refs to get the latest values
      const latestNoteId = currentNoteIdRef.current;
      const latestContent = contentRef.current;
      const latestTitle = titleRef.current;
      const latestIsSermonType = isSermonNoteTypeRef.current;

      if (latestNoteId) {
        // Save directly using refs instead of calling saveNoteContent
        if (latestIsSermonType) {
          updateSermonNote(latestNoteId, latestContent);
        } else {
          updateNote(latestNoteId, latestContent, latestTitle || undefined);
        }
      }
    };
  }, []); // Empty deps - runs only on unmount

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Sermon Header - only show for sermon notes */}
      {isSermonNoteType && messageTitle && (
        <View style={styles.sermonHeader}>
          {seriesArt ? (
            <Image source={{ uri: seriesArt }} style={styles.seriesArt} resizeMode="cover" />
          ) : (
            <View style={[styles.seriesArt, styles.seriesArtPlaceholder]}>
              <Ionicons name="document-text" size={24} color={theme.colors.textSecondary} />
            </View>
          )}
          <View style={styles.sermonInfo}>
            <Text style={styles.messageTitle} numberOfLines={2}>{messageTitle}</Text>
            <Text style={styles.seriesText} numberOfLines={1}>
              {seriesTitle || 'Sermon'} • {speaker || ''}
            </Text>
            <Text style={styles.dateText}>{formatDate(messageDate || '')}</Text>
          </View>
        </View>
      )}

      {/* Note Editor */}
      <ScrollView style={styles.editorContainer} keyboardShouldPersistTaps="handled">
        {/* Title input - only show for general notes */}
        {!isSermonNoteType && (
          <>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={handleTitleChange}
              placeholder={t('notes.detail.titlePlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="sentences"
              returnKeyType="next"
              onSubmitEditing={() => textInputRef.current?.focus()}
              blurOnSubmit={false}
            />
            <View style={styles.titleSeparator} />
          </>
        )}
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={content}
          onChangeText={handleTextChange}
          multiline
          placeholder={t('notes.detail.placeholder')}
          placeholderTextColor={theme.colors.textTertiary}
          textAlignVertical="top"
          autoCapitalize="sentences"
          autoCorrect
          spellCheck
          scrollEnabled={false}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  sermonHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  seriesArt: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  seriesArtPlaceholder: {
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sermonInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  messageTitle: {
    fontSize: 16,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.text,
    marginBottom: 2,
  },
  seriesText: {
    fontSize: 13,
    fontFamily: 'Avenir-Book',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Avenir-Book',
    color: theme.colors.textTertiary,
  },
  editorContainer: {
    flex: 1,
  },
  titleInput: {
    fontSize: 22,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  textInput: {
    fontSize: 17,
    fontFamily: 'AvenirNext-Regular',
    color: theme.colors.text,
    padding: 16,
    minHeight: 200,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

