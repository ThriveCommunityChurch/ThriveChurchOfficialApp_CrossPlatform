import 'react-native-gesture-handler'; // Must be first import
import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';

import App from './App';

// Register the TrackPlayer service for background audio
TrackPlayer.registerPlaybackService(() => require('./service'));

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
