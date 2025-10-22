import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { SermonMessage } from '../types/api';

interface SermonMessageCardProps {
  message: SermonMessage;
  downloaded: boolean;
  downloading: boolean;
  onPress: () => void;
  showBorder?: boolean;
  noHorizontalMargin?: boolean;
}

export const SermonMessageCard: React.FC<SermonMessageCardProps> = ({
  message,
  downloaded,
  downloading,
  onPress,
  showBorder = true,
  noHorizontalMargin = false,
}) => {
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (seconds: number): string => {
    const totalSeconds = Math.floor(seconds); // Remove decimal places
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const hasAudio = !!message.AudioUrl;
  const hasVideo = !!message.VideoUrl;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        showBorder && styles.containerWithBorder,
        noHorizontalMargin && styles.noHorizontalMargin,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={downloading}
      accessibilityLabel={`${message.Title}, Week ${message.WeekNum}, ${message.Speaker}, ${formatDate(message.Date)}`}
      accessibilityHint="Tap to play or view sermon options"
      accessibilityRole="button"
    >
      <View style={styles.content}>
        {/* Week Number Badge */}
        <View style={styles.weekBadge}>
          <Text style={styles.weekNumber}>{message.WeekNum ?? '—'}</Text>
          <Text style={styles.weekLabel}>Week</Text>
        </View>

        {/* Message Info */}
        <View style={styles.messageInfo}>
          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {message.Title}
          </Text>

          {/* Speaker with Icon */}
          <View style={styles.metadataRow}>
            <Ionicons name="person" size={14} color={colors.lightGray} style={styles.metadataIcon} />
            <Text style={styles.speaker} numberOfLines={1}>
              {message.Speaker}
            </Text>
          </View>

          {/* Date with Icon */}
          <View style={styles.metadataRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.lightGray} style={styles.metadataIcon} />
            <Text style={styles.date}>
              {formatDate(message.Date)}
            </Text>
          </View>

          {/* Media Availability Icons */}
          <View style={styles.mediaRow}>
            {/* Audio Icon */}
            <View style={styles.mediaItem}>
              <Ionicons
                name={hasAudio ? 'headset' : 'headset-outline'}
                size={18}
                color={hasAudio ? colors.mainBlue : colors.lightGray}
                accessibilityLabel={hasAudio ? 'Audio available' : 'Audio not available'}
              />
              <Text style={[styles.mediaLabel, { color: hasAudio ? colors.mainBlue : colors.lightGray }]}>
                Audio
              </Text>
            </View>

            {/* Video Icon */}
            <View style={styles.mediaItem}>
              <Ionicons
                name={hasVideo ? 'play-circle' : 'play-circle-outline'}
                size={18}
                color={hasVideo ? colors.mainBlue : colors.lightGray}
                accessibilityLabel={hasVideo ? 'Video available' : 'Video not available'}
              />
              <Text style={[styles.mediaLabel, { color: hasVideo ? colors.mainBlue : colors.lightGray }]}>
                Video
              </Text>
            </View>

            {/* Duration */}
            {message.AudioDuration && (
              <View style={styles.mediaItem}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.lightGray}
                />
                <Text style={styles.duration}>
                  {formatDuration(message.AudioDuration)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Download Status (Top-right corner) */}
        <View style={styles.downloadStatus}>
          {downloading && (
            <ActivityIndicator
              size="small"
              color={colors.mainBlue}
              accessibilityLabel="Downloading"
            />
          )}
          {downloaded && !downloading && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.bgGreen}
              accessibilityLabel="Downloaded"
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkGrey,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Shadow for Android
    elevation: 3,
  },
  containerWithBorder: {
    // Optional: can add additional border styling if needed
  },
  noHorizontalMargin: {
    marginHorizontal: 0,
  },
  content: {
    flexDirection: 'row',
    padding: 14,
    position: 'relative',
  },
  weekBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgDarkBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
    paddingTop: 2,
  },
  weekNumber: {
    ...typography.h3,
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: -4,
  },
  weekLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 8,
    marginTop: 0,
    lineHeight: 10,
    textTransform: 'uppercase',
  },
  messageInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 6,
    lineHeight: 19,
    fontSize: 16,
    fontWeight: '600',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metadataIcon: {
    marginRight: 6,
    width: 14,
  },
  speaker: {
    ...typography.body,
    color: colors.lessLightLightGray,
    fontSize: 13,
    flex: 1,
  },
  date: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mediaLabel: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '500',
  },
  duration: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 11,
    fontWeight: '500',
  },
  downloadStatus: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

