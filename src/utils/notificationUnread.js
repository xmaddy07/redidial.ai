import { DeviceEventEmitter } from 'react-native'
import {
  getNotificationUnreadCount,
  getNotificationsList,
  getNotificationsListAll,
} from '../api'

export const NOTIFICATION_UNREAD_CHANGED = 'notificationUnreadChanged'

let cachedUnreadCount = 0

export function isNotificationUnread(item) {
  if (item == null) return false

  if (typeof item.isRead === 'boolean') return !item.isRead
  if (typeof item.read === 'boolean') return !item.read
  if (typeof item.is_read === 'boolean') return !item.is_read

  if (item.isRead === 0 || item.isRead === '0' || item.isRead === false) return true
  if (item.read === 0 || item.read === '0' || item.read === false) return true
  if (item.is_read === 0 || item.is_read === '0' || item.is_read === false) return true

  if (item.isRead === 1 || item.isRead === '1' || item.isRead === true) return false
  if (item.read === 1 || item.read === '1' || item.read === true) return false
  if (item.is_read === 1 || item.is_read === '1' || item.is_read === true) return false

  const status = String(item.status || item.read_status || item.readStatus || '').toLowerCase()
  if (status === 'unread' || status === 'new') return true
  if (status === 'read' || status === 'seen') return false

  return false
}

function normalizeNotificationList(resp) {
  if (!resp) return []
  if (Array.isArray(resp?.data)) return resp.data
  if (Array.isArray(resp?.notifications)) return resp.notifications
  if (Array.isArray(resp?.items)) return resp.items
  if (Array.isArray(resp?.list)) return resp.list
  if (Array.isArray(resp)) return resp
  return []
}

function parseUnreadCount(data) {
  if (typeof data === 'number' && Number.isFinite(data) && data >= 0) {
    return data
  }

  const candidates = [
    data?.count,
    data?.unread,
    data?.unreadCount,
    data?.unread_count,
    data?.totalUnread,
    data?.total_unread,
    data?.data,
    data?.data?.count,
    data?.data?.unread,
    data?.data?.unreadCount,
    data?.data?.unread_count,
  ]

  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value
    }
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }

  return null
}

async function countUnreadFromListFetcher(fetchList) {
  const resp = await fetchList()
  const list = normalizeNotificationList(resp)
  return list.filter(isNotificationUnread).length
}

export function getCachedNotificationUnreadCount() {
  return cachedUnreadCount
}

export function setNotificationUnreadCount(count) {
  const next = Math.max(0, Number(count) || 0)
  if (next === cachedUnreadCount) return
  cachedUnreadCount = next
  DeviceEventEmitter.emit(NOTIFICATION_UNREAD_CHANGED, cachedUnreadCount)
}

export function adjustNotificationUnreadCount(delta) {
  setNotificationUnreadCount(cachedUnreadCount + (Number(delta) || 0))
}

export function onNotificationUnreadChanged(listener) {
  const subscription = DeviceEventEmitter.addListener(
    NOTIFICATION_UNREAD_CHANGED,
    listener,
  )
  return () => subscription.remove()
}

export async function refreshNotificationUnreadCount(token) {
  if (!token) {
    setNotificationUnreadCount(0)
    return 0
  }

  try {
    const resp = await getNotificationUnreadCount({ token })
    const parsed = parseUnreadCount(resp)
    if (parsed != null) {
      setNotificationUnreadCount(parsed)
      return parsed
    }
  } catch {
    // fall through to list endpoints
  }

  const listFetchers = [
    () => getNotificationsListAll({ token, page: 1, size: 100 }),
    () => getNotificationsList({ token, page: 1, size: 100 }),
  ]

  for (const fetchList of listFetchers) {
    try {
      const count = await countUnreadFromListFetcher(fetchList)
      setNotificationUnreadCount(count)
      return count
    } catch {
      // try next source
    }
  }

  return cachedUnreadCount
}
