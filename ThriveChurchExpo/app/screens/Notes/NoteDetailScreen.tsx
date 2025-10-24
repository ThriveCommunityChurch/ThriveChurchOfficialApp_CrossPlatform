/**
 * NoteDetailScreen
 * Full-screen editor for viewing and editing notes
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
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getNote, updateNote } from '../../services/storage/storage';
import { setCurrentScreen, logShareNote, logCustomEvent } from '../../services/analytics/analyticsService';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../theme/types';

type NotesStackParamList = {
  NotesList: undefined;
  NoteDetail: { noteId: string };
};

type NoteDetailRouteProp = RouteProp<NotesStackParamList, 'NoteDetail'>;
type NavigationProp = NativeStackNavigationProp<NotesStackParamList>;

export const NoteDetailScreen: React.FC = () => {
  const route = useRoute<NoteDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { noteId } = route.params;
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [content, setContent] = useState('');
  const textInputRef = useRef<TextInput>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('NoteDetailScreen', 'NoteDetail');
    logCustomEvent('view_note', {
      note_id: noteId,
      content_type: 'note',
    });
  }, [noteId]);

  useEffect(() => {
    // Load note content
    const loadNote = async () => {
      const note = await getNote(noteId);
      if (note) {
        // Don't show "New Note" placeholder in editor
        const displayContent = note.content === 'New Note' ? '' : note.content;
        setContent(displayContent);

        // Auto-focus for new notes
        if (!note.content || note.content === 'New Note') {
          setTimeout(() => {
            textInputRef.current?.focus();
          }, 300);
        }
      }
    };
    loadNote();
  }, [noteId]);

  useEffect(() => {
    // Set up share button in header
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShare}
          style={styles.headerButton}
        >
          <Text style={styles.shareIcon}>⤴</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, content]);

  const handleTextChange = (text: string) => {
    setContent(text);
    
    // Debounced auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(text);
    }, 500); // Save 500ms after user stops typing
  };

  const saveNote = async (text: string) => {
    // Save empty notes as "New Note" to match iOS behavior
    const contentToSave = text.trim() === '' ? 'New Note' : text;
    await updateNote(noteId, contentToSave);
  };

  const handleShare = async () => {
    if (!content || content.trim() === '') {
      Alert.alert('Empty Note', 'There is no content to share.');
      return;
    }

    try {
      await Share.share({
        message: content,
      });

      // Track note share event
      await logShareNote(noteId);
    } catch (error) {
      console.error('Error sharing note:', error);
      Alert.alert('Error', 'Unable to share note. Please try again.');
    }
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveNote(content);
    };
  }, [content]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.editorContainer}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={content}
          onChangeText={handleTextChange}
          multiline
          placeholder="Start typing..."
          placeholderTextColor="#999999"
          textAlignVertical="top"
          autoCapitalize="sentences"
          autoCorrect
          spellCheck

        />
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
  },
  editorContainer: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'AvenirNext-Regular',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    padding: 16,
    textAlignVertical: 'top',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shareIcon: {
    fontSize: 22,
    color: theme.colors.card, // ← ONLY COLOR CHANGED (icon on header button)
  },
});

