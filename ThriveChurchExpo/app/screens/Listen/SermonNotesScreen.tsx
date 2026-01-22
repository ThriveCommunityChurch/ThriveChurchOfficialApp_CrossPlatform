/**
 * SermonNotesScreen
 * Displays AI-generated sermon notes with key points, quotes, and application points
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SermonMessage, SermonNotesResponse } from '../../types/api';
import { getSermonNotes } from '../../services/api/sermonContentService';
import { createSermonNote, getSermonNoteByMessageId } from '../../services/storage/storage';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';
import { CollapsibleSection } from '../../components/CollapsibleSection';

type SermonNotesScreenRouteProp = RouteProp<{
  SermonNotesScreen: {
    message: SermonMessage;
    seriesTitle: string;
    seriesArtUrl: string;
    seriesId: string;
  };
}, 'SermonNotesScreen'>;

export const SermonNotesScreen: React.FC = () => {
  const route = useRoute<SermonNotesScreenRouteProp>();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { message, seriesTitle, seriesArtUrl, seriesId } = route.params;
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Track screen view
  React.useEffect(() => {
    setCurrentScreen('SermonNotesScreen', 'SermonNotes');
    logCustomEvent('view_sermon_notes', {
      message_id: message.MessageId,
      message_title: message.Title,
    });
  }, [message.MessageId, message.Title]);

  // Fetch sermon notes
  const { data: notes, isLoading, error, refetch } = useQuery({
    queryKey: ['sermonNotes', message.MessageId],
    queryFn: () => getSermonNotes(message.MessageId),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Handle save notes to local storage
  const handleSaveToNotes = useCallback(async () => {
    if (!notes) return;

    try {
      // Check if note already exists for this message
      const existingNote = await getSermonNoteByMessageId(message.MessageId);
      
      // Format notes content
      const formattedContent = formatNotesForStorage(notes);
      
      if (existingNote) {
        // Note already exists - ask to append or replace
        Alert.alert(
          t('listen.sermonNotes.noteExists'),
          t('listen.sermonNotes.noteExistsMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('listen.sermonNotes.appendNote'),
              onPress: async () => {
                // Navigate to existing note with content to append
                (navigation as any).navigate('Notes', {
                  screen: 'NoteDetail',
                  params: {
                    noteId: existingNote.id,
                    appendContent: formattedContent,
                  },
                });
              },
            },
          ]
        );
      } else {
        // Create new note with the formatted content
        await createSermonNote({
          messageId: message.MessageId,
          seriesId: seriesId,
          messageTitle: message.Title,
          seriesTitle: seriesTitle,
          seriesArt: seriesArtUrl,
          speaker: message.Speaker || 'Unknown',
          messageDate: message.Date || new Date().toISOString(),
          content: formattedContent,
        });

        logCustomEvent('save_sermon_notes', {
          message_id: message.MessageId,
          message_title: message.Title,
        });

        Alert.alert(
          t('common.success'),
          t('listen.sermonNotes.savedToNotes'),
          [
            { text: t('common.ok') },
            {
              text: t('listen.sermonNotes.viewNotes'),
              onPress: () => {
                (navigation as any).navigate('Notes', {
                  screen: 'NotesList',
                });
              },
            },
          ]
        );
      }
    } catch (err) {
      console.error('Error saving notes:', err);
      Alert.alert(t('common.error'), t('listen.sermonNotes.saveFailed'));
    }
  }, [notes, message, seriesId, seriesTitle, seriesArtUrl, navigation, t]);

  // Format notes for storage as markdown-like text
  const formatNotesForStorage = (notesData: SermonNotesResponse): string => {
    let content = '';
    
    // Summary
    if (notesData.Summary) {
      content += `## ${t('listen.sermonNotes.summary')}\n${notesData.Summary}\n\n`;
    }

    // Main Scripture
    if (notesData.MainScripture) {
      content += `📖 ${notesData.MainScripture}\n\n`;
    }

    // Key Points
    if (notesData.KeyPoints?.length > 0) {
      content += `## ${t('listen.sermonNotes.keyPoints')}\n`;
      notesData.KeyPoints.forEach((point, index) => {
        content += `${index + 1}. **${point.Point}**`;
        if (point.Scripture) content += ` (${point.Scripture})`;
        content += '\n';
        if (point.Detail) content += `   ${point.Detail}\n`;
      });
      content += '\n';
    }

    // Quotes
    if (notesData.Quotes?.length > 0) {
      content += `## ${t('listen.sermonNotes.quotes')}\n`;
      notesData.Quotes.forEach((quote) => {
        content += `> "${quote.Text}"\n`;
        if (quote.Context) content += `  — ${quote.Context}\n`;
      });
      content += '\n';
    }

    // Application Points
    if (notesData.ApplicationPoints?.length > 0) {
      content += `## ${t('listen.sermonNotes.applicationPoints')}\n`;
      notesData.ApplicationPoints.forEach((point, index) => {
        content += `${index + 1}. ${point}\n`;
      });
    }

    return content.trim();
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('listen.sermonNotes.loading')}</Text>
      </View>
    );
  }

  // Error state
  if (error || !notes) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-text-outline" size={64} color={theme.colors.textTertiary} />
        <Text style={styles.errorTitle}>{t('listen.sermonNotes.notAvailable')}</Text>
        <Text style={styles.errorMessage}>{t('listen.sermonNotes.notAvailableMessage')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Summary always visible */}
        <View style={styles.header}>
          <Text style={styles.messageTitle}>{notes.Title}</Text>
          <Text style={styles.speakerDate}>
            {notes.Speaker} • {notes.MainScripture}
          </Text>

          {/* Summary - Always visible, not collapsible */}
          {notes.Summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{notes.Summary}</Text>
            </View>
          )}
        </View>

        {/* Collapsible Sections Container */}
        <View style={styles.sectionsContainer}>
          {/* Key Points Section */}
          {notes.KeyPoints && notes.KeyPoints.length > 0 && (
            <CollapsibleSection
              title={t('listen.sermonNotes.keyPoints')}
              icon="key"
              theme={theme}
            >
              {notes.KeyPoints.map((point, index) => (
                <View key={index} style={styles.keyPointCard}>
                  <View style={styles.keyPointHeader}>
                    <View style={styles.keyPointNumber}>
                      <Text style={styles.keyPointNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.keyPointTitle}>{point.Point}</Text>
                  </View>
                  {point.Scripture && (
                    <View style={styles.scriptureTag}>
                      <Ionicons name="book-outline" size={14} color={theme.colors.primary} />
                      <Text style={styles.scriptureTagText}>{point.Scripture}</Text>
                    </View>
                  )}
                  {point.Detail && (
                    <Text style={styles.keyPointDetail}>{point.Detail}</Text>
                  )}
                </View>
              ))}
            </CollapsibleSection>
          )}

          {/* Quotes Section */}
          {notes.Quotes && notes.Quotes.length > 0 && (
            <CollapsibleSection
              title={t('listen.sermonNotes.quotes')}
              icon="chatbox-ellipses"
              theme={theme}
            >
              {notes.Quotes.map((quote, index) => (
                <View key={index} style={styles.quoteCard}>
                  <Text style={styles.quoteText}>"{quote.Text}"</Text>
                  {quote.Context && (
                    <Text style={styles.quoteContext}>— {quote.Context}</Text>
                  )}
                </View>
              ))}
            </CollapsibleSection>
          )}

          {/* Application Points Section */}
          {notes.ApplicationPoints && notes.ApplicationPoints.length > 0 && (
            <CollapsibleSection
              title={t('listen.sermonNotes.applicationPoints')}
              icon="checkmark-circle"
              theme={theme}
            >
              {notes.ApplicationPoints.map((point, index) => (
                <View key={index} style={styles.applicationCard}>
                  <View style={styles.applicationBullet}>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.applicationText}>{point}</Text>
                </View>
              ))}
            </CollapsibleSection>
          )}

          {/* Bottom padding for save button */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Save to Notes Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveToNotes}
          activeOpacity={0.8}
        >
          <Ionicons name="bookmark" size={20} color={theme.colors.textInverse} />
          <Text style={styles.saveButtonText}>{t('listen.sermonNotes.saveToNotes')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
  errorTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  header: {
    padding: 20,
    paddingBottom: 24,
    backgroundColor: theme.colors.background,
  },
  messageTitle: {
    ...theme.typography.h1,
    fontSize: 24,
    color: theme.colors.text,
    marginBottom: 8,
  },
  speakerDate: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  summaryContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
  },
  summaryText: {
    ...theme.typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
  },
  sectionsContainer: {
    paddingHorizontal: 16,
  },
  keyPointCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  keyPointHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  keyPointNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  keyPointNumberText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    fontSize: 14,
  },
  keyPointTitle: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  scriptureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 40,
  },
  scriptureTagText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  keyPointDetail: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 8,
    paddingLeft: 40,
    lineHeight: 22,
  },
  quoteCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  quoteText: {
    ...theme.typography.body,
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.colors.text,
    lineHeight: 24,
  },
  quoteContext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  applicationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  applicationBullet: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  applicationText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
    lineHeight: 22,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    marginLeft: 8,
    fontSize: 16,
  },
});

