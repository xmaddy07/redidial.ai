import { useCallback, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import {
  getCachedNotificationUnreadCount,
  onNotificationUnreadChanged,
  refreshNotificationUnreadCount,
} from '../utils/notificationUnread'

export function useUnreadNotificationCount({ refreshOnFocus = true } = {}) {
  const token = useSelector(state => state?.auth?.token)
  const [count, setCount] = useState(getCachedNotificationUnreadCount())

  useEffect(() => {
    const unsubscribe = onNotificationUnreadChanged(setCount)
    refreshNotificationUnreadCount(token).then(setCount)
    return unsubscribe
  }, [token])

  useFocusEffect(
    useCallback(() => {
      if (!refreshOnFocus) return undefined
      refreshNotificationUnreadCount(token).then(setCount)
      return undefined
    }, [token, refreshOnFocus]),
  )

  return count
}

export function useNotificationUnreadBootstrap() {
  const token = useSelector(state => state?.auth?.token)

  useEffect(() => {
    refreshNotificationUnreadCount(token)
  }, [token])

  useEffect(() => {
    const handleAppState = (nextState) => {
      if (nextState === 'active') {
        refreshNotificationUnreadCount(token)
      }
    }

    const subscription = AppState.addEventListener('change', handleAppState)
    return () => subscription.remove()
  }, [token])
}
