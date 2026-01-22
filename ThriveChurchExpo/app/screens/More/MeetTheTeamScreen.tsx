/**
 * MeetTheTeamScreen
 * Native landing page for displaying church leadership and staff
 * Card-based layout with profile images, bios, and contact information
 * Responsive design for both phone and tablet devices
 * Team data is fetched from API config (Team_Members key)
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';
import { getConfigSetting } from '../../services/storage/storage';
import { ConfigKeys, TeamMembersConfigValue, TeamMemberConfig } from '../../types/config';

/**
 * Team Member interface for internal use (camelCase)
 */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string[];
  email: string;
  imageUrl: string;
}

/**
 * Maps Pascal case API config to camelCase internal format
 */
const mapConfigToTeamMember = (config: TeamMemberConfig): TeamMember => ({
  id: config.Id,
  name: config.Name,
  role: config.Role,
  bio: config.Bio,
  email: config.Email,
  imageUrl: config.ImageUrl,
});

type MoreStackParamList = {
  MoreHome: undefined;
  MeetTheTeam: undefined;
};

type NavigationProp = NativeStackNavigationProp<MoreStackParamList>;

export const MeetTheTeamScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLandscape = windowWidth > windowHeight;
  const isTabletDevice = (Platform.OS === 'ios' && Platform.isPad) || Math.min(windowWidth, windowHeight) >= 768;

  const styles = createStyles(theme, isTabletDevice, isLandscape);

  // Fetch team members from config
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const config = await getConfigSetting(ConfigKeys.TEAM_MEMBERS);

        if (config?.Value) {
          const parsed: TeamMembersConfigValue = JSON.parse(config.Value);
          const members = parsed.Members.map(mapConfigToTeamMember);
          setTeamMembers(members);
        } else {
          setError('Team data not available');
        }
      } catch (err) {
        console.error('Error loading team members:', err);
        setError('Failed to load team data');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamMembers();
  }, []);

  useEffect(() => {
    setCurrentScreen('MeetTheTeamScreen', 'MeetTheTeam');
  }, []);

  const handleEmailPress = useCallback((email: string, name: string) => {
    const mailtoUrl = `mailto:${email}`;
    logCustomEvent('team_email_pressed', { email, name });

    Linking.openURL(mailtoUrl).catch((error) => {
      console.error('Error opening email:', error);
      Alert.alert(
        t('more.team.emailError'),
        t('more.team.emailErrorMessage')
      );
    });
  }, [t]);

  const handleGetInvolved = useCallback(() => {
    logCustomEvent('team_get_involved_pressed', {});
    // Navigate to Contact screen in Connect tab
    navigation.getParent()?.navigate('Connect', {
      screen: 'Contact',
    });
  }, [navigation]);

  // Render team member card
  const renderTeamCard = (member: TeamMember) => (
    <View key={member.id} style={styles.teamCard}>
      <Image
        source={{ uri: member.imageUrl }}
        style={styles.teamImage}
        resizeMode="cover"
        accessibilityLabel={`${t('more.team.photoOf')} ${member.name}`}
      />
      <View style={styles.teamCardContent}>
        <Text style={styles.teamName}>{member.name}</Text>
        <Text style={styles.teamRole}>{member.role}</Text>
        {member.bio.map((paragraph, index) => (
          <Text key={index} style={styles.teamBio}>{paragraph}</Text>
        ))}
        <TouchableOpacity
          style={styles.emailButton}
          onPress={() => handleEmailPress(member.email, member.name)}
          activeOpacity={0.7}
          accessibilityLabel={`${t('more.team.emailAccessibility')} ${member.name}`}
          accessibilityRole="button"
        >
          <Ionicons name="mail" size={isTabletDevice ? 20 : 18} color={theme.colors.primary} />
          <Text style={styles.emailText}>{member.email}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Error state
  if (error || teamMembers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.errorText}>{error || 'No team members found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Ionicons name="people" size={isTabletDevice ? 100 : 70} color={theme.colors.primary} />
        <Text style={styles.heroTitle}>{t('more.team.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('more.team.heroSubtitle')}</Text>
      </View>

      {/* Intro Section */}
      <View style={styles.introSection}>
        <Text style={styles.introText}>{t('more.team.introText')}</Text>
      </View>

      {/* Team Grid */}
      <View style={styles.teamGrid}>
        {teamMembers.map(renderTeamCard)}
      </View>

      {/* Get Involved CTA */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>{t('more.team.ctaTitle')}</Text>
        <Text style={styles.ctaText}>{t('more.team.ctaText')}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleGetInvolved} activeOpacity={0.8}>
          <Ionicons name="hand-right" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>{t('more.team.ctaButton')}</Text>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    errorText: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
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
      marginBottom: isTablet ? 32 : 24,
      paddingTop: isTablet ? 16 : 8,
    },
    heroTitle: {
      fontSize: isTablet ? 40 : 30,
      fontFamily: 'Avenir-Heavy',
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: isTablet ? 16 : 12,
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
      marginBottom: isTablet ? 40 : 28,
    },
    introText: {
      fontSize: isTablet ? 17 : 15,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: isTablet ? 28 : 24,
      paddingHorizontal: isTablet ? 40 : 0,
    },
    teamGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: isTablet ? 24 : 16,
      justifyContent: isTablet && isLandscape ? 'space-between' : 'center',
      marginBottom: isTablet ? 48 : 32,
    },
    teamCard: {
      backgroundColor: theme.colors.card,
      borderRadius: isTablet ? 20 : 16,
      overflow: 'hidden',
      width: isTablet ? (isLandscape ? '31%' : '47%') : '100%',
      minWidth: isTablet ? 280 : undefined,
      shadowColor: theme.colors.shadowDark,
      shadowOffset: { width: 0, height: isTablet ? 4 : 2 },
      shadowOpacity: isTablet ? 0.12 : 0.08,
      shadowRadius: isTablet ? 8 : 4,
      elevation: isTablet ? 4 : 2,
      alignItems: 'center',
      paddingTop: isTablet ? 24 : 20,
    },
    teamImage: {
      width: isTablet ? 180 : 140,
      height: isTablet ? 180 : 140,
      borderRadius: isTablet ? 90 : 70,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    teamCardContent: {
      padding: isTablet ? 24 : 20,
    },
    teamName: {
      fontSize: isTablet ? 22 : 18,
      fontFamily: 'Avenir-Heavy',
      color: theme.colors.text,
      marginBottom: isTablet ? 6 : 4,
    },
    teamRole: {
      fontSize: isTablet ? 16 : 14,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.primary,
      marginBottom: isTablet ? 16 : 12,
    },
    teamBio: {
      fontSize: isTablet ? 15 : 14,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      lineHeight: isTablet ? 24 : 22,
      marginBottom: isTablet ? 12 : 10,
    },
    emailButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: isTablet ? 8 : 6,
      paddingVertical: isTablet ? 8 : 6,
    },
    emailText: {
      fontSize: isTablet ? 15 : 14,
      fontFamily: 'Avenir-Medium',
      color: theme.colors.primary,
      marginLeft: isTablet ? 10 : 8,
    },
    ctaSection: {
      backgroundColor: theme.colors.cardSecondary,
      borderRadius: isTablet ? 20 : 16,
      padding: isTablet ? 32 : 24,
      alignItems: 'center',
    },
    ctaTitle: {
      fontSize: isTablet ? 24 : 20,
      fontFamily: 'Avenir-Heavy',
      color: theme.colors.text,
      marginBottom: isTablet ? 10 : 8,
      textAlign: 'center',
    },
    ctaText: {
      fontSize: isTablet ? 17 : 15,
      fontFamily: 'Avenir-Book',
      color: theme.colors.textSecondary,
      marginBottom: isTablet ? 24 : 18,
      textAlign: 'center',
      lineHeight: isTablet ? 26 : 22,
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
    buttonIcon: {
      marginRight: isTablet ? 10 : 8,
    },
    primaryButtonText: {
      fontSize: isTablet ? 17 : 15,
      fontFamily: 'Avenir-Medium',
      color: '#FFFFFF',
    },
  });

