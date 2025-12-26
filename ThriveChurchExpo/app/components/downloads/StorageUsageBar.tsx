/**
 * StorageUsageBar Component
 * Displays current download storage usage with optional progress bar
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../theme/types';
import { getTotalDownloadsSize, formatBytes } from '../../services/downloads/downloadManager';
import { getDownloadSettings, DownloadSettings } from '../../services/downloads/downloadSettings';

interface StorageUsageBarProps {
  onManagePress?: () => void;
  compact?: boolean;
}

export const StorageUsageBar: React.FC<StorageUsageBarProps> = ({
  onManagePress,
  compact = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, compact);

  const [currentUsage, setCurrentUsage] = useState(0);
  const [settings, setSettings] = useState<DownloadSettings | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [usage, downloadSettings] = await Promise.all([
      getTotalDownloadsSize(),
      getDownloadSettings(),
    ]);
    setCurrentUsage(usage);
    setSettings(downloadSettings);
  };

  // Calculate usage percentage
  const usagePercentage = settings?.storageLimitEnabled && settings.storageLimit > 0
    ? Math.min((currentUsage / settings.storageLimit) * 100, 100)
    : 0;

  // Determine bar color based on usage
  const getBarColor = () => {
    if (!settings?.storageLimitEnabled) return theme.colors.primary;
    if (usagePercentage > 90) return theme.colors.error;
    if (usagePercentage > 75) return '#F59E0B'; // amber warning
    return theme.colors.primary;
  };

  const content = (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <Ionicons name="folder" size={compact ? 16 : 20} color={theme.colors.primary} />
          <Text style={styles.label}>Downloads</Text>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.value}>
            {formatBytes(currentUsage)}
            {settings?.storageLimitEnabled && ` / ${formatBytes(settings.storageLimit)}`}
          </Text>
          {onManagePress && (
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          )}
        </View>
      </View>

      {/* Progress bar when limit is enabled */}
      {settings?.storageLimitEnabled && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${usagePercentage}%`,
                backgroundColor: getBarColor(),
              },
            ]}
          />
        </View>
      )}
    </View>
  );

  if (onManagePress) {
    return (
      <TouchableOpacity onPress={onManagePress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const createStyles = (theme: Theme, compact: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: compact ? 8 : 12,
      padding: compact ? 10 : 14,
      marginHorizontal: 16,
      marginBottom: compact ? 8 : 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    label: {
      ...theme.typography.body,
      fontSize: compact ? 14 : 16,
      color: theme.colors.text,
      marginLeft: 8,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    value: {
      ...theme.typography.body,
      fontSize: compact ? 13 : 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginRight: 4,
    },
    progressBar: {
      height: compact ? 4 : 6,
      backgroundColor: theme.colors.border,
      borderRadius: compact ? 2 : 3,
      marginTop: compact ? 8 : 10,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: compact ? 2 : 3,
    },
  });

export default StorageUsageBar;
