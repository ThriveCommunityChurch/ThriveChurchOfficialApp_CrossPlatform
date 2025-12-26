/**
 * DownloadSettingsScreen
 * Settings for download preferences including WiFi-only, storage limits
 *
 * Features:
 * - WiFi-only download toggle
 * - Storage limit toggle and picker
 * - Current storage usage display with progress bar
 * - Responsive design for phones and tablets
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import {
  DownloadSettings,
  getDownloadSettings,
  updateDownloadSetting,
  STORAGE_LIMIT_OPTIONS,
  DEFAULT_DOWNLOAD_SETTINGS,
} from '../../services/downloads/downloadSettings';
import { getTotalDownloadsSize, formatBytes } from '../../services/downloads/downloadManager';
import { setCurrentScreen } from '../../services/analytics/analyticsService';

/**
 * Setting Row Component
 * Reusable row with icon, label, description and toggle/chevron
 */
interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  showChevron?: boolean;
  theme: Theme;
  disabled?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  label,
  description,
  value,
  onToggle,
  onPress,
  showChevron,
  theme,
  disabled,
}) => {
  const styles = createStyles(theme);

  const content = (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color={disabled ? theme.colors.textSecondary : theme.colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, disabled && styles.settingLabelDisabled]}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      {onToggle !== undefined && value !== undefined && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={theme.colors.surface}
          disabled={disabled}
        />
      )}
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={disabled}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default function DownloadSettingsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const [settings, setSettings] = useState<DownloadSettings>(DEFAULT_DOWNLOAD_SETTINGS);
  const [currentUsage, setCurrentUsage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('DownloadSettingsScreen', 'Download Settings');
  }, []);

  // Load settings and usage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedSettings, usage] = await Promise.all([
        getDownloadSettings(),
        getTotalDownloadsSize(),
      ]);
      setSettings(savedSettings);
      setCurrentUsage(usage);
    } catch (error) {
      console.error('Error loading download settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = useCallback(async (key: keyof DownloadSettings, value: boolean) => {
    try {
      const updated = await updateDownloadSetting(key, value);
      setSettings(updated);
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert(t('common.error'), t('settings.downloads.errorSaving'));
    }
  }, [t]);

  const handleStorageLimitChange = useCallback(async (value: number) => {
    // Check if current usage exceeds new limit
    if (value > 0 && currentUsage > value) {
      Alert.alert(
        t('settings.downloads.storageLimitWarningTitle'),
        t('settings.downloads.storageLimitWarningMessage', {
          currentUsage: formatBytes(currentUsage),
          newLimit: formatBytes(value),
        }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('settings.downloads.setAnyway'),
            onPress: async () => {
              const updated = await updateDownloadSetting('storageLimit', value);
              setSettings(updated);
            },
          },
        ]
      );
    } else {
      const updated = await updateDownloadSetting('storageLimit', value);
      setSettings(updated);
    }
  }, [currentUsage, t]);

  // Calculate usage percentage for progress bar
  const usagePercentage = settings.storageLimitEnabled && settings.storageLimit > 0
    ? Math.min((currentUsage / settings.storageLimit) * 100, 100)
    : 0;

  const getUsageBarColor = () => {
    if (!settings.storageLimitEnabled) return theme.colors.primary;
    if (usagePercentage > 90) return theme.colors.error;
    if (usagePercentage > 75) return '#FFA500'; // warning orange
    return theme.colors.primary;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Download Preferences Section */}
        <Text style={styles.sectionTitle}>{t('settings.downloads.preferencesTitle')}</Text>
        <Text style={styles.sectionDescription}>{t('settings.downloads.preferencesDescription')}</Text>

        <View style={styles.card}>
          {/* WiFi Only Toggle */}
          <SettingRow
            icon="wifi"
            label={t('settings.downloads.wifiOnly')}
            description={t('settings.downloads.wifiOnlyDescription')}
            value={settings.wifiOnly}
            onToggle={(value) => handleToggle('wifiOnly', value)}
            theme={theme}
          />
        </View>

        {/* Storage Section */}
        <Text style={styles.sectionTitle}>{t('settings.downloads.storageTitle')}</Text>

        <View style={styles.card}>
          {/* Storage Limit Toggle */}
          <SettingRow
            icon="folder"
            label={t('settings.downloads.limitStorage')}
            description={t('settings.downloads.limitStorageDescription')}
            value={settings.storageLimitEnabled}
            onToggle={(value) => handleToggle('storageLimitEnabled', value)}
            theme={theme}
          />
        </View>

        {/* Storage Limit Picker (shown when enabled) */}
        {settings.storageLimitEnabled && (
          <View style={styles.storageLimitPicker}>
            {STORAGE_LIMIT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.storageLimitOption,
                  settings.storageLimit === option.value && styles.storageLimitOptionSelected,
                ]}
                onPress={() => handleStorageLimitChange(option.value)}
              >
                <Text
                  style={[
                    styles.storageLimitOptionText,
                    settings.storageLimit === option.value && styles.storageLimitOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Current Usage Display */}
        <View style={styles.usageContainer}>
          <View style={styles.usageHeader}>
            <View style={styles.usageIconLabel}>
              <Ionicons name="disc" size={20} color={theme.colors.primary} />
              <Text style={styles.usageLabel}>{t('settings.downloads.currentUsage')}</Text>
            </View>
            <Text style={styles.usageValue}>
              {formatBytes(currentUsage)}
              {settings.storageLimitEnabled && ` / ${formatBytes(settings.storageLimit)}`}
            </Text>
          </View>
          {settings.storageLimitEnabled && (
            <View style={styles.usageBar}>
              <View
                style={[
                  styles.usageBarFill,
                  {
                    width: `${usagePercentage}%`,
                    backgroundColor: getUsageBarColor(),
                  },
                ]}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Styles
 */
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Section
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text,
      marginTop: 8,
      marginBottom: 4,
      marginLeft: 4,
    },
    sectionDescription: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginBottom: 12,
      marginLeft: 4,
    },

    // Card
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },

    // Setting Row
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    settingRowDisabled: {
      opacity: 0.5,
    },
    settingIcon: {
      width: 40,
      alignItems: 'center',
    },
    settingContent: {
      flex: 1,
      marginRight: 12,
    },
    settingLabel: {
      ...theme.typography.body,
      color: theme.colors.text,
      fontWeight: '600',
      marginBottom: 2,
    },
    settingLabelDisabled: {
      color: theme.colors.textSecondary,
    },
    settingDescription: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginLeft: 56,
    },

    // Storage Limit Picker
    storageLimitPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 8,
      marginBottom: 12,
      gap: 8,
    },
    storageLimitOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    storageLimitOptionSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    storageLimitOptionText: {
      ...theme.typography.body,
      fontSize: 14,
      color: theme.colors.text,
    },
    storageLimitOptionTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },

    // Usage Display
    usageContainer: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 12,
      marginTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    usageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    usageIconLabel: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    usageLabel: {
      ...theme.typography.body,
      color: theme.colors.text,
      marginLeft: 8,
    },
    usageValue: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.text,
    },
    usageBar: {
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 4,
    },
    usageBarFill: {
      height: '100%',
      borderRadius: 4,
    },
  });

