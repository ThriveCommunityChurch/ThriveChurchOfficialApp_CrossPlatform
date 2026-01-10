/**
 * StudyGuideScreen
 * Displays AI-generated study guide for small groups and devotional time
 *
 * Section Order (YouVersion-style Flow):
 * 1. Introduction: Overview (Summary), Scripture References
 * 2. Core Content: Devotional, Key Points, Illustrations
 * 3. Engagement: Discussion Questions (Icebreaker → Reflection → Application → For Leaders)
 * 4. Closing: Prayer Prompts, Take Home Challenges
 * 5. Optional: Additional Study, Estimated Study Time
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SermonMessage, StudyGuideResponse } from '../../types/api';
import { getStudyGuide } from '../../services/api/sermonContentService';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';
import { CollapsibleSection } from '../../components/CollapsibleSection';

type StudyGuideScreenRouteProp = RouteProp<{
  StudyGuideScreen: {
    message: SermonMessage;
    seriesTitle: string;
    seriesArtUrl: string;
    seriesId: string;
  };
}, 'StudyGuideScreen'>;

export const StudyGuideScreen: React.FC = () => {
  const route = useRoute<StudyGuideScreenRouteProp>();
  const { message } = route.params;
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Track screen view
  React.useEffect(() => {
    setCurrentScreen('StudyGuideScreen', 'StudyGuide');
    logCustomEvent('view_study_guide', {
      message_id: message.MessageId,
      message_title: message.Title,
    });
  }, [message.MessageId, message.Title]);

  // Fetch study guide
  const { data: guide, isLoading, error, refetch } = useQuery({
    queryKey: ['studyGuide', message.MessageId],
    queryFn: () => getStudyGuide(message.MessageId),
    staleTime: 5 * 60 * 1000,
  });

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('listen.studyGuide.loading')}</Text>
      </View>
    );
  }

  // Error state
  if (error || !guide) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="library-outline" size={64} color={theme.colors.textTertiary} />
        <Text style={styles.errorTitle}>{t('listen.studyGuide.notAvailable')}</Text>
        <Text style={styles.errorMessage}>{t('listen.studyGuide.notAvailableMessage')}</Text>
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
          <Text style={styles.messageTitle}>{guide.Title}</Text>
          <Text style={styles.speakerDate}>
            {guide.Speaker} • {guide.MainScripture}
          </Text>
          {guide.EstimatedStudyTime && (
            <View style={styles.timeTag}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.timeTagText}>{guide.EstimatedStudyTime}</Text>
            </View>
          )}

          {/* Summary - Always visible, not collapsible */}
          {guide.Summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{guide.Summary}</Text>
            </View>
          )}
        </View>

        {/* Collapsible Sections Container */}
        <View style={styles.sectionsContainer}>

        {/* Scripture References */}
        {guide.ScriptureReferences && guide.ScriptureReferences.length > 0 && (
          <CollapsibleSection
            title={t('listen.studyGuide.scriptureReferences')}
            icon="book"
            theme={theme}
          >
            {guide.ScriptureReferences.map((ref, index) => (
              <View key={index} style={styles.scriptureCard}>
                <Text style={styles.scriptureRef}>{ref.Reference}</Text>
                <Text style={styles.scriptureContext}>{ref.Context}</Text>
              </View>
            ))}
          </CollapsibleSection>
        )}

        {/* SECTION 2: Core Content */}
        {/* Devotional */}
        {guide.Devotional && (
          <CollapsibleSection
            title={t('listen.studyGuide.devotional')}
            icon="heart"
            theme={theme}
          >
            <Text style={styles.devotionalText}>{guide.Devotional}</Text>
          </CollapsibleSection>
        )}

        {/* Key Points */}
        {guide.KeyPoints && guide.KeyPoints.length > 0 && (
          <CollapsibleSection
            title={t('listen.studyGuide.keyPoints')}
            icon="key"
            theme={theme}
          >
            {guide.KeyPoints.map((point, index) => (
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
                {point.TheologicalContext && (
                  <Text style={styles.keyPointTheology}>{point.TheologicalContext}</Text>
                )}
              </View>
            ))}
          </CollapsibleSection>
        )}

        {/* Illustrations */}
        {guide.Illustrations && guide.Illustrations.length > 0 && (
          <CollapsibleSection
            title={t('listen.studyGuide.illustrations')}
            icon="bulb"
            theme={theme}
          >
            {guide.Illustrations.map((illustration, index) => (
              <View key={index} style={styles.illustrationCard}>
                <Ionicons name="bulb-outline" size={20} color={theme.colors.warning} />
                <View style={styles.illustrationContent}>
                  <Text style={styles.illustrationSummary}>{illustration.Summary}</Text>
                  <Text style={styles.illustrationPoint}>
                    <Text style={styles.illustrationPointLabel}>
                      {t('listen.studyGuide.point')}:{' '}
                    </Text>
                    {illustration.Point}
                  </Text>
                </View>
              </View>
            ))}
          </CollapsibleSection>
        )}

        {/* SECTION 3: Engagement - Discussion Questions */}
        {guide.DiscussionQuestions && (
          <CollapsibleSection
            title={t('listen.studyGuide.discussionQuestions')}
            icon="chatbubbles"
            theme={theme}
          >
            {/* Icebreaker Questions */}
            {guide.DiscussionQuestions.Icebreaker?.length > 0 && (
              <View style={styles.questionGroup}>
                <View style={styles.questionGroupHeader}>
                  <Ionicons name="snow" size={16} color={theme.colors.info} />
                  <Text style={styles.questionGroupTitle}>
                    {t('listen.studyGuide.icebreaker')}
                  </Text>
                </View>
                {guide.DiscussionQuestions.Icebreaker.map((q, i) => (
                  <View key={i} style={styles.questionItem}>
                    <Text style={styles.questionText}>{q}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Reflection Questions */}
            {guide.DiscussionQuestions.Reflection?.length > 0 && (
              <View style={styles.questionGroup}>
                <View style={styles.questionGroupHeader}>
                  <Ionicons name="glasses" size={16} color={theme.colors.primary} />
                  <Text style={styles.questionGroupTitle}>
                    {t('listen.studyGuide.reflection')}
                  </Text>
                </View>
                {guide.DiscussionQuestions.Reflection.map((q, i) => (
                  <View key={i} style={styles.questionItem}>
                    <Text style={styles.questionText}>{q}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Application Questions */}
            {guide.DiscussionQuestions.Application?.length > 0 && (
              <View style={styles.questionGroup}>
                <View style={styles.questionGroupHeader}>
                  <Ionicons name="hand-right" size={16} color={theme.colors.success} />
                  <Text style={styles.questionGroupTitle}>
                    {t('listen.studyGuide.application')}
                  </Text>
                </View>
                {guide.DiscussionQuestions.Application.map((q, i) => (
                  <View key={i} style={styles.questionItem}>
                    <Text style={styles.questionText}>{q}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* For Leaders Questions */}
            {guide.DiscussionQuestions.ForLeaders && guide.DiscussionQuestions.ForLeaders.length > 0 && (
              <View style={styles.questionGroup}>
                <View style={styles.questionGroupHeader}>
                  <Ionicons name="people" size={16} color={theme.colors.warning} />
                  <Text style={styles.questionGroupTitle}>
                    {t('listen.studyGuide.forLeaders')}
                  </Text>
                </View>
                {guide.DiscussionQuestions.ForLeaders.map((q, i) => (
                  <View key={i} style={styles.questionItem}>
                    <Text style={styles.questionText}>{q}</Text>
                  </View>
                ))}
              </View>
            )}
          </CollapsibleSection>
        )}

        {/* SECTION 4: Closing/Action */}
        {/* Prayer Prompts */}
        {guide.PrayerPrompts && guide.PrayerPrompts.length > 0 && (
          <CollapsibleSection
            title={t('listen.studyGuide.prayerPrompts')}
            icon="hand-left"
            theme={theme}
          >
            {guide.PrayerPrompts.map((prompt, index) => (
              <View key={index} style={styles.prayerCard}>
                <Ionicons name="hand-left-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.prayerText}>{prompt}</Text>
              </View>
            ))}
          </CollapsibleSection>
        )}

        {/* Take Home Challenges */}
        {guide.TakeHomeChallenges && guide.TakeHomeChallenges.length > 0 && (
          <CollapsibleSection
            title={t('listen.studyGuide.takeHomeChallenges')}
            icon="rocket"
            theme={theme}
          >
            {guide.TakeHomeChallenges.map((challenge, index) => (
              <View key={index} style={styles.challengeCard}>
                <View style={styles.challengeNumber}>
                  <Text style={styles.challengeNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.challengeText}>{challenge}</Text>
              </View>
            ))}
          </CollapsibleSection>
        )}

        {/* SECTION 5: Optional Deeper Study */}
        {/* Additional Study */}
        {guide.AdditionalStudy && guide.AdditionalStudy.length > 0 && (
          <CollapsibleSection
            title={t('listen.studyGuide.additionalStudy')}
            icon="school"
            theme={theme}
            defaultExpanded={false}
          >
            {guide.AdditionalStudy.map((study, index) => (
              <View key={index} style={styles.additionalStudyCard}>
                <Text style={styles.additionalStudyTopic}>{study.Topic}</Text>
                <View style={styles.additionalStudyScriptures}>
                  {study.Scriptures.map((scripture, i) => (
                    <View key={i} style={styles.additionalStudyScriptureTag}>
                      <Text style={styles.additionalStudyScriptureText}>{scripture}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.additionalStudyNote}>{study.Note}</Text>
              </View>
            ))}
          </CollapsibleSection>
        )}

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
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
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  timeTagText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  summaryContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
  },
  sectionsContainer: {
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 10,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.background,
  },
  summaryText: {
    ...theme.typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
  },
  devotionalText: {
    ...theme.typography.body,
    fontSize: 16,
    lineHeight: 26,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  scriptureCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  scriptureRef: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: 6,
  },
  scriptureContext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  keyPointCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  keyPointTheology: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 8,
    paddingLeft: 40,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  illustrationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  illustrationContent: {
    flex: 1,
    marginLeft: 12,
  },
  illustrationSummary: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  illustrationPoint: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  illustrationPointLabel: {
    fontWeight: '600',
    color: theme.colors.warning,
  },
  questionGroup: {
    marginTop: 16,
  },
  questionGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  questionGroupTitle: {
    ...theme.typography.h3,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionItem: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  questionText: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 22,
  },
  prayerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  prayerText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
    marginLeft: 12,
    lineHeight: 22,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  challengeNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeNumberText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    fontSize: 12,
  },
  challengeText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
    lineHeight: 22,
  },
  additionalStudyCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  additionalStudyTopic: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  additionalStudyScriptures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  additionalStudyScriptureTag: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  additionalStudyScriptureText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  additionalStudyNote: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});

