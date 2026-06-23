import { Platform, PermissionsAndroid } from 'react-native'
import {
  getTwilioVoiceToken,
  getChannelConfiguration,
  getOrganizationDetails,
} from '../api'
import { resolveOrgIdFromUser } from '../utils/dnc'
import {
  buildTwilioIdentity,
  buildAgentName,
  normalizeE164,
  extractTwilioAccessToken,
  extractCallerIdFromChannelConfig,
} from '../utils/twilioCall'
import {
  isTwilioVoiceNativeLinked,
  loadTwilioVoiceSdk,
} from './twilioVoiceNative'

let voiceInstance = null
let activeCall = null
let tokenContext = null
let sdkCache = null
let connectedAt = null
const callStateListeners = new Set()

export const CallState = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  RINGING: 'ringing',
  CONNECTED: 'connected',
  FAILED: 'failed',
  DISCONNECTED: 'disconnected',
}

function emitCallState(state, payload = {}) {
  callStateListeners.forEach((listener) => {
    try {
      listener(state, payload)
    } catch (err) {
      console.warn('[TwilioVoice] call state listener error:', err?.message || err)
    }
  })
}

export function subscribeCallState(listener) {
  callStateListeners.add(listener)
  return () => callStateListeners.delete(listener)
}

export function getCallConnectedAt() {
  return connectedAt
}

function getSdk() {
  if (!sdkCache) {
    sdkCache = loadTwilioVoiceSdk()
  }
  return sdkCache
}

async function requestMicrophonePermission() {
  if (Platform.OS !== 'android') return true

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone permission',
      message: 'Redidial needs microphone access for voice calls.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  )

  return granted === PermissionsAndroid.RESULTS.GRANTED
}

async function resolveOrgId({ token, user, orgId }) {
  if (orgId != null) return orgId

  const fromUser = resolveOrgIdFromUser(user, null)
  if (fromUser != null) return fromUser

  const orgRes = await getOrganizationDetails(token)
  const orgData = orgRes?.data || orgRes || {}
  return resolveOrgIdFromUser(user, orgData)
}

async function fetchTwilioAccessToken({ token, user, orgId }) {
  const identity = buildTwilioIdentity(user, orgId)
  if (!identity) {
    throw new Error('Missing user or organization ID for Twilio identity')
  }

  console.log('[TwilioVoice] fetching token for identity:', identity)
  const res = await getTwilioVoiceToken({ token, identity })
  const accessToken = extractTwilioAccessToken(res)

  if (!accessToken) {
    throw new Error('Twilio access token missing from server response')
  }

  tokenContext = { token, user, orgId, identity }
  return accessToken
}

async function refreshTwilioAccessToken() {
  if (!tokenContext) {
    throw new Error('No Twilio token context available for refresh')
  }
  return fetchTwilioAccessToken(tokenContext)
}

export { refreshTwilioAccessToken, isTwilioVoiceNativeLinked }

async function resolveCallerId(authToken) {
  try {
    const config = await getChannelConfiguration(authToken)
    const callerId = extractCallerIdFromChannelConfig(config)
    console.log('[TwilioVoice] callerId resolved:', callerId || '(none)')
    return callerId ? normalizeE164(callerId) : ''
  } catch (err) {
    console.warn('[TwilioVoice] callerId lookup failed:', err?.message || err)
    return ''
  }
}

function getVoiceInstance() {
  const { Voice } = getSdk()

  if (!voiceInstance) {
    voiceInstance = new Voice()

    voiceInstance.on(Voice.Event.Error, (error) => {
      console.error('[TwilioVoice] SDK error:', error?.message || error)
    })

    voiceInstance.on(Voice.Event.Registered, () => {
      console.log('[TwilioVoice] device registered for incoming calls')
    })
  }

  return voiceInstance
}

function bindCallEvents(call) {
  const { Call } = getSdk()

  call.on(Call.Event.Connected, () => {
    console.log('[TwilioVoice] call connected')
    connectedAt = Date.now()
    emitCallState(CallState.CONNECTED, { call, connectedAt })
  })

  call.on(Call.Event.Ringing, () => {
    console.log('[TwilioVoice] call ringing')
    emitCallState(CallState.RINGING, { call })
  })

  call.on(Call.Event.ConnectFailure, (error) => {
    console.error('[TwilioVoice] connect failure:', error?.message || error)
    if (activeCall === call) activeCall = null
    connectedAt = null
    emitCallState(CallState.FAILED, { call, error })
  })

  call.on(Call.Event.Disconnected, (error) => {
    console.log('[TwilioVoice] call disconnected', error?.message || '')
    if (activeCall === call) activeCall = null
    connectedAt = null
    emitCallState(CallState.DISCONNECTED, { call, error })
  })
}

export async function ensureTwilioRegistered({ token, user, orgId: orgIdProp }) {
  const orgId = await resolveOrgId({ token, user, orgId: orgIdProp })
  const accessToken = await fetchTwilioAccessToken({ token, user, orgId })
  const voice = getVoiceInstance()

  try {
    await voice.register(accessToken)
  } catch (err) {
    console.warn('[TwilioVoice] register failed (outbound may still work):', err?.message || err)
  }

  return { orgId, accessToken, voice }
}

export async function initiateOutboundCall({
  token,
  user,
  phoneNumber,
  leadId,
  orgId: orgIdProp,
}) {
  const to = normalizeE164(phoneNumber)
  if (!to) {
    throw new Error('Enter a valid phone number')
  }

  const micOk = await requestMicrophonePermission()
  if (!micOk) {
    throw new Error('Microphone permission is required for in-app calls')
  }

  const orgId = await resolveOrgId({ token, user, orgId: orgIdProp })
  const accessToken = await fetchTwilioAccessToken({ token, user, orgId })
  const agent = buildAgentName(user)
  const callerId = await resolveCallerId(token)

  const params = {
    To: to,
    agent,
  }

  if (callerId) params.callerId = callerId
  if (leadId != null) params.leadId = String(leadId)

  console.log('[TwilioVoice] device.connect params:', params)

  const voice = getVoiceInstance()
  connectedAt = null
  emitCallState(CallState.CONNECTING, { to })

  try {
    await voice.register(accessToken)
  } catch (err) {
    console.warn('[TwilioVoice] register before connect failed:', err?.message || err)
  }

  const call = await voice.connect(accessToken, {
    params,
    contactHandle: agent,
    notificationDisplayName: agent,
  })

  activeCall = call
  bindCallEvents(call)

  return {
    to,
    call,
    orgId,
    params,
  }
}

export async function hangupActiveCall() {
  if (activeCall) {
    try {
      await activeCall.disconnect()
    } finally {
      activeCall = null
      connectedAt = null
    }
    return
  }

  if (voiceInstance) {
    const calls = await voiceInstance.getCalls()
    for (const call of calls.values()) {
      await call.disconnect()
    }
    connectedAt = null
  }
}

export function getActiveCall() {
  return activeCall
}

export async function setCallMuted(mute) {
  if (!activeCall) return false
  return activeCall.mute(mute)
}

export async function toggleCallSpeaker() {
  if (!voiceInstance) return false

  const { audioDevices, selectedDevice } = await voiceInstance.getAudioDevices()
  const speaker = audioDevices.find((d) => d.type === 'speaker')
  const earpiece = audioDevices.find((d) => d.type === 'earpiece')

  if (!speaker) return false

  const isSpeaker = selectedDevice?.type === 'speaker'
  const next = isSpeaker ? earpiece : speaker
  if (next) {
    await next.select()
    return next.type === 'speaker'
  }

  await speaker.select()
  return true
}

export async function getSpeakerEnabled() {
  if (!voiceInstance) return false
  const { selectedDevice } = await voiceInstance.getAudioDevices()
  return selectedDevice?.type === 'speaker'
}

export async function sendCallDigits(digits) {
  if (!activeCall || !digits) return
  await activeCall.sendDigits(String(digits))
}
