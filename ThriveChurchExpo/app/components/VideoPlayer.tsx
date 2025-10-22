import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  onError?: (error: string) => void;
  onReady?: () => void;
  onStateChange?: (state: string) => void;
  style?: any;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 */
const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  // Handle youtu.be format
  const youtuBeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch) {
    return youtuBeMatch[1];
  }

  // Handle youtube.com/watch format
  const youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return youtubeMatch[1];
  }

  // Handle direct video ID (fallback)
  const directIdMatch = url.match(/^[a-zA-Z0-9_-]{11}$/);
  if (directIdMatch) {
    return url;
  }

  return null;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  onError,
  onReady,
  onStateChange,
  style,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<YoutubeIframeRef>(null);

  const videoId = extractYouTubeVideoId(videoUrl);

  const { width } = Dimensions.get('window');
  const playerHeight = (width * 9) / 16; // 16:9 aspect ratio

  const handleReady = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onReady?.();
  }, [onReady]);

  const handleError = useCallback((error: string) => {
    console.error('YouTube Player Error:', error);
    setIsLoading(false);
    setHasError(true);
    
    let errorMessage = 'Failed to load video';
    switch (error) {
      case 'video_not_found':
        errorMessage = 'Video not found or has been removed';
        break;
      case 'embed_not_allowed':
        errorMessage = 'Video cannot be played in embedded players';
        break;
      case 'invalid_parameter':
        errorMessage = 'Invalid video URL';
        break;
      case 'HTML5_error':
        errorMessage = 'Video playback error occurred';
        break;
    }
    
    onError?.(errorMessage);
  }, [onError]);

  const handleStateChange = useCallback((state: string) => {
    setIsPlaying(state === 'playing');
    onStateChange?.(state);
  }, [onStateChange]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    // Force re-render by updating a key or reloading
  }, []);

  const openInYouTube = useCallback(() => {
    if (!videoId) return;
    
    Alert.alert(
      'Open in YouTube',
      'Would you like to open this video in the YouTube app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => {
            // This will be handled by the parent component
            // as it needs access to Linking API
          },
        },
      ]
    );
  }, [videoId]);

  if (!videoId) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>Invalid video URL</Text>
        <Text style={styles.errorSubtext}>Unable to extract video ID from: {videoUrl}</Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>Video Unavailable</Text>
        <Text style={styles.errorSubtext}>
          This video cannot be played at the moment
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
      )}
      
      <View style={styles.playerContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}
        
        <YoutubePlayer
          ref={playerRef}
          height={playerHeight}
          videoId={videoId}
          onReady={handleReady}
          onError={handleError}
          onChangeState={handleStateChange}
          webViewStyle={styles.webView}
          initialPlayerParams={{
            controls: true,
            rel: false,
            preventFullScreen: false,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.almostBlack,
  },
  titleContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    ...typography.h3,
    color: colors.white,
    textAlign: 'center',
  },
  playerContainer: {
    position: 'relative',
    backgroundColor: colors.black,
  },
  webView: {
    backgroundColor: colors.black,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.almostBlack,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGrey,
    marginTop: 12,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 200,
  },
  errorText: {
    ...typography.h3,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    ...typography.body,
    color: colors.lightGrey,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
  },
});

export default VideoPlayer;
