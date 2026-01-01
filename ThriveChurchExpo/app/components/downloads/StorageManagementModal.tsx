/**
 * StorageManagementModal Component
 * Modal for managing download storage with quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import {
  getTotalDownloadsSize,
  formatBytes,
  deleteDownload,
  clearAllDownloads,
} from '../../services/downloads/downloadManager';
import { getAllDownloadedMessages } from '../../services/storage/storage';
import { SermonMessage } from '../../types/api';

interface StorageManagementModalProps {
  visible: boolean;
  onClose: () => void;
  onStorageChanged: () => void;
}

interface SeriesGroup {
  title: string;
  messages: SermonMessage[];
  totalSize: number;
}

export const StorageManagementModal: React.FC<StorageManagementModalProps> = ({
  visible,
  onClose,
  onStorageChanged,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  const [totalSize, setTotalSize] = useState(0);
  const [seriesGroups, setSeriesGroups] = useState<SeriesGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [size, messages] = await Promise.all([
        getTotalDownloadsSize(),
        getAllDownloadedMessages(),
      ]);
      setTotalSize(size);

      // Group by series
      const groups = new Map<string, SeriesGroup>();
      messages.forEach((msg) => {
        const seriesTitle = msg.seriesTitle || 'Unknown Series';
        if (!groups.has(seriesTitle)) {
          groups.set(seriesTitle, {
            title: seriesTitle,
            messages: [],
            totalSize: 0,
          });
        }
        const group = groups.get(seriesTitle)!;
        group.messages.push(msg);
        group.totalSize += msg.AudioFileSize || 0;
      });

      // Sort by size descending
      const sortedGroups = Array.from(groups.values()).sort(
        (a, b) => b.totalSize - a.totalSize
      );
      setSeriesGroups(sortedGroups);
    } catch (error) {
      console.error('Error loading storage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearOldest = () => {
    Alert.alert(
      t('listen.downloads.clearOldestTitle'),
      t('listen.downloads.clearOldestMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('listen.downloads.clearOldest'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Get all messages sorted by download date
              const messages = await getAllDownloadedMessages();
              const sorted = messages.sort(
                (a, b) => (a.DownloadedOn || 0) - (b.DownloadedOn || 0)
              );
              
              // Delete oldest 5
              const toDelete = sorted.slice(0, 5);
              for (const msg of toDelete) {
                await deleteDownload(msg.MessageId);
              }
              
              await loadData();
              onStorageChanged();
            } catch (error) {
              console.error('Error clearing oldest:', error);
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t('listen.downloads.clearAllTitle'),
      t('listen.downloads.clearAllMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('listen.downloads.clearAll'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllDownloads();
              await loadData();
              onStorageChanged();
            } catch (error) {
              console.error('Error clearing all:', error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteSeries = (group: SeriesGroup) => {
    Alert.alert(
      t('listen.downloads.deleteSeriesTitle'),
      t('listen.downloads.deleteSeriesMessage', { series: group.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              for (const msg of group.messages) {
                await deleteDownload(msg.MessageId);
              }
              await loadData();
              onStorageChanged();
            } catch (error) {
              console.error('Error deleting series:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('listen.downloads.manageStorage')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Total Storage */}
        <View style={styles.totalRow}>
          <View style={styles.totalIconLabel}>
            <Ionicons name="folder" size={24} color={theme.colors.primary} />
            <Text style={styles.totalLabel}>{t('listen.downloads.totalDownloads')}</Text>
          </View>
          <Text style={styles.totalValue}>{formatBytes(totalSize)}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleClearOldest}>
            <Ionicons name="time-outline" size={20} color={theme.colors.error} />
            <Text style={styles.actionText}>{t('listen.downloads.clearOldest')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            <Text style={styles.actionText}>{t('listen.downloads.clearAll')}</Text>
          </TouchableOpacity>
        </View>

        {/* Series List */}
        <Text style={styles.sectionTitle}>{t('listen.downloads.bySeries')}</Text>
        <ScrollView style={styles.seriesList} showsVerticalScrollIndicator={false}>
          {seriesGroups.map((group) => (
            <View key={group.title} style={styles.seriesItem}>
              <View style={styles.seriesInfo}>
                <Text style={styles.seriesTitle} numberOfLines={1}>{group.title}</Text>
                <Text style={styles.seriesDetails}>
                  {group.messages.length} {group.messages.length === 1 ? t('listen.downloads.sermon') : t('listen.downloads.sermons')} • {formatBytes(group.totalSize)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteSeries(group)}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          {seriesGroups.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>{t('listen.downloads.noDownloads')}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.colors.card,
      marginTop: 16,
      marginHorizontal: 16,
      borderRadius: 12,
    },
    totalIconLabel: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    totalLabel: {
      ...theme.typography.body,
      color: theme.colors.text,
      marginLeft: 12,
    },
    totalValue: {
      ...theme.typography.h3,
      color: theme.colors.text,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 16,
      marginHorizontal: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.card,
    },
    actionText: {
      ...theme.typography.body,
      color: theme.colors.error,
      marginLeft: 8,
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    seriesList: {
      flex: 1,
      paddingHorizontal: 16,
    },
    seriesItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    seriesInfo: {
      flex: 1,
    },
    seriesTitle: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.text,
    },
    seriesDetails: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    deleteButton: {
      padding: 8,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      marginTop: 12,
    },
  });

export default StorageManagementModal;

