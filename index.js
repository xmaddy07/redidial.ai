/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { handleIncomingFcmMessage } from './src/services/pushNotifications';
import App from './App';
import { name as appName } from './app.json';

// Must be registered outside the app component (background/quit state)
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  console.log('FCM background message:', remoteMessage?.messageId);
  await handleIncomingFcmMessage(remoteMessage, { context: 'background' });
});

// Handle unhandled promise rejections
if (typeof global !== 'undefined') {
  const handleUnhandledRejection = (event) => {
    console.error('Unhandled Promise Rejection in index.js:', event.reason);
    // Prevent default error dialog
    if (event.preventDefault) {
      event.preventDefault();
    }
  };

  if (typeof global.addEventListener !== 'undefined') {
    global.addEventListener('unhandledrejection', handleUnhandledRejection);
  }
}

AppRegistry.registerComponent(appName, () => App);
