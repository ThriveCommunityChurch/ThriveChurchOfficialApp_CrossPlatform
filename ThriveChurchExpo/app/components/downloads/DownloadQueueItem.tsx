/**
 * DownloadQueueItem Component
 * Displays a single item in the download queue with progress and actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../theme/types';
import { QueueItem, QueueItemStatus } from '../../stores/downloadQueueStore';
import { formatBytes } from '../../services/downloads/downloadManager';

interface DownloadQueueItemProps {
  item: QueueItem;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

const getStatusColor = (status: QueueItemStatus, theme: Theme): string => {
  switch (status) {
    case 'downloading':
      return theme.colors.primary;
    case 'completed':
      return '#10B981'; // green
    case 'failed':
      return theme.colors.error;
    case 'paused':
      return '#F59E0B'; // amber
    case 'queued':
    default:
      return theme.colors.textSecondary;
  }
};

const getStatusText = (status: QueueItemStatus, progress: number): string => {
  switch (status) {
    case 'downloading':
      return `Downloading... ${progress}%`;
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'paused':
      return 'Paused';
    case 'queued':
      return 'Queued';
    default:
      return status;
  }
};

const getActionIcon = (status: QueueItemStatus): keyof typeof Ionicons.glyphMap => {
  switch (status) {
    case 'downloading':
      return 'pause';
    case 'paused':
      return 'play';
    case 'failed':
      return 'refresh';
    case 'completed':
      return 'checkmark-circle';
    case 'queued':
    default:
      return 'close';
  }
};

export const DownloadQueueItem: React.FC<DownloadQueueItemProps> = ({
  item,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onRemove,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleActionPress = () => {
    switch (item.status) {
      case 'downloading':
        onPause(item.id);
        break;
      case 'paused':
        onResume(item.id);
        break;
      case 'failed':
        onRetry(item.id);
        break;
      case 'completed':
        onRemove(item.id);
        break;
      case 'queued':
        onCancel(item.id);
        break;
    }
  };

  const statusColor = getStatusColor(item.status, theme);
  const statusText = getStatusText(item.status, item.progress);
  const actionIcon = getActionIcon(item.status);
  const showProgress = item.status === 'downloading' || item.status === 'paused';

  return (
    <View style={styles.container}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {item.seriesArt ? (
          <Image source={{ uri: item.seriesArt }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="musical-notes" size={24} color={theme.colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {item.title}
        </Text>
        <Text style={styles.seriesTitle} numberOfLines={1} ellipsizeMode="tail">
          {item.seriesTitle}
        </Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          {item.totalBytes > 0 && (
            <Text style={styles.sizeText}>
              {formatBytes(item.downloadedBytes)} / {formatBytes(item.totalBytes)}
            </Text>
          )}
        </View>

	        {/* Error details for failed items */}
	        {item.status === 'failed' && item.error && (
	          <Text style={styles.errorText} numberOfLines={2} ellipsizeMode="tail">
	            {item.error}
	          </Text>
	        )}

        {/* Progress bar */}
        {showProgress && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${item.progress}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>
        )}
      </View>

      {/* Action button */}
      <TouchableOpacity style={styles.actionButton} onPress={handleActionPress}>
        <Ionicons name={actionIcon} size={24} color={statusColor} />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    thumbnailContainer: {
      width: 50,
      height: 50,
      borderRadius: 8,
      overflow: 'hidden',
      marginRight: 12,
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    thumbnailPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    seriesTitle: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusText: {
      ...theme.typography.caption,
      fontWeight: '500',
    },
    sizeText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontSize: 11,
    },
	    errorText: {
	      ...theme.typography.caption,
	      color: theme.colors.error,
	      marginTop: 4,
	    },
    progressBar: {
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      marginTop: 6,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default DownloadQueueItem;

