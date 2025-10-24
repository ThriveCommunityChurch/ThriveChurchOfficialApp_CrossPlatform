import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import BiblePassageReader from '../../components/BiblePassageReader';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../theme/types';
import { SermonMessage } from '../../types/api';
import { setCurrentScreen, logViewBible } from '../../services/analytics/analyticsService';

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
  const styles = createStyles(theme);

  const { message, seriesTitle } = route.params;

  // Track screen view with passage info
  useEffect(() => {
    setCurrentScreen('BiblePassageScreen', 'BiblePassage');
    if (message.PassageRef) {
      logViewBible(message.PassageRef);
    }
  }, [message.PassageRef]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
          <Text style={styles.errorText}>No Bible passage available</Text>
          <Text style={styles.errorSubtext}>This sermon doesn't have a Bible passage reference</Text>
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
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
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
