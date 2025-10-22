import React, { useCallback, useEffect, useState } from 'react';
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
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { SermonMessage } from '../../types/api';
import { usePlayer } from '../../hooks/usePlayer';
import { downloadSermon, deleteDownload, getDownloadSize } from '../../services/downloads/downloadManager';
import { isMessageDownloaded } from '../../services/storage/storage';

type SermonDetailScreenRouteProp = RouteProp<{
  SermonDetailScreen: {
    message: SermonMessage;
    seriesTitle: string;
    seriesArtUrl: string;
  };
}, 'SermonDetailScreen'>;

export const SermonDetailScreen: React.FC = () => {
  const route = useRoute<SermonDetailScreenRouteProp>();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { message, seriesTitle, seriesArtUrl } = route.params;
  const player = usePlayer();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [fileSize, setFileSize] = useState<number>(0);

  // Calculate orientation and responsive dimensions
  const isLandscape = windowWidth > windowHeight;
  const isTabletDevice = (Platform.OS === 'ios' && Platform.isPad) || Math.min(windowWidth, windowHeight) >= 768;

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
      await player.play({
        message,
        seriesTitle,
        seriesArt: seriesArtUrl,
        isLocal: downloaded,
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio. Please check your connection and try again.');
    }
  }, [player, message, seriesTitle, seriesArtUrl, downloaded]);

  const handlePlayVideo = useCallback(() => {
    if (!message.VideoUrl) {
      Alert.alert('No Video', 'This sermon does not have a video available.');
      return;
    }

    navigation.navigate('VideoPlayerScreen', {
      message,
      seriesTitle,
    });
  }, [navigation, message, seriesTitle]);

  const handleReadPassage = useCallback(() => {
    if (!message.PassageRef) {
      Alert.alert('No Passage', 'This sermon does not have a Bible passage reference.');
      return;
    }

    navigation.navigate('BiblePassageScreen', {
      message,
      seriesTitle,
    });
  }, [navigation, message, seriesTitle]);

  const handleDownload = useCallback(async () => {
    if (!message.AudioUrl) {
      Alert.alert('Error', 'No audio available for download');
      return;
    }

    try {
      setDownloading(true);
      setDownloadProgress(0);

      await downloadSermon(
        message,
        seriesTitle,
        seriesArtUrl,
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      setDownloaded(true);

      // Get and update the file size
      const size = await getDownloadSize(message.MessageId);
      setFileSize(size);

      Alert.alert('Success', 'Sermon downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Failed to download sermon. Please try again.');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [message, seriesTitle, seriesArtUrl]);

  const handleDeleteDownload = useCallback(async () => {
    Alert.alert(
      'Remove Download',
      'Are you sure you want to remove this downloaded sermon?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDownload(message.MessageId);
              setDownloaded(false);
              Alert.alert('Success', 'Download removed successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to remove download');
            }
          },
        },
      ]
    );
  }, [message.MessageId]);

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
              source={{ uri: seriesArtUrl }}
              style={styles.tabletHeroBackground}
              blurRadius={50}
              resizeMode="cover"
            >
              <View style={styles.tabletHeroOverlay}>
                <View style={styles.tabletHeroContentContainer}>
                  {/* Left Side - Sharp Series Artwork */}
                  <View style={[styles.tabletHeroArtworkContainer, { width: artworkWidth }]}>
                    <Image
                      source={{ uri: seriesArtUrl }}
                      style={styles.tabletHeroArtwork}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Right Side - Content */}
                  <View style={styles.tabletHeroContent}>
                    {/* Series Title */}
                    <Text style={styles.tabletHeroSeriesTitle}>{seriesTitle}</Text>

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
                            <Ionicons name="play" size={20} color={colors.white} />
                            <Text style={styles.tabletHeroPrimaryButtonText}>Play Audio</Text>
                          </TouchableOpacity>
                        )}

                        {hasVideo && (
                          <TouchableOpacity
                            style={styles.tabletHeroSecondaryButton}
                            onPress={handlePlayVideo}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="videocam" size={20} color={colors.white} />
                            <Text style={styles.tabletHeroSecondaryButtonText}>Watch Video</Text>
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
                        <Ionicons name="play" size={20} color={colors.white} />
                        <Text style={styles.tabletHeroPrimaryButtonText}>Play Audio</Text>
                      </TouchableOpacity>
                    )}

                    {hasVideo && (
                      <TouchableOpacity
                        style={styles.tabletHeroSecondaryButton}
                        onPress={handlePlayVideo}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="videocam" size={20} color={colors.white} />
                        <Text style={styles.tabletHeroSecondaryButtonText}>Watch Video</Text>
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
              <Text style={styles.tabletSectionTitle}>Details</Text>

              {/* Week Card */}
              <View style={styles.tabletMetadataCard}>
                <Ionicons name="calendar-outline" size={20} color={colors.mainBlue} />
                <View style={styles.tabletMetadataCardContent}>
                  <Text style={styles.tabletMetadataLabel}>Week</Text>
                  <Text style={styles.tabletMetadataValue}>{message.WeekNum ?? '—'}</Text>
                </View>
              </View>

              {/* Speaker Card */}
              {message.Speaker && (
                <View style={styles.tabletMetadataCard}>
                  <Ionicons name="person" size={20} color={colors.mainBlue} />
                  <View style={styles.tabletMetadataCardContent}>
                    <Text style={styles.tabletMetadataLabel}>Speaker</Text>
                    <Text style={styles.tabletMetadataValue}>{message.Speaker}</Text>
                  </View>
                </View>
              )}

              {/* Date Card */}
              {message.Date && (
                <View style={styles.tabletMetadataCard}>
                  <Ionicons name="calendar" size={20} color={colors.mainBlue} />
                  <View style={styles.tabletMetadataCardContent}>
                    <Text style={styles.tabletMetadataLabel}>Date</Text>
                    <Text style={styles.tabletMetadataValue}>{formatDate(message.Date)}</Text>
                  </View>
                </View>
              )}

              {/* Duration Card */}
              {message.AudioDuration && message.AudioDuration > 0 && (
                <View style={styles.tabletMetadataCard}>
                  <Ionicons name="time" size={20} color={colors.mainBlue} />
                  <View style={styles.tabletMetadataCardContent}>
                    <Text style={styles.tabletMetadataLabel}>Duration</Text>
                    <Text style={styles.tabletMetadataValue}>{formatDuration(message.AudioDuration)}</Text>
                  </View>
                </View>
              )}

              {/* File Size Card - only show if downloaded and size > 0 */}
              {downloaded && fileSize > 0 && (
                <View style={styles.tabletMetadataCard}>
                  <Ionicons name="document" size={20} color={colors.mainBlue} />
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
                <Ionicons name="book" size={24} color={colors.mainBlue} />
                <View style={styles.tabletSidebarPassageContent}>
                  <Text style={styles.tabletSidebarPassageLabel}>Scripture</Text>
                  <Text style={styles.tabletSidebarPassageText}>{message.PassageRef}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.lightGray} />
              </TouchableOpacity>
            )}

            {/* Download Section */}
            <View style={styles.tabletDownloadSection}>
              {downloaded && (
                <View style={styles.tabletDownloadedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.bgGreen} />
                  <Text style={styles.tabletDownloadedText}>Downloaded</Text>
                </View>
              )}

              {hasAudio && (
                <TouchableOpacity
                  style={[
                    styles.tabletDownloadButton,
                    downloading && styles.tabletDownloadButtonDisabled,
                  ]}
                  onPress={downloaded ? handleDeleteDownload : handleDownload}
                  activeOpacity={0.8}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <ActivityIndicator size="small" color={colors.white} />
                      <Text style={styles.tabletDownloadButtonText}>
                        {Math.round(downloadProgress * 100)}%
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name={downloaded ? 'trash' : 'download'}
                        size={20}
                        color={colors.white}
                      />
                      <Text style={styles.tabletDownloadButtonText}>
                        {downloaded ? 'Remove Download' : 'Download'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Right Main Content - Summary and Topics */}
          <View style={styles.tabletMainContent}>
            {/* Summary Section */}
            {message.Summary && (
              <View style={styles.tabletSection}>
                <Text style={styles.tabletSectionTitle}>About This Message</Text>
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
                      <Ionicons name="pricetag" size={14} color={colors.mainBlue} />
                      <Text style={styles.tabletTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.tabletEmptyState}>
                  <Ionicons name="pricetags-outline" size={32} color={colors.lighterBlueGray} />
                  <Text style={styles.tabletEmptyStateText}>
                    No topics tagged
                  </Text>
                </View>
              )}
            </View>

            {/* Future: Related Series Section */}
            <View style={styles.tabletSection}>
              <Text style={styles.tabletSectionTitle}>Related Series</Text>
              <View style={styles.tabletEmptyState}>
                <Ionicons name="albums-outline" size={32} color={colors.lighterBlueGray} />
                <Text style={styles.tabletEmptyStateText}>
                  Related series will be available soon
                </Text>
              </View>
            </View>
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
          source={{ uri: seriesArtUrl }}
          style={styles.artwork}
          resizeMode="cover"
        />

        {/* Content Section */}
        <View style={styles.content}>
          {/* Week Badge */}
          <View style={styles.weekBadge}>
            <Text style={styles.weekNumber}>{message.WeekNum ?? '—'}</Text>
            <Text style={styles.weekLabel}>Week</Text>
          </View>

          {/* Sermon Title */}
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {message.Title}
          </Text>

          {/* Series Title */}
          <Text style={styles.seriesTitle}>{seriesTitle}</Text>

          {/* Metadata Section */}
          <View style={styles.metadataSection}>
            {/* Speaker */}
            {message.Speaker && (
              <View style={styles.metadataRow}>
                <Ionicons name="person" size={18} color={colors.mainBlue} />
                <Text style={styles.metadataText}>{message.Speaker}</Text>
              </View>
            )}

            {/* Date */}
            {message.Date && (
              <View style={styles.metadataRow}>
                <Ionicons name="calendar" size={18} color={colors.mainBlue} />
                <Text style={styles.metadataText}>{formatDate(message.Date)}</Text>
              </View>
            )}

            {/* Duration - only show if > 0 */}
            {message.AudioDuration && message.AudioDuration > 0 && (
              <View style={styles.metadataRow}>
                <Ionicons name="time" size={18} color={colors.mainBlue} />
                <Text style={styles.metadataText}>{formatDuration(message.AudioDuration)}</Text>
              </View>
            )}

            {/* File Size - only show if downloaded and size > 0 */}
            {downloaded && fileSize > 0 && (
              <View style={styles.metadataRow}>
                <Ionicons name="document" size={18} color={colors.mainBlue} />
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
              <Ionicons name="book" size={24} color={colors.mainBlue} />
              <View style={styles.passageContent}>
                <Text style={styles.passageLabel}>Scripture Reference</Text>
                <Text style={styles.passageText}>{message.PassageRef}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.lightGray} />
            </TouchableOpacity>
          )}

          {/* Summary Section */}
          {message.Summary && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>About This Message</Text>
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
                    <Ionicons name="pricetag" size={12} color={colors.mainBlue} />
                    <Text style={styles.tagText}>{tag}</Text>
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
              <Ionicons name="checkmark-circle" size={18} color={colors.bgGreen} />
              <Text style={styles.downloadedText}>Downloaded</Text>
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
                <Ionicons name="play" size={24} color={colors.white} />
                <Text style={styles.primaryButtonText}>Play Audio</Text>
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
                  <Ionicons name="videocam" size={20} color={colors.white} />
                  <Text style={styles.secondaryButtonText}>Watch Video</Text>
                </TouchableOpacity>
              )}

              {/* Download/Remove Button */}
              {hasAudio && (
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    downloading && styles.secondaryButtonDisabled,
                  ]}
                  onPress={downloaded ? handleDeleteDownload : handleDownload}
                  activeOpacity={0.8}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <ActivityIndicator size="small" color={colors.white} />
                      <Text style={styles.secondaryButtonText}>
                        {Math.round(downloadProgress * 100)}%
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name={downloaded ? 'trash' : 'download'}
                        size={20}
                        color={colors.white}
                      />
                      <Text style={styles.secondaryButtonText}>
                        {downloaded ? 'Remove' : 'Download'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  // Conditionally render based on device type
  return isTabletDevice ? renderTabletLayout() : renderPhoneLayout();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.almostBlack,
  },
  scrollView: {
    flex: 1,
  },
  artwork: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.bgDarkBlue,
  },
  content: {
    padding: 20,
  },
  weekBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.bgDarkBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.mainBlue,
    gap: 0, // Remove any gap between number and label
  },
  weekNumber: {
    ...typography.h2,
    fontSize: 22,
    color: colors.white,
    lineHeight: 24, // Tighter line height
    marginBottom: -2, // Reduce space between number and label
  },
  weekLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.lightGray,
    textTransform: 'uppercase',
    lineHeight: 12, // Tighter line height
    marginTop: -2, // Reduce space between number and label
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    lineHeight: 34, // Add proper line height to prevent cutoff
    marginBottom: 8,
    color: colors.white,
  },
  seriesTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.lightGray,
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
    ...typography.body,
    fontSize: 15,
    color: colors.white,
    marginLeft: 12,
  },
  passageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDarkBlue,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.lighterBlueGray,
  },
  passageContent: {
    flex: 1,
    marginLeft: 12,
  },
  passageLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.lightGray,
    marginBottom: 4,
  },
  passageText: {
    ...typography.h3,
    fontSize: 16,
    color: colors.white,
  },
  summaryCard: {
    backgroundColor: colors.bgDarkBlue,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.lighterBlueGray,
  },
  summaryLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.lightGray,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.white,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.lightGray,
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
    backgroundColor: colors.bgDarkBlue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.lighterBlueGray,
  },
  tagText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  tagMore: {
    backgroundColor: colors.darkGrey,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagMoreText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '500',
    color: colors.lightGray,
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDarkBlue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  downloadedText: {
    ...typography.label,
    fontSize: 13,
    color: colors.bgGreen,
    marginLeft: 6,
  },
  actionsSection: {
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mainBlue,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.mainBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    ...typography.button,
    fontSize: 18,
    color: colors.white,
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
    backgroundColor: colors.bgDarkBlue,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lighterBlueGray,
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    ...typography.button,
    fontSize: 14,
    color: colors.white,
    marginLeft: 6,
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  tabletHeroArtwork: {
    width: '100%',
    height: '100%',
  },
  tabletHeroContent: {
    flex: 1,
    justifyContent: 'center',
  },
  tabletHeroSeriesTitle: {
    ...typography.h3,
    fontSize: 18,
    color: colors.mainBlue,
    marginBottom: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabletHeroTitle: {
    ...typography.h1,
    fontSize: 48,
    lineHeight: 56,
    marginBottom: 0,
    color: colors.white,
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
    backgroundColor: colors.mainBlue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: colors.mainBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabletHeroPrimaryButtonText: {
    ...typography.button,
    fontSize: 15,
    color: colors.white,
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
    borderColor: colors.lighterBlueGray,
  },
  tabletHeroSecondaryButtonText: {
    ...typography.button,
    fontSize: 15,
    color: colors.white,
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
    ...typography.h3,
    fontSize: 20,
    color: colors.white,
    marginBottom: 16,
    fontWeight: '700',
  },
  tabletMetadataSection: {
    marginBottom: 32,
  },
  tabletMetadataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDarkBlue,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.lighterBlueGray,
  },
  tabletMetadataCardContent: {
    marginLeft: 12,
    flex: 1,
  },
  tabletMetadataLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.lightGray,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabletMetadataValue: {
    ...typography.body,
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  tabletSidebarPassageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDarkBlue,
    padding: 18,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.mainBlue,
  },
  tabletSidebarPassageContent: {
    flex: 1,
    marginLeft: 12,
  },
  tabletSidebarPassageLabel: {
    ...typography.caption,
    fontSize: 12,
    color: colors.lightGray,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabletSidebarPassageText: {
    ...typography.h3,
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  tabletDownloadSection: {
    gap: 12,
  },
  tabletDownloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDarkBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  tabletDownloadedText: {
    ...typography.label,
    fontSize: 14,
    color: colors.bgGreen,
    marginLeft: 6,
    fontWeight: '600',
  },
  tabletDownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgDarkBlue,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lighterBlueGray,
  },
  tabletDownloadButtonDisabled: {
    opacity: 0.6,
  },
  tabletDownloadButtonText: {
    ...typography.button,
    fontSize: 14,
    color: colors.white,
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
    backgroundColor: colors.bgDarkBlue,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lighterBlueGray,
    borderStyle: 'dashed',
  },
  tabletEmptyStateText: {
    ...typography.body,
    fontSize: 16,
    color: colors.lightGray,
    marginTop: 12,
    textAlign: 'center',
  },

  // Summary Card
  tabletSummaryCard: {
    backgroundColor: colors.bgDarkBlue,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lighterBlueGray,
  },
  tabletSummaryText: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
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
    backgroundColor: colors.bgDarkBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.lighterBlueGray,
  },
  tabletTagText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});

