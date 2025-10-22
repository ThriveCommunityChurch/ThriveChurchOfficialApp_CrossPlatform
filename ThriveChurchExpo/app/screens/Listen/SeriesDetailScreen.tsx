import React, { useState, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import OfflineBanner from '../../components/OfflineBanner';
import { SermonSeries, SermonMessage } from '../../types/api';
import { isMessageDownloaded } from '../../services/storage/storage';
import { SermonMessageCard } from '../../components/SermonMessageCard';

interface SeriesDetailScreenProps {
  seriesId: string;
  seriesArtUrl: string;
}

export default function SeriesDetailScreen({ seriesId, seriesArtUrl }: SeriesDetailScreenProps) {
  const navigation = useNavigation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Calculate orientation and device type
  const isLandscape = windowWidth > windowHeight;
  const isTabletDevice = (Platform.OS === 'ios' && Platform.isPad) || Math.min(windowWidth, windowHeight) >= 768;

  const [downloadedMessages, setDownloadedMessages] = useState<Set<string>>(new Set());

  const { data: series, isLoading, isError } = useQuery({
    queryKey: ['series', seriesId],
    queryFn: async (): Promise<SermonSeries> => {
      const res = await api.get(`api/sermons/series/${seriesId}`);
      return res.data;
    },
  });

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
    });
  }, [navigation, series, seriesArtUrl]);

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
      <View style={{ flex: 1, backgroundColor: colors.bgDarkBlue, alignItems: 'center', justifyContent: 'center' }}>
        <OfflineBanner />
        <ActivityIndicator color={colors.white} size="large" />
      </View>
    );
  }

  if (isError || !series) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgDarkBlue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <OfflineBanner />
        <Text style={[typography.h2, { textAlign: 'center', marginBottom: 16 }]}>
          Error loading series
        </Text>
        <Text style={[typography.body, { textAlign: 'center', color: colors.lessLightLightGray }]}>
          Please try again later
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
                        <Ionicons name="radio-button-on" size={12} color={colors.bgGreen} />
                        <Text style={styles.tabletCurrentBadgeText}>Current Series</Text>
                      </View>
                    )}

                    {/* Message Count */}
                    <View style={styles.tabletMetadataItem}>
                      <Ionicons name="list" size={16} color={colors.lightGray} />
                      <Text style={styles.tabletMetadataText}>
                        {series.Messages.length} {series.Messages.length === 1 ? 'Message' : 'Messages'}
                      </Text>
                    </View>

                    {/* Date Range */}
                    {series.StartDate && (
                      <View style={styles.tabletMetadataItem}>
                        <Ionicons name="calendar-outline" size={16} color={colors.lightGray} />
                        <Text style={styles.tabletMetadataText}>
                          {formatDate(series.StartDate)}
                          {series.EndDate && ` - ${formatDate(series.EndDate)}`}
                        </Text>
                      </View>
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
              <Text style={styles.tabletSidebarTitle}>Speakers</Text>

              {/* Get unique speakers from messages */}
              {Array.from(new Set(series.Messages.map(m => m.Speaker).filter(Boolean))).map((speaker, index) => (
                <View key={index} style={styles.tabletSpeakerCard}>
                  <View style={styles.tabletSpeakerAvatar}>
                    <Ionicons name="person" size={24} color={colors.mainBlue} />
                  </View>
                  <View style={styles.tabletSpeakerInfo}>
                    <Text style={styles.tabletSpeakerName}>{speaker}</Text>
                    <Text style={styles.tabletSpeakerRole}>Speaker</Text>
                  </View>
                </View>
              ))}

              {/* Show placeholder if no speakers */}
              {Array.from(new Set(series.Messages.map(m => m.Speaker).filter(Boolean))).length === 0 && (
                <View style={styles.tabletEmptyState}>
                  <Ionicons name="person-outline" size={32} color={colors.lighterBlueGray} />
                  <Text style={styles.tabletEmptyStateText}>No speakers listed</Text>
                </View>
              )}
            </View>

            {/* Topics Section */}
            <View style={styles.tabletSidebarSection}>
              <Text style={styles.tabletSidebarTitle}>Topics</Text>

              {/* Placeholder topics - will be populated when API provides tags */}
              <View style={styles.tabletTopicsContainer}>
                <View style={styles.tabletTopicTag}>
                  <Ionicons name="pricetag" size={14} color={colors.mainBlue} />
                  <Text style={styles.tabletTopicText}>Faith</Text>
                </View>
                <View style={styles.tabletTopicTag}>
                  <Ionicons name="pricetag" size={14} color={colors.mainBlue} />
                  <Text style={styles.tabletTopicText}>Prayer</Text>
                </View>
                <View style={styles.tabletTopicTag}>
                  <Ionicons name="pricetag" size={14} color={colors.mainBlue} />
                  <Text style={styles.tabletTopicText}>Community</Text>
                </View>
              </View>

              {/* Empty state for when no topics */}
              {/* <View style={styles.tabletEmptyState}>
                <Ionicons name="pricetags-outline" size={32} color={colors.lighterBlueGray} />
                <Text style={styles.tabletEmptyStateText}>No topics tagged</Text>
              </View> */}
            </View>
          </View>

          {/* Right Main Content - Messages */}
          <View style={styles.tabletMainContent}>
            <Text style={styles.tabletSectionTitle}>Messages</Text>

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
            Current Series
          </Text>
        )}

        {/* Messages List */}
        <View style={[styles.phoneMessagesList, { marginTop: isCurrentSeries ? 0 : 16 }]}>
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

const styles = StyleSheet.create({
  // Common styles
  container: {
    flex: 1,
    backgroundColor: colors.bgDarkBlue,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  tabletHeroArtwork: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.darkGrey,
  },
  tabletHeroContent: {
    flex: 1,
    justifyContent: 'center',
  },
  tabletHeroTitle: {
    ...typography.h1,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 24,
  },
  tabletHeroMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 20,
  },
  tabletCurrentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tabletCurrentBadgeText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.bgGreen,
  },
  tabletMetadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabletMetadataText: {
    ...typography.body,
    fontSize: 16,
    color: colors.lessLightLightGray,
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
    ...typography.h3,
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 16,
  },

  // Speaker Cards
  tabletSpeakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGrey,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  tabletSpeakerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgDarkBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletSpeakerInfo: {
    flex: 1,
  },
  tabletSpeakerName: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  tabletSpeakerRole: {
    ...typography.caption,
    fontSize: 13,
    color: colors.lightGray,
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
    backgroundColor: colors.darkGrey,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tabletTopicText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
  },

  // Empty State
  tabletEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  tabletEmptyStateText: {
    ...typography.body,
    fontSize: 14,
    color: colors.lighterBlueGray,
    marginTop: 8,
    textAlign: 'center',
  },

  // Tablet Main Content (Right Column)
  tabletMainContent: {
    flex: 1,
    minWidth: 0, // Ensures flex child doesn't overflow
  },
  tabletSectionTitle: {
    ...typography.h2,
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  phoneArtwork: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.darkGrey,
  },
  phoneCurrentLabel: {
    ...typography.body,
    color: colors.lightGray,
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 0,
  },
  phoneMessagesList: {
    // marginTop is set dynamically based on isCurrentSeries
  },
});
