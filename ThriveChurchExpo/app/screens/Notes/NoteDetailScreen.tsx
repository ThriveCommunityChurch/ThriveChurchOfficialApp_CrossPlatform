/**
 * NoteDetailScreen
 * Full-screen editor for viewing and editing notes (both sermon notes and general notes)
 * Supports View mode (rendered Markdown) and Edit mode (raw text editing)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Markdown from 'react-native-markdown-display';
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
  const styles = useMemo(() => createStyles(theme), [theme]);
  const markdownStyles = useMemo(() => createMarkdownStyles(theme), [theme]);

  // Determine if this is a sermon note or general note
  const isSermonNote = !!messageId;

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [currentNoteId, setCurrentNoteId] = useState<string | undefined>(noteId);
  const [isSermonNoteType, setIsSermonNoteType] = useState(isSermonNote);
  // View mode: true = rendered Markdown, false = edit mode with TextInput
  // Default to edit mode for new notes, view mode for existing notes
  const [isViewMode, setIsViewMode] = useState(!!noteId);
  const [isNewNote, setIsNewNote] = useState(!noteId);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
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
          // Show view mode for existing notes with content
          setIsViewMode(note.content.trim().length > 0);
          setIsNewNote(false);
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
          // Edit mode for new notes
          setIsViewMode(false);
          setIsNewNote(true);

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
            // Show view mode for existing notes with content
            setIsViewMode(note.content.trim().length > 0);
            setIsNewNote(false);
          }
        } else {
          // Create new general note
          const newNote = await createNote('');
          setCurrentNoteId(newNote.id);
          setIsSermonNoteType(false);
          setContent('');
          setTitle('');
          // Edit mode for new notes
          setIsViewMode(false);
          setIsNewNote(true);

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

  // Toggle between view and edit modes
  const toggleViewMode = () => {
    if (isViewMode) {
      // Switching to edit mode - focus the input
      setIsViewMode(false);
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    } else {
      // Switching to view mode - save first
      saveNoteContent();
      setIsViewMode(true);
    }
  };

  useEffect(() => {
    // Set up header buttons: Markdown Help, View/Edit toggle, and Share
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          {/* Markdown Help Button */}
          <TouchableOpacity
            onPress={() => setShowMarkdownHelp(true)}
            style={styles.headerButton}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          {/* View/Edit Toggle - only show if there's content */}
          {content.trim().length > 0 && (
            <TouchableOpacity
              onPress={toggleViewMode}
              style={styles.headerButton}
            >
              <Ionicons
                name={isViewMode ? 'create-outline' : 'eye-outline'}
                size={22}
                color={theme.colors.text}
                style={{ marginTop: -3 }}
              />
            </TouchableOpacity>
          )}
          {/* Share Button */}
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerButton}
          >
            <Ionicons name="share-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, content, t, theme, isViewMode]);

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
              {messageId?.startsWith('bible-')
                ? (speaker || 'ESV Bible')
                : `${seriesTitle || 'Sermon'} • ${speaker || ''}`}
            </Text>
            <Text style={styles.dateText}>{formatDate(messageDate || '')}</Text>
          </View>
        </View>
      )}

      {/* Note Content - View Mode or Edit Mode */}
      {isViewMode && content.trim().length > 0 ? (
        // View Mode: Rendered Markdown
        <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
          {/* Title for general notes in view mode */}
          {!isSermonNoteType && title && (
            <Text style={styles.viewTitle}>{title}</Text>
          )}
          <View style={styles.markdownContainer}>
            <Markdown style={markdownStyles}>{content}</Markdown>
          </View>
          {/* Tap to edit hint */}
          <TouchableOpacity
            style={styles.editHintContainer}
            onPress={toggleViewMode}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.textTertiary} />
            <Text style={styles.editHintText}>{t('notes.detail.tapToEdit')}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // Edit Mode: TextInput
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
      )}

      {/* Markdown Help Modal */}
      <Modal
        visible={showMarkdownHelp}
        animationType="fade"
        transparent
        onRequestClose={() => setShowMarkdownHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.modalTitle}>{t('notes.markdownHelp.title')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowMarkdownHelp(false)}
                style={styles.modalCloseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>{t('notes.markdownHelp.description')}</Text>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Headers */}
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>{t('notes.markdownHelp.headers')}</Text>
                <View style={styles.helpExample}>
                  <Text style={styles.helpCode}># {t('notes.markdownHelp.headerExample1')}</Text>
                  <Text style={styles.helpCode}>## {t('notes.markdownHelp.headerExample2')}</Text>
                  <Text style={styles.helpCode}>### {t('notes.markdownHelp.headerExample3')}</Text>
                </View>
              </View>

              {/* Emphasis */}
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>{t('notes.markdownHelp.emphasis')}</Text>
                <View style={styles.helpExample}>
                  <Text style={styles.helpCode}>**{t('notes.markdownHelp.boldText')}**</Text>
                  <Text style={styles.helpCode}>*{t('notes.markdownHelp.italicText')}*</Text>
                </View>
              </View>

              {/* Lists */}
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>{t('notes.markdownHelp.lists')}</Text>
                <View style={styles.helpExample}>
                  <Text style={styles.helpCode}>- {t('notes.markdownHelp.bulletItem')}</Text>
                  <Text style={styles.helpCode}>1. {t('notes.markdownHelp.numberedItem')}</Text>
                </View>
              </View>

              {/* Quotes */}
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>{t('notes.markdownHelp.quotes')}</Text>
                <View style={styles.helpExample}>
                  <Text style={styles.helpCode}>&gt; {t('notes.markdownHelp.quoteExample')}</Text>
                </View>
              </View>

              {/* Links */}
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>{t('notes.markdownHelp.links')}</Text>
                <View style={styles.helpExample}>
                  <Text style={styles.helpCode}>[{t('notes.markdownHelp.linkText')}](url)</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowMarkdownHelp(false)}
            >
              <Text style={styles.modalDoneButtonText}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  // View Mode Styles
  viewContainer: {
    flex: 1,
    padding: 16,
  },
  viewTitle: {
    fontSize: 24,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.text,
    marginBottom: 16,
  },
  markdownContainer: {
    flex: 1,
  },
  editHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  editHintText: {
    fontSize: 14,
    fontFamily: 'Avenir-Book',
    color: theme.colors.textTertiary,
    marginLeft: 6,
  },
  // Edit Mode Styles
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.text,
    marginLeft: 10,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Avenir-Book',
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  helpSection: {
    marginBottom: 16,
  },
  helpSectionTitle: {
    fontSize: 14,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.text,
    marginBottom: 6,
  },
  helpExample: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
  },
  helpCode: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  modalDoneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneButtonText: {
    fontSize: 16,
    fontFamily: 'Avenir-Medium',
    color: theme.colors.textInverse,
  },
});

// Markdown styles for view mode
const createMarkdownStyles = (theme: Theme) => ({
  body: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'AvenirNext-Regular',
  },
  heading1: {
    color: theme.colors.text,
    fontSize: 24,
    fontFamily: 'Avenir-Medium',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: theme.colors.text,
    fontSize: 20,
    fontFamily: 'Avenir-Medium',
    marginTop: 16,
    marginBottom: 8,
  },
  heading3: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Avenir-Medium',
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 12,
  },
  strong: {
    fontFamily: 'Avenir-Medium',
    fontWeight: '600' as const,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  blockquote: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  list_item: {
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  code_inline: {
    backgroundColor: theme.colors.backgroundSecondary,
    color: theme.colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  fence: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  code_block: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: theme.colors.text,
  },
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline' as const,
  },
  hr: {
    backgroundColor: theme.colors.border,
    height: 1,
    marginVertical: 16,
  },
});

