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
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { esvApiService, BiblePassage } from '../services/bible/esvApiService';

interface BiblePassageReaderProps {
  reference: string;
  onClose?: () => void;
  style?: any;
}

/**
 * Format Bible passage text with proper verse numbers and styling
 * This matches the formatting used in the iOS app's BibleTextFormatter
 */
const formatPassageText = (text: string): React.ReactNode[] => {
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
  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPassage();
  }, [reference]);

  const loadPassage = async () => {
    if (!reference) {
      setError('No passage reference provided');
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
      }
    } catch (err) {
      console.error('Error loading Bible passage:', err);
      setError('Failed to load Bible passage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    loadPassage();
  };

  const handleApiKeyInfo = () => {
    Alert.alert(
      'ESV API Configuration',
      'To use Bible passage reading, you need to:\n\n1. Get a free API key from api.esv.org\n2. Add it to your app configuration\n\nThe ESV API is free for non-commercial use.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading passage...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <Text style={styles.errorTitle}>Unable to Load Passage</Text>
        <Text style={styles.errorText}>{error}</Text>
        
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          
          {error.includes('API key') && (
            <TouchableOpacity style={styles.infoButton} onPress={handleApiKeyInfo}>
              <Text style={styles.infoButtonText}>Setup Info</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!passage || !passage.text) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <Text style={styles.errorTitle}>No Passage Found</Text>
        <Text style={styles.errorText}>
          Could not find text for "{reference}"
        </Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const formattedText = formatPassageText(passage.text);

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.almostBlack,
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
    borderBottomColor: colors.darkGrey,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    flex: 1,
  },
  headerCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.darkGrey,
    borderRadius: 16,
    marginLeft: 16,
  },
  headerCloseButtonText: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
  },
  passageContainer: {
    flex: 1,
  },
  heading: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: 'bold',
  },
  passageReference: {
    ...typography.h3,
    color: colors.lightGrey,
    marginBottom: 12,
    fontWeight: '600',
  },
  verseLine: {
    ...typography.body,
    color: colors.white,
    lineHeight: 24,
    marginBottom: 8,
  },
  verseNumber: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },
  verseText: {
    ...typography.body,
    color: colors.white,
    lineHeight: 24,
  },
  lineBreak: {
    height: 12,
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGrey,
    marginTop: 16,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    ...typography.body,
    color: colors.lightGrey,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  infoButton: {
    backgroundColor: colors.darkGrey,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  infoButtonText: {
    ...typography.button,
    color: colors.white,
  },
  closeButton: {
    backgroundColor: colors.mediumGrey,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    ...typography.button,
    color: colors.white,
  },
});

export default BiblePassageReader;
