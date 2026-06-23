import { PermissionsAndroid, Platform } from 'react-native'
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  isDeviceRegisteredForRemoteMessages,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PushNotification from 'react-native-push-notification'
import { registerDeviceToken } from '../api'
import { refreshNotificationUnreadCount } from '../utils/notificationUnread'
import { isTwilioVoiceNativeLinked, loadTwilioVoiceSdk } from './twilioVoiceNative'

const FCM_TOKEN_KEY = '@redidial_fcm_token'
const ANDROID_CHANNEL_ID = 'redidial-default'

const messaging = getMessaging()

let listenersCleanup = null
let activeAuthToken = null
let lastLoggedFcmToken = null

export function setPushAuthToken(token) {
  activeAuthToken = token || null
}

function logFcmToken(token, source) {
  if (!token || token === lastLoggedFcmToken) return
  lastLoggedFcmToken = token
  console.log(`[FCM] Token (${source}):`, token)
}

let pushNotificationConfigured = false

function configurePushNotificationLibrary(onOpenNotification) {
  if (pushNotificationConfigured) return
  pushNotificationConfigured = true

  PushNotification.configure({
    onRegister: () => {
      console.log('[PushNotificationIOS] native register event')
    },
    onRegistrationError: (err) => {
      console.warn('[PushNotificationIOS] registration error:', err?.message || err)
    },
    onNotification: (notification) => {
      if (notification?.userInteraction) {
        onOpenNotification?.(notification?.data || notification)
      }
      if (typeof notification?.finish === 'function') {
        notification.finish('noData')
      }
    },
    requestPermissions: false,
    popInitialNotification: true,
  })
}

function configureAndroidChannel() {
  if (Platform.OS !== 'android') return
  PushNotification.createChannel(
    {
      channelId: ANDROID_CHANNEL_ID,
      channelName: 'Redidial',
      channelDescription: 'App notifications',
      importance: 4,
      vibrate: true,
    },
    () => {},
  )
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'ios') {
    const authStatus = await requestPermission(messaging)
    return (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    )
  }

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    )
    return result === PermissionsAndroid.RESULTS.GRANTED
  }

  return true
}

export async function getFcmToken(source = 'getFcmToken') {
  if (Platform.OS === 'ios' && !isDeviceRegisteredForRemoteMessages(messaging)) {
    await registerDeviceForRemoteMessages(messaging)
  }
  const token = await getToken(messaging)
  logFcmToken(token, source)
  return token
}

export async function registerFcmTokenWithBackend(authToken) {
  if (!authToken) return null

  try {
    const fcmToken = await getFcmToken('after-login')
    if (!fcmToken) return null

    const cached = await AsyncStorage.getItem(FCM_TOKEN_KEY)
    if (cached !== fcmToken) {
      try {
        await registerDeviceToken({
          token: authToken,
          fcmToken,
          platform: Platform.OS,
        })
        console.log('FCM token registered with backend')
      } catch (error) {
        console.warn('Failed to register FCM token with backend:', error?.message || error)
      }
    }

    await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken)
    return fcmToken
  } catch (error) {
    console.warn('Failed to get FCM token:', error?.message || error)
    return null
  }
}

export function showLocalNotification({ title, message, body, data } = {}) {
  configureAndroidChannel()

  const notificationBody = body ?? message ?? ''

  PushNotification.localNotification({
    ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID, importance: 'high' } : {}),
    title: title || 'Redidial',
    message: notificationBody || 'You have a new notification',
    userInfo: data || {},
    data: data || {},
    playSound: true,
  })
}

function showNotificationFromRemoteMessage(remoteMessage) {
  const title =
    remoteMessage?.notification?.title ||
    remoteMessage?.data?.title ||
    'Redidial'
  const body =
    remoteMessage?.notification?.body ||
    remoteMessage?.data?.body ||
    remoteMessage?.data?.message ||
    ''

  showLocalNotification({ title, message: body, data: remoteMessage?.data })
}

function hasNotificationPayload(remoteMessage) {
  return !!(
    remoteMessage?.notification?.title ||
    remoteMessage?.notification?.body
  )
}

async function tryHandleTwilioFcmMessage(remoteMessage) {
  if (Platform.OS !== 'android') return false

  const data = remoteMessage?.data
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return false
  }

  if (!isTwilioVoiceNativeLinked()) return false

  try {
    const { Voice } = loadTwilioVoiceSdk()
    const voice = new Voice()
    return Boolean(await voice.handleFirebaseMessage(data))
  } catch (error) {
    console.warn('[FCM] Twilio message handling:', error?.message || error)
    return false
  }
}

/**
 * Route FCM to Twilio Voice (call invites) or show a local notification.
 * @param {'foreground'|'background'} context
 */
export async function handleIncomingFcmMessage(
  remoteMessage,
  { context = 'foreground' } = {},
) {
  const handledByTwilio = await tryHandleTwilioFcmMessage(remoteMessage)
  if (handledByTwilio) {
    console.log('[FCM] Handled by Twilio Voice')
    return { handledByTwilio: true }
  }

  const showTrayNotification =
    context === 'foreground' ||
    Platform.OS !== 'android' ||
    !hasNotificationPayload(remoteMessage)

  if (showTrayNotification) {
    showNotificationFromRemoteMessage(remoteMessage)
  }

  return { handledByTwilio: false }
}

export function setupPushNotificationListeners({ onOpenNotification } = {}) {
  if (listenersCleanup) {
    listenersCleanup()
    listenersCleanup = null
  }

  configureAndroidChannel()
  configurePushNotificationLibrary(onOpenNotification)
  if (Platform.OS === 'ios') {
    // Foreground banners are handled in AppDelegate (willPresent) and via
    // handleIncomingFcmMessage below — setForegroundNotificationPresentationOptions
    // is not available on @react-native-firebase/messaging v23 modular API.
  }

  const unsubMessage = onMessage(messaging, async (remoteMessage) => {
    console.log('FCM foreground message:', remoteMessage?.messageId)
    await handleIncomingFcmMessage(remoteMessage, { context: 'foreground' })
    if (activeAuthToken) {
      refreshNotificationUnreadCount(activeAuthToken).catch(() => {})
    }
  })

  const unsubTokenRefresh = onTokenRefresh(messaging, async (newToken) => {
    logFcmToken(newToken, 'token-refresh')
    await AsyncStorage.removeItem(FCM_TOKEN_KEY)
    lastLoggedFcmToken = null
    if (activeAuthToken) {
      await registerFcmTokenWithBackend(activeAuthToken)
    }
  })

  const unsubOpened = onNotificationOpenedApp(messaging, (remoteMessage) => {
    onOpenNotification?.(remoteMessage)
  })

  getInitialNotification(messaging)
    .then((remoteMessage) => {
      if (remoteMessage) {
        onOpenNotification?.(remoteMessage)
      }
    })
    .catch(() => {})

  listenersCleanup = () => {
    unsubMessage()
    unsubTokenRefresh()
    unsubOpened()
  }

  return listenersCleanup
}

export async function initializePushNotifications({ authToken, onOpenNotification } = {}) {
  setupPushNotificationListeners({ onOpenNotification })

  const permitted = await requestNotificationPermission()
  if (!permitted) {
    console.log('Push notification permission not granted')
    return null
  }

  if (authToken) {
    return registerFcmTokenWithBackend(authToken)
  }

  return getFcmToken('app-init')
}

export async function clearCachedFcmToken() {
  await AsyncStorage.removeItem(FCM_TOKEN_KEY)
  lastLoggedFcmToken = null
}
