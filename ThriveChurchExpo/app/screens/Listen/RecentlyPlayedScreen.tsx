import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SermonMessage } from '../../types/api';
import { getRecentlyPlayed, clearRecentlyPlayed, getPlaybackProgressMap } from '../../services/storage/storage';
import { getDownloadedMessage } from '../../services/storage/storage';
import { usePlayer } from '../../hooks/usePlayer';
import { setCurrentScreen } from '../../services/analytics/analyticsService';
import { PlaybackProgressMap } from '../../types/playback';

export default function RecentlyPlayedScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [recentlyPlayed, setRecentlyPlayed] = useState<SermonMessage[]>([]);
  const [playbackProgress, setPlaybackProgress] = useState<PlaybackProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const player = usePlayer();

  // Track screen view
  useEffect(() => {
    setCurrentScreen('RecentlyPlayedScreen', 'RecentlyPlayed');
  }, []);

  const loadRecentlyPlayed = useCallback(async () => {
    try {
      const [messages, progressMap] = await Promise.all([
        getRecentlyPlayed(),
        getPlaybackProgressMap(),
      ]);
      setRecentlyPlayed(messages);
      setPlaybackProgress(progressMap);
    } catch (error) {
      console.error('Error loading recently played:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecentlyPlayed();
  }, [loadRecentlyPlayed]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadRecentlyPlayed();
  }, [loadRecentlyPlayed]);

  const handleMessagePress = useCallback(async (message: SermonMessage) => {
    // Check if message is downloaded
    const downloadedMessage = await getDownloadedMessage(message.MessageId);
    const isDownloaded = !!downloadedMessage;

    // Check if there's playback progress (not finished)
    const progress = playbackProgress[message.MessageId];
    const hasProgress = progress && progress.positionSeconds > 30;
    const isFinished = progress && progress.positionSeconds >= progress.durationSeconds - 10; // Within 10 seconds of end

    const options = [];

    options.push({
      text: hasProgress && !isFinished
        ? t('listen.recentlyPlayed.resume')
        : t('listen.recentlyPlayed.listen'),
      onPress: () => handleListen(message, isDownloaded),
    });

    if (message.VideoUrl) {
      options.push({
        text: t('listen.recentlyPlayed.watchHD'),
        onPress: () => handleWatch(message),
      });
    }

    if (message.PassageRef) {
      options.push({
        text: `${t('listen.recentlyPlayed.read')} ${message.PassageRef}`,
        onPress: () => handleReadPassage(message),
      });
    }

    options.push({
      text: t('common.cancel'),
      style: 'cancel',
    });

    Alert.alert(
      message.Title,
      t('listen.recentlyPlayed.selectAction'),
      options as any
    );
  }, [t, playbackProgress]);

  const handleListen = useCallback(async (message: SermonMessage, isDownloaded: boolean) => {
    try {
      await player.play({
        message,
        seriesTitle: message.seriesTitle,
        seriesArt: message.seriesArt,
        isLocal: isDownloaded,
      });
    } catch (error) {
      console.error('Error playing message:', error);
      Alert.alert(t('common.error'), t('listen.recentlyPlayed.errorPlayAudio'));
    }
  }, [player, t]);

  const handleWatch = useCallback((message: SermonMessage) => {
    if (!message.VideoUrl) {
      Alert.alert(t('listen.sermon.noVideo'), t('listen.sermon.noVideoMessage'));
      return;
    }

    // Navigate to video player screen
    (navigation as any).navigate('VideoPlayerScreen', {
      message,
      seriesTitle: message.seriesTitle,
    });
  }, [navigation, t]);

  const handleReadPassage = useCallback((message: SermonMessage) => {
    if (!message.PassageRef) {
      Alert.alert(t('listen.sermon.noPassage'), t('listen.sermon.noPassageMessage'));
      return;
    }

    // Navigate to Bible passage reader screen
    (navigation as any).navigate('BiblePassageScreen', {
      message,
      seriesTitle: message.seriesTitle,
    });
  }, [navigation, t]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      t('listen.recentlyPlayed.clearAllTitle'),
      t('listen.recentlyPlayed.clearAllMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('listen.recentlyPlayed.clear'),
          style: 'destructive',
          onPress: async () => {
            await clearRecentlyPlayed();
            await loadRecentlyPlayed();
          },
        },
      ]
    );
  }, [loadRecentlyPlayed, t]);

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatTimeRemaining = (positionSeconds: number, durationSeconds: number): string => {
    const remaining = Math.max(0, durationSeconds - positionSeconds);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m ${t('listen.recentlyPlayed.remaining')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')} ${t('listen.recentlyPlayed.remaining')}`;
  };

  const renderRecentlyPlayedItem = useCallback(({ item }: { item: SermonMessage }) => {
    const progress = playbackProgress[item.MessageId];
    const hasProgress = progress && progress.positionSeconds > 30; // Only show if meaningful progress
    const progressPercent = hasProgress
      ? Math.min((progress.positionSeconds / progress.durationSeconds) * 100, 100)
      : 0;

    return (
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.background,
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.colors.border,
        }}
        onPress={() => handleMessagePress(item)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Series Art Thumbnail */}
          {item.seriesArt ? (
            <Image
              source={{ uri: item.seriesArt }}
              style={{
                width: 106,
                height: 60,
                borderRadius: 8,
                backgroundColor: theme.colors.card,
                marginRight: 12,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 106,
                height: 60,
                borderRadius: 8,
                backgroundColor: theme.colors.card,
                marginRight: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={[theme.typography.label as any, { color: theme.colors.textSecondary }]}>
                {item.WeekNum || '?'}
              </Text>
            </View>
          )}

          {/* Message Info */}
          <View style={{ flex: 1 }}>
            <Text style={[theme.typography.h3 as any, { marginBottom: 4 }]} numberOfLines={2}>
              {item.Title}
            </Text>
            <Text style={[theme.typography.body as any, { color: theme.colors.textTertiary, marginBottom: 2 }]}>
              {item.seriesTitle || 'Sermon'}
            </Text>
            <Text style={[theme.typography.caption as any, { color: theme.colors.textSecondary }]}>
              {item.Speaker} • {formatDate(item.previouslyPlayed)}
            </Text>
          </View>
        </View>

        {/* Resume Progress Indicator */}
        {hasProgress && (
          <View style={{ marginTop: 10, marginLeft: 118 }}>
            <View style={{
              height: 3,
              backgroundColor: theme.colors.border,
              borderRadius: 1.5,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: theme.colors.primary,
                borderRadius: 1.5,
              }} />
            </View>
            <Text style={[
              theme.typography.caption as any,
              { color: theme.colors.primary, marginTop: 4, fontSize: 11 }
            ]}>
              {formatTimeRemaining(progress.positionSeconds, progress.durationSeconds)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [handleMessagePress, formatDate, theme, playbackProgress, t]);

  const renderEmptyState = useCallback(() => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={[theme.typography.h2 as any, { textAlign: 'center', marginBottom: 16 }]}>
        {t('listen.recentlyPlayed.empty')}
      </Text>
      <Text style={[theme.typography.body as any, { textAlign: 'center', color: theme.colors.textTertiary }]}>
        {t('listen.recentlyPlayed.emptyDescription')}
      </Text>
    </View>
  ), [theme, t]);

  const renderHeader = useCallback(() => {
    if (recentlyPlayed.length === 0) return null;

    return (
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.backgroundSecondary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Text style={[theme.typography.body as any, { color: theme.colors.textSecondary }]}>
          {recentlyPlayed.length} {recentlyPlayed.length === 1 ? t('listen.recentlyPlayed.sermon') : t('listen.recentlyPlayed.sermons')}
        </Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={[theme.typography.body as any, { color: theme.colors.primary }]}>
            {t('listen.recentlyPlayed.clearAll')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [recentlyPlayed.length, handleClearAll, theme, t]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }}>
      <FlatList
        data={recentlyPlayed}
        renderItem={renderRecentlyPlayedItem}
        keyExtractor={(item) => `${item.MessageId}-${item.previouslyPlayed}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={recentlyPlayed.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );
}

