import { NativeModules } from 'react-native'

const TWILIO_NATIVE_MODULE = 'TwilioVoiceReactNative'

export function isTwilioVoiceNativeLinked() {
  return !!NativeModules[TWILIO_NATIVE_MODULE]
}

export function getTwilioNativeModule() {
  return NativeModules[TWILIO_NATIVE_MODULE] || null
}

export function assertTwilioVoiceNativeLinked() {
  if (isTwilioVoiceNativeLinked()) return

  throw new Error(
    'Twilio Voice is not available in this app build. '
    + 'Stop Metro, run "cd ios && LANG=en_US.UTF-8 pod install", '
    + 'then rebuild with "yarn ios" or Xcode (a reload is not enough).',
  )
}

export function loadTwilioVoiceSdk() {
  assertTwilioVoiceNativeLinked()
  return require('@twilio/voice-react-native-sdk')
}
