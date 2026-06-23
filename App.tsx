import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Routes, { navigationRef } from './src/navigation';
import { Provider } from 'react-redux';
import { persistor, store } from './src/redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import ErrorBoundary from './src/component/ErrorBoundary';
import { ThemeProvider } from './src/context/ThemeContext';
import CustomAlertProvider from './src/component/CustomAlert';
import { useOfflineSync } from './src/hooks/useOfflineSync';
import { initializePushNotifications } from './src/services/pushNotifications';

function AppBootstrap() {
  useOfflineSync();
  return <Routes />;
}

declare const global: any;

// Global error handlers
const globalErrorHandler = (error: any, isFatal?: boolean) => {
  console.error('Global Error Handler:', error, 'isFatal:', isFatal);
  if (isFatal) {
    console.error('Fatal error occurred:', error);
  }
};

const globalPromiseRejectionHandler = (_promise: any, reason: any) => {
  console.error('Unhandled Promise Rejection:', reason);
};

if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = (ErrorUtils as any).getGlobalHandler();
  (ErrorUtils as any).setGlobalHandler((error: any, isFatal?: boolean) => {
    globalErrorHandler(error, isFatal);
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

if (typeof (global as any) !== 'undefined') {
  const handleUnhandledRejection = (event: any) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    globalPromiseRejectionHandler(null, event.reason);
    if (event.preventDefault) {
      event.preventDefault();
    }
  };

  if (typeof (global as any).addEventListener !== 'undefined') {
    (global as any).addEventListener('unhandledrejection', handleUnhandledRejection);
  }
}

function handleNotificationOpen(remoteMessage: any) {
  const data = remoteMessage?.data || remoteMessage || {};
  const eventType = data.type || data.event || data.notification_type || '';
  const normalizedType = String(eventType).toUpperCase();

  if (normalizedType === 'AUTH_REQUIRED') {
    if (navigationRef.isReady()) {
      navigationRef.navigate('linkedAccount', { authRequired: true });
    }
    return;
  }

  if ((normalizedType === 'TEAM_CHAT' || normalizedType === 'TEAM_MESSAGE') && data.conversationId) {
    if (navigationRef.isReady()) {
      navigationRef.navigate('teamChat', {
        conversationId: String(data.conversationId),
        user: {
          id: data.senderId,
          name: data.senderName || 'Teammate',
        },
      });
    }
    return;
  }

  console.log('Notification opened:', remoteMessage?.messageId);
}

export default function App() {
  useEffect(() => {
    initializePushNotifications({
      onOpenNotification: handleNotificationOpen,
    })
      .then((fcmToken) => {
        if (!fcmToken) {
          console.log('[FCM] No token yet (log in or grant notification permission)');
        }
      })
      .catch((error) => {
        console.error('Error initializing push notifications:', error);
      });
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider>
              <SafeAreaProvider>
                <CustomAlertProvider>
                  <AppBootstrap />
                </CustomAlertProvider>
              </SafeAreaProvider>
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
