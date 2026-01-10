/**
 * LiveScreen
 * Screen for watching Thrive Church live streams on YouTube
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useLiveStream } from '../../hooks/useLiveStream';
import { getYouTubeWatchUrl, getYouTubeEmbedUrl } from '../../services/youtube';
import { youtubeConfig } from '../../config/app.config';
import { LiveBadge } from '../../components/LiveBadge';
import { setCurrentScreen } from '../../services/analytics/analyticsService';
import type { Theme } from '../../theme/types';

export const LiveScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { data: liveStatus, isLoading, refetch, isRefetching } = useLiveStream();
  const styles = createStyles(theme);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('LiveScreen', 'Live');
  }, []);

  // Share handler
  const handleShare = useCallback(async () => {
    if (!liveStatus?.videoId) return;

    const url = getYouTubeWatchUrl(liveStatus.videoId);
    try {
      await Share.share({
        message: `Watch Thrive Church live! ${url}`,
        url: url, // iOS only
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [liveStatus?.videoId]);

  // Open in YouTube app
  const handleOpenInYouTube = useCallback(async () => {
    if (!liveStatus?.videoId) return;

    const url = getYouTubeWatchUrl(liveStatus.videoId);
    const youtubeAppUrl = Platform.select({
      ios: `youtube://watch?v=${liveStatus.videoId}`,
      android: `vnd.youtube:${liveStatus.videoId}`,
    });

    try {
      const canOpenYouTube = await Linking.canOpenURL(youtubeAppUrl || '');
      await Linking.openURL(canOpenYouTube ? youtubeAppUrl! : url);
    } catch (error) {
      console.error('Error opening YouTube:', error);
      await Linking.openURL(url);
    }
  }, [liveStatus?.videoId]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading && !liveStatus) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('listen.live.checking')}</Text>
      </View>
    );
  }

  // Live state - show the stream
  if (liveStatus?.isLive && liveStatus.videoId) {
    return (
      <View style={styles.container}>
        {/* Header with live badge and title */}
        <View style={styles.liveHeader}>
          <LiveBadge size="medium" />
          <Text style={styles.streamTitle} numberOfLines={2}>
            {liveStatus.title || t('listen.live.liveNow')}
          </Text>
        </View>

        {/* Viewer count */}
        {liveStatus.viewerCount !== null && (
          <View style={styles.viewerCount}>
            <Ionicons name="eye-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.viewerText}>
              {t('listen.live.watching', { count: liveStatus.viewerCount.toLocaleString() })}
            </Text>
          </View>
        )}

        {/* YouTube Player (WebView) */}
        <View style={styles.playerContainer}>
          <WebView
            source={{ uri: getYouTubeEmbedUrl(liveStatus.videoId) }}
            style={styles.webView}
            allowsFullscreenVideo={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            allowsPictureInPictureMediaPlayback={true}
          />
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={theme.colors.text} />
            <Text style={styles.actionButtonText}>{t('listen.live.share')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleOpenInYouTube}>
            <Ionicons name="logo-youtube" size={22} color="#FF0000" />
            <Text style={styles.actionButtonText}>{t('listen.live.openInYouTube')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Offline state - show friendly message
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.offlineContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.offlineContainer}>
        <Ionicons name="videocam-off-outline" size={80} color={theme.colors.textTertiary} />
        <Text style={styles.offlineTitle}>{t('listen.live.notLive')}</Text>
        <Text style={styles.offlineSubtitle}>{t('listen.live.joinUs')}</Text>

        {/* Check Again Button */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
          disabled={isRefetching}
        >
          <Ionicons name="refresh-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.secondaryButtonText}>{t('listen.live.checkAgain')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Styles
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    // Live state styles
    liveHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    streamTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    viewerCount: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 6,
    },
    viewerText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    playerContainer: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: '#000000',
    },
    webView: {
      flex: 1,
      backgroundColor: '#000000',
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      padding: 16,
      gap: 24,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      gap: 8,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    // Offline state styles
    offlineContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    offlineContainer: {
      alignItems: 'center',
      padding: 32,
    },
    offlineTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 24,
      textAlign: 'center',
    },
    offlineSubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.error,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginTop: 32,
      gap: 10,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginTop: 16,
      gap: 8,
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    },
  });

export default LiveScreen;

