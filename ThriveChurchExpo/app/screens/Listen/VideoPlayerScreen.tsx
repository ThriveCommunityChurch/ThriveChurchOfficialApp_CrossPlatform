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
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { SermonMessage } from '../../types/api';

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
  
  const { message, seriesTitle } = route.params;

  useEffect(() => {
    // Hide status bar for immersive video experience
    StatusBar.setHidden(true);
    
    return () => {
      // Restore status bar when leaving
      StatusBar.setHidden(false);
    };
  }, []);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleError = useCallback((error: string) => {
    Alert.alert(
      'Video Error',
      error,
      [
        { text: 'Close', onPress: handleClose },
        { text: 'Open in YouTube', onPress: handleOpenInYouTube },
      ]
    );
  }, [handleClose]);

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
      Alert.alert('Error', 'Unable to open YouTube');
    }
  }, [message.VideoUrl, handleClose]);

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
          <Text style={styles.errorText}>No video available</Text>
          <Text style={styles.errorSubtext}>This sermon doesn't have a video</Text>
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
          <Text style={styles.youtubeButtonText}>Open in YouTube</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.almostBlack,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.almostBlack,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.darkGrey,
    borderRadius: 22,
  },
  closeButtonText: {
    ...typography.h3,
    color: colors.white,
    fontSize: 18,
  },
  youtubeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  youtubeButtonText: {
    ...typography.button,
    color: colors.white,
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
    backgroundColor: colors.almostBlack,
  },
  messageTitle: {
    ...typography.h2,
    color: colors.white,
    marginBottom: 4,
  },
  seriesTitle: {
    ...typography.h3,
    color: colors.lightGrey,
    marginBottom: 8,
  },
  speaker: {
    ...typography.body,
    color: colors.lightGrey,
    marginBottom: 4,
  },
  date: {
    ...typography.caption,
    color: colors.mediumGrey,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    ...typography.body,
    color: colors.lightGrey,
    textAlign: 'center',
  },
});

export default VideoPlayerScreen;
