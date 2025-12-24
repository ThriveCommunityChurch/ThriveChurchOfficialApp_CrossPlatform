/**
 * AboutScreen
 * Landing page displaying app information and user-friendly diagnostics
 * Responsive design for both phone and tablet devices
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { setCurrentScreen } from '../../services/analytics/analyticsService';

interface DeviceInfoState {
  appVersion: string;
  buildNumber: string;
  deviceModel: string;
  osName: string;
  osVersion: string;
  deviceType: string;
  year: number;
}

export const AboutScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isLandscape = windowWidth > windowHeight;
  const isTabletDevice = (Platform.OS === 'ios' && Platform.isPad) || Math.min(windowWidth, windowHeight) >= 768;
  const styles = createStyles(theme, isTabletDevice, isLandscape);

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoState>({
    appVersion: '1.0.0',
    buildNumber: '1',
    deviceModel: 'Unknown',
    osName: Platform.OS === 'ios' ? 'iOS' : 'Android',
    osVersion: 'Unknown',
    deviceType: 'Phone',
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    setCurrentScreen('AboutScreen', 'About');
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = () => {
    const deviceType = Device.deviceType;
    let deviceTypeString = 'Phone';
    if (deviceType === Device.DeviceType.TABLET) deviceTypeString = 'Tablet';
    else if (deviceType === Device.DeviceType.DESKTOP) deviceTypeString = 'Desktop';
    else if (deviceType === Device.DeviceType.TV) deviceTypeString = 'TV';

    setDeviceInfo({
      appVersion: Application.nativeApplicationVersion || '1.0.0',
      buildNumber: Application.nativeBuildVersion || '1',
      deviceModel: Device.modelName || 'Unknown',
      osName: Device.osName || (Platform.OS === 'ios' ? 'iOS' : 'Android'),
      osVersion: Device.osVersion || 'Unknown',
      deviceType: deviceTypeString,
      year: new Date().getFullYear(),
    });
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://thrive-fl.org').catch(() => {});
  };

  const renderInfoRow = (label: string, value: string) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  const renderSectionCard = (iconName: keyof typeof Ionicons.glyphMap, title: string, children: React.ReactNode) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={iconName} size={isTabletDevice ? 28 : 24} color={theme.colors.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroSection}>
        <Ionicons name="information-circle" size={isTabletDevice ? 100 : 70} color={theme.colors.primary} />
        <Text style={styles.heroTitle}>{t('more.about.screenTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('more.about.screenSubtitle')}</Text>
      </View>

      <View style={isTabletDevice ? styles.tabletContentWrapper : undefined}>
        <View style={styles.cardContainer}>
          {renderSectionCard('apps', t('more.about.appInfoTitle'), (
            <>
              {renderInfoRow(t('more.about.version'), deviceInfo.appVersion)}
              {renderInfoRow(t('more.about.build'), deviceInfo.buildNumber)}
              {renderInfoRow(t('more.about.platform'), deviceInfo.osName)}
            </>
          ))}

          {renderSectionCard('phone-portrait', t('more.about.deviceInfoTitle'), (
            <>
              {renderInfoRow(t('more.about.deviceModel'), deviceInfo.deviceModel)}
              {renderInfoRow(t('more.about.deviceType'), deviceInfo.deviceType)}
              {renderInfoRow(t('more.about.osVersion'), `${deviceInfo.osName} ${deviceInfo.osVersion}`)}
            </>
          ))}

          {renderSectionCard('heart', t('more.about.aboutAppTitle'), (
            <Text style={styles.aboutText}>{t('more.about.aboutAppText')}</Text>
          ))}
        </View>

        <View style={styles.footerSection}>
          <TouchableOpacity onPress={handleWebsitePress} activeOpacity={0.7}>
            <Text style={styles.websiteLink}>thrive-fl.org</Text>
          </TouchableOpacity>
          <Text style={styles.copyrightText}>{t('more.about.copyright', { year: deviceInfo.year })}</Text>
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
      maxWidth: 900,
      alignSelf: 'center',
      width: '100%',
    },
    cardContainer: {
      gap: isTablet ? 24 : 16,
      ...(isTablet && isLandscape && {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'center' as const,
      }),
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: isTablet ? 16 : 12,
      padding: isTablet ? 24 : 16,
      shadowColor: theme.colors.shadowDark,
      shadowOffset: { width: 0, height: isTablet ? 4 : 2 },
      shadowOpacity: isTablet ? 0.12 : 0.08,
      shadowRadius: isTablet ? 8 : 4,
      elevation: isTablet ? 4 : 2,
      ...(isTablet && isLandscape && {
        width: '31%',
        minWidth: 260,
      }),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isTablet ? 16 : 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: isTablet ? 12 : 8,
    },
    cardTitle: {
      fontSize: isTablet ? 20 : 17,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.text,
      marginLeft: isTablet ? 12 : 10,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: isTablet ? 10 : 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    infoLabel: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
    },
    infoValue: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.text,
    },
    aboutText: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      lineHeight: isTablet ? 26 : 22,
    },
    footerSection: {
      marginTop: isTablet ? 48 : 32,
      alignItems: 'center',
      paddingBottom: isTablet ? 20 : 10,
    },
    websiteLink: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.primary,
      marginBottom: isTablet ? 12 : 8,
    },
    copyrightText: {
      fontSize: isTablet ? 14 : 12,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });