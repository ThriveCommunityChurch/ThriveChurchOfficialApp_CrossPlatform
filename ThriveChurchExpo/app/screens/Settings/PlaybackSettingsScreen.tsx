/**
 * PlaybackSettingsScreen
 * Settings for playback preferences including skip intervals and playback speed
 *
 * Features:
 * - Configurable skip forward interval (10s/15s/30s)
 * - Configurable skip backward interval (10s/15s/30s)
 * - Default playback speed setting
 * - Lock screen respects skip interval settings
 * - Player screen can override speed per-session
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import {
  PlaybackSettings,
  SkipInterval,
  PlaybackSpeed,
  getPlaybackSettings,
  updatePlaybackSetting,
  SKIP_INTERVAL_OPTIONS,
  PLAYBACK_SPEED_OPTIONS,
  DEFAULT_PLAYBACK_SETTINGS,
} from '../../services/playback/playbackSettings';
import { setCurrentScreen } from '../../services/analytics/analyticsService';
import { updatePlayerSkipIntervals } from '../../services/audio/trackPlayerService';

/**
 * Option Pill Component for selections
 */
interface OptionPillProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  theme: Theme;
}

const OptionPill: React.FC<OptionPillProps> = ({ label, isSelected, onPress, theme }) => {
  const styles = createStyles(theme);
  return (
    <TouchableOpacity
      style={[styles.optionPill, isSelected && styles.optionPillSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.optionPillText, isSelected && styles.optionPillTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default function PlaybackSettingsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const [settings, setSettings] = useState<PlaybackSettings>(DEFAULT_PLAYBACK_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('PlaybackSettingsScreen', 'Playback Settings');
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await getPlaybackSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading playback settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipForwardChange = useCallback(async (value: SkipInterval) => {
    try {
      const updated = await updatePlaybackSetting('skipForwardInterval', value);
      setSettings(updated);
      // Update TrackPlayer with new intervals
      await updatePlayerSkipIntervals(value, updated.skipBackwardInterval);
    } catch (error) {
      console.error('Error updating skip forward interval:', error);
    }
  }, []);

  const handleSkipBackwardChange = useCallback(async (value: SkipInterval) => {
    try {
      const updated = await updatePlaybackSetting('skipBackwardInterval', value);
      setSettings(updated);
      // Update TrackPlayer with new intervals
      await updatePlayerSkipIntervals(updated.skipForwardInterval, value);
    } catch (error) {
      console.error('Error updating skip backward interval:', error);
    }
  }, []);

  const handleSpeedChange = useCallback(async (value: PlaybackSpeed) => {
    try {
      const updated = await updatePlaybackSetting('defaultPlaybackSpeed', value);
      setSettings(updated);
    } catch (error) {
      console.error('Error updating playback speed:', error);
    }
  }, []);

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
        {/* Skip Intervals Section */}
        <Text style={styles.sectionTitle}>{t('settings.playback.skipIntervalsTitle')}</Text>
        <Text style={styles.sectionDescription}>
          {t('settings.playback.skipIntervalsDescription')}
        </Text>

        {/* Skip Forward */}
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="refresh" size={24} color={theme.colors.primary} style={{ transform: [{ scaleX: -1 }] }} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.playback.skipForward')}</Text>
              <Text style={styles.settingDescription}>
                {t('settings.playback.skipForwardDescription')}
              </Text>
            </View>
          </View>
          <View style={styles.optionsRow}>
            {SKIP_INTERVAL_OPTIONS.map((option) => (
              <OptionPill
                key={option.value}
                label={option.label}
                isSelected={settings.skipForwardInterval === option.value}
                onPress={() => handleSkipForwardChange(option.value)}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* Skip Backward */}
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="refresh" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.playback.skipBackward')}</Text>
              <Text style={styles.settingDescription}>
                {t('settings.playback.skipBackwardDescription')}
              </Text>
            </View>
          </View>
          <View style={styles.optionsRow}>
            {SKIP_INTERVAL_OPTIONS.map((option) => (
              <OptionPill
                key={option.value}
                label={option.label}
                isSelected={settings.skipBackwardInterval === option.value}
                onPress={() => handleSkipBackwardChange(option.value)}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* Playback Speed Section */}
        <Text style={styles.sectionTitle}>{t('settings.playback.speedTitle')}</Text>
        <Text style={styles.sectionDescription}>
          {t('settings.playback.speedDescription')}
        </Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="speedometer" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.playback.defaultSpeed')}</Text>
              <Text style={styles.settingDescription}>
                {t('settings.playback.defaultSpeedDescription')}
              </Text>
            </View>
          </View>
          <View style={styles.speedOptionsRow}>
            {PLAYBACK_SPEED_OPTIONS.map((option) => (
              <OptionPill
                key={option.value}
                label={option.label}
                isSelected={settings.defaultPlaybackSpeed === option.value}
                onPress={() => handleSpeedChange(option.value)}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>{t('settings.playback.infoNote')}</Text>
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
      paddingBottom: 16,
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
      paddingBottom: 8,
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
    settingDescription: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },

    // Options Row
    optionsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
    },
    speedOptionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      gap: 8,
    },

    // Option Pill
    optionPill: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    optionPillSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    optionPillText: {
      ...theme.typography.body,
      fontSize: 14,
      color: theme.colors.text,
    },
    optionPillTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },

    // Info Box
    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 16,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginTop: 8,
      gap: 12,
    },
    infoText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
  });

