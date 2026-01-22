import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useDownloadQueueStore } from '../stores/downloadQueueStore';
import { getDownloadSettings } from '../services/downloads/downloadSettings';
import type { Theme } from '../theme/types';

export default function OfflineBanner() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const netInfo = useNetInfo();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Get download queue state with primitive selectors to avoid re-renders
  const items = useDownloadQueueStore((state) => state.items);

  // Compute derived values with useMemo to avoid infinite loops
  const { activeDownload, pendingCount } = useMemo(() => {
    const active = items.find((item) => item.status === 'downloading') || null;
    const queued = items.filter((item) => item.status === 'queued');
    return {
      activeDownload: active,
      pendingCount: queued.length,
    };
  }, [items]);

  // Track WiFi-only setting
  const [wifiOnly, setWifiOnly] = useState(true);
  useEffect(() => {
    getDownloadSettings().then((settings) => setWifiOnly(settings.wifiOnly));
  }, []);

  const isOffline = netInfo.isConnected === false;
  const isWifi = netInfo.type === 'wifi';
  const hasActiveDownload = !!activeDownload;

  // Determine what to show
  const getStatusInfo = (): { text: string; icon: string; color: string } | null => {
    if (isOffline) {
      return {
        text: t('common.offline'),
        icon: 'cloud-offline-outline',
        color: theme.colors.textSecondary,
      };
    }

    // Online - show download status if relevant
    if (hasActiveDownload) {
      return {
        text: t('offline.downloadingMessage', {
          title: activeDownload.title,
          progress: activeDownload.progress,
        }),
        icon: 'cloud-download-outline',
        color: theme.colors.primary,
      };
    }

    if (pendingCount > 0) {
      // If WiFi-only and on cellular, show waiting message
      if (wifiOnly && !isWifi) {
        return {
          text: t('offline.queuedWifiMessage', { count: pendingCount }),
          icon: 'wifi-outline',
          color: theme.colors.textSecondary,
        };
      }
      // Otherwise show queued count
      return {
        text: t('offline.queuedMessage', { count: pendingCount }),
        icon: 'cloud-download-outline',
        color: theme.colors.primary,
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();

  // Don't render if nothing to show
  if (!statusInfo) return null;

  return (
    <View style={[styles.container, isOffline && styles.offlineContainer]}>
      <Ionicons
        name={statusInfo.icon as any}
        size={14}
        color={statusInfo.color}
        style={styles.icon}
      />
      <Text
        style={[styles.text, { color: statusInfo.color }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {statusInfo.text}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardSecondary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineContainer: {
    backgroundColor: theme.colors.cardSecondary,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    ...theme.typography.label as any,
    fontSize: 13,
    flexShrink: 1,
  },
});

