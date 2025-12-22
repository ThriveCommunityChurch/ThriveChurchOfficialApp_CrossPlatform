import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { usePlayer } from '../../hooks/usePlayer';
import { AudioWaveform } from '../../components/AudioWaveform';
import { ProgressSlider } from '../../components/ProgressSlider';
import { waveformService } from '../../services/audio/waveformService';
import { setCurrentScreen } from '../../services/analytics/analyticsService';
import { fetchWaveformData } from '../../services/api/waveformService';
import { adaptWaveformToScreen } from '../../utils/waveformUtils';

const { width, height } = Dimensions.get('window');
const isTablet = (Platform.OS === 'ios' && Platform.isPad) || Math.min(width, height) >= 768;

// Responsive scaling factors
const SCALE = {
  // Artwork
  artworkMaxWidth: 600,
  artworkPhoneScale: 1,
  artworkTabletScale: 0.5,

  // Spacing
  paddingPhone: 32,
  paddingTablet: 48,
  marginBottomPhone: 24,
  marginBottomTablet: 36,

  // Controls
  controlButtonSizePhone: 50,
  controlButtonSizeTablet: 65,
  controlGapPhone: 32,
  controlGapTablet: 48,

  // Icons
  iconSizeSmallPhone: 28,
  iconSizeSmallTablet: 36,
  iconSizeMediumPhone: 32,
  iconSizeMediumTablet: 42,
  iconSizeLargePhone: 36,
  iconSizeLargeTablet: 46,
  iconSizeXLargePhone: 48,
  iconSizeXLargeTablet: 62,

  // Waveform
  waveformHeightPhone: 60,
  waveformHeightTablet: 80,

  // Content max width
  contentMaxWidth: 800,
};

export default function NowPlayingScreen() {
  const player = usePlayer();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const styles = createStyles(theme);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(false);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('NowPlayingScreen', 'NowPlaying');
  }, []);

  // Handle take notes navigation
  const handleTakeNotes = useCallback(() => {
    if (!player.currentTrack) return;

    const track = player.currentTrack as any;
    // Navigate to Notes tab, then to NoteDetail screen with sermon context
    (navigation as any).navigate('Notes', {
      screen: 'NoteDetail',
      params: {
        messageId: track.id,
        messageTitle: track.title || 'Untitled',
        seriesTitle: track.seriesTitle || track.description || undefined,
        seriesArt: track.artwork || undefined,
        speaker: track.artist || 'Unknown',
        messageDate: track.messageDate || new Date().toISOString(),
        seriesId: track.seriesId || undefined,
      },
    });
  }, [navigation, player.currentTrack]);

  // Set up header with notes button when track is playing
  useEffect(() => {
    if (player.currentTrack) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={handleTakeNotes}
            style={{ marginRight: 16 }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({
        headerRight: undefined,
      });
    }
  }, [navigation, player.currentTrack, handleTakeNotes, theme.colors.text]);

  useEffect(() => {
    if (!isSeeking) {
      setSeekPosition(player.position);
    }
  }, [player.position, isSeeking]);

  // Load waveform when track changes
  useEffect(() => {
    const loadWaveform = async () => {
      if (!player.currentTrack) {
        setWaveformData([]);
        setIsLoadingWaveform(false);
        return;
      }

      // Get MessageId from track (stored as 'id' property)
      const messageId = player.currentTrack.id;

      if (!messageId) {
        console.warn('[NowPlayingScreen] No messageId available on track');
        setWaveformData([]);
        setIsLoadingWaveform(false);
        return;
      }

      try {
        // Try to fetch pre-computed waveform data from API
        console.log('[NowPlayingScreen] Attempting to fetch pre-computed waveform for:', messageId);
        const precomputedWaveform = await fetchWaveformData(messageId);

        // If we got valid pre-computed data, use it immediately
        if (precomputedWaveform && precomputedWaveform.length > 0) {
          console.log('[NowPlayingScreen] Using pre-computed waveform:', {
            originalLength: precomputedWaveform.length,
            messageId,
          });

          // Adapt to screen size (480 → 240/120/60 based on device)
          const adaptedWaveform = adaptWaveformToScreen(precomputedWaveform);
          console.log('[NowPlayingScreen] Adapted waveform to:', adaptedWaveform.length, 'bars');

          setWaveformData(adaptedWaveform);
          setIsLoadingWaveform(false);
          return;
        }

        // Fallback: Extract waveform on-device for messages without pre-computed data
        console.log('[NowPlayingScreen] No pre-computed waveform available, extracting on-device');

        if (!player.currentTrack.url) {
          console.warn('[NowPlayingScreen] No audio URL available');
          setWaveformData([]);
          setIsLoadingWaveform(false);
          return;
        }

        setIsLoadingWaveform(true);
        console.log('[NowPlayingScreen] Extracting waveform for:', player.currentTrack.url);

        const amplitudes = await waveformService.extractWaveform(player.currentTrack.url, 120);
        setWaveformData(amplitudes);

        console.log('[NowPlayingScreen] Waveform extracted successfully (on-device)');
      } catch (error) {
        console.error('[NowPlayingScreen] Error loading waveform:', error);
        setWaveformData([]); // Will use fallback waveform in AudioWaveform component
      } finally {
        setIsLoadingWaveform(false);
      }
    };

    loadWaveform();
  }, [player.currentTrack?.id]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekChange = (value: number) => {
    setSeekPosition(value);
  };

  const handleSeekComplete = async (value: number) => {
    setIsSeeking(false);
    await player.seek(value);
  };

  const handlePlayPause = async () => {
    await player.togglePlayPause();
  };

  const handleStop = async () => {
    await player.stop();
  };

  const handleForward = async () => {
    await player.forward(15);
  };

  const handleBackward = async () => {
    await player.backward(15);
  };

  if (!player.currentTrack) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={[theme.typography.h2 as any, { textAlign: 'center', marginBottom: 16 }]}>
            {t('nowPlaying.noAudioPlaying')}
          </Text>
          <Text style={[theme.typography.body as any, { textAlign: 'center', color: theme.colors.textTertiary }]}>
            {t('nowPlaying.selectSermon')}
          </Text>
        </View>
      </View>
    );
  }

  // Calculate artwork dimensions with 16:9 aspect ratio
  const baseArtworkWidth = isTablet
    ? Math.min(width, height) * SCALE.artworkTabletScale
    : width - (SCALE.paddingPhone * 2);
  const artworkWidth = Math.min(baseArtworkWidth, SCALE.artworkMaxWidth);
  const artworkHeight = artworkWidth * (9 / 16); // 16:9 aspect ratio

  // Responsive values
  const padding = isTablet ? SCALE.paddingTablet : SCALE.paddingPhone;
  const marginBottom = isTablet ? SCALE.marginBottomTablet : SCALE.marginBottomPhone;
  const controlButtonSize = isTablet ? SCALE.controlButtonSizeTablet : SCALE.controlButtonSizePhone;
  const controlGap = isTablet ? SCALE.controlGapTablet : SCALE.controlGapPhone;
  const iconSizeSmall = isTablet ? SCALE.iconSizeSmallTablet : SCALE.iconSizeSmallPhone;
  const iconSizeMedium = isTablet ? SCALE.iconSizeMediumTablet : SCALE.iconSizeMediumPhone;
  const iconSizeLarge = isTablet ? SCALE.iconSizeLargeTablet : SCALE.iconSizeLargePhone;
  const waveformHeight = isTablet ? SCALE.waveformHeightTablet : SCALE.waveformHeightPhone;

  // Extract custom metadata from track
  const track = player.currentTrack as any;
  const weekNum = track.weekNum;

  return (
    <View style={styles.container}>
      <View style={[
        styles.content,
        {
          paddingHorizontal: padding,
          paddingVertical: padding,
          maxWidth: SCALE.contentMaxWidth,
          alignSelf: 'center',
          width: '100%',
        }
      ]}>
        {/* Artwork with 16:9 aspect ratio */}
        <View style={[
          styles.artworkContainer,
          {
            width: artworkWidth,
            height: artworkHeight,
            marginBottom: marginBottom,
          }
        ]}>
          {player.currentTrack.artwork ? (
            <Image
              source={{ uri: player.currentTrack.artwork as string }}
              style={styles.artwork}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.artwork, styles.placeholderArtwork]}>
              <Ionicons
                name="musical-notes"
                size={isTablet ? SCALE.iconSizeXLargeTablet : SCALE.iconSizeXLargePhone}
                color={theme.colors.textSecondary}
              />
            </View>
          )}
        </View>

        {/* Track Info */}
        <View style={[styles.trackInfo, { marginBottom: marginBottom }]}>
          <Text
            style={[
              isTablet ? theme.typography.h1 as any : theme.typography.h2 as any,
              { textAlign: 'center', marginBottom: isTablet ? 12 : 8 }
            ]}
            numberOfLines={2}
          >
            {player.currentTrack.title}
          </Text>
          <Text
            style={[
              isTablet ? theme.typography.h3 as any : theme.typography.body as any,
              { textAlign: 'center', color: theme.colors.textTertiary, marginBottom: isTablet ? 6 : 4 }
            ]}
          >
            {player.currentTrack.artist}
          </Text>
          {weekNum && (
            <Text
              style={[
                isTablet ? theme.typography.body as any : theme.typography.caption as any,
                { textAlign: 'center', color: theme.colors.textSecondary }
              ]}
            >
              {t('nowPlaying.week')} {weekNum}
            </Text>
          )}
        </View>

        {/* Waveform Visualization */}
        <View style={[styles.waveformContainer, { marginBottom: marginBottom * 0.67 }]}>
          <AudioWaveform
            progress={player.duration > 0 ? player.position / player.duration : 0}
            duration={player.duration}
            onSeek={handleSeekComplete}
            amplitudes={waveformData}
            isLoading={isLoadingWaveform}
            height={waveformHeight}
            isSeeking={isSeeking}
          />
        </View>

        {/* Progress Slider */}
        <View style={[styles.progressContainer, { marginBottom: marginBottom * 1.33 }]}>
          <ProgressSlider
            value={isSeeking ? seekPosition : player.position}
            maximumValue={player.duration || 1}
            onSlidingStart={handleSeekStart}
            onValueChange={handleSeekChange}
            onSlidingComplete={handleSeekComplete}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <View style={styles.timeContainer}>
            <Text style={[
              isTablet ? theme.typography.body as any : theme.typography.caption as any,
              { color: theme.colors.textSecondary }
            ]}>
              {formatTime(isSeeking ? seekPosition : player.position)}
            </Text>
            <Text style={[
              isTablet ? theme.typography.body as any : theme.typography.caption as any,
              { color: theme.colors.textSecondary }
            ]}>
              {formatTime(player.duration)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={[styles.controls, { gap: controlGap }]}>
          {/* Backward 15s */}
          <TouchableOpacity
            style={[styles.controlButton, { width: controlButtonSize, height: controlButtonSize }]}
            onPress={handleBackward}
            activeOpacity={0.7}
          >
            <Ionicons
              name="refresh-outline"
              size={iconSizeLarge}
              color={theme.colors.text}
              style={{ transform: [{ scaleX: -1 }] }}
            />
            <Text style={[
              theme.typography.caption as any,
              {
                color: theme.colors.textSecondary,
                marginTop: isTablet ? 6 : 4,
                fontSize: isTablet ? 14 : 11
              }
            ]}>
              15s
            </Text>
          </TouchableOpacity>

          {/* Stop */}
          <TouchableOpacity
            style={[styles.controlButton, { width: controlButtonSize, height: controlButtonSize }]}
            onPress={handleStop}
            activeOpacity={0.7}
          >
            <Ionicons name="stop" size={iconSizeSmall} color={theme.colors.text} />
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            style={[styles.controlButton, { width: controlButtonSize, height: controlButtonSize }]}
            onPress={handlePlayPause}
            activeOpacity={0.7}
            disabled={player.isLoading}
          >
            {player.isLoading ? (
              <Ionicons name="hourglass" size={iconSizeMedium} color={theme.colors.text} />
            ) : player.isPlaying ? (
              <Ionicons name="pause" size={iconSizeMedium} color={theme.colors.text} />
            ) : (
              <Ionicons name="play" size={iconSizeMedium} color={theme.colors.text} />
            )}
          </TouchableOpacity>

          {/* Forward 15s */}
          <TouchableOpacity
            style={[styles.controlButton, { width: controlButtonSize, height: controlButtonSize }]}
            onPress={handleForward}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={iconSizeLarge} color={theme.colors.text} />
            <Text style={[
              theme.typography.caption as any,
              {
                color: theme.colors.textSecondary,
                marginTop: isTablet ? 6 : 4,
                fontSize: isTablet ? 14 : 11
              }
            ]}>
              15s
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary, // ← ONLY COLOR CHANGED
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // paddingHorizontal and paddingVertical are now dynamic
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  artworkContainer: {
    // marginBottom is now dynamic
    borderRadius: isTablet ? 16 : 12,
    shadowColor: theme.colors.shadowDark, // ← ONLY COLOR CHANGED
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
  },
  placeholderArtwork: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    width: '100%',
    // marginBottom is now dynamic
  },
  waveformContainer: {
    width: '100%',
    // marginBottom is now dynamic
  },
  progressContainer: {
    width: '100%',
    // marginBottom is now dynamic
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 12 : 8,
    marginTop: isTablet ? 12 : 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // gap is now dynamic
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    // width and height are now dynamic
  },
});

