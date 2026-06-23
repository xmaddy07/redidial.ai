import { DeviceEventEmitter } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const TEAM_CHAT_UNREAD_CHANGED = 'teamChatUnreadChanged'
export const TEAM_CHAT_INCOMING = 'teamChatIncoming'
export const TEAM_CHAT_ACTIVITY = 'teamChatActivity'
export const TEAM_CHAT_AUTH_ERROR = 'teamChatAuthError'

const STORAGE_KEY = '@redidial_team_chat_unread'

const unreadByConversation = {}
let activeConversationId = null
let persistTimer = null

function emitUnreadChanged() {
  DeviceEventEmitter.emit(TEAM_CHAT_UNREAD_CHANGED, getTeamChatUnreadTotal())
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(async () => {
    persistTimer = null
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(unreadByConversation))
    } catch {
      // ignore storage errors
    }
  }, 250)
}

export function getTeamChatUnreadTotal() {
  return Object.values(unreadByConversation).reduce((sum, count) => sum + count, 0)
}

export function getConversationUnread(conversationId) {
  if (!conversationId) return 0
  return unreadByConversation[String(conversationId)] || 0
}

export function setActiveTeamConversation(conversationId) {
  activeConversationId = conversationId ? String(conversationId) : null
}

export function clearConversationUnread(conversationId) {
  if (!conversationId) return
  const key = String(conversationId)
  if (!unreadByConversation[key]) return
  delete unreadByConversation[key]
  schedulePersist()
  emitUnreadChanged()
}

export function setConversationUnread(conversationId, count) {
  if (!conversationId) return
  const key = String(conversationId)
  const next = Math.max(0, Number(count) || 0)
  if (next === 0) {
    delete unreadByConversation[key]
  } else {
    unreadByConversation[key] = next
  }
  schedulePersist()
  emitUnreadChanged()
}

export function incrementConversationUnread(conversationId) {
  if (!conversationId) return
  const key = String(conversationId)
  unreadByConversation[key] = (unreadByConversation[key] || 0) + 1
  schedulePersist()
  emitUnreadChanged()
}

export function syncUnreadFromConversations(conversations = []) {
  ;(Array.isArray(conversations) ? conversations : []).forEach((chat) => {
    const id = chat?.conversationId ?? chat?.id
    if (!id) return

    const key = String(id)
    const apiCount = Math.max(0, Number(chat?.unreadCount ?? 0) || 0)
    const localCount = unreadByConversation[key] || 0
    const merged = Math.max(localCount, apiCount)

    if (merged > 0) {
      unreadByConversation[key] = merged
    } else {
      delete unreadByConversation[key]
    }
  })
  schedulePersist()
  emitUnreadChanged()
}

export function shouldAlertForNotify(conversationId) {
  if (!conversationId) return true
  return String(conversationId) !== activeConversationId
}

export async function hydrateTeamChatUnread() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return

    Object.keys(unreadByConversation).forEach((key) => {
      delete unreadByConversation[key]
    })
    Object.entries(parsed).forEach(([key, count]) => {
      const next = Math.max(0, Number(count) || 0)
      if (next > 0) unreadByConversation[key] = next
    })
    emitUnreadChanged()
  } catch {
    // ignore corrupt storage
  }
}

export async function clearTeamChatUnreadStore() {
  Object.keys(unreadByConversation).forEach((key) => {
    delete unreadByConversation[key]
  })
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  try {
    await AsyncStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  emitUnreadChanged()
}

export function onTeamChatUnreadChanged(listener) {
  const subscription = DeviceEventEmitter.addListener(TEAM_CHAT_UNREAD_CHANGED, listener)
  return () => subscription.remove()
}

export function emitTeamChatIncoming(payload) {
  DeviceEventEmitter.emit(TEAM_CHAT_INCOMING, payload)
}

export function onTeamChatIncoming(listener) {
  const subscription = DeviceEventEmitter.addListener(TEAM_CHAT_INCOMING, listener)
  return () => subscription.remove()
}

export function emitTeamChatActivity(payload) {
  DeviceEventEmitter.emit(TEAM_CHAT_ACTIVITY, payload)
}

export function onTeamChatActivity(listener) {
  const subscription = DeviceEventEmitter.addListener(TEAM_CHAT_ACTIVITY, listener)
  return () => subscription.remove()
}

export function emitTeamChatAuthError(error) {
  DeviceEventEmitter.emit(TEAM_CHAT_AUTH_ERROR, error)
}

export function onTeamChatAuthError(listener) {
  const subscription = DeviceEventEmitter.addListener(TEAM_CHAT_AUTH_ERROR, listener)
  return () => subscription.remove()
}
