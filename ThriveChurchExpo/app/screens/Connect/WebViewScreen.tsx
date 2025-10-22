/**
 * WebViewScreen
 * Generic WebView screen for displaying forms (Serve, Small Group, Prayer Requests)
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme/colors';

type ConnectStackParamList = {
  ConnectHome: undefined;
  WebViewForm: { url: string; title: string };
};

type WebViewRouteProp = RouteProp<ConnectStackParamList, 'WebViewForm'>;

export const WebViewScreen: React.FC = () => {
  const route = useRoute<WebViewRouteProp>();
  const { url } = route.params;
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const handleShouldStartLoadWithRequest = (request: any): boolean => {
    const { url: requestUrl, navigationType } = request;

    // Allow initial load and form submissions
    if (navigationType === 'other' || navigationType === 'formsubmit') {
      return true;
    }

    // Handle link clicks
    if (navigationType === 'click') {
      const supportedSchemes = ['http', 'https'];
      const urlScheme = requestUrl.split(':')[0];

      // Check if it's an external link (different domain)
      const currentDomain = new URL(url).hostname;
      const requestDomain = new URL(requestUrl).hostname;

      // If same domain, allow navigation within WebView
      if (currentDomain === requestDomain) {
        return true;
      }

      // External link - open in browser
      if (supportedSchemes.includes(urlScheme)) {
        Linking.canOpenURL(requestUrl)
          .then((supported) => {
            if (supported) {
              Linking.openURL(requestUrl);
            } else {
              Alert.alert('Error', 'Unable to open link');
            }
          })
          .catch((err) => {
            console.error('Error opening URL:', err);
            Alert.alert('Error', 'Unable to open link');
          });
      }

      return false; // Prevent WebView from navigating to external links
    }

    return true;
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
    Alert.alert(
      'Error Loading Page',
      'Unable to load the page. Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onError={handleError}
        onHttpError={handleError}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
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

