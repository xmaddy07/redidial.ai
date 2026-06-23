import io from 'socket.io-client'
import { Platform } from 'react-native'
import { BASE_URL } from '../config'
import { emitTeamChatAuthError } from '../utils/teamChatNotify'

let socket = null
let activeToken = null

/** Subscriptions registered before socket exists; re-applied on connect/reconnect */
const pendingSubscriptions = []

function subscriptionKey(event, handler) {
  return `${event}::${handler}`
}

function attachToSocket(event, handler) {
  if (socket) socket.on(event, handler)
}

function registerSubscription(event, handler) {
  const key = subscriptionKey(event, handler)
  const exists = pendingSubscriptions.some(
    (s) => subscriptionKey(s.event, s.handler) === key
  )
  if (!exists) {
    pendingSubscriptions.push({ event, handler })
  }
  attachToSocket(event, handler)
}

function unregisterSubscription(event, handler) {
  const key = subscriptionKey(event, handler)
  const idx = pendingSubscriptions.findIndex(
    (s) => subscriptionKey(s.event, s.handler) === key
  )
  if (idx !== -1) pendingSubscriptions.splice(idx, 1)
  if (socket) socket.off(event, handler)
}

function applyPendingSubscriptions() {
  if (!socket) return
  pendingSubscriptions.forEach(({ event, handler }) => {
    socket.off(event, handler)
    socket.on(event, handler)
  })
}

function emitSocketAuthenticate(sock, token) {
  if (!sock || !token) return
  sock.emit('authenticate', {
    token,
    timestamp: Date.now(),
    clientInfo: { platform: Platform.OS === 'ios' ? 'ios' : 'mobile' },
  })
}

export const ORG_PREFERENCE_SOCKET_EVENTS = [
  'v1OnOrganizationPreferencesUpdate',
  'v1OnOrganizationUpdate',
  'organizationUpdated',
]

export function connectSocket(token) {
  if (!token) return null

  if (socket && activeToken === token) {
    if (!socket.connected) socket.connect()
    return socket
  }

  if (socket) {
    try {
      socket.disconnect()
    } catch (e) {}
    socket = null
    activeToken = null
  }

  activeToken = token
  socket = io(BASE_URL, {
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 15000,
    forceNew: true,
    auth: { token },
    query: { token },
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
    multiplex: false,
    path: '/socket.io',
    autoConnect: true,
  })

  socket.on('connect', () => {
    // eslint-disable-next-line no-console
    console.log('socket connected', { url: BASE_URL })
    emitSocketAuthenticate(socket, activeToken)
    applyPendingSubscriptions()
  })
  socket.on('connect_error', (e) => {
    // eslint-disable-next-line no-console
    console.log('socket connect_error', e?.message || e)
  })
  socket.on('reconnect', () => {
    emitSocketAuthenticate(socket, activeToken)
    applyPendingSubscriptions()
  })
  socket.on('reconnect_attempt', (n) => {
    // eslint-disable-next-line no-console
    console.log('socket reconnect_attempt', n)
  })
  socket.on('authentication_error', (err) => {
    emitTeamChatAuthError(err)
  })

  applyPendingSubscriptions()

  return socket
}

export async function diagnoseSocketConnectivity() {
  const info = { baseUrl: BASE_URL, path: '/socket.io' }
  try {
    const res = await fetch(BASE_URL, { method: 'GET' })
    info.httpReachable = res.ok
    info.httpStatus = res.status
  } catch (e) {
    info.httpReachable = false
    info.httpError = String(e?.message || e)
  }
  try {
    const ts = Date.now()
    const url = `${BASE_URL}/socket.io/?EIO=4&transport=polling&t=${ts}`
    const res = await fetch(url, { method: 'GET' })
    info.pollingReachable = res.ok
    info.pollingStatus = res.status
  } catch (e) {
    info.pollingReachable = false
    info.pollingError = String(e?.message || e)
  }
  // eslint-disable-next-line no-console
  console.log('socket diagnose', info)
  return info
}

export function disconnectSocket() {
  if (socket) {
    try {
      socket.disconnect()
    } catch (e) {}
    socket = null
  }
  activeToken = null
}

export function getSocket() {
  return socket
}

export function isSocketConnected() {
  return !!(socket && socket.connected)
}

export function onSocket(event, handler) {
  registerSubscription(event, handler)
}

export function offSocket(event, handler) {
  unregisterSubscription(event, handler)
}

export function emitSocket(event, payload) {
  if (socket) socket.emit(event, payload)
}

export function getUsersOnlineStatus(emails, { timeoutMs = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not connected'))
      return
    }

    const timeout = setTimeout(() => {
      reject(new Error('Socket request timed out'))
    }, timeoutMs)

    socket.once('v1OnUsersOnlineStatus', (data) => {
      clearTimeout(timeout)
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data
        resolve(parsed)
      } catch (e) {
        reject(e)
      }
    })

    socket.emit('v1GetUsersOnlineStatus', { emails, requestTimestamp: Date.now() })
  })
}
