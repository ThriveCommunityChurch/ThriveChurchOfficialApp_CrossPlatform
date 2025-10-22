/**
 * NotesListScreen
 * Master list view of notes with card design
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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Note } from '../../types/notes';
import { getNotes, createNote, deleteNote } from '../../services/storage/storage';

type NotesStackParamList = {
  NotesList: undefined;
  NoteDetail: { noteId: string };
};

type NavigationProp = NativeStackNavigationProp<NotesStackParamList>;

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onDelete: (note: Note) => void;
  isEditMode: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onDelete, isEditMode }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

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

  // Extract title and preview from content
  const getDisplayText = () => {
    const content = note.content.trim();
    
    if (!content || content === 'New Note') {
      return {
        title: 'New Note',
        preview: 'Tap to start writing...',
        isEmpty: true,
      };
    }

    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    const remainingLines = lines.slice(1).join(' ').trim();

    return {
      title: firstLine || 'Note',
      preview: remainingLines || null,
      isEmpty: false,
    };
  };

  const { title, preview, isEmpty } = getDisplayText();

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
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text
              style={[styles.noteTitle, isEmpty && styles.emptyNoteTitle]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {preview && (
              <Text style={styles.notePreview} numberOfLines={1}>
                {preview}
              </Text>
            )}
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
        
        {isEditMode && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(note)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const NotesListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const loadNotes = useCallback(async () => {
    const loadedNotes = await getNotes();
    setNotes(loadedNotes);
    
    // Auto-create first note if empty
    if (loadedNotes.length === 0) {
      const newNote = await createNote('');
      setNotes([newNote]);
    }
  }, []);

  // Load notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  useEffect(() => {
    // Set up navigation buttons
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setIsEditMode(!isEditMode)}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>
            {isEditMode ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleAddNote}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditMode]);

  const handleAddNote = async () => {
    const newNote = await createNote('');
    setNotes([newNote, ...notes]);
    navigation.navigate('NoteDetail', { noteId: newNote.id });
  };

  const handleNotePress = (note: Note) => {
    if (!isEditMode) {
      navigation.navigate('NoteDetail', { noteId: note.id });
    }
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNote(note.id);
            await loadNotes();
          },
        },
      ]
    );
  };

  const renderNote = ({ item }: { item: Note }) => (
    <NoteCard
      note={item}
      onPress={handleNotePress}
      onDelete={handleDeleteNote}
      isEditMode={isEditMode}
    />
  );

  const keyExtractor = (item: Note) => item.id;

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        renderItem={renderNote}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(25, 25, 25)', // almostBlack
  },
  listContent: {
    padding: 8,
  },
  card: {
    backgroundColor: 'rgb(63, 63, 63)', // darkGrey
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 72,
  },
  textContainer: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontFamily: 'Avenir-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptyNoteTitle: {
    color: '#D3D3D3',
  },
  notePreview: {
    fontSize: 14,
    fontFamily: 'Avenir-Book',
    color: '#D3D3D3',
  },
  chevron: {
    fontSize: 32,
    color: '#D3D3D3',
    marginLeft: 12,
    fontWeight: '300',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Avenir-Medium',
    textAlign: 'center',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Avenir-Medium',
  },
});

