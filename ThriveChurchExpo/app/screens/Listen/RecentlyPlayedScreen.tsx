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
import type { Theme } from '../../theme/types';
import { SermonMessage } from '../../types/api';
import { getRecentlyPlayed, clearRecentlyPlayed } from '../../services/storage/storage';
import { getDownloadedMessage } from '../../services/storage/storage';
import { usePlayer } from '../../hooks/usePlayer';
import { setCurrentScreen } from '../../services/analytics/analyticsService';

export default function RecentlyPlayedScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [recentlyPlayed, setRecentlyPlayed] = useState<SermonMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const player = usePlayer();

  // Track screen view
  useEffect(() => {
    setCurrentScreen('RecentlyPlayedScreen', 'RecentlyPlayed');
  }, []);

  const loadRecentlyPlayed = useCallback(async () => {
    try {
      const messages = await getRecentlyPlayed();
      setRecentlyPlayed(messages);
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

    const options = [];

    options.push({
      text: 'Listen',
      onPress: () => handleListen(message, isDownloaded),
    });

    if (message.VideoUrl) {
      options.push({
        text: 'Watch in HD',
        onPress: () => handleWatch(message),
      });
    }

    if (message.PassageRef) {
      options.push({
        text: `Read ${message.PassageRef}`,
        onPress: () => handleReadPassage(message),
      });
    }

    options.push({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert(
      message.Title,
      'Please select an action',
      options as any
    );
  }, []);

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
      Alert.alert('Error', 'Failed to play audio. Please try again.');
    }
  }, [player]);

  const handleWatch = useCallback((message: SermonMessage) => {
    if (!message.VideoUrl) {
      Alert.alert('No Video', 'This sermon does not have a video available.');
      return;
    }

    // Navigate to video player screen
    (navigation as any).navigate('VideoPlayerScreen', {
      message,
      seriesTitle: message.seriesTitle,
    });
  }, [navigation]);

  const handleReadPassage = useCallback((message: SermonMessage) => {
    if (!message.PassageRef) {
      Alert.alert('No Passage', 'This sermon does not have a Bible passage reference.');
      return;
    }

    // Navigate to Bible passage reader screen
    (navigation as any).navigate('BiblePassageScreen', {
      message,
      seriesTitle: message.seriesTitle,
    });
  }, [navigation]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear Recently Played',
      'Are you sure you want to clear your recently played history?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearRecentlyPlayed();
            await loadRecentlyPlayed();
          },
        },
      ]
    );
  }, [loadRecentlyPlayed]);

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

  const renderRecentlyPlayedItem = useCallback(({ item }: { item: SermonMessage }) => {
    return (
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.background,
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        onPress={() => handleMessagePress(item)}
        activeOpacity={0.7}
      >
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
      </TouchableOpacity>
    );
  }, [handleMessagePress, formatDate, theme]);

  const renderEmptyState = useCallback(() => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={[theme.typography.h2 as any, { textAlign: 'center', marginBottom: 16 }]}>
        No Recently Played
      </Text>
      <Text style={[theme.typography.body as any, { textAlign: 'center', color: theme.colors.textTertiary }]}>
        Sermons you listen to will appear here
      </Text>
    </View>
  ), [theme]);

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
          {recentlyPlayed.length} {recentlyPlayed.length === 1 ? 'sermon' : 'sermons'}
        </Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={[theme.typography.body as any, { color: theme.colors.primary }]}>
            Clear All
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [recentlyPlayed.length, handleClearAll, theme]);

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

