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
import { useTheme } from '../../hooks/useTheme';
import { useSettings } from '../../hooks/useSettings';
import { BIBLE_TRANSLATIONS } from '../../data/bibleTranslations';
import type { Theme } from '../../theme/types';
import type { BibleTranslation, ThemeMode } from '../../types/settings';
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
  const { settings, isLoading, updateBibleTranslation, updateThemeMode } = useSettings();
  const styles = createStyles(theme);

  // State for Bible translation dropdown
  const [isTranslationExpanded, setIsTranslationExpanded] = useState(false);

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

  // Handle device settings navigation
  const handleDeviceSettings = () => {
    Linking.openSettings().catch((error) => {
      console.error('Error opening settings:', error);
      Alert.alert(
        'Unable to Open Settings',
        'Could not open device settings. Please try again.',
        [{ text: 'OK' }]
      );
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
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
        <Text style={styles.sectionTitle}>Bible Translation</Text>
        
        <AnimatedCard
          onPress={() => setIsTranslationExpanded(!isTranslationExpanded)}
          theme={theme}
        >
          <View style={styles.cardContent}>
            <View style={styles.textContainer}>
              <Text style={styles.cardLabel}>Translation</Text>
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

        {/* Appearance Section */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        <View style={styles.card}>
          <ThemeModeOption
            mode="auto"
            label="Auto"
            description="Follow system appearance"
            isSelected={settings.themeMode === 'auto'}
            onPress={() => handleThemeModeSelect('auto')}
            theme={theme}
          />
          
          <View style={styles.divider} />
          
          <ThemeModeOption
            mode="light"
            label="Light"
            description="Always use light theme"
            isSelected={settings.themeMode === 'light'}
            onPress={() => handleThemeModeSelect('light')}
            theme={theme}
          />
          
          <View style={styles.divider} />
          
          <ThemeModeOption
            mode="dark"
            label="Dark"
            description="Always use dark theme"
            isSelected={settings.themeMode === 'dark'}
            onPress={() => handleThemeModeSelect('dark')}
            theme={theme}
          />
        </View>

        {/* System Section */}
        <Text style={styles.sectionTitle}>System</Text>
        
        <AnimatedCard onPress={handleDeviceSettings} theme={theme}>
          <View style={styles.cardContent}>
            <View style={styles.textContainer}>
              <Text style={styles.cardLabel}>Device Settings</Text>
              <Text style={styles.cardDescription}>Manage notifications and permissions</Text>
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

