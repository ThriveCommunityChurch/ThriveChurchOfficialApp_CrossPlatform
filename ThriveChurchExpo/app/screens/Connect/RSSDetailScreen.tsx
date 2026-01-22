/**
 * RSSDetailScreen
 * Displays RSS announcement content in WebView
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import type { Theme } from '../../theme/types';
import { setCurrentScreen, logCustomEvent } from '../../services/analytics/analyticsService';

type ConnectStackParamList = {
  RSSAnnouncements: undefined;
  RSSDetail: { title: string; content: string; date: string };
};

type RSSDetailRouteProp = RouteProp<ConnectStackParamList, 'RSSDetail'>;

export const RSSDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const route = useRoute<RSSDetailRouteProp>();
  const { content, title } = route.params;
  const [loading, setLoading] = React.useState(true);

  // Track screen view
  useEffect(() => {
    setCurrentScreen('RSSDetailScreen', 'AnnouncementDetail');
    logCustomEvent('view_announcement', {
      announcement_title: title,
      content_type: 'announcement',
    });
  }, [title]);

  const handleShouldStartLoadWithRequest = (request: any): boolean => {
    const { url, navigationType } = request;

    // Allow initial load
    if (navigationType === 'other') {
      return true;
    }

    // Handle link clicks - open in external browser
    if (navigationType === 'click') {
      const supportedSchemes = ['http', 'https'];
      const urlScheme = url.split(':')[0];

      if (supportedSchemes.includes(urlScheme)) {
        Linking.canOpenURL(url)
          .then((supported) => {
            if (supported) {
              Linking.openURL(url);
            } else {
              Alert.alert(t('rssDetail.error'), t('rssDetail.unableToOpenLink'));
            }
          })
          .catch((err) => {
            console.error('Error opening URL:', err);
            Alert.alert(t('rssDetail.error'), t('rssDetail.unableToOpenLink'));
          });
      }

      return false; // Prevent WebView from navigating
    }

    return true;
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: content }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      />
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface, // ← ONLY COLOR CHANGED (white background for content)
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.surface, // ← ONLY COLOR CHANGED
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface, // ← ONLY COLOR CHANGED
  },
});

