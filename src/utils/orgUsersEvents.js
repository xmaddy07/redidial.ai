import { DeviceEventEmitter } from 'react-native'

export const ORG_USERS_CHANGED = 'orgUsersChanged'

export function emitOrgUsersChanged() {
  DeviceEventEmitter.emit(ORG_USERS_CHANGED)
}

export function onOrgUsersChanged(listener) {
  const subscription = DeviceEventEmitter.addListener(ORG_USERS_CHANGED, listener)
  return () => subscription.remove()
}
