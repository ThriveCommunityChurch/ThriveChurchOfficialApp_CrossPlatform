/**
 * SettingsScreen
 * User preferences and app settings
 * 
 * Features:
 * - Bible translation selection with dropdown
 * - Theme mode selection (Auto/Light/Dark)
 * - Device settings navigation
 * - Real-time theme updates
 * - Persistent settings storage
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useSettings } from '../../hooks/useSettings';
import { useTranslation } from '../../hooks/useTranslation';
import { BIBLE_TRANSLATIONS } from '../../data/bibleTranslations';
import { LANGUAGES } from '../../i18n/types';
import type { Theme } from '../../theme/types';
import type { BibleTranslation, ThemeMode } from '../../types/settings';
import type { Language } from '../../i18n/types';
import { setCurrentScreen } from '../../services/analytics/analyticsService';

/**
 * Animated Card Component
 * Reusable card with scale animation on press
 */
interface AnimatedCardProps {
  onPress: () => void;
  children: React.ReactNode;
  theme: Theme;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ onPress, children, theme }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const styles = createStyles(theme);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * Theme Mode Option Component
 * Individual radio button option for theme selection
 */
interface ThemeModeOptionProps {
  mode: ThemeMode;
  label: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
  theme: Theme;
}

const ThemeModeOption: React.FC<ThemeModeOptionProps> = ({
  label,
  description,
  isSelected,
  onPress,
  theme,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const styles = createStyles(theme);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.themeOption,
          isSelected && styles.themeOptionSelected,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.radioContainer}>
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
          <View style={styles.themeOptionText}>
            <Text style={styles.themeOptionLabel}>{label}</Text>
            <Text style={styles.themeOptionDescription}>{description}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * Settings Screen Component
 */
export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { settings, isLoading, updateBibleTranslation, updateThemeMode, updateLanguage } = useSettings();
  const styles = createStyles(theme);

  // State for Bible translation dropdown
  const [isTranslationExpanded, setIsTranslationExpanded] = useState(false);

  // State for language dropdown
  const [isLanguageExpanded, setIsLanguageExpanded] = useState(false);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('SettingsScreen', 'Settings');
  }, []);

  // Handle Bible translation selection
  const handleTranslationSelect = async (translation: BibleTranslation) => {
    await updateBibleTranslation(translation);
    setIsTranslationExpanded(false);
  };

  // Handle theme mode selection
  const handleThemeModeSelect = async (mode: ThemeMode) => {
    await updateThemeMode(mode);
  };

  // Handle language selection
  const handleLanguageSelect = async (language: Language) => {
    await updateLanguage(language);
    setIsLanguageExpanded(false);
  };

  // Handle device settings navigation
  const handleDeviceSettings = () => {
    Linking.openSettings().catch((error) => {
      console.error('Error opening settings:', error);
      Alert.alert(
        t('settings.alerts.unableToOpenSettings'),
        t('settings.alerts.unableToOpenSettingsMessage'),
        [{ text: t('common.ok') }]
      );
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('settings.loadingSettings')}</Text>
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
        {/* Bible Translation Section */}
        <Text style={styles.sectionTitle}>{t('settings.bibleTranslation.title')}</Text>

        <AnimatedCard
          onPress={() => setIsTranslationExpanded(!isTranslationExpanded)}
          theme={theme}
        >
          <View style={styles.cardContent}>
            <View style={styles.textContainer}>
              <Text style={styles.cardLabel}>{t('settings.bibleTranslation.label')}</Text>
              <Text style={styles.cardValue}>{settings.bibleTranslation.fullName}</Text>
            </View>
            <Text style={styles.chevron}>{isTranslationExpanded ? '⌄' : '›'}</Text>
          </View>
        </AnimatedCard>

        {/* Translation Dropdown */}
        {isTranslationExpanded && (
          <View style={styles.dropdown}>
            <ScrollView
              style={styles.dropdownScroll}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {BIBLE_TRANSLATIONS.map((translation) => {
                const isSelected = translation.id === settings.bibleTranslation.id;
                return (
                  <TouchableOpacity
                    key={translation.id}
                    style={[
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemSelected,
                    ]}
                    onPress={() => handleTranslationSelect(translation)}
                  >
                    <View style={styles.dropdownItemContent}>
                      <Text style={[styles.dropdownItemName, isSelected && styles.dropdownItemNameSelected]}>
                        {translation.name}
                      </Text>
                      <Text style={[styles.dropdownItemFullName, isSelected && styles.dropdownItemFullNameSelected]}>
                        {translation.fullName}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Language Section */}
        <Text style={styles.sectionTitle}>{t('settings.language.title')}</Text>

        <AnimatedCard
          onPress={() => setIsLanguageExpanded(!isLanguageExpanded)}
          theme={theme}
        >
          <View style={styles.cardContent}>
            <View style={styles.textContainer}>
              <Text style={styles.cardLabel}>{t('settings.language.label')}</Text>
              <Text style={styles.cardValue}>
                {LANGUAGES.find(lang => lang.code === settings.language)?.nativeName || 'English'}
              </Text>
            </View>
            <Text style={styles.chevron}>{isLanguageExpanded ? '⌄' : '›'}</Text>
          </View>
        </AnimatedCard>

        {/* Language Dropdown */}
        {isLanguageExpanded && (
          <View style={styles.dropdown}>
            <ScrollView
              style={styles.dropdownScroll}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === settings.language;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemSelected,
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                  >
                    <View style={styles.dropdownItemContent}>
                      <Text style={[styles.dropdownItemName, isSelected && styles.dropdownItemNameSelected]}>
                        {lang.nativeName}
                      </Text>
                      <Text style={[styles.dropdownItemFullName, isSelected && styles.dropdownItemFullNameSelected]}>
                        {t(`settings.language.${lang.code}FullDescription`)}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Appearance Section */}
        <Text style={styles.sectionTitle}>{t('settings.appearance.title')}</Text>

        <View style={styles.card}>
          <ThemeModeOption
            mode="auto"
            label={t('settings.appearance.auto')}
            description={t('settings.appearance.autoDescription')}
            isSelected={settings.themeMode === 'auto'}
            onPress={() => handleThemeModeSelect('auto')}
            theme={theme}
          />

          <View style={styles.divider} />

          <ThemeModeOption
            mode="light"
            label={t('settings.appearance.light')}
            description={t('settings.appearance.lightDescription')}
            isSelected={settings.themeMode === 'light'}
            onPress={() => handleThemeModeSelect('light')}
            theme={theme}
          />

          <View style={styles.divider} />

          <ThemeModeOption
            mode="dark"
            label={t('settings.appearance.dark')}
            description={t('settings.appearance.darkDescription')}
            isSelected={settings.themeMode === 'dark'}
            onPress={() => handleThemeModeSelect('dark')}
            theme={theme}
          />
        </View>

        {/* Downloads Section */}
        <Text style={styles.sectionTitle}>{t('settings.downloads.title')}</Text>

        <AnimatedCard onPress={() => navigation.navigate('DownloadSettings')} theme={theme}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="download-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardLabel}>{t('settings.downloads.manageDownloads')}</Text>
              <Text style={styles.cardDescription}>{t('settings.downloads.manageDownloadsDescription')}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </AnimatedCard>

        {/* Playback Section */}
        <Text style={styles.sectionTitle}>{t('settings.playback.title')}</Text>

        <AnimatedCard onPress={() => navigation.navigate('PlaybackSettings')} theme={theme}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="play-circle-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardLabel}>{t('settings.playback.managePlayback')}</Text>
              <Text style={styles.cardDescription}>{t('settings.playback.managePlaybackDescription')}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </AnimatedCard>

        {/* System Section */}
        <Text style={styles.sectionTitle}>{t('settings.system.title')}</Text>

        <AnimatedCard onPress={handleDeviceSettings} theme={theme}>
          <View style={styles.cardContent}>
            <View style={styles.textContainer}>
              <Text style={styles.cardLabel}>{t('settings.system.deviceSettings')}</Text>
              <Text style={styles.cardDescription}>{t('settings.system.deviceSettingsDescription')}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </AnimatedCard>
      </ScrollView>
    </View>
  );
};

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
    loadingText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },

    // Section
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text,
      marginTop: 8,
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
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    iconContainer: {
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
      marginRight: 12,
    },
    cardLabel: {
      ...theme.typography.body,
      color: theme.colors.text,
      fontWeight: '600',
      marginBottom: 4,
    },
    cardValue: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
    },
    cardDescription: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    chevron: {
      fontSize: 24,
      color: theme.colors.textSecondary,
      fontWeight: '300',
    },

    // Dropdown
    dropdown: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginBottom: 12,
      marginTop: -8,
      maxHeight: 300,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    dropdownScroll: {
      maxHeight: 300,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    dropdownItemSelected: {
      // No background highlight - selection indicated by checkmark and text color
    },
    dropdownItemContent: {
      flex: 1,
      marginRight: 12,
    },
    dropdownItemName: {
      ...theme.typography.body,
      color: theme.colors.text,
      fontWeight: '600',
      marginBottom: 2,
    },
    dropdownItemNameSelected: {
      color: theme.colors.primary,
    },
    dropdownItemFullName: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    dropdownItemFullNameSelected: {
      color: theme.colors.primary,
    },
    checkmark: {
      fontSize: 20,
      color: theme.colors.primary,
      fontWeight: '700',
      marginLeft: 8,
    },

    // Theme Mode Options
    themeOption: {
      padding: 16,
    },
    themeOptionSelected: {
      // No background highlight - selection indicated by radio button
    },
    radioContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.textSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    radioOuterSelected: {
      borderColor: theme.colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    themeOptionText: {
      flex: 1,
    },
    themeOptionLabel: {
      ...theme.typography.body,
      color: theme.colors.text,
      fontWeight: '600',
      marginBottom: 2,
    },
    themeOptionDescription: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginLeft: 48,
    },
  });

