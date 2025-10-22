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
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { SermonMessage } from '../../types/api';
import { getRecentlyPlayed, clearRecentlyPlayed } from '../../services/storage/storage';
import { getDownloadedMessage } from '../../services/storage/storage';
import { usePlayer } from '../../hooks/usePlayer';

export default function RecentlyPlayedScreen() {
  const navigation = useNavigation();
  const [recentlyPlayed, setRecentlyPlayed] = useState<SermonMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const player = usePlayer();

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
          backgroundColor: colors.almostBlack,
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.darkGrey,
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
              backgroundColor: colors.darkGrey,
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
              backgroundColor: colors.darkGrey,
              marginRight: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[typography.label, { color: colors.lightGray }]}>
              {item.WeekNum || '?'}
            </Text>
          </View>
        )}

        {/* Message Info */}
        <View style={{ flex: 1 }}>
          <Text style={[typography.h3, { marginBottom: 4 }]} numberOfLines={2}>
            {item.Title}
          </Text>
          <Text style={[typography.body, { color: colors.lessLightLightGray, marginBottom: 2 }]}>
            {item.seriesTitle || 'Sermon'}
          </Text>
          <Text style={[typography.caption, { color: colors.lightGray }]}>
            {item.Speaker} • {formatDate(item.previouslyPlayed)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleMessagePress, formatDate]);

  const renderEmptyState = useCallback(() => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={[typography.h2, { textAlign: 'center', marginBottom: 16 }]}>
        No Recently Played
      </Text>
      <Text style={[typography.body, { textAlign: 'center', color: colors.lessLightLightGray }]}>
        Sermons you listen to will appear here
      </Text>
    </View>
  ), []);

  const renderHeader = useCallback(() => {
    if (recentlyPlayed.length === 0) return null;

    return (
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.bgDarkBlue,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Text style={[typography.body, { color: colors.lightGray }]}>
          {recentlyPlayed.length} {recentlyPlayed.length === 1 ? 'sermon' : 'sermons'}
        </Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={[typography.body, { color: colors.mainBlue }]}>
            Clear All
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [recentlyPlayed.length, handleClearAll]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgDarkBlue, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.white} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgDarkBlue }}>
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

