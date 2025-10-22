/**
 * RSSDetailScreen
 * Displays RSS announcement content in WebView
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme/colors';

type ConnectStackParamList = {
  RSSAnnouncements: undefined;
  RSSDetail: { title: string; content: string; date: string };
};

type RSSDetailRouteProp = RouteProp<ConnectStackParamList, 'RSSDetail'>;

export const RSSDetailScreen: React.FC = () => {
  const route = useRoute<RSSDetailRouteProp>();
  const { content } = route.params;
  const [loading, setLoading] = React.useState(true);

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
              Alert.alert('Error', 'Unable to open link');
            }
          })
          .catch((err) => {
            console.error('Error opening URL:', err);
            Alert.alert('Error', 'Unable to open link');
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
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
});

