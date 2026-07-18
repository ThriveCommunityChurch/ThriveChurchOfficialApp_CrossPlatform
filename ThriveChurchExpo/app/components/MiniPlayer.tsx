/**
 * MiniPlayer Component
 *
 * Persistent, compact audio player bar shown while a track is loaded but the
 * user isn't on the full NowPlaying screen. Renders nothing when there is no
 * active track.
 *
 * - Tapping the bar navigates to the Listen tab's NowPlaying screen.
 * - Tapping the play/pause button toggles playback without navigating.
 * - A thin progress line along the top of the bar reflects playback position.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { usePlayer, usePlayerProgress } from '../hooks/usePlayer';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import type { Theme } from '../theme/types';

const MiniPlayerComponent: React.FC = () => {
  const { currentTrack, isPlaying, pause, resume } = usePlayer();
  // Progress is a separate hook after the usePlayer split (PR #50).
  const { position, duration } = usePlayerProgress();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [artworkFailed, setArtworkFailed] = useState(false);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const artwork = currentTrack?.artwork as string | undefined;

  useEffect(() => {
    setArtworkFailed(false);
  }, [artwork]);

  if (!currentTrack) {
    return null;
  }

  const title = (currentTrack.title as string) || t('miniPlayer.untitled');
  const artist = (currentTrack.artist as string) || '';

  const progress = duration > 0 ? Math.min(Math.max(position / duration, 0), 1) : 0;

  const handlePress = () => {
    navigation.navigate('Listen', { screen: 'NowPlaying' });
  };

  const accessibleTitle = artist ? `${title}, ${artist}` : title;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={t('miniPlayer.openPlayerHint', { track: accessibleTitle })}
    >
      {/* Thin progress line along the top of the bar */}
      <View style={styles.progressTrack} accessibilityElementsHidden importantForAccessibility="no">
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        {artwork && !artworkFailed ? (
          <FastImage
            source={{ uri: artwork }}
            style={styles.artwork}
            resizeMode={FastImage.resizeMode.cover}
            onError={() => setArtworkFailed(true)}
          />
        ) : (
          <View style={[styles.artwork, styles.placeholderArtwork]}>
            <Ionicons name="musical-notes" size={16} color={theme.colors.textTertiary} />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!artist && (
            <Text style={styles.artist} numberOfLines={1}>
              {artist}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.playButton}
          onPress={isPlaying ? pause : resume}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? t('player.pause') : t('player.play')}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={22}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      shadowColor: theme.colors.shadowDark,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 6,
      overflow: 'hidden',
    },
    progressTrack: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.colors.border,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    artwork: {
      width: 40,
      height: 40,
      borderRadius: 6,
      backgroundColor: theme.colors.backgroundSecondary,
      marginRight: 10,
    },
    placeholderArtwork: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      marginRight: 10,
    },
    title: {
      ...theme.typography.body,
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    artist: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export const MiniPlayer = React.memo(MiniPlayerComponent);
export default MiniPlayer;
