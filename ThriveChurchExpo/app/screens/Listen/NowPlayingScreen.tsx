import React, { useState, useEffect } from 'react';
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
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { usePlayer } from '../../hooks/usePlayer';
import { AudioWaveform } from '../../components/AudioWaveform';
import { ProgressSlider } from '../../components/ProgressSlider';
import { waveformService } from '../../services/audio/waveformService';

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
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(false);

  useEffect(() => {
    if (!isSeeking) {
      setSeekPosition(player.position);
    }
  }, [player.position, isSeeking]);

  // Extract waveform when track changes
  useEffect(() => {
    const extractWaveform = async () => {
      if (!player.currentTrack?.url) {
        setWaveformData([]);
        return;
      }

      try {
        setIsLoadingWaveform(true);
        console.log('[NowPlayingScreen] Extracting waveform for:', player.currentTrack.url);

        const amplitudes = await waveformService.extractWaveform(player.currentTrack.url, 60);
        setWaveformData(amplitudes);

        console.log('[NowPlayingScreen] Waveform extracted successfully');
      } catch (error) {
        console.error('[NowPlayingScreen] Error extracting waveform:', error);
        setWaveformData([]); // Will use fallback waveform
      } finally {
        setIsLoadingWaveform(false);
      }
    };

    extractWaveform();
  }, [player.currentTrack?.url]);

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
          <Text style={[typography.h2, { textAlign: 'center', marginBottom: 16 }]}>
            No Audio Playing
          </Text>
          <Text style={[typography.body, { textAlign: 'center', color: colors.lessLightLightGray }]}>
            Select a sermon to start listening
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
  const seriesTitle = track.seriesTitle || track.description;
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
                color={colors.lightGray}
              />
            </View>
          )}
        </View>

        {/* Track Info */}
        <View style={[styles.trackInfo, { marginBottom: marginBottom }]}>
          <Text
            style={[
              isTablet ? typography.h1 : typography.h2,
              { textAlign: 'center', marginBottom: isTablet ? 12 : 8 }
            ]}
            numberOfLines={2}
          >
            {player.currentTrack.title}
          </Text>
          <Text
            style={[
              isTablet ? typography.h3 : typography.body,
              { textAlign: 'center', color: colors.lessLightLightGray, marginBottom: isTablet ? 6 : 4 }
            ]}
          >
            {player.currentTrack.artist}
          </Text>
          {seriesTitle && (
            <Text
              style={[
                isTablet ? typography.body : typography.caption,
                { textAlign: 'center', color: colors.lightGray }
              ]}
            >
              {seriesTitle}
              {weekNum ? ` - Week ${weekNum}` : ''}
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
            minimumTrackTintColor={colors.mainBlue}
            maximumTrackTintColor={colors.darkGrey}
            thumbTintColor={colors.mainBlue}
          />
          <View style={styles.timeContainer}>
            <Text style={[
              isTablet ? typography.body : typography.caption,
              { color: colors.lightGray }
            ]}>
              {formatTime(isSeeking ? seekPosition : player.position)}
            </Text>
            <Text style={[
              isTablet ? typography.body : typography.caption,
              { color: colors.lightGray }
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
              color={colors.white}
              style={{ transform: [{ scaleX: -1 }] }}
            />
            <Text style={[
              typography.caption,
              {
                color: colors.lightGray,
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
            <Ionicons name="stop" size={iconSizeSmall} color={colors.white} />
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            style={[styles.controlButton, { width: controlButtonSize, height: controlButtonSize }]}
            onPress={handlePlayPause}
            activeOpacity={0.7}
            disabled={player.isLoading}
          >
            {player.isLoading ? (
              <Ionicons name="hourglass" size={iconSizeMedium} color={colors.white} />
            ) : player.isPlaying ? (
              <Ionicons name="pause" size={iconSizeMedium} color={colors.white} />
            ) : (
              <Ionicons name="play" size={iconSizeMedium} color={colors.white} />
            )}
          </TouchableOpacity>

          {/* Forward 15s */}
          <TouchableOpacity
            style={[styles.controlButton, { width: controlButtonSize, height: controlButtonSize }]}
            onPress={handleForward}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={iconSizeLarge} color={colors.white} />
            <Text style={[
              typography.caption,
              {
                color: colors.lightGray,
                marginTop: isTablet ? 6 : 4,
                fontSize: isTablet ? 14 : 11
              }
            ]}>
              15s
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Indicator */}
        {player.isLoading && (
          <Text style={[
            isTablet ? typography.body : typography.caption,
            { textAlign: 'center', color: colors.lightGray, marginTop: isTablet ? 24 : 16 }
          ]}>
            Buffering...
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDarkBlue,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.darkGrey,
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

