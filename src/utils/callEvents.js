import { DeviceEventEmitter } from 'react-native'

export const INITIATE_CALL_EVENT = 'initiateCall'
export const OPEN_DIALER_EVENT = 'openDialer'

export function emitInitiateCall({
  phoneNumber,
  agent,
  leadId,
  contactName,
  avatarUri,
} = {}) {
  DeviceEventEmitter.emit(INITIATE_CALL_EVENT, {
    phoneNumber,
    agent,
    leadId,
    contactName,
    avatarUri,
  })
}

export function onInitiateCall(listener) {
  const subscription = DeviceEventEmitter.addListener(INITIATE_CALL_EVENT, listener)
  return () => subscription.remove()
}

export function emitOpenDialer({
  phoneNumber,
  leadId,
  contactName,
  avatarUri,
} = {}) {
  DeviceEventEmitter.emit(OPEN_DIALER_EVENT, {
    phoneNumber,
    leadId,
    contactName,
    avatarUri,
  })
}

export function onOpenDialer(listener) {
  const subscription = DeviceEventEmitter.addListener(OPEN_DIALER_EVENT, listener)
  return () => subscription.remove()
}
