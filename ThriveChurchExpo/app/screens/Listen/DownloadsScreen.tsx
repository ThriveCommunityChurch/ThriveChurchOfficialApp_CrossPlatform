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
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SermonMessage } from '../../types/api';
import { getAllDownloadedMessages } from '../../services/storage/storage';
import { deleteDownload, getDownloadSize, formatBytes } from '../../services/downloads/downloadManager';
import { usePlayer } from '../../hooks/usePlayer';
import { setCurrentScreen } from '../../services/analytics/analyticsService';

// Separate component for download item to properly use hooks
interface DownloadItemProps {
  item: SermonMessage;
  onPress: (message: SermonMessage) => void;
  theme: Theme;
}

const DownloadItem: React.FC<DownloadItemProps> = ({ item, onPress, theme }) => {
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
        backgroundColor: theme.colors.background,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.border,
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
          {item.Speaker} • {fileSize}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function DownloadsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [downloads, setDownloads] = useState<SermonMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const player = usePlayer();

  // Track screen view
  useEffect(() => {
    setCurrentScreen('DownloadsScreen', 'Downloads');
  }, []);

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
      t('listen.downloads.selectAction'),
      [
        {
          text: t('listen.downloads.listen'),
          onPress: () => handleListen(message),
        },
        {
          text: t('listen.downloads.removeDownload'),
          style: 'destructive',
          onPress: () => handleDelete(message),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  }, [t]);

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
      Alert.alert(t('common.error'), t('listen.downloads.errorPlayAudio'));
    }
  }, [player, t]);

  const handleDelete = useCallback(async (message: SermonMessage) => {
    Alert.alert(
      t('listen.downloads.removeTitle'),
      t('listen.downloads.removeMessage', { title: message.Title }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('listen.downloads.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDownload(message.MessageId);
              await loadDownloads();
            } catch (error) {
              console.error('Error deleting download:', error);
              Alert.alert(t('common.error'), t('listen.downloads.errorRemove'));
            }
          },
        },
      ]
    );
  }, [loadDownloads, t]);

  const renderDownloadItem = useCallback(({ item }: { item: SermonMessage }) => {
    return <DownloadItem item={item} onPress={handleMessagePress} theme={theme} />;
  }, [handleMessagePress, theme]);

  const renderEmptyState = useCallback(() => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={[theme.typography.h2 as any, { textAlign: 'center', marginBottom: 16 }]}>
        {t('listen.downloads.empty')}
      </Text>
      <Text style={[theme.typography.body as any, { textAlign: 'center', color: theme.colors.textTertiary }]}>
        {t('listen.downloads.emptyDescription')}
      </Text>
    </View>
  ), [theme, t]);

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

