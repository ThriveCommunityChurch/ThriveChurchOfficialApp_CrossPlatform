/**
 * ContactScreen
 * Landing page for contacting the church - email, phone, and prayer requests
 * Responsive design for both phone and tablet devices
 */

import React, { useEffect, useState, useCallback } from 'react';
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
import { setCurrentScreen, logContactChurch, logCustomEvent } from '../../services/analytics/analyticsService';

interface ContactConfig {
  email: string | null;
  phone: string | null;
}

export const ContactScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isLandscape = windowWidth > windowHeight;
  const isTabletDevice = (Platform.OS === 'ios' && Platform.isPad) || Math.min(windowWidth, windowHeight) >= 768;
  const styles = createStyles(theme, isTabletDevice, isLandscape);

  const [config, setConfig] = useState<ContactConfig>({ email: null, phone: null });

  useEffect(() => {
    setCurrentScreen('ContactScreen', 'Contact');
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const emailConfig = await getConfigSetting(ConfigKeys.EMAIL_MAIN);
    const phoneConfig = await getConfigSetting(ConfigKeys.PHONE_MAIN);
    setConfig({
      email: emailConfig?.Value || null,
      phone: phoneConfig?.Value || null,
    });
  };

  // Format phone number as US format: (XXX) XXX-XXXX
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      // Handle numbers with country code
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone; // Return original if not a standard US number
  };

  const handleEmail = useCallback(() => {
    if (!config.email) return;
    logContactChurch('email');
    const url = `mailto:${config.email}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(t('connect.contact.emailError'), t('connect.contact.emailErrorMessage'));
      }
    }).catch(() => {
      Alert.alert(t('connect.contact.emailError'), t('connect.contact.emailErrorMessage'));
    });
  }, [config.email, t]);

  const handlePhone = useCallback(() => {
    if (!config.phone) return;
    logContactChurch('phone');
    const url = `tel:${config.phone}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(t('connect.contact.phoneError'), t('connect.contact.phoneErrorMessage'));
      }
    }).catch(() => {
      Alert.alert(t('connect.contact.phoneError'), t('connect.contact.phoneErrorMessage'));
    });
  }, [config.phone, t]);

  const handlePrayerRequest = useCallback(() => {
    if (!config.email) return;
    logCustomEvent('prayer_request_email');
    const subject = encodeURIComponent(t('connect.contactScreen.prayerEmailSubject'));
    const body = encodeURIComponent(t('connect.contactScreen.prayerEmailBody'));
    const url = `mailto:${config.email}?subject=${subject}&body=${body}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(t('connect.contact.emailError'), t('connect.contact.emailErrorMessage'));
      }
    }).catch(() => {
      Alert.alert(t('connect.contact.emailError'), t('connect.contact.emailErrorMessage'));
    });
  }, [config.email, t]);

  const renderContactCard = (
    iconName: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    onPress: () => void,
    disabled: boolean = false
  ) => (
    <TouchableOpacity
      style={[styles.card, disabled && styles.cardDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={styles.cardIconContainer}>
        <Ionicons name={iconName} size={isTabletDevice ? 36 : 30} color={disabled ? theme.colors.textSecondary : theme.colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, disabled && styles.textDisabled]}>{title}</Text>
        <Text style={[styles.cardSubtitle, disabled && styles.textDisabled]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={disabled ? theme.colors.textSecondary : theme.colors.primary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroSection}>
        <Ionicons name="chatbubbles" size={isTabletDevice ? 100 : 70} color={theme.colors.primary} />
        <Text style={styles.heroTitle}>{t('connect.contactScreen.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('connect.contactScreen.heroSubtitle')}</Text>
      </View>

      <View style={isTabletDevice ? styles.tabletContentWrapper : undefined}>
        <View style={styles.cardContainer}>
          {renderContactCard(
            'mail',
            t('connect.contactScreen.emailTitle'),
            config.email || t('connect.contactScreen.notAvailable'),
            handleEmail,
            !config.email
          )}
          {renderContactCard(
            'call',
            t('connect.contactScreen.phoneTitle'),
            config.phone ? formatPhoneNumber(config.phone) : t('connect.contactScreen.notAvailable'),
            handlePhone,
            !config.phone
          )}
          {renderContactCard(
            'heart',
            t('connect.contactScreen.prayerTitle'),
            t('connect.contactScreen.prayerSubtitle'),
            handlePrayerRequest,
            !config.email
          )}
        </View>
      </View>
    </ScrollView>
  );
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
      paddingTop: isTablet ? 24 : 16,
    },
    heroTitle: {
      fontSize: isTablet ? 36 : 26,
      fontFamily: 'Avenir-Heavy',
      color: theme.colors.text,
      marginTop: isTablet ? 20 : 12,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontSize: isTablet ? 18 : 15,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      marginTop: isTablet ? 10 : 6,
      textAlign: 'center',
      paddingHorizontal: isTablet ? 60 : 20,
      maxWidth: isTablet ? 700 : undefined,
      lineHeight: isTablet ? 28 : 22,
    },
    tabletContentWrapper: {
      maxWidth: isLandscape ? 1000 : 800,
      alignSelf: 'center',
      width: '100%',
    },
    cardContainer: {
      gap: isTablet ? 20 : 16,
      ...(isTablet && isLandscape && {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'center' as const,
      }),
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: isTablet ? 16 : 12,
      padding: isTablet ? 24 : 18,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: theme.colors.shadowDark,
      shadowOffset: { width: 0, height: isTablet ? 4 : 2 },
      shadowOpacity: isTablet ? 0.12 : 0.08,
      shadowRadius: isTablet ? 8 : 4,
      elevation: isTablet ? 4 : 2,
      ...(isTablet && isLandscape && {
        width: '31%',
        minWidth: 280,
      }),
    },
    cardDisabled: {
      opacity: 0.5,
    },
    cardIconContainer: {
      width: isTablet ? 60 : 50,
      height: isTablet ? 60 : 50,
      borderRadius: isTablet ? 30 : 25,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isTablet ? 20 : 16,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: isTablet ? 20 : 17,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.text,
      marginBottom: isTablet ? 6 : 4,
    },
    cardSubtitle: {
      fontSize: isTablet ? 15 : 14,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
    },
    textDisabled: {
      color: theme.colors.textSecondary,
    },
  });