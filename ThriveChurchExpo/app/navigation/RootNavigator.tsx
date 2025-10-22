import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import OfflineBanner from '../components/OfflineBanner';
import { linking } from './linking';
import { logAppOpen, logAppInBackground } from '../services/analytics/analyticsService';
import { initializePushNotifications, clearAllNotifications } from '../services/notifications/pushNotificationService';
import { logAppConfig } from '../config/app.config';
import { logFirebaseConfigStatus } from '../config/firebase.config';
import { logInfo, logWarning, logError } from '../services/logging/logger';
import ListenScreen from '../screens/Listen/ListenScreen';
import SeriesDetailScreen from '../screens/Listen/SeriesDetailScreen';
import { SermonDetailScreen } from '../screens/Listen/SermonDetailScreen';
import NowPlayingScreen from '../screens/Listen/NowPlayingScreen';
import RecentlyPlayedScreen from '../screens/Listen/RecentlyPlayedScreen';
import DownloadsScreen from '../screens/Listen/DownloadsScreen';
import VideoPlayerScreen from '../screens/Listen/VideoPlayerScreen';
import BiblePassageScreen from '../screens/Listen/BiblePassageScreen';
import { BibleSelectionScreen } from '../screens/Bible/BibleSelectionScreen';
import { BookListScreen } from '../screens/Bible/BookListScreen';
import { NotesListScreen, NoteDetailScreen } from '../screens/Notes';
import { ConnectScreen, RSSScreen, RSSDetailScreen, WebViewScreen } from '../screens/Connect';
import { MoreScreen } from '../screens/More';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import { isOnboardingCompleted } from '../services/storage/storage';

const Tab = createBottomTabNavigator();
const ListenStack = createNativeStackNavigator();
const BibleStack = createNativeStackNavigator();
const NotesStack = createNativeStackNavigator();
const ConnectStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

const Placeholder = ({ title }: { title: string }) => (
  <View style={{ flex: 1, backgroundColor: colors.almostBlack, alignItems: 'center', justifyContent: 'center' }}>
    <OfflineBanner />
    <Text style={[typography.h1]}>{title}</Text>
  </View>
);

function ListenStackNavigator() {
  return (
    <ListenStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.almostBlack },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: typography.families.heading },
      }}
    >
      <ListenStack.Screen
        name="ListenHome"
        options={({ navigation }) => ({
          title: 'Listen',
          headerRight: () => (
            <View style={{ flexDirection: 'row', marginRight: 8 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('NowPlaying')}
                style={{ marginRight: 16 }}
                accessibilityLabel="Now Playing"
                accessibilityRole="button"
              >
                <Ionicons name="play-circle" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('RecentlyPlayed')}
                style={{ marginRight: 16 }}
                accessibilityLabel="Recently Played"
                accessibilityRole="button"
              >
                <Ionicons name="time-outline" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Downloads')}
                accessibilityLabel="Downloads"
                accessibilityRole="button"
              >
                <Ionicons name="download-outline" size={24} color={colors.white} />
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
        name="SeriesDetail"
        options={({ route }: any) => ({
          title: route.params?.seriesTitle || 'Series',
          headerBackTitle: 'Listen'
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
          title: 'Sermon',
          headerBackTitle: 'Series',
          headerTitleAlign: 'center',
        }}
      />
      <ListenStack.Screen
        name="NowPlaying"
        component={NowPlayingScreen}
        options={{
          title: 'Now Playing',
          headerBackTitle: 'Listen',
          headerTitleAlign: 'center',
        }}
      />
      <ListenStack.Screen
        name="RecentlyPlayed"
        component={RecentlyPlayedScreen}
        options={{
          title: 'Recently Played',
          headerBackTitle: 'Listen',
          headerTitleAlign: 'center',
        }}
      />
      <ListenStack.Screen
        name="Downloads"
        component={DownloadsScreen}
        options={{
          title: 'Downloads',
          headerBackTitle: 'Listen',
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

function BibleStackNavigator() {
  return (
    <BibleStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.almostBlack },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: typography.families.heading },
      }}
    >
      <BibleStack.Screen
        name="BibleSelection"
        component={BibleSelectionScreen}
        options={{
          title: 'Bible',
        }}
      />
      <BibleStack.Screen
        name="BookList"
        component={BookListScreen}
        options={({ route }: any) => ({
          title: route.params?.title || 'Bible',
          headerBackTitle: 'Bible',
        })}
      />
    </BibleStack.Navigator>
  );
}

function NotesStackNavigator() {
  return (
    <NotesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.almostBlack },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: typography.families.heading },
      }}
    >
      <NotesStack.Screen
        name="NotesList"
        component={NotesListScreen}
        options={{
          title: 'Notes',
        }}
      />
      <NotesStack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{
          title: 'Notes',
          headerBackTitle: 'Notes',
        }}
      />
    </NotesStack.Navigator>
  );
}

function ConnectStackNavigator() {
  return (
    <ConnectStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.almostBlack },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: typography.families.heading },
      }}
    >
      <ConnectStack.Screen
        name="ConnectHome"
        component={ConnectScreen}
        options={{
          title: 'Connect',
        }}
      />
      <ConnectStack.Screen
        name="RSSAnnouncements"
        component={RSSScreen}
        options={{
          title: 'Announcements',
          headerBackTitle: 'Connect',
        }}
      />
      <ConnectStack.Screen
        name="RSSDetail"
        component={RSSDetailScreen}
        options={({ route }: any) => ({
          title: route.params?.date || 'Announcement',
          headerBackTitle: 'Announcements',
        })}
      />
      <ConnectStack.Screen
        name="WebViewForm"
        component={WebViewScreen}
        options={({ route }: any) => ({
          title: route.params?.title || 'Form',
          headerBackTitle: 'Connect',
        })}
      />
    </ConnectStack.Navigator>
  );
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.almostBlack },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: typography.families.heading },
      }}
    >
      <MoreStack.Screen
        name="MoreHome"
        component={MoreScreen}
        options={{
          title: 'More',
        }}
      />
      <MoreStack.Screen
        name="WebView"
        component={WebViewScreen}
        options={({ route }: any) => ({
          title: route.params?.title || 'Page',
          headerBackTitle: 'More',
        })}
      />
    </MoreStack.Navigator>
  );
}

export function RootNavigator() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const navigationRef = useRef<any>(null);
  const appState = useRef(AppState.currentState);

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
      <View style={{ flex: 1, backgroundColor: colors.almostBlack, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.h2, { color: colors.white }]}>Loading...</Text>
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
      theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.almostBlack,
          card: colors.bgDarkBlue,
          text: colors.white,
          primary: colors.mainBlue,
          border: colors.darkGrey,
          notification: colors.mainBlue,
        },
      }}
    >
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.almostBlack },
          headerTintColor: colors.white,
          tabBarStyle: { backgroundColor: colors.bgDarkBlue, borderTopColor: colors.darkGrey },
          tabBarActiveTintColor: colors.white,
          tabBarInactiveTintColor: colors.lessLightLightGray,
          tabBarLabelStyle: { fontFamily: typography.families.body, fontSize: 12 },
        }}
      >
        <Tab.Screen
          name="Listen"
          component={ListenStackNavigator}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="headset" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Bible"
          component={BibleStackNavigator}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Notes"
          component={NotesStackNavigator}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="create" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Connect"
          component={ConnectStackNavigator}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreStackNavigator}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ellipsis-horizontal" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

