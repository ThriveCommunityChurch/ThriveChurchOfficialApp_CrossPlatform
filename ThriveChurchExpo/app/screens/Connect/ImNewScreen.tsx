/**
 * ImNewScreen
 * Native landing page for first-time visitors - displays what to expect and how to connect
 * Unique layout with intro section, FAQ cards, and dual CTAs
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { getConfigSetting } from '../../services/storage/storage';
import { ConfigKeys } from '../../types/config';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';

type ConnectStackParamList = {
  ConnectHome: undefined;
  SmallGroup: undefined;
};

type NavigationProp = NativeStackNavigationProp<ConnectStackParamList>;

interface FAQItem {
  id: string;
  iconName: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  textKey: string;
  linkKey?: string;
  linkAction?: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'vibe',
    iconName: 'cafe',
    titleKey: 'connect.imNew.faq.vibeTitle',
    textKey: 'connect.imNew.faq.vibeText',
    linkKey: 'connect.imNew.faq.vibeLink',
    linkAction: 'sermons',
  },
  {
    id: 'dress',
    iconName: 'shirt',
    titleKey: 'connect.imNew.faq.dressTitle',
    textKey: 'connect.imNew.faq.dressText',
  },
  {
    id: 'kids',
    iconName: 'happy',
    titleKey: 'connect.imNew.faq.kidsTitle',
    textKey: 'connect.imNew.faq.kidsText',
  },
  {
    id: 'connect',
    iconName: 'people',
    titleKey: 'connect.imNew.faq.connectTitle',
    textKey: 'connect.imNew.faq.connectText',
    linkKey: 'connect.imNew.faq.connectLink',
    linkAction: 'smallgroups',
  },
];

export const ImNewScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isLandscape = windowWidth > windowHeight;
  const isTabletDevice = (Platform.OS === 'ios' && Platform.isPad) || Math.min(windowWidth, windowHeight) >= 768;

  const styles = createStyles(theme, isTabletDevice, isLandscape);

  useEffect(() => {
    setCurrentScreen('ImNewScreen', 'ImNew');
  }, []);

  const handleDirections = useCallback(async () => {
    try {
      const addressConfig = await getConfigSetting(ConfigKeys.ADDRESS_MAIN);
      const address = addressConfig?.Value || '10020 Coconut Rd, Estero, FL 33928';
      const formattedAddress = address.replace(/ /g, '%20').replace(/\n/g, '%20');
      const url = Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${formattedAddress}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${formattedAddress}`;
      
      await Linking.openURL(url);
      logCustomEvent('imnew_directions_pressed', {});
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert(t('connect.contact.mapsError'), t('connect.contact.mapsErrorMessage'));
    }
  }, [t]);

  const handleWatchMessage = useCallback(() => {
    // Navigate to Listen tab
    logCustomEvent('imnew_watch_message_pressed', {});
    navigation.getParent()?.navigate('Listen');
  }, [navigation]);

  const handleFAQLinkPress = useCallback((action: string) => {
    logCustomEvent('imnew_faq_link_pressed', { action });
    switch (action) {
      case 'sermons':
        navigation.getParent()?.navigate('Listen');
        break;
      case 'smallgroups':
        navigation.navigate('SmallGroup');
        break;
    }
  }, [navigation]);

  // Render FAQ card component
  const renderFAQCard = (item: FAQItem) => (
    <View key={item.id} style={styles.faqCard}>
      <View style={styles.faqIconContainer}>
        <Ionicons name={item.iconName} size={isTabletDevice ? 28 : 24} color={theme.colors.primary} />
      </View>
      <Text style={styles.faqTitle}>{t(item.titleKey)}</Text>
      <Text style={styles.faqText}>{t(item.textKey)}</Text>
      {item.linkKey && item.linkAction && (
        <TouchableOpacity 
          style={styles.faqLink} 
          onPress={() => handleFAQLinkPress(item.linkAction!)}
          activeOpacity={0.7}
        >
          <Text style={styles.faqLinkText}>{t(item.linkKey)}</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>{t('connect.imNew.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('connect.imNew.heroSubtitle')}</Text>
      </View>

      {/* Intro Section */}
      <View style={styles.introSection}>
        <Text style={styles.introTitle}>{t('connect.imNew.introTitle')}</Text>
        <Text style={styles.introLead}>{t('connect.imNew.introLead')}</Text>
        <Text style={styles.introText}>{t('connect.imNew.introText')}</Text>

        {/* Dual CTA Buttons */}
        <View style={styles.introCTAContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleDirections} activeOpacity={0.8}>
            <Ionicons name="location" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>{t('connect.imNew.seeYouSunday')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={handleWatchMessage} activeOpacity={0.8}>
            <Ionicons name="play" size={20} color={theme.colors.primary} style={styles.buttonIcon} />
            <Text style={styles.outlineButtonText}>{t('connect.imNew.watchMessage')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FAQ Section */}
      <View style={styles.faqSection}>
        <Text style={styles.sectionTitle}>{t('connect.imNew.faqTitle')}</Text>
        <View style={styles.faqGrid}>
          {FAQ_ITEMS.map(renderFAQCard)}
        </View>
      </View>

      {/* Location CTA Section */}
      <View style={styles.locationCTASection}>
        <Text style={styles.locationCTATitle}>{t('connect.imNew.locationCTATitle')}</Text>
        <Text style={styles.locationCTASubtitle}>{t('connect.imNew.locationCTASubtitle')}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleDirections} activeOpacity={0.8}>
          <Ionicons name="navigate" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>{t('connect.imNew.getDirections')}</Text>
        </TouchableOpacity>
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
      marginBottom: isTablet ? 32 : 20,
      paddingTop: isTablet ? 16 : 8,
    },
    heroTitle: {
      fontSize: isTablet ? 40 : 30,
      fontFamily: 'Avenir-Heavy',
      color: theme.colors.text,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontSize: isTablet ? 18 : 15,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      marginTop: isTablet ? 10 : 6,
      textAlign: 'center',
      paddingHorizontal: isTablet ? 60 : 16,
      maxWidth: isTablet ? 700 : undefined,
      lineHeight: isTablet ? 28 : 22,
    },
    introSection: {
      backgroundColor: theme.colors.card,
      borderRadius: isTablet ? 20 : 16,
      padding: isTablet ? 32 : 24,
      marginBottom: isTablet ? 40 : 28,
      shadowColor: theme.colors.shadowDark,
      shadowOffset: { width: 0, height: isTablet ? 4 : 2 },
      shadowOpacity: isTablet ? 0.12 : 0.08,
      shadowRadius: isTablet ? 8 : 4,
      elevation: isTablet ? 4 : 2,
    },
    introTitle: {
      fontSize: isTablet ? 28 : 22,
      fontFamily: 'Avenir-Heavy',
      color: theme.colors.text,
      marginBottom: isTablet ? 16 : 12,
      textAlign: 'center',
    },
    introLead: {
      fontSize: isTablet ? 17 : 15,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.text,
      marginBottom: isTablet ? 12 : 10,
      lineHeight: isTablet ? 26 : 23,
      textAlign: 'center',
    },
    introText: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      lineHeight: isTablet ? 26 : 22,
      textAlign: 'center',
      marginBottom: isTablet ? 24 : 20,
    },
    introCTAContainer: {
      flexDirection: isTablet && isLandscape ? 'row' : 'column',
      gap: isTablet ? 16 : 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isTablet ? 18 : 14,
      paddingHorizontal: isTablet ? 32 : 24,
      borderRadius: isTablet ? 14 : 10,
      width: isTablet && isLandscape ? 'auto' : '100%',
      minWidth: isTablet ? 200 : undefined,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isTablet ? 16 : 12,
      paddingHorizontal: isTablet ? 32 : 24,
      borderRadius: isTablet ? 14 : 10,
      width: isTablet && isLandscape ? 'auto' : '100%',
      minWidth: isTablet ? 200 : undefined,
    },
    buttonIcon: {
      marginRight: isTablet ? 10 : 8,
    },
    primaryButtonText: {
      fontSize: isTablet ? 17 : 15,
      fontFamily: 'Avenir-Medium',
      color: '#FFFFFF',
    },
    outlineButtonText: {
      fontSize: isTablet ? 17 : 15,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.primary,
    },
    faqSection: {
      marginBottom: isTablet ? 40 : 28,
    },
    sectionTitle: {
      fontSize: isTablet ? 26 : 20,
      fontFamily: 'Avenir-Heavy',
      color: theme.colors.text,
      marginBottom: isTablet ? 24 : 18,
      textAlign: 'center',
    },
    faqGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: isTablet ? 20 : 14,
      justifyContent: 'center',
    },
    faqCard: {
      backgroundColor: theme.colors.card,
      borderRadius: isTablet ? 16 : 12,
      padding: isTablet ? 24 : 18,
      width: isTablet ? '47%' : '100%',
      minWidth: isTablet ? 280 : undefined,
      shadowColor: theme.colors.shadowDark,
      shadowOffset: { width: 0, height: isTablet ? 3 : 2 },
      shadowOpacity: isTablet ? 0.10 : 0.08,
      shadowRadius: isTablet ? 6 : 4,
      elevation: isTablet ? 3 : 2,
    },
    faqIconContainer: {
      width: isTablet ? 52 : 44,
      height: isTablet ? 52 : 44,
      borderRadius: isTablet ? 26 : 22,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isTablet ? 16 : 12,
    },
    faqTitle: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.text,
      marginBottom: isTablet ? 10 : 8,
    },
    faqText: {
      fontSize: isTablet ? 15 : 13,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      lineHeight: isTablet ? 24 : 20,
      marginBottom: isTablet ? 12 : 8,
    },
    faqLink: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: isTablet ? 4 : 2,
    },
    faqLinkText: {
      fontSize: isTablet ? 14 : 13,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.primary,
      marginRight: 6,
    },
    locationCTASection: {
      backgroundColor: theme.colors.cardSecondary,
      borderRadius: isTablet ? 20 : 16,
      padding: isTablet ? 32 : 24,
      alignItems: 'center',
      marginTop: isTablet ? 8 : 4,
    },
    locationCTATitle: {
      fontSize: isTablet ? 24 : 20,
      fontFamily: 'Avenir-Heavy',
      color: theme.colors.text,
      marginBottom: isTablet ? 10 : 8,
      textAlign: 'center',
    },
    locationCTASubtitle: {
      fontSize: isTablet ? 17 : 15,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      marginBottom: isTablet ? 24 : 18,
      textAlign: 'center',
    },
  });

