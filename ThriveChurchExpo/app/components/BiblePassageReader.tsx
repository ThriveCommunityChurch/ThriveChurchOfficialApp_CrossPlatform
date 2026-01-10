import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import type { Theme } from '../theme/types';
import { esvApiService, BiblePassage } from '../services/bible/esvApiService';
import { logBibleChapterRead } from '../services/analytics/analyticsService';

interface BiblePassageReaderProps {
  reference: string;
  onClose?: () => void;
  style?: any;
}

/**
 * Format Bible passage text with proper verse numbers and styling
 * This matches the formatting used in the iOS app's BibleTextFormatter
 */
const formatPassageText = (text: string, styles: any): React.ReactNode[] => {
  if (!text) return [];

  const elements: React.ReactNode[] = [];
  let key = 0;

  // Split text into lines and process each one
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      // Empty line - add spacing
      elements.push(
        <View key={key++} style={styles.lineBreak} />
      );
      continue;
    }

    // Check if this is a heading (usually all caps or title case without verse numbers)
    if (line.match(/^[A-Z\s]+$/) && !line.match(/\[\d+\]/)) {
      elements.push(
        <Text key={key++} style={styles.heading}>
          {line}
        </Text>
      );
      continue;
    }

    // Check if this is a passage reference (e.g., "John 3:16")
    if (line.match(/^[A-Za-z0-9\s]+\d+:\d+/) && !line.includes('[')) {
      elements.push(
        <Text key={key++} style={styles.passageReference}>
          {line}
        </Text>
      );
      continue;
    }

    // Process verse text with verse numbers
    const versePattern = /\[(\d+)\]/g;
    const parts = line.split(versePattern);

    if (parts.length > 1) {
      // Line contains verse numbers
      const lineElements: React.ReactNode[] = [];

      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];

        if (!part) continue;

        // Check if this part is a verse number
        if (j % 2 === 1 && /^\d+$/.test(part)) {
          lineElements.push(
            <Text key={`${key}-${j}`} style={styles.verseNumber}>
              {part}
            </Text>
          );
        } else {
          // Regular text
          lineElements.push(
            <Text key={`${key}-${j}`} style={styles.verseText}>
              {part}
            </Text>
          );
        }
      }

      elements.push(
        <Text key={key++} style={styles.verseLine}>
          {lineElements}
        </Text>
      );
    } else {
      // Line without verse numbers (continuation or special text)
      elements.push(
        <Text key={key++} style={styles.verseText}>
          {line}
        </Text>
      );
    }
  }

  return elements;
};

export const BiblePassageReader: React.FC<BiblePassageReaderProps> = ({
  reference,
  onClose,
  style,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPassage();
  }, [reference]);

  const loadPassage = async () => {
    if (!reference) {
      setError(t('components.bibleReader.noReference'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await esvApiService.getPassage(reference);

      if (result.error) {
        setError(result.error);
      } else {
        setPassage(result);

        // Track Bible chapter read - parse reference for book/chapter info
        // Reference format is typically "Book Chapter:Verse" e.g., "John 3:16"
        const refMatch = reference.match(/^([A-Za-z0-9\s]+?)(?:\s+(\d+))?(?::[\d-]+)?$/);
        const book = refMatch ? refMatch[1].trim() : reference;
        const chapter = refMatch && refMatch[2] ? parseInt(refMatch[2], 10) : undefined;
        logBibleChapterRead(book, chapter, reference);
      }
    } catch (err) {
      console.error('Error loading Bible passage:', err);
      setError(t('components.bibleReader.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    loadPassage();
  };

  const handleApiKeyInfo = () => {
    Alert.alert(
      t('components.bibleReader.apiConfigTitle'),
      t('components.bibleReader.apiConfigMessage'),
      [{ text: t('common.ok') }]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('components.bibleReader.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <Text style={styles.errorTitle}>{t('components.bibleReader.unableToLoad')}</Text>
        <Text style={styles.errorText}>{error}</Text>

        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>{t('components.bibleReader.retry')}</Text>
          </TouchableOpacity>

          {error.includes('API key') && (
            <TouchableOpacity style={styles.infoButton} onPress={handleApiKeyInfo}>
              <Text style={styles.infoButtonText}>{t('components.bibleReader.setupInfo')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t('components.bibleReader.close')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!passage || !passage.text) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <Text style={styles.errorTitle}>{t('components.bibleReader.noPassageFound')}</Text>
        <Text style={styles.errorText}>
          {t('components.bibleReader.couldNotFind', { reference })}
        </Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t('components.bibleReader.close')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const formattedText = formatPassageText(passage.text, styles);

  return (
    <View style={[styles.container, style]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{passage.canonical}</Text>
          {onClose && (
            <TouchableOpacity style={styles.headerCloseButton} onPress={onClose}>
              <Text style={styles.headerCloseButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.passageContainer}>
          {formattedText}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    flex: 1,
  },
  headerCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    borderRadius: 16,
    marginLeft: 16,
  },
  headerCloseButtonText: {
    ...theme.typography.body,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    fontSize: 16,
  },
  passageContainer: {
    flex: 1,
  },
  heading: {
    ...theme.typography.h2,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: 'bold',
  },
  passageReference: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginBottom: 12,
    fontWeight: '600',
  },
  verseLine: {
    ...theme.typography.body,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    lineHeight: 24,
    marginBottom: 8,
  },
  verseNumber: {
    ...theme.typography.caption,
    color: theme.colors.primary, // ← ONLY COLOR CHANGED
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },
  verseText: {
    ...theme.typography.body,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    lineHeight: 24,
  },
  lineBreak: {
    height: 12,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginTop: 16,
  },
  errorTitle: {
    ...theme.typography.h2,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    textAlign: 'center',
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary, // ← ONLY COLOR CHANGED
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    ...theme.typography.button,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },
  infoButton: {
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  infoButtonText: {
    ...theme.typography.button,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },
  closeButton: {
    backgroundColor: theme.colors.cardSecondary, // ← ONLY COLOR CHANGED
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    ...theme.typography.button,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },
});

export default BiblePassageReader;
