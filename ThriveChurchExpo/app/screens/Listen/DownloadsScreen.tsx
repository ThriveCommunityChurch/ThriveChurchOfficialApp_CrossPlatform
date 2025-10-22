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
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { SermonMessage } from '../../types/api';
import { getAllDownloadedMessages } from '../../services/storage/storage';
import { deleteDownload, getDownloadSize, formatBytes } from '../../services/downloads/downloadManager';
import { usePlayer } from '../../hooks/usePlayer';

// Separate component for download item to properly use hooks
interface DownloadItemProps {
  item: SermonMessage;
  onPress: (message: SermonMessage) => void;
}

const DownloadItem: React.FC<DownloadItemProps> = ({ item, onPress }) => {
  const [fileSize, setFileSize] = useState<string>('');

  useEffect(() => {
    const loadSize = async () => {
      const size = await getDownloadSize(item.MessageId);
      setFileSize(formatBytes(size));
    };
    loadSize();
  }, [item.MessageId]);

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
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Series Art Thumbnail - 16:9 aspect ratio */}
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
          {item.Speaker} • {fileSize}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<SermonMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const player = usePlayer();

  const loadDownloads = useCallback(async () => {
    try {
      const messages = await getAllDownloadedMessages();
      setDownloads(messages);
    } catch (error) {
      console.error('Error loading downloads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDownloads();
  }, [loadDownloads]);

  const handleMessagePress = useCallback((message: SermonMessage) => {
    Alert.alert(
      message.Title,
      'Please select an action',
      [
        {
          text: 'Listen',
          onPress: () => handleListen(message),
        },
        {
          text: 'Remove Download',
          style: 'destructive',
          onPress: () => handleDelete(message),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, []);

  const handleListen = useCallback(async (message: SermonMessage) => {
    try {
      await player.play({
        message,
        seriesTitle: message.seriesTitle,
        seriesArt: message.seriesArt,
        isLocal: true,
      });
    } catch (error) {
      console.error('Error playing downloaded message:', error);
      Alert.alert('Error', 'Failed to play audio. Please try again.');
    }
  }, [player]);

  const handleDelete = useCallback(async (message: SermonMessage) => {
    Alert.alert(
      'Remove Download',
      `Are you sure you want to remove "${message.Title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDownload(message.MessageId);
              await loadDownloads();
            } catch (error) {
              console.error('Error deleting download:', error);
              Alert.alert('Error', 'Failed to remove download. Please try again.');
            }
          },
        },
      ]
    );
  }, [loadDownloads]);

  const renderDownloadItem = useCallback(({ item }: { item: SermonMessage }) => {
    return <DownloadItem item={item} onPress={handleMessagePress} />;
  }, [handleMessagePress]);

  const renderEmptyState = useCallback(() => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={[typography.h2, { textAlign: 'center', marginBottom: 16 }]}>
        No Downloads
      </Text>
      <Text style={[typography.body, { textAlign: 'center', color: colors.lessLightLightGray }]}>
        Downloaded sermons will appear here for offline listening
      </Text>
    </View>
  ), []);

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
        data={downloads}
        renderItem={renderDownloadItem}
        keyExtractor={(item) => item.MessageId}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={downloads.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );
}

