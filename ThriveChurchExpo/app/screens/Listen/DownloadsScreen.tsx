import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SermonMessage } from '../../types/api';
import { getAllDownloadedMessages } from '../../services/storage/storage';
import { deleteDownload, getDownloadSize, formatBytes } from '../../services/downloads/downloadManager';
import { usePlayer } from '../../hooks/usePlayer';
import { setCurrentScreen } from '../../services/analytics/analyticsService';
import { useDownloadQueueStore, QueueItem, selectActiveDownload } from '../../stores/downloadQueueStore';
import { useShallow } from 'zustand/react/shallow';
import { DownloadQueueItem } from '../../components/downloads/DownloadQueueItem';
import { StorageUsageBar } from '../../components/downloads/StorageUsageBar';
import { StorageManagementModal } from '../../components/downloads/StorageManagementModal';
import { pauseCurrentDownload, resumeDownload } from '../../services/downloads/queueProcessor';

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

// Tab type
type TabType = 'queue' | 'downloaded';

export default function DownloadsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabType>('downloaded');
  const [downloads, setDownloads] = useState<SermonMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const player = usePlayer();

  // Detect device type
  const isTablet = (Platform.OS === 'ios' && Platform.isPad) || Math.min(windowWidth, windowHeight) >= 768;
  const styles = useMemo(() => createStyles(theme, isTablet), [theme, isTablet]);

  // Get queue items from store - include failed so users can see and retry them
  const queueItems = useDownloadQueueStore(
    useShallow((state) =>
      state.items.filter(
        (item) =>
          item.status === 'queued' ||
          item.status === 'paused' ||
          item.status === 'downloading' ||
          item.status === 'failed'
      )
    )
  );
  const pauseItem = useDownloadQueueStore((state) => state.pauseItem);
  const resumeItem = useDownloadQueueStore((state) => state.resumeItem);
  const retryItem = useDownloadQueueStore((state) => state.retryItem);
  const cancelItem = useDownloadQueueStore((state) => state.cancelItem);
  const removeFromQueue = useDownloadQueueStore((state) => state.removeFromQueue);
	const activeDownloadId = useDownloadQueueStore(
	  (state) => selectActiveDownload(state)?.id ?? null
	);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('DownloadsScreen', 'Downloads');
  }, []);

  // Set header right buttons for phones
  useLayoutEffect(() => {
    if (isTablet) return; // Tablets use inline tabs

    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerTabs}>
          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'queue' && styles.headerTabActive]}
            onPress={() => setActiveTab('queue')}
          >
            <Ionicons
              name="cloud-download-outline"
              size={22}
              color={activeTab === 'queue' ? theme.colors.primary : theme.colors.textSecondary}
            />
            {queueItems.length > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{queueItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'downloaded' && styles.headerTabActive]}
            onPress={() => setActiveTab('downloaded')}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={22}
              color={activeTab === 'downloaded' ? theme.colors.primary : theme.colors.textSecondary}
            />
            {downloads.length > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{downloads.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, isTablet, activeTab, theme, queueItems.length, downloads.length, styles]);

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

	// When the active download finishes or stops (completed/failed/paused),
	// refresh the downloaded list so the "Downloaded" tab stays in sync.
	useEffect(() => {
	  if (activeDownloadId === null) {
	    loadDownloads();
	  }
	}, [activeDownloadId, loadDownloads]);

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
        seriesId: message.SeriesId,
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

  const renderDownloadedEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="download-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>
        {t('listen.downloads.empty')}
      </Text>
      <Text style={styles.emptyDescription}>
        {t('listen.downloads.emptyDescription')}
      </Text>
    </View>
  ), [theme, t, styles]);

  const renderQueueEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="cloud-download-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>
        {t('listen.downloads.queueEmpty')}
      </Text>
      <Text style={styles.emptyDescription}>
        {t('listen.downloads.queueEmptyDescription')}
      </Text>
    </View>
  ), [theme, t, styles]);

  // Queue item handlers
  const handlePauseItem = useCallback((id: string) => {
    pauseItem(id);
    pauseCurrentDownload();
  }, [pauseItem]);

  const handleResumeItem = useCallback((id: string) => {
    resumeItem(id);
    resumeDownload(id);
  }, [resumeItem]);

  const handleRetryItem = useCallback((id: string) => {
    retryItem(id);
  }, [retryItem]);

  const handleCancelItem = useCallback((id: string) => {
    cancelItem(id);
  }, [cancelItem]);

  const handleRemoveItem = useCallback((id: string) => {
    removeFromQueue(id);
  }, [removeFromQueue]);

  const renderQueueItem = useCallback(({ item }: { item: QueueItem }) => {
    return (
      <DownloadQueueItem
        item={item}
        onPause={handlePauseItem}
        onResume={handleResumeItem}
        onCancel={handleCancelItem}
        onRetry={handleRetryItem}
        onRemove={handleRemoveItem}
      />
    );
  }, [handlePauseItem, handleResumeItem, handleCancelItem, handleRetryItem, handleRemoveItem]);

  const handleStorageChanged = useCallback(() => {
    loadDownloads();
  }, [loadDownloads]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Selector - Only show on tablets */}
      {isTablet && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'queue' && styles.tabActive]}
            onPress={() => setActiveTab('queue')}
          >
            <Text style={[styles.tabText, activeTab === 'queue' && styles.tabTextActive]}>
              {t('listen.downloads.queueTab')}
              {queueItems.length > 0 && ` (${queueItems.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'downloaded' && styles.tabActive]}
            onPress={() => setActiveTab('downloaded')}
          >
            <Text style={[styles.tabText, activeTab === 'downloaded' && styles.tabTextActive]}>
              {t('listen.downloads.downloadedTab')}
              {downloads.length > 0 && ` (${downloads.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Queue Tab Content */}
      {activeTab === 'queue' && (
        <FlatList
          data={queueItems}
          renderItem={renderQueueItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <StorageUsageBar
              compact
              onManagePress={() => setShowStorageModal(true)}
            />
          }
          ListEmptyComponent={renderQueueEmptyState}
          contentContainerStyle={queueItems.length === 0 ? styles.emptyListContent : styles.listContent}
        />
      )}

      {/* Downloaded Tab Content */}
      {activeTab === 'downloaded' && (
        <FlatList
          data={downloads}
          renderItem={renderDownloadItem}
          keyExtractor={(item) => item.MessageId}
          ListHeaderComponent={
            <StorageUsageBar
              compact
              onManagePress={() => setShowStorageModal(true)}
            />
          }
          ListEmptyComponent={renderDownloadedEmptyState}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={downloads.length === 0 ? styles.emptyListContent : styles.listContent}
        />
      )}

      {/* Storage Management Modal */}
      <StorageManagementModal
        visible={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        onStorageChanged={handleStorageChanged}
      />
    </View>
  );
}

const createStyles = (theme: Theme, isTablet: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Header tab styles for phones
    headerTabs: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
      gap: 4,
    },
    headerTab: {
      padding: 8,
      borderRadius: 8,
      position: 'relative',
    },
    headerTabActive: {
      // No background - just use icon color change
    },
    headerBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    headerBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    // Tablet tab styles (inline)
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 12,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 10,
    },
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    listContent: {
      paddingTop: isTablet ? 8 : 0,
      paddingBottom: 24,
    },
    emptyListContent: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      ...theme.typography.h2,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 8,
      color: theme.colors.text,
    },
    emptyDescription: {
      ...theme.typography.body,
      textAlign: 'center',
      color: theme.colors.textTertiary,
    },
  });

