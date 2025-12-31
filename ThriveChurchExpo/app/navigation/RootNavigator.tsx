import React, { useEffect, useState, useRef, useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme as NavigationTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, AppState, AppStateStatus, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import type { Theme } from '../theme/types';
import OfflineBanner from '../components/OfflineBanner';
import { linking } from './linking';

// Platform-specific font families for navigation headers
const ios = Platform.OS === 'ios';
const HEADER_FONT_FAMILY = ios ? 'Avenir-Heavy' : 'Lato-Bold';
const TAB_LABEL_FONT_FAMILY = ios ? 'Avenir-Book' : 'Lato-Regular';
import { logAppOpen, logAppInBackground } from '../services/analytics/analyticsService';
import { initializePushNotifications, clearAllNotifications } from '../services/notifications/pushNotificationService';
import { logAppConfig } from '../config/app.config';
import { logFirebaseConfigStatus } from '../config/firebase.config';
import { logInfo, logWarning, logError } from '../services/logging/logger';
import ListenScreen from '../screens/Listen/ListenScreen';
import SeriesDetailScreen from '../screens/Listen/SeriesDetailScreen';
import { SermonDetailScreen } from '../screens/Listen/SermonDetailScreen';
import { SearchScreen } from '../screens/Listen/SearchScreen';
import NowPlayingScreen from '../screens/Listen/NowPlayingScreen';
import RecentlyPlayedScreen from '../screens/Listen/RecentlyPlayedScreen';
import DownloadsScreen from '../screens/Listen/DownloadsScreen';
import VideoPlayerScreen from '../screens/Listen/VideoPlayerScreen';
import BiblePassageScreen from '../screens/Listen/BiblePassageScreen';
import { BibleSelectionScreen } from '../screens/Bible/BibleSelectionScreen';
import { BookListScreen } from '../screens/Bible/BookListScreen';
import { NotesListScreen, NoteDetailScreen } from '../screens/Notes';
import { ConnectScreen, RSSScreen, RSSDetailScreen, WebViewScreen, SmallGroupScreen, ServeScreen, ContactScreen, SocialScreen, ImNewScreen, EventsScreen, EventDetailScreen } from '../screens/Connect';
import { MoreScreen, AboutScreen } from '../screens/More';
import { SettingsScreen } from '../screens/Settings';
import DownloadSettingsScreen from '../screens/Settings/DownloadSettingsScreen';
import PlaybackSettingsScreen from '../screens/Settings/PlaybackSettingsScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import { isOnboardingCompleted } from '../services/storage/storage';
import { startNetworkMonitoring, stopNetworkMonitoring } from '../services/downloads/networkMonitor';
import { startQueueProcessor, stopQueueProcessor } from '../services/downloads/queueProcessor';

const Tab = createBottomTabNavigator();
const ListenStack = createNativeStackNavigator();
const BibleStack = createNativeStackNavigator();
const NotesStack = createNativeStackNavigator();
const ConnectStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

/**
 * Convert our theme to React Navigation theme format
 */
const createNavigationTheme = (theme: Theme): NavigationTheme => {
  return {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface, // Use surface for headers/tab bars (white in light mode)
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
    fonts: Platform.select({
      ios: {
        regular: {
          fontFamily: 'Avenir-Book',
          fontWeight: '400',
        },
        medium: {
          fontFamily: 'Avenir-Medium',
          fontWeight: '500',
        },
        bold: {
          fontFamily: 'Avenir-Heavy',
          fontWeight: '600',
        },
        heavy: {
          fontFamily: 'Avenir-Heavy',
          fontWeight: '700',
        },
      },
      default: {
        regular: {
          fontFamily: 'Lato-Regular',
          fontWeight: 'normal',
        },
        medium: {
          fontFamily: 'Lato-Semibold',
          fontWeight: 'normal',
        },
        bold: {
          fontFamily: 'Lato-Bold',
          fontWeight: '600',
        },
        heavy: {
          fontFamily: 'Lato-Bold',
          fontWeight: '700',
        },
      },
    }),
  };
};

function ListenStackNavigator({ theme }: { theme: Theme }) {
  const { t } = useTranslation();

  return (
    <ListenStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: HEADER_FONT_FAMILY },
      }}
    >
      <ListenStack.Screen
        name="ListenHome"
        options={({ navigation }) => ({
          title: t('navigation.listen'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Search')}
              style={{ marginLeft: 16 }}
              accessibilityLabel={t('listen.search.title')}
              accessibilityRole="button"
            >
              <Ionicons name="search" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', marginRight: 8 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('NowPlaying')}
                style={{ marginRight: 16 }}
                accessibilityLabel={t('navigation.nowPlaying')}
                accessibilityRole="button"
              >
                <Ionicons name="play-circle" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('RecentlyPlayed')}
                style={{ marginRight: 16 }}
                accessibilityLabel={t('navigation.recentlyPlayed')}
                accessibilityRole="button"
              >
                <Ionicons name="time-outline" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Downloads')}
                accessibilityLabel={t('listen.downloads.title')}
                accessibilityRole="button"
              >
                <Ionicons name="download-outline" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          ),
        })}
      >
        {({ navigation }) => (
          <ListenScreen
            onSeriesPress={(seriesId: string, artUrl: string) => {
              navigation.navigate('SeriesDetail', {
                seriesId,
                seriesArtUrl: artUrl
              });
            }}
          />
        )}
      </ListenStack.Screen>
      <ListenStack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: t('listen.search.title'),
          headerBackTitle: t('navigation.listen'),
          headerTitleAlign: 'center',
        }}
      />
      <ListenStack.Screen
        name="SeriesDetail"
        options={({ route }: any) => ({
          title: route.params?.seriesTitle || t('navigation.series'),
          headerBackTitle: t('navigation.listen')
        })}
      >
        {({ route }: any) => (
          <SeriesDetailScreen
            seriesId={route.params.seriesId}
            seriesArtUrl={route.params.seriesArtUrl}
          />
        )}
      </ListenStack.Screen>
      <ListenStack.Screen
        name="SermonDetail"
        component={SermonDetailScreen}
        options={{
          title: t('navigation.sermon'),
          headerBackTitle: t('navigation.series'),
          headerTitleAlign: 'center',
        }}
      />
      <ListenStack.Screen
        name="NowPlaying"
        component={NowPlayingScreen}
        options={{
          title: t('navigation.nowPlaying'),
          headerBackTitle: t('navigation.listen'),
          headerTitleAlign: 'center',
        }}
      />
      <ListenStack.Screen
        name="RecentlyPlayed"
        component={RecentlyPlayedScreen}
        options={{
          title: t('navigation.recentlyPlayed'),
          headerBackTitle: t('navigation.listen'),
          headerTitleAlign: 'center',
        }}
      />
      <ListenStack.Screen
        name="Downloads"
        component={DownloadsScreen}
        options={{
          title: t('listen.downloads.title'),
          headerBackTitle: t('navigation.listen'),
          headerTitleAlign: 'center',
        }}
      />
      <ListenStack.Screen
        name="VideoPlayerScreen"
        component={VideoPlayerScreen}
        options={{
          headerShown: false, // Hide header for immersive video experience
        }}
      />
      <ListenStack.Screen
        name="BiblePassageScreen"
        component={BiblePassageScreen}
        options={{
          headerShown: false, // Hide header for immersive reading experience
        }}
      />
    </ListenStack.Navigator>
  );
}

function BibleStackNavigator({ theme }: { theme: Theme }) {
  const { t } = useTranslation();

  return (
    <BibleStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: HEADER_FONT_FAMILY },
      }}
    >
      <BibleStack.Screen
        name="BibleSelection"
        component={BibleSelectionScreen}
        options={{
          title: t('navigation.bible'),
        }}
      />
      <BibleStack.Screen
        name="BookList"
        component={BookListScreen}
        options={({ route }: any) => ({
          title: route.params?.title || t('navigation.bible'),
          headerBackTitle: t('navigation.bible'),
        })}
      />
    </BibleStack.Navigator>
  );
}

function NotesStackNavigator({ theme }: { theme: Theme }) {
  const { t } = useTranslation();

  return (
    <NotesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: HEADER_FONT_FAMILY },
      }}
    >
      <NotesStack.Screen
        name="NotesList"
        component={NotesListScreen}
        options={{
          title: t('navigation.notes'),
        }}
      />
      <NotesStack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{
          title: t('navigation.notes'),
          headerBackTitle: t('navigation.notes'),
        }}
      />
    </NotesStack.Navigator>
  );
}

function ConnectStackNavigator({ theme }: { theme: Theme }) {
  const { t } = useTranslation();

  return (
    <ConnectStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: HEADER_FONT_FAMILY },
      }}
    >
      <ConnectStack.Screen
        name="ConnectHome"
        component={ConnectScreen}
        options={{
          title: t('navigation.connect'),
        }}
      />
      <ConnectStack.Screen
        name="RSSAnnouncements"
        component={RSSScreen}
        options={{
          title: t('connect.announcements.title'),
          headerBackTitle: t('navigation.connect'),
        }}
      />
      <ConnectStack.Screen
        name="RSSDetail"
        component={RSSDetailScreen}
        options={({ route }: any) => ({
          title: route.params?.date || t('connect.announcements.announcement'),
          headerBackTitle: t('connect.announcements.title'),
        })}
      />
      <ConnectStack.Screen
        name="WebViewForm"
        component={WebViewScreen}
        options={({ route }: any) => ({
          title: route.params?.title || t('navigation.form'),
          headerBackTitle: t('navigation.connect'),
        })}
      />
      <ConnectStack.Screen
        name="SmallGroup"
        component={SmallGroupScreen}
        options={{
          title: t('connect.menu.smallGroupTitle'),
          headerBackTitle: t('navigation.connect'),
        }}
      />
      <ConnectStack.Screen
        name="Serve"
        component={ServeScreen}
        options={{
          title: t('connect.menu.serveTitle'),
          headerBackTitle: t('navigation.connect'),
        }}
      />
      <ConnectStack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: t('connect.menu.contactTitle'),
          headerBackTitle: t('navigation.connect'),
        }}
      />
      <ConnectStack.Screen
        name="Social"
        component={SocialScreen}
        options={{
          title: t('connect.menu.socialTitle'),
          headerBackTitle: t('navigation.connect'),
        }}
      />
      <ConnectStack.Screen
        name="ImNew"
        component={ImNewScreen}
        options={{
          title: t('connect.menu.imNewTitle'),
          headerBackTitle: t('navigation.connect'),
        }}
      />
      <ConnectStack.Screen
        name="Events"
        component={EventsScreen}
        options={{
          title: t('events.title'),
          headerBackTitle: t('navigation.connect'),
        }}
      />
      <ConnectStack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={({ route }: any) => ({
          title: route.params?.eventTitle || t('events.detail.title'),
          headerBackTitle: t('events.title'),
        })}
      />
    </ConnectStack.Navigator>
  );
}

function MoreStackNavigator({ theme }: { theme: Theme }) {
  const { t } = useTranslation();

  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: HEADER_FONT_FAMILY },
      }}
    >
      <MoreStack.Screen
        name="MoreHome"
        component={MoreScreen}
        options={{
          title: t('navigation.more'),
        }}
      />
      <MoreStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('navigation.settings'),
          headerBackTitle: t('navigation.more'),
        }}
      />
      <MoreStack.Screen
        name="DownloadSettings"
        component={DownloadSettingsScreen}
        options={{
          title: t('navigation.downloadSettings'),
          headerBackTitle: t('navigation.settings'),
        }}
      />
      <MoreStack.Screen
        name="PlaybackSettings"
        component={PlaybackSettingsScreen}
        options={{
          title: t('navigation.playbackSettings'),
          headerBackTitle: t('navigation.settings'),
        }}
      />
      <MoreStack.Screen
        name="WebView"
        component={WebViewScreen}
        options={({ route }: any) => ({
          title: route.params?.title || t('navigation.page'),
          headerBackTitle: t('navigation.more'),
        })}
      />
      <MoreStack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: t('navigation.about'),
          headerBackTitle: t('navigation.more'),
        }}
      />
    </MoreStack.Navigator>
  );
}

export function RootNavigator() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const navigationRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  // Create navigation theme from our theme
  const navigationTheme = useMemo(() => createNavigationTheme(theme), [theme]);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await isOnboardingCompleted();
        setShowOnboarding(!completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        await logWarning(`Failed to check onboarding status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setShowOnboarding(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, []);

  // Initialize network monitoring and queue processor
  useEffect(() => {
    startNetworkMonitoring();
    startQueueProcessor();

    return () => {
      stopQueueProcessor();
      stopNetworkMonitoring();
    };
  }, []);

  // Initialize analytics and push notifications
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Log app startup
        await logInfo('App started successfully');

        // Log configuration status
        logAppConfig();
        logFirebaseConfigStatus();

        // Log app open
        await logAppOpen();

        // Initialize push notifications
        await initializePushNotifications((remoteMessage) => {
          // Handle notification opened
          console.log('Notification opened:', remoteMessage);
          // TODO: Navigate based on notification data
        });

        // Clear badge on app open
        await clearAllNotifications();
      } catch (error) {
        console.error('Error initializing services:', error);
        await logError(`Failed to initialize app services: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initializeServices();
  }, []);

  // Handle app state changes for analytics
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active/) && nextAppState === 'background') {
        // App went to background
        logAppInBackground();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        clearAllNotifications();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (isCheckingOnboarding) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[theme.typography.h2 as any, { color: theme.colors.text }]}>Loading...</Text>
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      theme={navigationTheme}
    >
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarLabelStyle: { fontFamily: TAB_LABEL_FONT_FAMILY, fontSize: 12 },
        }}
      >
        <Tab.Screen
          name="Listen"
          options={{
            headerShown: false,
            tabBarLabel: t('navigation.listen'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="headset" size={size} color={color} />
            ),
          }}
        >
          {() => <ListenStackNavigator theme={theme} />}
        </Tab.Screen>
        <Tab.Screen
          name="Bible"
          options={{
            headerShown: false,
            tabBarLabel: t('navigation.bible'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book" size={size} color={color} />
            ),
          }}
        >
          {() => <BibleStackNavigator theme={theme} />}
        </Tab.Screen>
        <Tab.Screen
          name="Notes"
          options={{
            headerShown: false,
            tabBarLabel: t('navigation.notes'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="create" size={size} color={color} />
            ),
          }}
        >
          {() => <NotesStackNavigator theme={theme} />}
        </Tab.Screen>
        <Tab.Screen
          name="Connect"
          options={{
            headerShown: false,
            tabBarLabel: t('navigation.connect'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        >
          {() => <ConnectStackNavigator theme={theme} />}
        </Tab.Screen>
        <Tab.Screen
          name="More"
          options={{
            headerShown: false,
            tabBarLabel: t('navigation.more'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ellipsis-horizontal" size={size} color={color} />
            ),
          }}
        >
          {() => <MoreStackNavigator theme={theme} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

