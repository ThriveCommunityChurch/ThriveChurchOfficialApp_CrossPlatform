import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import TrackPlayer, { State } from 'react-native-track-player';
import BiblePassageReader from '../../components/BiblePassageReader';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { SermonMessage } from '../../types/api';
import { setCurrentScreen, logViewBible, logPlayBibleAudio } from '../../services/analytics/analyticsService';
import { esvApiService } from '../../services/bible/esvApiService';
import { setupPlayer } from '../../services/audio/trackPlayerService';

// ESV Bible reference image for control center and Now Playing screen
const ESV_REFERENCE_IMAGE = Image.resolveAssetSource(require('../../../assets/ESV_Reference.png'));

type BiblePassageScreenParams = {
  BiblePassageScreen: {
    message: SermonMessage;
    seriesTitle?: string;
  };
};

type BiblePassageScreenRouteProp = RouteProp<BiblePassageScreenParams, 'BiblePassageScreen'>;
type BiblePassageScreenNavigationProp = StackNavigationProp<BiblePassageScreenParams, 'BiblePassageScreen'>;

const BiblePassageScreen: React.FC = () => {
  const navigation = useNavigation<BiblePassageScreenNavigationProp>();
  const route = useRoute<BiblePassageScreenRouteProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const { message, seriesTitle } = route.params;
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Track screen view with passage info
  useEffect(() => {
    setCurrentScreen('BiblePassageScreen', 'BiblePassage');
    if (message.PassageRef) {
      logViewBible(message.PassageRef);
    }
  }, [message.PassageRef]);

  // Check if audio is playing
  useEffect(() => {
    const checkPlaybackState = async () => {
      try {
        const playbackState = await TrackPlayer.getPlaybackState();
        const playing = playbackState.state === State.Playing;
        setIsPlaying(playing);

        // Clear loading state when playback actually starts
        if (playing) {
          setIsLoadingAudio(false);
        }
      } catch (error) {
        // Player not initialized yet
        setIsPlaying(false);
      }
    };

    checkPlaybackState();
    const interval = setInterval(checkPlaybackState, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePlayAudio = useCallback(async () => {
    if (!message.PassageRef) {
      Alert.alert(t('biblePassage.error'), t('biblePassage.noPassageReference'));
      return;
    }

    try {
      setIsLoadingAudio(true);

      // Check if ESV API is configured
      const apiStatus = esvApiService.getApiStatus();
      if (!apiStatus.isConfigured) {
        Alert.alert(
          t('biblePassage.esvApiNotConfigured'),
          t('biblePassage.esvApiMessage'),
          [{ text: t('biblePassage.ok') }]
        );
        return;
      }

      // Track Bible audio play event
      await logPlayBibleAudio(message.PassageRef);

      // Get audio URL
      const audioUrl = esvApiService.getAudioUrl(message.PassageRef);
      const authHeaders = esvApiService.getAuthHeaders();

      // Setup player
      await setupPlayer();

      // Stop any current playback
      await TrackPlayer.reset();

      // Add track with authorization headers and ESV reference image
      await TrackPlayer.add({
        id: `bible-${message.PassageRef}`,
        url: audioUrl,
        title: message.PassageRef,
        artist: 'ESV Bible',
        artwork: ESV_REFERENCE_IMAGE.uri,
        headers: authHeaders,
      });

      // Play audio
      await TrackPlayer.play();
      // Note: isPlaying state will be updated by the polling effect
      // isLoadingAudio will be cleared by polling effect when playback starts

    } catch (error) {
      console.error('Error playing Bible audio:', error);
      setIsLoadingAudio(false); // Clear loading state on error
      Alert.alert(
        t('biblePassage.audioPlaybackError'),
        t('biblePassage.unableToPlayAudio'),
        [{ text: t('biblePassage.ok') }]
      );
    }
  }, [message, t]);

  const handleStopAudio = useCallback(async () => {
    try {
      // Reset loading state in case user stops while loading
      setIsLoadingAudio(false);
      await TrackPlayer.pause();
      setIsPlaying(false);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }, []);

  if (!message.PassageRef) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('biblePassage.noPassageAvailable')}</Text>
          <Text style={styles.errorSubtext}>{t('biblePassage.noPassageMessage')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Text style={styles.messageTitle} numberOfLines={1}>
              {message.Title}
            </Text>
            {seriesTitle && (
              <Text style={styles.seriesTitle} numberOfLines={1}>
                {seriesTitle}
              </Text>
            )}
          </View>
          <View style={styles.headerButtons}>
            {/* Audio Play/Pause Button */}
            {message.PassageRef && (
              <TouchableOpacity
              style={styles.audioButton}
              onPress={(isPlaying || isLoadingAudio) ? handleStopAudio : handlePlayAudio}
              disabled={false}
            >
              <Ionicons
                name={(isPlaying || isLoadingAudio) ? "stop" : "play"}
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>)}

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <BiblePassageReader
        reference={message.PassageRef}
        style={styles.reader}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
  },
  header: {
    backgroundColor: theme.colors.background, // ← ONLY COLOR CHANGED
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border, // ← ONLY COLOR CHANGED
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
    marginRight: 16,
  },
  messageTitle: {
    ...theme.typography.h3,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    marginBottom: 2,
  },
  seriesTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary, // ← ONLY COLOR CHANGED
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  audioButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 18,
  },
  audioButtonPlaying: {
    backgroundColor: theme.colors.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card, // ← ONLY COLOR CHANGED
    borderRadius: 18,
  },
  closeButtonText: {
    ...theme.typography.body,
    color: theme.colors.text, // ← ONLY COLOR CHANGED
    fontSize: 16,
  },
  reader: {
    flex: 1,
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

export default BiblePassageScreen;
