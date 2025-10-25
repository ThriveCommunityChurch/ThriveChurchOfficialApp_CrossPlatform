import AsyncStorage from '@react-native-async-storage/async-storage';
import { SermonMessage } from '../../types/api';
import { Note } from '../../types/notes';
import { ConfigSetting } from '../../types/config';
import { BibleTranslation, ThemeMode, DEFAULT_BIBLE_TRANSLATION } from '../../types/settings';

// Storage wrapper using AsyncStorage
// All operations are async to properly handle AsyncStorage's async nature

let storageInitError: Error | null = null;
let isInitialized = true;

try {
  console.log('AsyncStorage initialized successfully');
} catch (error) {
  storageInitError = error instanceof Error ? error : new Error('Failed to initialize AsyncStorage');
  console.error('AsyncStorage initialization failed:', storageInitError);
  isInitialized = false;
}

// Helper to check if storage is available
const isStorageAvailable = (): boolean => {
  if (!isInitialized) {
    console.warn('AsyncStorage is not available:', storageInitError?.message);
    return false;
  }
  return true;
};

// Export storage availability status (keeping same API as MMKV)
export const isMMKVAvailable = (): boolean => isStorageAvailable();
export const getMMKVError = (): Error | null => storageInitError;

// Storage Keys
export const StorageKeys = {
  RECENTLY_PLAYED: 'recentlyPlayed',
  DOWNLOADED_MESSAGES: 'downloadedMessages',
  DOWNLOADED_MESSAGE_IDS: 'downloadedMessageIds',
  API_DOMAIN: 'apiDomain',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  DOWNLOAD_QUEUE: 'downloadQueue',
  NOTES: 'notes',
  THEME_MODE: 'themeMode',
  BIBLE_TRANSLATION: 'bibleTranslation',
} as const;

// Recently Played Functions
export const getRecentlyPlayed = async (): Promise<SermonMessage[]> => {
  if (!isStorageAvailable()) return [];

  try {
    const data = await AsyncStorage.getItem(StorageKeys.RECENTLY_PLAYED);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading recently played:', error);
    return [];
  }
};

export const addToRecentlyPlayed = async (message: SermonMessage, seriesArt?: string): Promise<void> => {
  if (!isStorageAvailable()) return;

  try {
    const recentlyPlayed = await getRecentlyPlayed();

    // Create a new message object with series art and timestamp
    const messageWithMetadata: SermonMessage = {
      ...message,
      previouslyPlayed: Date.now(),
      seriesArt: seriesArt,
    };

    // Remove if already exists (to avoid duplicates)
    const filtered = recentlyPlayed.filter(m => m.MessageId !== message.MessageId);

    // Add to beginning of array
    const updated = [messageWithMetadata, ...filtered];

    // Keep only the last 50 items
    const trimmed = updated.slice(0, 50);

    await AsyncStorage.setItem(StorageKeys.RECENTLY_PLAYED, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error adding to recently played:', error);
  }
};

export const clearRecentlyPlayed = async (): Promise<void> => {
  if (!isStorageAvailable()) return;

  try {
    await AsyncStorage.removeItem(StorageKeys.RECENTLY_PLAYED);
  } catch (error) {
    console.error('Error clearing recently played:', error);
  }
};

// Downloaded Messages Functions
export const getDownloadedMessageIds = async (): Promise<string[]> => {
  if (!isStorageAvailable()) return [];

  try {
    const data = await AsyncStorage.getItem(StorageKeys.DOWNLOADED_MESSAGE_IDS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading downloaded message IDs:', error);
    return [];
  }
};

export const getDownloadedMessage = async (messageId: string): Promise<SermonMessage | null> => {
  if (!isStorageAvailable()) return null;

  try {
    const data = await AsyncStorage.getItem(`message_${messageId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading downloaded message:', error);
    return null;
  }
};

export const getAllDownloadedMessages = async (): Promise<SermonMessage[]> => {
  try {
    const ids = await getDownloadedMessageIds();
    const messages: SermonMessage[] = [];
    
    for (const id of ids) {
      const message = await getDownloadedMessage(id);
      if (message) {
        messages.push(message);
      }
    }
    
    // Sort by download date (most recent first)
    return messages.sort((a, b) => (b.DownloadedOn || 0) - (a.DownloadedOn || 0));
  } catch (error) {
    console.error('Error reading all downloaded messages:', error);
    return [];
  }
};

export const saveDownloadedMessage = async (message: SermonMessage): Promise<void> => {
  if (!isStorageAvailable()) return;

  try {
    // Save the message object
    await AsyncStorage.setItem(`message_${message.MessageId}`, JSON.stringify(message));

    // Update the IDs list
    const ids = await getDownloadedMessageIds();
    if (!ids.includes(message.MessageId)) {
      ids.push(message.MessageId);
      await AsyncStorage.setItem(StorageKeys.DOWNLOADED_MESSAGE_IDS, JSON.stringify(ids));
    }
  } catch (error) {
    console.error('Error saving downloaded message:', error);
  }
};

export const removeDownloadedMessage = async (messageId: string): Promise<void> => {
  if (!isStorageAvailable()) return;

  try {
    // Remove the message object
    await AsyncStorage.removeItem(`message_${messageId}`);
    
    // Update the IDs list
    const ids = await getDownloadedMessageIds();
    const filtered = ids.filter(id => id !== messageId);
    await AsyncStorage.setItem(StorageKeys.DOWNLOADED_MESSAGE_IDS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing downloaded message:', error);
  }
};

export const isMessageDownloaded = async (messageId: string): Promise<boolean> => {
  const ids = await getDownloadedMessageIds();
  return ids.includes(messageId);
};

// Onboarding Functions
export const isOnboardingCompleted = async (): Promise<boolean> => {
  if (!isStorageAvailable()) return false;
  
  try {
    const value = await AsyncStorage.getItem(StorageKeys.ONBOARDING_COMPLETED);
    return value === 'true';
  } catch (error) {
    console.error('Error reading onboarding status:', error);
    return false;
  }
};

export const setOnboardingCompleted = async (completed: boolean): Promise<void> => {
  if (!isStorageAvailable()) return;
  
  try {
    await AsyncStorage.setItem(StorageKeys.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting onboarding status:', error);
  }
};

// API Domain Functions
export const getApiDomain = async (): Promise<string | null> => {
  if (!isStorageAvailable()) return null;
  
  try {
    return await AsyncStorage.getItem(StorageKeys.API_DOMAIN);
  } catch (error) {
    console.error('Error reading API domain:', error);
    return null;
  }
};

export const setApiDomain = async (domain: string): Promise<void> => {
  if (!isStorageAvailable()) return;
  
  try {
    await AsyncStorage.setItem(StorageKeys.API_DOMAIN, domain);
  } catch (error) {
    console.error('Error setting API domain:', error);
  }
};

// Download Queue Functions
export interface DownloadQueueItem {
  messageId: string;
  audioUrl: string;
  title: string;
  seriesTitle?: string;
  seriesArt?: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export const getDownloadQueue = async (): Promise<DownloadQueueItem[]> => {
  if (!isStorageAvailable()) return [];

  try {
    const data = await AsyncStorage.getItem(StorageKeys.DOWNLOAD_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading download queue:', error);
    return [];
  }
};

export const saveDownloadQueue = async (queue: DownloadQueueItem[]): Promise<void> => {
  if (!isStorageAvailable()) return;

  try {
    await AsyncStorage.setItem(StorageKeys.DOWNLOAD_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving download queue:', error);
  }
};

export const addToDownloadQueue = async (item: DownloadQueueItem): Promise<void> => {
  try {
    const queue = await getDownloadQueue();

    // Check if already in queue
    const exists = queue.find(q => q.messageId === item.messageId);
    if (!exists) {
      queue.push(item);
      await saveDownloadQueue(queue);
    }
  } catch (error) {
    console.error('Error adding to download queue:', error);
  }
};

export const updateDownloadQueueItem = async (messageId: string, updates: Partial<DownloadQueueItem>): Promise<void> => {
  try {
    const queue = await getDownloadQueue();
    const index = queue.findIndex(q => q.messageId === messageId);

    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await saveDownloadQueue(queue);
    }
  } catch (error) {
    console.error('Error updating download queue item:', error);
  }
};

export const removeFromDownloadQueue = async (messageId: string): Promise<void> => {
  try {
    const queue = await getDownloadQueue();
    const filtered = queue.filter(q => q.messageId !== messageId);
    await saveDownloadQueue(filtered);
  } catch (error) {
    console.error('Error removing from download queue:', error);
  }
};

export const clearDownloadQueue = async (): Promise<void> => {
  if (!isStorageAvailable()) return;

  try {
    await AsyncStorage.removeItem(StorageKeys.DOWNLOAD_QUEUE);
  } catch (error) {
    console.error('Error clearing download queue:', error);
  }
};

// Migration from iOS UserDefaults (to be called on first launch)
export const migrateFromIOSUserDefaults = async (): Promise<void> => {
  // This would be implemented with a native module bridge
  // For now, it's a placeholder for the migration logic
  console.log('iOS UserDefaults migration would happen here');

  // Example structure:
  // 1. Check if migration has already happened
  // 2. If not, call native module to read UserDefaults
  // 3. Transform data to React Native format
  // 4. Save to AsyncStorage
  // 5. Mark migration as complete
};

// Notes Functions
export const getNotes = async (): Promise<Note[]> => {
  if (!isStorageAvailable()) return [];

  try {
    const data = await AsyncStorage.getItem(StorageKeys.NOTES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading notes:', error);
    return [];
  }
};

export const saveNotes = async (notes: Note[]): Promise<void> => {
  if (!isStorageAvailable()) return;

  try {
    await AsyncStorage.setItem(StorageKeys.NOTES, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving notes:', error);
  }
};

export const createNote = async (content: string = ''): Promise<Note> => {
  const now = Date.now();
  const note: Note = {
    id: `note_${now}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const notes = await getNotes();
    notes.unshift(note); // Add to beginning
    await saveNotes(notes);
    return note;
  } catch (error) {
    console.error('Error creating note:', error);
    return note;
  }
};

export const updateNote = async (id: string, content: string): Promise<void> => {
  try {
    const notes = await getNotes();
    const index = notes.findIndex(n => n.id === id);

    if (index !== -1) {
      notes[index] = {
        ...notes[index],
        content,
        updatedAt: Date.now(),
      };
      await saveNotes(notes);
    }
  } catch (error) {
    console.error('Error updating note:', error);
  }
};

export const deleteNote = async (id: string): Promise<void> => {
  try {
    const notes = await getNotes();
    const filtered = notes.filter(n => n.id !== id);
    await saveNotes(filtered);
  } catch (error) {
    console.error('Error deleting note:', error);
  }
};

export const getNote = async (id: string): Promise<Note | null> => {
  try {
    const notes = await getNotes();
    return notes.find(n => n.id === id) || null;
  } catch (error) {
    console.error('Error getting note:', error);
    return null;
  }
};

export const clearAllNotes = async (): Promise<void> => {
  if (!isStorageAvailable()) return;

  try {
    await AsyncStorage.removeItem(StorageKeys.NOTES);
  } catch (error) {
    console.error('Error clearing notes:', error);
  }
};

// Config Functions
export const getConfigSetting = async (key: string): Promise<ConfigSetting | null> => {
  if (!isStorageAvailable()) {
    console.warn(`Cannot get config ${key}: Storage not available`);
    return null;
  }

  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading config ${key}:`, error);
    return null;
  }
};

export const saveConfigSetting = async (key: string, config: ConfigSetting): Promise<void> => {
  if (!isStorageAvailable()) {
    console.warn(`Cannot save config ${key}: Storage not available`);
    return;
  }

  try {
    await AsyncStorage.setItem(key, JSON.stringify(config));
  } catch (error) {
    console.error(`Error saving config ${key}:`, error);
  }
};

export const deleteConfigSetting = async (key: string): Promise<void> => {
  if (!isStorageAvailable()) return;

  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error deleting config ${key}:`, error);
  }
};

// Clear all storage (for testing/debugging)
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing all storage:', error);
  }
};

// Settings Functions
export const getThemeMode = async (): Promise<ThemeMode> => {
  if (!isStorageAvailable()) return 'auto';

  try {
    const data = await AsyncStorage.getItem(StorageKeys.THEME_MODE);
    return (data as ThemeMode) || 'auto';
  } catch (error) {
    console.error('Error reading theme mode:', error);
    return 'auto';
  }
};

export const setThemeMode = async (mode: ThemeMode): Promise<void> => {
  if (!isStorageAvailable()) return;

  try {
    await AsyncStorage.setItem(StorageKeys.THEME_MODE, mode);
  } catch (error) {
    console.error('Error saving theme mode:', error);
  }
};

export const getBibleTranslation = async (): Promise<BibleTranslation> => {
  if (!isStorageAvailable()) return DEFAULT_BIBLE_TRANSLATION;

  try {
    const data = await AsyncStorage.getItem(StorageKeys.BIBLE_TRANSLATION);
    return data ? JSON.parse(data) : DEFAULT_BIBLE_TRANSLATION;
  } catch (error) {
    console.error('Error reading Bible translation:', error);
    return DEFAULT_BIBLE_TRANSLATION;
  }
};

export const setBibleTranslation = async (translation: BibleTranslation): Promise<void> => {
  if (!isStorageAvailable()) return;

  try {
    await AsyncStorage.setItem(StorageKeys.BIBLE_TRANSLATION, JSON.stringify(translation));
  } catch (error) {
    console.error('Error saving Bible translation:', error);
  }
};
