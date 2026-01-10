import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import VideoPlayer from '../../components/VideoPlayer';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SermonMessage } from '../../types/api';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';

type VideoPlayerScreenParams = {
  VideoPlayerScreen: {
    message: SermonMessage;
    seriesTitle?: string;
  };
};

type VideoPlayerScreenRouteProp = RouteProp<VideoPlayerScreenParams, 'VideoPlayerScreen'>;
type VideoPlayerScreenNavigationProp = StackNavigationProp<VideoPlayerScreenParams, 'VideoPlayerScreen'>;

const VideoPlayerScreen: React.FC = () => {
  const navigation = useNavigation<VideoPlayerScreenNavigationProp>();
  const route = useRoute<VideoPlayerScreenRouteProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const { message, seriesTitle } = route.params;

  useEffect(() => {
    // Track screen view with video info
    setCurrentScreen('VideoPlayerScreen', 'VideoPlayer');
    logCustomEvent('play_video', {
      sermon_id: message.MessageId,
      sermon_title: message.Title,
      series_title: seriesTitle || '',
      content_type: 'video',
    });

    // Hide status bar for immersive video experience
    StatusBar.setHidden(true);

    return () => {
      // Restore status bar when leaving
      StatusBar.setHidden(false);
    };
  }, [message.MessageId, message.Title, seriesTitle]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleError = useCallback((error: string) => {
    Alert.alert(
      t('videoPlayer.videoError'),
      error,
      [
        { text: t('videoPlayer.close'), onPress: handleClose },
        { text: t('videoPlayer.openInYouTube'), onPress: handleOpenInYouTube },
      ]
    );
  }, [handleClose, t]);

  const handleOpenInYouTube = useCallback(async () => {
    if (!message.VideoUrl) return;

    try {
      // Extract video ID from URL
      const videoId = message.VideoUrl.replace('https://youtu.be/', '');
      
      // Try to open in YouTube app first
      const youtubeAppUrl = `youtube://watch?v=${videoId}`;
      const canOpenApp = await Linking.canOpenURL(youtubeAppUrl);
      
      if (canOpenApp) {
        await Linking.openURL(youtubeAppUrl);
      } else {
        // Fallback to web browser
        const webUrl = `https://www.youtube.com/watch?v=${videoId}`;
        await Linking.openURL(webUrl);
      }
      
      // Close the video player screen
      handleClose();
    } catch (error) {
      console.error('Error opening YouTube:', error);
      Alert.alert(t('videoPlayer.error'), t('videoPlayer.unableToOpenYouTube'));
    }
  }, [message.VideoUrl, handleClose, t]);

  const handleReady = useCallback(() => {
    console.log('Video player ready');
  }, []);

  const handleStateChange = useCallback((state: string) => {
    console.log('Video state changed:', state);
    
    // You could add analytics tracking here
    // Example: logVideoEvent(message.MessageId, state);
  }, [message.MessageId]);

  if (!message.VideoUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('videoPlayer.noVideoAvailable')}</Text>
          <Text style={styles.errorSubtext}>{t('videoPlayer.noVideoMessage')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const videoTitle = `${message.Title}${seriesTitle ? ` - ${seriesTitle}` : ''}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.youtubeButton} onPress={handleOpenInYouTube}>
          <Text style={styles.youtubeButtonText}>{t('videoPlayer.openInYouTube')}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.playerWrapper}>
        <VideoPlayer
          videoUrl={message.VideoUrl}
          title={videoTitle}
          onError={handleError}
          onReady={handleReady}
          onStateChange={handleStateChange}
          style={styles.player}
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.messageTitle} numberOfLines={2}>
          {message.Title}
        </Text>
        {seriesTitle && (
          <Text style={styles.seriesTitle} numberOfLines={1}>
            {seriesTitle}
          </Text>
        )}
        <Text style={styles.speaker} numberOfLines={1}>
          {message.Speaker}
        </Text>
        <Text style={styles.date}>
          {new Date(message.Date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    borderRadius: 22,
  },
  closeButtonText: {
    ...theme.typography.h3,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    fontSize: 18,
  },
  youtubeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary, // ← ONLY COLOR CHANGED
    borderRadius: 8,
  },
  youtubeButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse, // ← ONLY COLOR CHANGED
    fontSize: 14,
  },
  playerWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  player: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  messageTitle: {
    ...theme.typography.h2,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginBottom: 4,
  },
  seriesTitle: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginBottom: 8,
  },
  speaker: {
    ...theme.typography.body,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    marginBottom: 4,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary, // ← ONLY COLOR CHANGED
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    ...theme.typography.h2,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
    textAlign: 'center',
  },
});

export default VideoPlayerScreen;
