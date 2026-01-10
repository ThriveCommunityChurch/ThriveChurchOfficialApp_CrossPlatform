import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SermonMessage, SermonSeries } from '../../types/api';
import { api } from '../../services/api/client';
import { usePlayer } from '../../hooks/usePlayer';
import { deleteDownload, getDownloadSize } from '../../services/downloads/downloadManager';
import { isMessageDownloaded } from '../../services/storage/storage';
import { setCurrentScreen, logCustomEvent, logPlaySermon, logDownloadSermon } from '../../services/analytics/analyticsService';
import { getTagDisplayLabel } from '../../types/messageTag';
import { RelatedSeriesSection } from '../../components/RelatedSeriesSection';
import { useDownloadQueueStore } from '../../stores/downloadQueueStore';
import { useShallow } from 'zustand/react/shallow';
import { queueSermonDownload } from '../../services/downloads/queueProcessor';
import { canDownloadNow } from '../../services/downloads/networkMonitor';
import {
  hasBeenPromptedForWifiOnly,
  markWifiOnlyPrompted,
  updateDownloadSetting,
} from '../../services/downloads/downloadSettings';

type SermonDetailScreenRouteProp = RouteProp<{
  SermonDetailScreen: {
    message: SermonMessage;
    seriesTitle: string;
    seriesArtUrl: string;
    seriesId: string;
  };
}, 'SermonDetailScreen'>;

export const SermonDetailScreen: React.FC = () => {
  const route = useRoute<SermonDetailScreenRouteProp>();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { message, seriesTitle, seriesArtUrl, seriesId } = route.params;
  const player = usePlayer();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [downloaded, setDownloaded] = useState(false);
  const [fileSize, setFileSize] = useState<number>(0);

  // Get queue state for this message - only extract the fields we need to avoid re-renders
  const { queueStatus, downloadProgress } = useDownloadQueueStore(
    useShallow((state) => {
      const item = state.items.find((i) => i.messageId === message.MessageId);
      return {
        queueStatus: item?.status,
        downloadProgress: item?.progress || 0,
      };
    })
  );
  const isDownloading = queueStatus === 'downloading';
  const isQueued = queueStatus === 'queued' || queueStatus === 'paused';

  // Calculate orientation and responsive dimensions
  const isLandscape = windowWidth > windowHeight;
  const isTabletDevice = (Platform.OS === 'ios' && Platform.isPad) || Math.min(windowWidth, windowHeight) >= 768;

  // Determine if we need to fetch series data (when coming from search with SeriesId but no artwork)
  const needsSeriesData = !!(seriesId && !seriesArtUrl);

  // Fetch series data if needed (when coming from search results)
  const { data: seriesData, isLoading: isLoadingSeries } = useQuery({
    queryKey: ['series', seriesId],
    queryFn: async (): Promise<SermonSeries> => {
      const res = await api.get(`api/sermons/series/${seriesId}`);
      return res.data;
    },
    enabled: needsSeriesData, // Only fetch if we need it
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Calculate week number from series data if available
  const calculatedWeekNum = useMemo(() => {
    if (!seriesData || !message.MessageId) return message.WeekNum;

    const messageIndex = seriesData.Messages.findIndex(
      (m) => m.MessageId === message.MessageId
    );

    if (messageIndex === -1) return message.WeekNum;

    // Week number is reverse order (newest = week 1)
    return seriesData.Messages.length - messageIndex;
  }, [seriesData, message.MessageId, message.WeekNum]);

  // Use fetched data or fallback to route params
  const displaySeriesTitle = seriesData?.Name || seriesTitle;
  const displaySeriesArtUrl = seriesData?.ArtUrl || seriesArtUrl;
  const displayWeekNum = calculatedWeekNum || message.WeekNum;

  // Update message object with calculated week number
  const messageWithWeek = useMemo(() => ({
    ...message,
    WeekNum: displayWeekNum,
  }), [message, displayWeekNum]);

  // Track screen view with sermon info
  useEffect(() => {
    setCurrentScreen('SermonDetailScreen', 'SermonDetail');
    logCustomEvent('view_sermon', {
      sermon_id: message.MessageId,
      sermon_title: message.Title,
      series_title: displaySeriesTitle,
      content_type: 'sermon',
    });
  }, [message.MessageId, message.Title, displaySeriesTitle]);

  useEffect(() => {
    const checkDownloadStatus = async () => {
      const isDownloaded = await isMessageDownloaded(message.MessageId);
      setDownloaded(isDownloaded);

      // If downloaded, get the actual file size
      if (isDownloaded) {
        const size = await getDownloadSize(message.MessageId);
        setFileSize(size);
      } else {
        // Use the API-provided file size if available
        setFileSize(message.AudioFileSize || 0);
      }
    };
    checkDownloadStatus();
  }, [message.MessageId, message.AudioFileSize]);

  // Watch for download completion and update downloaded state
  useEffect(() => {
    if (queueStatus === 'completed') {
      // Download just finished - update state
      setDownloaded(true);
      // Also update file size
      getDownloadSize(message.MessageId).then((size) => {
        if (size > 0) setFileSize(size);
      });
    }
  }, [queueStatus, message.MessageId]);

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

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handlePlayAudio = useCallback(async () => {
    try {
      // Track sermon play event
      await logPlaySermon(message.MessageId, message.Title);

      await player.play({
        message,
        seriesId,
        seriesTitle: displaySeriesTitle,
        seriesArt: displaySeriesArtUrl,
        isLocal: downloaded,
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert(t('common.error'), t('listen.sermon.errorPlayAudio'));
    }
  }, [player, message, seriesId, displaySeriesTitle, displaySeriesArtUrl, downloaded, t]);

  const handlePlayVideo = useCallback(() => {
    if (!message.VideoUrl) {
      Alert.alert(t('listen.sermon.noVideo'), t('listen.sermon.noVideoMessage'));
      return;
    }

    navigation.navigate('VideoPlayerScreen', {
      message,
      seriesTitle: displaySeriesTitle,
    });
  }, [navigation, message, displaySeriesTitle, t]);

  const handleReadPassage = useCallback(() => {
    if (!message.PassageRef) {
      Alert.alert(t('listen.sermon.noPassage'), t('listen.sermon.noPassageMessage'));
      return;
    }

    navigation.navigate('BiblePassageScreen', {
      message,
      seriesTitle: displaySeriesTitle,
    });
  }, [navigation, message, displaySeriesTitle, t]);

  // Helper to actually queue the download and show feedback
  const proceedWithDownload = useCallback(async () => {
    // Check network status and queue state to provide appropriate feedback
    const networkStatus = await canDownloadNow();
    const queueStore = useDownloadQueueStore.getState();
    const queuedItems = queueStore.items.filter(
      (item) => item.status === 'queued' || item.status === 'downloading'
    );
    const hasActiveDownloads = queuedItems.length > 0;

    // Add to download queue
    queueSermonDownload(message, displaySeriesTitle, displaySeriesArtUrl);

    // Track sermon download event
    logDownloadSermon(message.MessageId, message.Title);

    // Show context-aware feedback
    let feedbackMessage: string;
    if (!networkStatus.allowed) {
      // Distinguish between WiFi-only restriction and no internet
      const isWifiOnlyRestriction = networkStatus.reason?.includes('WiFi-only');
      if (isWifiOnlyRestriction) {
        feedbackMessage = t('listen.downloads.addedWillDownloadOnWifi');
      } else {
        // No internet connection
        feedbackMessage = t('listen.downloads.addedWillDownloadWhenOnline');
      }
    } else if (hasActiveDownloads) {
      // Connected and can download, but there are items ahead in queue
      feedbackMessage = t('listen.downloads.addedToQueueWaiting');
    } else {
      // Connected, can download, queue is empty - download starting now
      feedbackMessage = t('listen.downloads.downloadStarting');
    }

    Alert.alert(t('common.success'), feedbackMessage);
  }, [message, displaySeriesTitle, displaySeriesArtUrl, t]);

  const handleDownload = useCallback(async () => {
    if (!message.AudioUrl) {
      Alert.alert(t('common.error'), t('listen.sermon.noAudioDownload'));
      return;
    }

    // Check if this is the user's first download - show WiFi preference prompt
    const hasBeenPrompted = await hasBeenPromptedForWifiOnly();
    if (!hasBeenPrompted) {
      // Mark as prompted regardless of their choice
      await markWifiOnlyPrompted();

      // Show the first-time WiFi preference prompt
      Alert.alert(
        t('listen.downloads.wifiOnlyPromptTitle'),
        t('listen.downloads.wifiOnlyPromptMessage'),
        [
          {
            text: t('listen.downloads.keepWifiOnly'),
            style: 'cancel',
            onPress: () => {
              // Default is already WiFi-only, just proceed
              proceedWithDownload();
            },
          },
          {
            text: t('listen.downloads.allowCellular'),
            onPress: async () => {
              // Update setting to allow cellular downloads
              await updateDownloadSetting('wifiOnly', false);
              proceedWithDownload();
            },
          },
        ]
      );
      return;
    }

    // Already prompted before, just proceed with download
    proceedWithDownload();
  }, [message, t, proceedWithDownload]);

  const handleDeleteDownload = useCallback(async () => {
    Alert.alert(
      t('listen.sermon.removeDownloadTitle'),
      t('listen.sermon.removeDownloadMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('listen.sermon.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDownload(message.MessageId);
              setDownloaded(false);
              Alert.alert(t('common.success'), t('listen.sermon.removeSuccess'));
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert(t('common.error'), t('listen.sermon.removeFailed'));
            }
          },
        },
      ]
    );
  }, [message.MessageId, t]);

  const handleTakeNotes = useCallback(() => {
    // Navigate to Notes tab, then to NoteDetail screen with sermon context
    (navigation as any).navigate('Notes', {
      screen: 'NoteDetail',
      params: {
        messageId: message.MessageId,
        messageTitle: message.Title,
        seriesTitle: displaySeriesTitle,
        seriesArt: displaySeriesArtUrl,
        speaker: message.Speaker || 'Unknown',
        messageDate: message.Date || new Date().toISOString(),
        seriesId: seriesId,
      },
    });
  }, [navigation, message, displaySeriesTitle, displaySeriesArtUrl, seriesId]);

  const hasAudio = !!message.AudioUrl;
  const hasVideo = !!message.VideoUrl;
  const hasPassage = !!message.PassageRef;

  // Render tablet layout with hero section and improved content layout
  const renderTabletLayout = () => {
    // Dynamic styles based on orientation for responsive design
    const heroSectionHeight = isLandscape ? windowHeight * 0.45 : windowHeight * 0.5;
    const artworkWidth = isLandscape ? 280 : 400;
    const titleFontSize = isLandscape ? 32 : 48;
    const titleLineHeight = isLandscape ? 38 : 56;

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Hero Section with Blurred Background and Sharp Artwork */}
          <View style={[styles.tabletHeroSection, { height: heroSectionHeight }]}>
            {/* Blurred Background Image */}
            <ImageBackground
              source={{ uri: displaySeriesArtUrl }}
              style={styles.tabletHeroBackground}
              blurRadius={50}
              resizeMode="cover"
            >
              <View style={styles.tabletHeroOverlay}>
                <View style={styles.tabletHeroContentContainer}>
                  {/* Left Side - Sharp Series Artwork */}
                  <View style={[styles.tabletHeroArtworkContainer, { width: artworkWidth }]}>
                    <Image
                      source={{ uri: displaySeriesArtUrl }}
                      style={styles.tabletHeroArtwork}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Right Side - Content */}
                  <View style={styles.tabletHeroContent}>
                    {/* Series Title */}
                    <Text style={styles.tabletHeroSeriesTitle}>{displaySeriesTitle}</Text>

                    {/* Sermon Title */}
                    <Text style={[styles.tabletHeroTitle, { fontSize: titleFontSize, lineHeight: titleLineHeight }]} numberOfLines={3}>
                      {message.Title}
                    </Text>

                    {/* Primary Action Buttons - Below Title in Landscape, Below Everything in Portrait */}
                    {isLandscape && (
                      <View style={styles.tabletHeroActionsLandscape}>
                        {hasAudio && (
                          <TouchableOpacity
                            style={styles.tabletHeroPrimaryButton}
                            onPress={handlePlayAudio}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="play" size={20} color={theme.colors.textInverse} />
                            <Text style={styles.tabletHeroPrimaryButtonText}>{t('listen.sermon.playAudio')}</Text>
                          </TouchableOpacity>
                        )}

                        {hasVideo && (
                          <TouchableOpacity
                            style={styles.tabletHeroSecondaryButton}
                            onPress={handlePlayVideo}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="videocam" size={20} color={theme.colors.textInverse} />
                            <Text style={styles.tabletHeroSecondaryButtonText}>{t('listen.sermon.playVideo')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* Primary Action Buttons - Portrait Mode Only */}
                {!isLandscape && (
                  <View style={styles.tabletHeroActions}>
                    {hasAudio && (
                      <TouchableOpacity
                        style={styles.tabletHeroPrimaryButton}
                        onPress={handlePlayAudio}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="play" size={20} color={theme.colors.textInverse} />
                        <Text style={styles.tabletHeroPrimaryButtonText}>{t('listen.sermon.playAudio')}</Text>
                      </TouchableOpacity>
                    )}

                    {hasVideo && (
                      <TouchableOpacity
                        style={styles.tabletHeroSecondaryButton}
                        onPress={handlePlayVideo}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="videocam" size={20} color={theme.colors.textInverse} />
                        <Text style={styles.tabletHeroSecondaryButtonText}>{t('listen.sermon.playVideo')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </ImageBackground>
          </View>

        {/* Main Content Section - Two Column Layout */}
        <View style={styles.tabletContentContainer}>
          {/* Left Sidebar - Metadata & Quick Actions */}
          <View style={styles.tabletSidebar}>
            {/* Metadata Cards */}
            <View style={styles.tabletMetadataSection}>
              <Text style={styles.tabletSectionTitle}>{t('listen.sermon.details')}</Text>

              {/* Week Card */}
              <View style={styles.tabletMetadataCard}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                <View style={styles.tabletMetadataCardContent}>
                  <Text style={styles.tabletMetadataLabel}>{t('listen.sermon.week')}</Text>
                  <Text style={styles.tabletMetadataValue}>{messageWithWeek.WeekNum ?? '—'}</Text>
                </View>
              </View>

              {/* Speaker Card */}
              {message.Speaker && (
                <View style={styles.tabletMetadataCard}>
                  <Ionicons name="person" size={20} color={theme.colors.primary} />
                  <View style={styles.tabletMetadataCardContent}>
                    <Text style={styles.tabletMetadataLabel}>{t('listen.speaker')}</Text>
                    <Text style={styles.tabletMetadataValue}>{message.Speaker}</Text>
                  </View>
                </View>
              )}

              {/* Date Card */}
              {message.Date && (
                <View style={styles.tabletMetadataCard}>
                  <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                  <View style={styles.tabletMetadataCardContent}>
                    <Text style={styles.tabletMetadataLabel}>{t('listen.sermon.date')}</Text>
                    <Text style={styles.tabletMetadataValue}>{formatDate(message.Date)}</Text>
                  </View>
                </View>
              )}

              {/* Duration Card */}
              {message.AudioDuration && message.AudioDuration > 0 && (
                <View style={styles.tabletMetadataCard}>
                  <Ionicons name="time" size={20} color={theme.colors.primary} />
                  <View style={styles.tabletMetadataCardContent}>
                    <Text style={styles.tabletMetadataLabel}>{t('listen.sermon.duration')}</Text>
                    <Text style={styles.tabletMetadataValue}>{formatDuration(message.AudioDuration)}</Text>
                  </View>
                </View>
              )}

              {/* File Size Card - only show if downloaded and size > 0 */}
              {downloaded && fileSize > 0 && (
                <View style={styles.tabletMetadataCard}>
                  <Ionicons name="document" size={20} color={theme.colors.primary} />
                  <View style={styles.tabletMetadataCardContent}>
                    <Text style={styles.tabletMetadataLabel}>File Size</Text>
                    <Text style={styles.tabletMetadataValue}>{formatFileSize(fileSize)}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Scripture Reference */}
            {hasPassage && (
              <TouchableOpacity
                style={styles.tabletSidebarPassageCard}
                onPress={handleReadPassage}
                activeOpacity={0.7}
              >
                <Ionicons name="book" size={24} color={theme.colors.primary} />
                <View style={styles.tabletSidebarPassageContent}>
                  <Text style={styles.tabletSidebarPassageLabel}>{t('listen.scripture')}</Text>
                  <Text style={styles.tabletSidebarPassageText}>{message.PassageRef}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Download Section */}
            <View style={styles.tabletDownloadSection}>
              {downloaded && (
                <View style={styles.tabletDownloadedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  <Text style={styles.tabletDownloadedText}>{t('listen.sermon.downloaded')}</Text>
                </View>
              )}

              {hasAudio && (
                <TouchableOpacity
                  style={[
                    styles.tabletDownloadButton,
                    (isDownloading || isQueued || downloaded) && styles.tabletDownloadButtonDisabled,
                  ]}
                  onPress={handleDownload}
                  activeOpacity={0.8}
                  disabled={isDownloading || isQueued || downloaded}
                >
                  {isDownloading ? (
                    <>
                      <ActivityIndicator size="small" color={theme.colors.text} />
                      <Text style={styles.tabletDownloadButtonText}>
                        {Math.round(downloadProgress)}%
                      </Text>
                    </>
                  ) : isQueued ? (
                    <>
                      <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                      <Text style={styles.tabletDownloadButtonText}>{t('listen.downloads.queued')}</Text>
                    </>
                  ) : downloaded ? (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.tabletDownloadButtonText}>{t('listen.sermon.saved')}</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="download" size={20} color={theme.colors.text} />
                      <Text style={styles.tabletDownloadButtonText}>
                        {t('listen.sermon.download')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Take Notes Button */}
              <TouchableOpacity
                style={styles.tabletDownloadButton}
                onPress={handleTakeNotes}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={20} color={theme.colors.text} />
                <Text style={styles.tabletDownloadButtonText}>{t('listen.sermon.takeNotes')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Main Content - Summary and Topics */}
          <View style={styles.tabletMainContent}>
            {/* Summary Section */}
            {message.Summary && (
              <View style={styles.tabletSection}>
                <Text style={styles.tabletSectionTitle}>{t('listen.aboutThisMessage')}</Text>
                <View style={styles.tabletSummaryCard}>
                  <Text style={styles.tabletSummaryText}>{message.Summary}</Text>
                </View>
              </View>
            )}

            {/* Tags Section */}
            <View style={styles.tabletSection}>
              <Text style={styles.tabletSectionTitle}>Topics</Text>
              {message.Tags && message.Tags.length > 0 ? (
                <View style={styles.tabletTagsContainer}>
                  {message.Tags.map((tag, index) => (
                    <View key={index} style={styles.tabletTag}>
                      <Ionicons name="pricetag" size={14} color={theme.colors.primary} />
                      <Text style={styles.tabletTagText}>{getTagDisplayLabel(tag)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.tabletEmptyState}>
                  <Ionicons name="pricetags-outline" size={32} color={theme.colors.textTertiary} />
                  <Text style={styles.tabletEmptyStateText}>
                    No topics tagged
                  </Text>
                </View>
              )}
            </View>

            {/* Related Series Section */}
            <RelatedSeriesSection
              currentMessageTags={message.Tags || []}
              currentSeriesId={seriesId}
            />
          </View>
        </View>
      </ScrollView>
    </View>
    );
  };

  // Render phone layout (original vertical design)
  const renderPhoneLayout = () => (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Series Artwork */}
        <Image
          source={{ uri: displaySeriesArtUrl }}
          style={styles.artwork}
          resizeMode="cover"
        />

        {/* Content Section */}
        <View style={styles.content}>
          {/* Week Badge */}
          <View style={styles.weekBadge}>
            <Text style={styles.weekNumber}>{messageWithWeek.WeekNum ?? '—'}</Text>
            <Text style={styles.weekLabel}>{t('listen.sermon.week')}</Text>
          </View>

          {/* Sermon Title */}
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {message.Title}
          </Text>

          {/* Series Title */}
          <Text style={styles.seriesTitle}>{displaySeriesTitle}</Text>

          {/* Metadata Section */}
          <View style={styles.metadataSection}>
            {/* Speaker */}
            {message.Speaker && (
              <View style={styles.metadataRow}>
                <Ionicons name="person" size={18} color={theme.colors.primary} />
                <Text style={styles.metadataText}>{message.Speaker}</Text>
              </View>
            )}

            {/* Date */}
            {message.Date && (
              <View style={styles.metadataRow}>
                <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                <Text style={styles.metadataText}>{formatDate(message.Date)}</Text>
              </View>
            )}

            {/* Duration - only show if > 0 */}
            {message.AudioDuration && message.AudioDuration > 0 && (
              <View style={styles.metadataRow}>
                <Ionicons name="time" size={18} color={theme.colors.primary} />
                <Text style={styles.metadataText}>{formatDuration(message.AudioDuration)}</Text>
              </View>
            )}

            {/* File Size - only show if downloaded and size > 0 */}
            {downloaded && fileSize > 0 && (
              <View style={styles.metadataRow}>
                <Ionicons name="document" size={18} color={theme.colors.primary} />
                <Text style={styles.metadataText}>{formatFileSize(fileSize)}</Text>
              </View>
            )}
          </View>

          {/* Bible Passage - Prominent */}
          {hasPassage && (
            <TouchableOpacity
              style={styles.passageCard}
              onPress={handleReadPassage}
              activeOpacity={0.7}
            >
              <Ionicons name="book" size={24} color={theme.colors.primary} />
              <View style={styles.passageContent}>
                <Text style={styles.passageLabel}>{t('listen.scriptureReference')}</Text>
                <Text style={styles.passageText}>{message.PassageRef}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Summary Section */}
          {message.Summary && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t('listen.aboutThisMessage')}</Text>
              <Text style={styles.summaryText}>{message.Summary}</Text>
            </View>
          )}

          {/* Tags Section - Limited to 4 tags on mobile */}
          {message.Tags && message.Tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>Topics</Text>
              <View style={styles.tagsContainer}>
                {message.Tags.slice(0, 4).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Ionicons name="pricetag" size={12} color={theme.colors.primary} />
                    <Text style={styles.tagText}>{getTagDisplayLabel(tag)}</Text>
                  </View>
                ))}
                {message.Tags.length > 4 && (
                  <View style={styles.tagMore}>
                    <Text style={styles.tagMoreText}>+{message.Tags.length - 4} more</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Download Status */}
          {downloaded && (
            <View style={styles.downloadedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Text style={styles.downloadedText}>{t('listen.sermon.downloaded')}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            {/* Play Audio Button - Primary */}
            {hasAudio && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handlePlayAudio}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={24} color={theme.colors.textInverse} />
                <Text style={styles.primaryButtonText}>{t('listen.sermon.playAudio')}</Text>
              </TouchableOpacity>
            )}

            {/* Secondary Actions Row */}
            <View style={styles.secondaryActionsRow}>
              {/* Play Video Button */}
              {hasVideo && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handlePlayVideo}
                  activeOpacity={0.8}
                >
                  <Ionicons name="videocam" size={20} color={theme.colors.text} />
                  <Text style={styles.secondaryButtonText}>Watch Video</Text>
                </TouchableOpacity>
              )}

              {/* Download/Saved Button */}
              {hasAudio && (
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    (isDownloading || isQueued || downloaded) && styles.secondaryButtonDisabled,
                  ]}
                  onPress={handleDownload}
                  activeOpacity={0.8}
                  disabled={isDownloading || isQueued || downloaded}
                >
                  {isDownloading ? (
                    <>
                      <ActivityIndicator size="small" color={theme.colors.text} />
                      <Text style={styles.secondaryButtonText}>
                        {Math.round(downloadProgress)}%
                      </Text>
                    </>
                  ) : isQueued ? (
                    <>
                      <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                      <Text style={styles.secondaryButtonText}>{t('listen.downloads.queued')}</Text>
                    </>
                  ) : downloaded ? (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.secondaryButtonText}>{t('listen.sermon.saved')}</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="download" size={20} color={theme.colors.text} />
                      <Text style={styles.secondaryButtonText}>
                        {t('listen.sermon.download')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Take Notes Button - Full Width */}
            <TouchableOpacity
              style={styles.notesButton}
              onPress={handleTakeNotes}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.text} />
              <Text style={styles.secondaryButtonText}>{t('listen.sermon.takeNotes')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  // Show loading indicator while fetching series data
  if (needsSeriesData && isLoadingSeries) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.summaryText, { marginTop: 16 }]}>
          {t('listen.sermon.loadingDetails')}
        </Text>
      </View>
    );
  }

  // Conditionally render based on device type
  return isTabletDevice ? renderTabletLayout() : renderPhoneLayout();
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  scrollView: {
    flex: 1,
  },
  artwork: {
    width: '100%' as const,
    aspectRatio: 16 / 9,
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
  },
  content: {
    padding: 20,
  },
  weekBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary, // ← ONLY COLOR CHANGED
    gap: 0, // Remove any gap between number and label
  },
  weekNumber: {
    ...theme.typography.h2,
    fontSize: 22,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    lineHeight: 24, // Tighter line height
    marginBottom: -2, // Reduce space between number and label
  },
  weekLabel: {
    ...theme.typography.caption,
    fontSize: 10,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    textTransform: 'uppercase',
    lineHeight: 12, // Tighter line height
    marginTop: -2, // Reduce space between number and label
  },
  title: {
    ...theme.typography.h1,
    fontSize: 28,
    lineHeight: 34, // Add proper line height to prevent cutoff
    marginBottom: 8,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },
  seriesTitle: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginBottom: 24,
  },
  metadataSection: {
    marginBottom: 24,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metadataText: {
    ...theme.typography.body,
    fontSize: 15,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginLeft: 12,
  },
  passageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  passageContent: {
    flex: 1,
    marginLeft: 12,
  },
  passageLabel: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginBottom: 4,
  },
  passageText: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },
  summaryCard: {
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  summaryLabel: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    ...theme.typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsLabel: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  tagText: {
    ...theme.typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },
  tagMore: {
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagMoreText: {
    ...theme.typography.caption,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  downloadedText: {
    ...theme.typography.label,
    fontSize: 13,
    color: theme.colors.success, // ← ONLY COLOR CHANGED
    marginLeft: 6,
  },
  actionsSection: {
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary, // ← ONLY COLOR CHANGED
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: theme.colors.primary, // ← ONLY COLOR CHANGED
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    ...theme.typography.button,
    fontSize: 18,
    color: theme.colors.textInverse, // ← ONLY COLOR CHANGED
    marginLeft: 8,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    ...theme.typography.button,
    fontSize: 14,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginLeft: 6,
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 12,
  },
  // Tablet-specific styles - New iPad Design
  // Hero Section
  tabletHeroSection: {
    width: '100%',
    minHeight: 400,
  },
  tabletHeroBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  tabletHeroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay for text readability
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  tabletHeroContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
    maxWidth: 1200,
    width: '100%',
    marginBottom: 24,
  },
  tabletHeroArtworkContainer: {
    position: 'relative',
    width: 400,
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: theme.colors.shadowDark, // ← ONLY COLOR CHANGED
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  tabletHeroArtwork: {
    width: '100%' as const,
    height: '100%' as const,
  },
  tabletHeroContent: {
    flex: 1,
    justifyContent: 'center',
  },
  tabletHeroSeriesTitle: {
    ...theme.typography.h3,
    fontSize: 18,
    color: theme.colors.textInverse, // ← White text for readability on all blurred backgrounds
    marginBottom: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabletHeroTitle: {
    ...theme.typography.h1,
    fontSize: 48,
    lineHeight: 56,
    marginBottom: 0,
    color: theme.colors.textInverse, // ← ONLY COLOR CHANGED (white text on dark overlay)
    fontWeight: '700',
  },
  tabletHeroActions: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: 1200,
    width: '100%',
    justifyContent: 'center',
  },
  tabletHeroActionsLandscape: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    justifyContent: 'flex-start',
  },
  tabletHeroPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary, // ← ONLY COLOR CHANGED
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: theme.colors.primary, // ← ONLY COLOR CHANGED
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabletHeroPrimaryButtonText: {
    ...theme.typography.button,
    fontSize: 15,
    color: theme.colors.textInverse, // ← ONLY COLOR CHANGED
    marginLeft: 8,
    fontWeight: '600',
  },
  tabletHeroSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27,41,51,0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  tabletHeroSecondaryButtonText: {
    ...theme.typography.button,
    fontSize: 15,
    color: theme.colors.textInverse, // ← ONLY COLOR CHANGED
    marginLeft: 8,
    fontWeight: '600',
  },

  // Content Container
  tabletContentContainer: {
    flexDirection: 'row',
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 48,
    paddingVertical: 40,
    gap: 40,
  },

  // Left Sidebar
  tabletSidebar: {
    flex: 1,
    maxWidth: 350,
  },
  tabletSectionTitle: {
    ...theme.typography.h3,
    fontSize: 20,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginBottom: 16,
    fontWeight: '700',
  },
  tabletMetadataSection: {
    marginBottom: 32,
  },
  tabletMetadataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  tabletMetadataCardContent: {
    marginLeft: 12,
    flex: 1,
  },
  tabletMetadataLabel: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabletMetadataValue: {
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    fontWeight: '600',
  },
  tabletSidebarPassageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    padding: 18,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.primary, // ← ONLY COLOR CHANGED
  },
  tabletSidebarPassageContent: {
    flex: 1,
    marginLeft: 12,
  },
  tabletSidebarPassageLabel: {
    ...theme.typography.caption,
    fontSize: 12,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabletSidebarPassageText: {
    ...theme.typography.h3,
    fontSize: 16,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    fontWeight: '600',
  },
  tabletDownloadSection: {
    gap: 12,
  },
  tabletDownloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  tabletDownloadedText: {
    ...theme.typography.label,
    fontSize: 14,
    color: theme.colors.success, // ← ONLY COLOR CHANGED
    marginLeft: 6,
    fontWeight: '600',
  },
  tabletDownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  tabletDownloadButtonDisabled: {
    opacity: 0.6,
  },
  tabletDownloadButtonText: {
    ...theme.typography.button,
    fontSize: 14,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginLeft: 8,
    fontWeight: '600',
  },

  // Right Main Content
  tabletMainContent: {
    flex: 2,
  },
  tabletSection: {
    marginBottom: 40,
  },
  tabletEmptyState: {
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
    borderStyle: 'dashed',
  },
  tabletEmptyStateText: {
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginTop: 12,
    textAlign: 'center',
  },

  // Summary Card
  tabletSummaryCard: {
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  tabletSummaryText: {
    ...theme.typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },

  // Tags Container
  tabletTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tabletTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  tabletTagText: {
    ...theme.typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text, // ← ONLY COLOR CHANGED
  },
});

