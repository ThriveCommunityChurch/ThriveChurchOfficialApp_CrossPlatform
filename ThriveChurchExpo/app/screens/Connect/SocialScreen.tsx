/**
 * SocialScreen
 * Landing page for social media links with brand logos
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { ConfigKeys } from '../../types/config';
import { getConfigSetting } from '../../services/storage/storage';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';

interface SocialConfig {
  fbPageId: string | null;
  fbSocial: string | null;
  igUsername: string | null;
  igSocial: string | null;
  twUsername: string | null;
  twSocial: string | null;
}

// Brand colors for social platforms
const SOCIAL_COLORS = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  x: '#000000',
};

export const SocialScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isLandscape = windowWidth > windowHeight;
  const isTabletDevice = (Platform.OS === 'ios' && Platform.isPad) || Math.min(windowWidth, windowHeight) >= 768;
  const styles = createStyles(theme, isTabletDevice, isLandscape);

  const [config, setConfig] = useState<SocialConfig>({
    fbPageId: null,
    fbSocial: null,
    igUsername: null,
    igSocial: null,
    twUsername: null,
    twSocial: null,
  });

  useEffect(() => {
    setCurrentScreen('SocialScreen', 'Social');
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const fbPageId = await getConfigSetting(ConfigKeys.FB_PAGE_ID);
    const fbSocial = await getConfigSetting(ConfigKeys.FB_SOCIAL);
    const igUsername = await getConfigSetting(ConfigKeys.IG_USERNAME);
    const igSocial = await getConfigSetting(ConfigKeys.IG_SOCIAL);
    const twUsername = await getConfigSetting(ConfigKeys.TW_USERNAME);
    const twSocial = await getConfigSetting(ConfigKeys.TW_SOCIAL);

    setConfig({
      fbPageId: fbPageId?.Value || null,
      fbSocial: fbSocial?.Value || null,
      igUsername: igUsername?.Value || null,
      igSocial: igSocial?.Value || null,
      twUsername: twUsername?.Value || null,
      twSocial: twSocial?.Value || null,
    });
  };

  const openFacebook = useCallback(async () => {
    logCustomEvent('social_facebook_tap');
    const pageId = config.fbPageId;
    const webUrl = config.fbSocial;

    if (pageId) {
      const appURL = `fb://profile/${pageId}`;
      try {
        const canOpen = await Linking.canOpenURL(appURL);
        if (canOpen) {
          await Linking.openURL(appURL);
          return;
        }
      } catch {}
      // Show download prompt
      Alert.alert(
        t('connect.socialScreen.downloadAlert'),
        t('connect.socialScreen.downloadFacebook'),
        [
          { text: t('connect.socialScreen.cancel'), style: 'destructive' },
          {
            text: t('connect.socialScreen.download'),
            onPress: () => {
              const storeURL = Platform.OS === 'ios'
                ? 'itms-apps://itunes.apple.com/app/id284882215'
                : 'market://details?id=com.facebook.katana';
              Linking.openURL(storeURL);
            },
          },
        ]
      );
    } else if (webUrl) {
      Linking.openURL(webUrl);
    }
  }, [config.fbPageId, config.fbSocial, t]);

  const openInstagram = useCallback(async () => {
    logCustomEvent('social_instagram_tap');
    const username = config.igUsername;
    const webUrl = config.igSocial;

    if (username) {
      const appURL = `instagram://user?username=${username}`;
      try {
        const canOpen = await Linking.canOpenURL(appURL);
        if (canOpen) {
          await Linking.openURL(appURL);
          return;
        }
      } catch {}
      Alert.alert(
        t('connect.socialScreen.downloadAlert'),
        t('connect.socialScreen.downloadInstagram'),
        [
          { text: t('connect.socialScreen.cancel'), style: 'destructive' },
          {
            text: t('connect.socialScreen.download'),
            onPress: () => {
              const storeURL = Platform.OS === 'ios'
                ? 'itms-apps://itunes.apple.com/app/id389801252'
                : 'market://details?id=com.instagram.android';
              Linking.openURL(storeURL);
            },
          },
        ]
      );
    } else if (webUrl) {
      Linking.openURL(webUrl);
    }
  }, [config.igUsername, config.igSocial, t]);

  const openX = useCallback(async () => {
    logCustomEvent('social_x_tap');
    const username = config.twUsername;
    const webUrl = config.twSocial;

    if (username) {
      const appURL = `twitter://user?screen_name=${username}`;
      try {
        const canOpen = await Linking.canOpenURL(appURL);
        if (canOpen) {
          await Linking.openURL(appURL);
          return;
        }
      } catch {}
      Alert.alert(
        t('connect.socialScreen.downloadAlert'),
        t('connect.socialScreen.downloadX'),
        [
          { text: t('connect.socialScreen.cancel'), style: 'destructive' },
          {
            text: t('connect.socialScreen.download'),
            onPress: () => {
              const storeURL = Platform.OS === 'ios'
                ? 'itms-apps://itunes.apple.com/app/id409789998'
                : 'market://details?id=com.twitter.android';
              Linking.openURL(storeURL);
            },
          },
        ]
      );
    } else if (webUrl) {
      Linking.openURL(webUrl);
    }
  }, [config.twUsername, config.twSocial, t]);

  const hasFacebook = config.fbPageId || config.fbSocial;
  const hasInstagram = config.igUsername || config.igSocial;
  const hasX = config.twUsername || config.twSocial;

  const renderSocialCard = (
    iconName: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    brandColor: string,
    onPress: () => void,
    isAvailable: boolean
  ) => (
    <TouchableOpacity
      style={[styles.card, !isAvailable && styles.cardDisabled]}
      onPress={onPress}
      disabled={!isAvailable}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIconContainer, { backgroundColor: brandColor }]}>
        <Ionicons name={iconName} size={isTabletDevice ? 32 : 28} color="#FFFFFF" />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, !isAvailable && styles.textDisabled]}>{title}</Text>
        <Text style={[styles.cardSubtitle, !isAvailable && styles.textDisabled]}>{subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={isTabletDevice ? 24 : 20}
        color={isAvailable ? theme.colors.textSecondary : theme.colors.border}
      />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroSection}>
        <Ionicons name="share-social" size={isTabletDevice ? 100 : 70} color={theme.colors.primary} />
        <Text style={styles.heroTitle}>{t('connect.socialScreen.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('connect.socialScreen.heroSubtitle')}</Text>
      </View>

      <View style={isTabletDevice ? styles.tabletContentWrapper : undefined}>
        <View style={styles.cardContainer}>
          {renderSocialCard(
            'logo-facebook',
            t('connect.socialScreen.facebookTitle'),
            hasFacebook ? t('connect.socialScreen.facebookSubtitle') : t('connect.socialScreen.notAvailable'),
            SOCIAL_COLORS.facebook,
            openFacebook,
            !!hasFacebook
          )}
          {renderSocialCard(
            'logo-instagram',
            t('connect.socialScreen.instagramTitle'),
            hasInstagram ? t('connect.socialScreen.instagramSubtitle') : t('connect.socialScreen.notAvailable'),
            SOCIAL_COLORS.instagram,
            openInstagram,
            !!hasInstagram
          )}
          {renderSocialCard(
            'logo-x',
            t('connect.socialScreen.xTitle'),
            hasX ? t('connect.socialScreen.xSubtitle') : t('connect.socialScreen.notAvailable'),
            SOCIAL_COLORS.x,
            openX,
            !!hasX
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

