import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
  ImageBackground,
  useWindowDimensions,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
import { queueSeriesDownload } from '../../services/downloads/queueProcessor';
import { useDownloadQueueStore } from '../../stores/downloadQueueStore';

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

  // Get messages in queue - use stable selector to avoid infinite re-renders
  const queueItems = useDownloadQueueStore((state) => state.items);
  const queuedMessageIds = useMemo(
    () => new Set(queueItems.map((item) => item.messageId)),
    [queueItems]
  );

  // Calculate downloadable messages (not downloaded and not in queue)
  const downloadableMessages = useMemo(() => {
    if (!series?.Messages) return [];
    return series.Messages.filter(
      (msg) =>
        msg.AudioUrl &&
        !downloadedMessages.has(msg.MessageId) &&
        !queuedMessageIds.has(msg.MessageId)
    );
  }, [series?.Messages, downloadedMessages, queuedMessageIds]);

  // Handle download series action
  const handleDownloadSeries = useCallback((count?: number) => {
    if (!series || downloadableMessages.length === 0) return;

    const messagesToDownload = count
      ? downloadableMessages.slice(0, count)
      : downloadableMessages;

    if (messagesToDownload.length === 0) {
      Alert.alert(
        t('listen.series.downloadSeries'),
        t('listen.series.noMessagesToDownload')
      );
      return;
    }

    // Show confirmation
    Alert.alert(
      t('listen.series.confirmDownloadTitle'),
      t('listen.series.confirmDownloadMessage', { count: messagesToDownload.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('listen.sermon.download'),
          onPress: () => {
            queueSeriesDownload(messagesToDownload, series.Name, seriesArtUrl);

            // Track analytics
            logCustomEvent('download_series', {
              series_id: seriesId,
              series_name: series.Name,
              message_count: messagesToDownload.length,
              download_type: count ? 'partial' : 'full',
            });

            // Show success feedback
            Alert.alert(
              t('listen.series.downloadSeries'),
              count
                ? t('listen.series.queuedSome', { count: messagesToDownload.length })
                : t('listen.series.queuedAll', { count: messagesToDownload.length })
            );
          },
        },
      ]
    );
  }, [series, downloadableMessages, seriesArtUrl, seriesId, t]);

  // Show download options
  const showDownloadOptions = useCallback(() => {
    if (!series) return;

    const totalMessages = series.Messages.filter((m) => m.AudioUrl).length;
    const downloadedCount = downloadedMessages.size + queuedMessageIds.size;
    const availableCount = downloadableMessages.length;

    if (availableCount === 0) {
      Alert.alert(
        t('listen.series.downloadSeries'),
        t('listen.series.noMessagesToDownload')
      );
      return;
    }

    // Build options based on availability
    const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }[] = [];

    // Always show "Download All" if there are messages to download
    options.push({
      text: t('listen.series.downloadAll'),
      onPress: () => handleDownloadSeries(),
    });

    // Show "Download Next 3" if there are more than 3 available
    if (availableCount > 3) {
      options.push({
        text: t('listen.series.downloadNext', { count: 3 }),
        onPress: () => handleDownloadSeries(3),
      });
    }

    options.push({ text: t('common.cancel'), style: 'cancel' });

    Alert.alert(
      t('listen.series.downloadSeries'),
      downloadedCount > 0
        ? t('listen.series.someDownloaded', { downloaded: downloadedCount, total: totalMessages })
        : undefined,
      options
    );
  }, [series, downloadedMessages, queuedMessageIds, downloadableMessages, handleDownloadSeries, t]);

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

            {/* Download Series Section */}
            <View style={styles.tabletSidebarSection}>
              <Text style={styles.tabletSidebarTitle}>{t('listen.series.downloadSeries')}</Text>
              <TouchableOpacity
                style={styles.tabletDownloadSeriesButton}
                onPress={showDownloadOptions}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={downloadableMessages.length === 0 ? 'checkmark-circle' : 'cloud-download-outline'}
                  size={24}
                  color={downloadableMessages.length === 0 ? theme.colors.success : theme.colors.textInverse}
                />
                <View style={styles.tabletDownloadSeriesContent}>
                  <Text style={[
                    styles.tabletDownloadSeriesText,
                    downloadableMessages.length === 0 && styles.tabletDownloadSeriesTextComplete
                  ]}>
                    {downloadableMessages.length === 0
                      ? t('listen.series.allDownloaded')
                      : t('listen.series.downloadAll')}
                  </Text>
                  {downloadableMessages.length > 0 && (
                    <Text style={styles.tabletDownloadSeriesSubtext}>
                      {downloadableMessages.length} {downloadableMessages.length === 1 ? 'message' : 'messages'} available
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
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

        {/* Download Series Button */}
        <TouchableOpacity
          style={styles.phoneDownloadSeriesButton}
          onPress={showDownloadOptions}
          activeOpacity={0.7}
        >
          <Ionicons
            name={downloadableMessages.length === 0 ? 'checkmark-circle' : 'cloud-download-outline'}
            size={20}
            color={downloadableMessages.length === 0 ? theme.colors.success : theme.colors.primary}
          />
          <Text style={[
            styles.phoneDownloadSeriesText,
            downloadableMessages.length === 0 && styles.phoneDownloadSeriesTextComplete
          ]}>
            {downloadableMessages.length === 0
              ? t('listen.series.allDownloaded')
              : t('listen.series.downloadSeries')}
          </Text>
          {downloadableMessages.length > 0 && (
            <View style={styles.phoneDownloadSeriesBadge}>
              <Text style={styles.phoneDownloadSeriesBadgeText}>{downloadableMessages.length}</Text>
            </View>
          )}
        </TouchableOpacity>

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

  // Phone Download Series Button
  phoneDownloadSeriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  phoneDownloadSeriesText: {
    ...theme.typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
    flex: 1,
  },
  phoneDownloadSeriesTextComplete: {
    color: theme.colors.success,
  },
  phoneDownloadSeriesBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  phoneDownloadSeriesBadgeText: {
    ...theme.typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },

  // Tablet Download Series Button
  tabletDownloadSeriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  tabletDownloadSeriesContent: {
    flex: 1,
  },
  tabletDownloadSeriesText: {
    ...theme.typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textInverse,
  },
  tabletDownloadSeriesTextComplete: {
    color: theme.colors.success,
  },
  tabletDownloadSeriesSubtext: {
    ...theme.typography.caption,
    fontSize: 13,
    color: theme.colors.textInverse,
    opacity: 0.8,
    marginTop: 2,
  },
});
