/**
 * ServeScreen
 * Native landing page for serving - displays info and allows users to email the church
 * Responsive design for both phone and tablet devices
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { getConfigSetting } from '../../services/storage/storage';
import { ConfigKeys } from '../../types/config';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';

export const ServeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Calculate orientation and device type
  const isLandscape = windowWidth > windowHeight;
  const isTabletDevice = (Platform.OS === 'ios' && Platform.isPad) || Math.min(windowWidth, windowHeight) >= 768;

  const styles = createStyles(theme, isTabletDevice, isLandscape);

  useEffect(() => {
    setCurrentScreen('ServeScreen', 'Serve');
  }, []);

  const handleEmailPress = useCallback(async () => {
    try {
      const emailConfig = await getConfigSetting(ConfigKeys.EMAIL_MAIN);
      const email = emailConfig?.Value || 'info@thrive-fl.org';
      
      const subject = encodeURIComponent(t('connect.serve.emailSubject'));
      const body = encodeURIComponent(t('connect.serve.emailBody'));
      const url = `mailto:${email}?subject=${subject}&body=${body}`;

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        logCustomEvent('serve_email_sent', { email });
      } else {
        Alert.alert(
          t('connect.contact.emailError'),
          t('connect.contact.emailErrorMessage')
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert(
        t('connect.contact.emailError'),
        t('connect.contact.emailErrorMessage')
      );
    }
  }, [t]);

  // Render info card component
  const renderInfoCard = (iconName: keyof typeof Ionicons.glyphMap, titleKey: string, textKey: string) => (
    <View style={styles.card}>
      <Ionicons name={iconName} size={isTabletDevice ? 32 : 28} color={theme.colors.primary} style={styles.cardIcon} />
      <Text style={styles.cardTitle}>{t(titleKey)}</Text>
      <Text style={styles.cardText}>{t(textKey)}</Text>
    </View>
  );

  // Render tablet layout with grid design for cards
  const renderTabletLayout = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section - Larger for tablet */}
      <View style={styles.heroSection}>
        <Ionicons name="hand-left" size={120} color={theme.colors.primary} />
        <Text style={styles.heroTitle}>{t('connect.serve.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('connect.serve.heroSubtitle')}</Text>
      </View>

      {/* Grid Layout for Cards */}
      <View style={styles.tabletContentWrapper}>
        <View style={styles.cardContainer}>
          {renderInfoCard('musical-notes', 'connect.serve.worshipTitle', 'connect.serve.worshipText')}
          {renderInfoCard('videocam', 'connect.serve.techTitle', 'connect.serve.techText')}
          {renderInfoCard('cafe', 'connect.serve.hospitalityTitle', 'connect.serve.hospitalityText')}
          {renderInfoCard('hand-right', 'connect.serve.ushersTitle', 'connect.serve.ushersText')}
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaText}>{t('connect.serve.ctaText')}</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleEmailPress} activeOpacity={0.8}>
            <Ionicons name="mail" size={24} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.ctaButtonText}>{t('connect.serve.ctaButton')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // Render phone layout (original vertical design)
  const renderPhoneLayout = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Ionicons name="hand-left" size={80} color={theme.colors.primary} />
        <Text style={styles.heroTitle}>{t('connect.serve.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('connect.serve.heroSubtitle')}</Text>
      </View>

      {/* Info Cards */}
      <View style={styles.cardContainer}>
        {renderInfoCard('musical-notes', 'connect.serve.worshipTitle', 'connect.serve.worshipText')}
        {renderInfoCard('videocam', 'connect.serve.techTitle', 'connect.serve.techText')}
        {renderInfoCard('cafe', 'connect.serve.hospitalityTitle', 'connect.serve.hospitalityText')}
        {renderInfoCard('hand-right', 'connect.serve.ushersTitle', 'connect.serve.ushersText')}
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaText}>{t('connect.serve.ctaText')}</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={handleEmailPress} activeOpacity={0.8}>
          <Ionicons name="mail" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.ctaButtonText}>{t('connect.serve.ctaButton')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Conditionally render based on device type
  return isTabletDevice ? renderTabletLayout() : renderPhoneLayout();
};

const createStyles = (theme: Theme, isTablet: boolean, isLandscape: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      padding: isTablet ? 48 : 20,
      paddingBottom: isTablet ? 60 : 40,
      ...(isTablet && {
        maxWidth: 1200,
        alignSelf: 'center' as const,
        width: '100%',
      }),
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: isTablet ? 48 : 32,
      paddingTop: isTablet ? 32 : 20,
    },
    heroTitle: {
      fontSize: isTablet ? 40 : 28,
      fontFamily: 'Avenir-Heavy',
      color: theme.colors.text,
      marginTop: isTablet ? 24 : 16,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontSize: isTablet ? 20 : 16,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      marginTop: isTablet ? 12 : 8,
      textAlign: 'center',
      paddingHorizontal: isTablet ? 60 : 20,
      maxWidth: isTablet ? 800 : undefined,
      lineHeight: isTablet ? 30 : 24,
    },
    // Tablet wrapper for grid layout
    tabletContentWrapper: {
      maxWidth: 1000,
      alignSelf: 'center',
      width: '100%',
    },
    cardContainer: {
      gap: isTablet ? 24 : 16,
      ...(isTablet && {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'center' as const,
      }),
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: isTablet ? 16 : 12,
      padding: isTablet ? 28 : 20,
      shadowColor: theme.colors.shadowDark,
      shadowOffset: { width: 0, height: isTablet ? 4 : 2 },
      shadowOpacity: isTablet ? 0.15 : 0.1,
      shadowRadius: isTablet ? 8 : 4,
      elevation: isTablet ? 5 : 3,
      ...(isTablet && {
        // 2x2 grid in landscape, 2 columns in portrait
        width: isLandscape ? '23%' : '47%',
        minWidth: isLandscape ? 220 : 280,
      }),
    },
    cardIcon: {
      marginBottom: isTablet ? 16 : 12,
    },
    cardTitle: {
      fontSize: isTablet ? 22 : 18,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.text,
      marginBottom: isTablet ? 12 : 8,
    },
    cardText: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      lineHeight: isTablet ? 26 : 22,
    },
    ctaSection: {
      marginTop: isTablet ? 48 : 32,
      alignItems: 'center',
      ...(isTablet && {
        maxWidth: 500,
        alignSelf: 'center' as const,
        width: '100%',
      }),
    },
    ctaText: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: isTablet ? 24 : 16,
      lineHeight: isTablet ? 28 : 24,
    },
    ctaButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isTablet ? 20 : 16,
      paddingHorizontal: isTablet ? 48 : 32,
      borderRadius: isTablet ? 16 : 12,
      width: '100%',
      maxWidth: isTablet ? 400 : undefined,
    },
    buttonIcon: {
      marginRight: isTablet ? 12 : 8,
    },
    ctaButtonText: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'Avenir-Medium',
      color: '#FFFFFF',
    },
  });

