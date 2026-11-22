import 'react-native-gesture-handler'; // Must be first import
import { registerRootComponent } from 'expo';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

import App from './App';
import { displayNotification } from './app/services/notifications/pushNotificationService';

// Register background message handler for Firebase Cloud Messaging
// This must be done at the top level, outside of any component
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  console.log('Push: Background message received (index.js):', remoteMessage);

  await displayNotification(remoteMessage);
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
