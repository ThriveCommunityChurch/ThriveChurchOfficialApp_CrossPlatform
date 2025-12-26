import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
  ImageBackground,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useQuery } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api/client';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import OfflineBanner from '../../components/OfflineBanner';
import OfflineEmptyState from '../../components/OfflineEmptyState';
import { SermonSeries, SermonMessage } from '../../types/api';
import { isMessageDownloaded } from '../../services/storage/storage';
import { SermonMessageCard } from '../../components/SermonMessageCard';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';
import { getTagDisplayLabel } from '../../types/messageTag';

interface SeriesDetailScreenProps {
  seriesId: string;
  seriesArtUrl: string;
}

export default function SeriesDetailScreen({ seriesId, seriesArtUrl }: SeriesDetailScreenProps) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Calculate orientation and device type
  const isLandscape = windowWidth > windowHeight;
  const isTabletDevice = (Platform.OS === 'ios' && Platform.isPad) || Math.min(windowWidth, windowHeight) >= 768;

  const [downloadedMessages, setDownloadedMessages] = useState<Set<string>>(new Set());

  // Network status for offline detection
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  const { data: series, isLoading, isError, refetch } = useQuery({
    queryKey: ['series', seriesId],
    queryFn: async (): Promise<SermonSeries> => {
      const res = await api.get(`api/sermons/series/${seriesId}`);
      return res.data;
    },
  });

  // Track screen view with series info
  useEffect(() => {
    if (series) {
      setCurrentScreen('SeriesDetailScreen', 'SeriesDetail');
      logCustomEvent('view_series', {
        series_id: seriesId,
        series_name: series.Name,
        content_type: 'series',
      });
    }
  }, [series, seriesId]);

  // Load downloaded messages status
  React.useEffect(() => {
    const loadDownloadedStatus = async () => {
      if (!series?.Messages) return;

      const downloaded = new Set<string>();
      for (const message of series.Messages) {
        if (await isMessageDownloaded(message.MessageId)) {
          downloaded.add(message.MessageId);
        }
      }
      setDownloadedMessages(downloaded);
    };

    loadDownloadedStatus();
  }, [series]);

  const handleMessagePress = useCallback(async (message: SermonMessage) => {
    // Navigate to SermonDetailScreen instead of showing action sheet
    (navigation as any).navigate('SermonDetail', {
      message,
      seriesTitle: series?.Name,
      seriesArtUrl,
      seriesId,
    });
  }, [navigation, series, seriesArtUrl, seriesId]);

  const isCurrentSeries = series?.EndDate == null;

  // Format date helper
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Calculate responsive dimensions for tablet hero section
  const heroHeight = isTabletDevice
    ? isLandscape
      ? windowHeight * 0.45  // Smaller in landscape
      : windowHeight * 0.5   // Larger in portrait
    : 0;

  const artworkWidth = isTabletDevice
    ? isLandscape
      ? windowWidth * 0.35
      : windowWidth * 0.4
    : 0;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' }}>
        <OfflineBanner />
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !series) {
    // Show offline-specific empty state when offline, generic error otherwise
    if (isOffline) {
      return (
        <View style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }}>
          <OfflineEmptyState
            message={t('offline.noSeriesMessage')}
            showDownloadsCta={true}
            showBibleCta={true}
            showRetry={true}
            onRetry={() => refetch()}
          />
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <OfflineBanner />
        <Text style={[theme.typography.h2 as any, { textAlign: 'center', marginBottom: 16 }]}>
          {t('listen.error')}
        </Text>
        <Text style={[theme.typography.body as any, { textAlign: 'center', color: theme.colors.textTertiary }]}>
          {t('common.tryAgain')}
        </Text>
      </View>
    );
  }

  // Render tablet layout
  const renderTabletLayout = () => (
    <View style={styles.container}>
      <OfflineBanner />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
      >
        {/* Hero Section with Blurred Background */}
        <View style={[styles.tabletHeroContainer, { height: heroHeight }]}>
          <ImageBackground
            source={{ uri: seriesArtUrl }}
            style={styles.tabletHeroBackground}
            blurRadius={50}
            resizeMode="cover"
          >
            <View style={styles.tabletHeroOverlay}>
              <View style={styles.tabletHeroContentContainer}>
                {/* Left Side - Sharp Series Artwork */}
                <View style={[styles.tabletHeroArtworkContainer, { width: artworkWidth }]}>
                  <FastImage
                    source={{ uri: seriesArtUrl }}
                    style={styles.tabletHeroArtwork}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                </View>

                {/* Right Side - Series Info */}
                <View style={styles.tabletHeroContent}>
                  {/* Series Title */}
                  <Text style={styles.tabletHeroTitle} numberOfLines={2}>
                    {series.Name}
                  </Text>

                  {/* Series Metadata */}
                  <View style={styles.tabletHeroMetadata}>
                    {/* Current Series Badge */}
                    {isCurrentSeries && (
                      <View style={styles.tabletCurrentBadge}>
                        <Ionicons name="radio-button-on" size={12} color={theme.colors.success} />
                        <Text style={styles.tabletCurrentBadgeText}>{t('listen.currentSeries')}</Text>
                      </View>
                    )}

                    {/* Series Summary */}
                    {series.Summary && (
                      <Text style={[
                        styles.tabletHeroSummary,
                        !isLandscape && styles.tabletHeroSummaryPortrait
                      ]}>
                        {series.Summary}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Two Column Layout: Sidebar + Main Content */}
        <View style={styles.tabletContentContainer}>
          {/* Left Sidebar - Speakers & Topics */}
          <View style={styles.tabletSidebar}>
            {/* Speakers Section */}
            <View style={styles.tabletSidebarSection}>
              <Text style={styles.tabletSidebarTitle}>{t('listen.speakers')}</Text>

              {/* Get unique speakers from messages */}
              {Array.from(new Set(series.Messages.map(m => m.Speaker).filter(Boolean))).map((speaker, index) => (
                <View key={index} style={styles.tabletSpeakerCard}>
                  <View style={styles.tabletSpeakerAvatar}>
                    <Ionicons name="person" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.tabletSpeakerInfo}>
                    <Text style={styles.tabletSpeakerName}>{speaker}</Text>
                    <Text style={styles.tabletSpeakerRole}>{t('listen.speaker')}</Text>
                  </View>
                </View>
              ))}

              {/* Show placeholder if no speakers */}
              {Array.from(new Set(series.Messages.map(m => m.Speaker).filter(Boolean))).length === 0 && (
                <View style={styles.tabletEmptyState}>
                  <Ionicons name="person-outline" size={32} color={theme.colors.border} />
                  <Text style={styles.tabletEmptyStateText}>{t('listen.noSpeakers')}</Text>
                </View>
              )}
            </View>

            {/* Topics Section */}
            <View style={styles.tabletSidebarSection}>
              <Text style={styles.tabletSidebarTitle}>{t('listen.topics')}</Text>

              {/* Display actual tags from API */}
              {series.Tags && series.Tags.length > 0 ? (
                <View style={styles.tabletTopicsContainer}>
                  {series.Tags.map((tag, index) => (
                    <View key={index} style={styles.tabletTopicTag}>
                      <Ionicons name="pricetag" size={14} color={theme.colors.primary} />
                      <Text style={styles.tabletTopicText}>{getTagDisplayLabel(tag)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.tabletEmptyState}>
                  <Ionicons name="pricetags-outline" size={32} color={theme.colors.border} />
                  <Text style={styles.tabletEmptyStateText}>{t('listen.noTopics')}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Right Main Content - Messages */}
          <View style={styles.tabletMainContent}>
            <Text style={styles.tabletSectionTitle}>{t('listen.messages')}</Text>

            <View style={styles.tabletMessagesGrid}>
              {series.Messages.map((message, index) => {
                const downloaded = downloadedMessages.has(message.MessageId);
                const downloading = false;
                const weekNumber = series.Messages.length - index;
                const messageWithWeek = {
                  ...message,
                  WeekNum: message.WeekNum ?? weekNumber,
                };

                return (
                  <SermonMessageCard
                    key={message.MessageId}
                    message={messageWithWeek}
                    downloaded={downloaded}
                    downloading={downloading}
                    onPress={() => handleMessagePress(messageWithWeek)}
                    showBorder={false}
                    noHorizontalMargin={true}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  // Render phone layout (unchanged)
  const renderPhoneLayout = () => (
    <View style={styles.container}>
      <OfflineBanner />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
      >
        {/* Series Art Container */}
        <View style={styles.phoneArtContainer}>
          <View style={styles.phoneArtImageWrapper}>
            <FastImage
              source={{ uri: seriesArtUrl }}
              style={styles.phoneArtwork}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>
        </View>

        {/* Current Series Label */}
        {isCurrentSeries && (
          <Text style={styles.phoneCurrentLabel}>
            {t('listen.currentSeries')}
          </Text>
        )}

        {/* Summary Section */}
        {series.Summary && (
          <View style={styles.phoneSummarySection}>
            <Text style={styles.phoneSummaryLabel}>About This Series</Text>
            <Text style={styles.phoneSummaryText}>{series.Summary}</Text>
          </View>
        )}

        {/* Tags Section - Limited to 4 tags on mobile */}
        {series.Tags && series.Tags.length > 0 && (
          <View style={styles.phoneTagsSection}>
            <Text style={styles.phoneTagsLabel}>{t('listen.topics')}</Text>
            <View style={styles.phoneTagsContainer}>
              {series.Tags.slice(0, 4).map((tag, index) => (
                <View key={index} style={styles.phoneTag}>
                  <Ionicons name="pricetag" size={12} color={theme.colors.primary} />
                  <Text style={styles.phoneTagText}>{getTagDisplayLabel(tag)}</Text>
                </View>
              ))}
              {series.Tags.length > 4 && (
                <View style={styles.phoneTagMore}>
                  <Text style={styles.phoneTagMoreText}>+{series.Tags.length - 4} more</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Messages List */}
        <View style={[styles.phoneMessagesList, { marginTop: (series.Summary || (series.Tags && series.Tags.length > 0)) ? 8 : (isCurrentSeries ? 0 : 16) }]}>
          {series.Messages.map((message, index) => {
            const downloaded = downloadedMessages.has(message.MessageId);
            const downloading = false;
            const weekNumber = series.Messages.length - index;
            const messageWithWeek = {
              ...message,
              WeekNum: message.WeekNum ?? weekNumber,
            };

            return (
              <SermonMessageCard
                key={message.MessageId}
                message={messageWithWeek}
                downloaded={downloaded}
                downloading={downloading}
                onPress={() => handleMessagePress(messageWithWeek)}
                showBorder={index < series.Messages.length - 1}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  // Conditionally render based on device type
  return isTabletDevice ? renderTabletLayout() : renderPhoneLayout();
}

const createStyles = (theme: Theme) => StyleSheet.create({
  // Common styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Tablet Hero Section
  tabletHeroContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  tabletHeroBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  tabletHeroOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayMedium, // ← ONLY COLOR CHANGED
    paddingHorizontal: 48,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  tabletHeroContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: 40,
  },
  tabletHeroArtworkContainer: {
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: theme.colors.shadowDark, // ← ONLY COLOR CHANGED
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  tabletHeroArtwork: {
    width: '100%' as const,
    height: '100%' as const,
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
  },
  tabletHeroContent: {
    flex: 1,
    justifyContent: 'center',
  },
  tabletHeroTitle: {
    ...theme.typography.h1,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
    color: theme.colors.textInverse, // ← White text on dark overlay
    marginBottom: 24,
  },
  tabletHeroMetadata: {
    flexDirection: 'column',
    gap: 12,
  },
  tabletCurrentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight, // ← ONLY COLOR CHANGED
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
  },
  tabletCurrentBadgeText: {
    ...theme.typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success, // ← ONLY COLOR CHANGED
  },
  tabletHeroSummary: {
    ...theme.typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textInverse, // ← White text on dark overlay
  },
  tabletHeroSummaryPortrait: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  tabletMetadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabletMetadataText: {
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.textTertiary, // ← ONLY COLOR CHANGED
  },

  // Tablet Two Column Layout
  tabletContentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 48,
    paddingTop: 40,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: 40,
  },

  // Tablet Sidebar (Left Column)
  tabletSidebar: {
    width: 280,
    flexShrink: 0,
  },
  tabletSidebarSection: {
    marginBottom: 32,
  },
  tabletSidebarTitle: {
    ...theme.typography.h3,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginBottom: 16,
  },

  // Speaker Cards
  tabletSpeakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  tabletSpeakerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletSpeakerInfo: {
    flex: 1,
  },
  tabletSpeakerName: {
    ...theme.typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginBottom: 2,
  },
  tabletSpeakerRole: {
    ...theme.typography.caption,
    fontSize: 13,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
  },

  // Topics
  tabletTopicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabletTopicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tabletTopicText: {
    ...theme.typography.caption,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },

  // Summary
  tabletSummaryCard: {
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  tabletSummaryText: {
    ...theme.typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.textTertiary, // ← ONLY COLOR CHANGED
  },

  // Empty State
  tabletEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  tabletEmptyStateText: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.border, // ← ONLY COLOR CHANGED
    marginTop: 8,
    textAlign: 'center',
  },

  // Tablet Main Content (Right Column)
  tabletMainContent: {
    flex: 1,
    minWidth: 0, // Ensures flex child doesn't overflow
  },
  tabletSectionTitle: {
    ...theme.typography.h2,
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginBottom: 24,
    paddingTop: 4, // Prevent text clipping at the top
  },
  tabletMessagesGrid: {
    gap: 16,
    paddingRight: 8, // Add some breathing room on the right
  },

  // Phone Layout Styles
  phoneArtContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  phoneArtImageWrapper: {
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: theme.colors.shadowDark, // ← ONLY COLOR CHANGED
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  phoneArtwork: {
    width: '100%' as const,
    height: '100%' as const,
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
  },
  phoneCurrentLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 0,
  },
  phoneSummarySection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  phoneSummaryLabel: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneSummaryText: {
    ...theme.typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textTertiary, // ← ONLY COLOR CHANGED
  },
  phoneTagsSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  phoneTagsLabel: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  phoneTagText: {
    ...theme.typography.caption,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },
  phoneTagMore: {
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneTagMoreText: {
    ...theme.typography.caption,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
  },
  phoneMessagesList: {
    // marginTop is set dynamically based on isCurrentSeries
  },
});
