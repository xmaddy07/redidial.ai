import { useEffect, useCallback, useRef } from 'react'
import { Keyboard, Platform, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

const IS_ANDROID = Platform.OS === 'android'

const resolveKeyboardHeight = (event) => {
  const metrics = Keyboard.metrics?.()
  if (metrics?.height && metrics.height > 0) return metrics.height

  const coords = event?.endCoordinates
  if (!coords) return 0

  const windowHeight = Dimensions.get('window').height
  const screenHeight = Dimensions.get('screen').height

  if (typeof coords.screenY === 'number' && coords.screenY > 0) {
    const windowBased = windowHeight - coords.screenY
    if (windowBased > 48) return windowBased

    const screenBased = screenHeight - coords.screenY
    const chromeInset = Math.max(0, screenHeight - windowHeight)
    if (screenBased - chromeInset > 48) return screenBased - chromeInset
  }

  if (coords.height > 0) return coords.height

  return Math.max(0, windowHeight - (coords.screenY || 0))
}

const getIosKeyboardBuffer = (bottomInset) => Math.max(16, Math.round(bottomInset * 0.35))

export function useChatKeyboard(onKeyboardVisible, onKeyboardSettled, closedBottomInset = 0) {
  const insets = useSafeAreaInsets()
  const keyboardHeight = useSharedValue(0)
  const onSettledRef = useRef(onKeyboardSettled)
  const safeBottomInset = insets.bottom
  const openInputPadding = IS_ANDROID ? 8 : 0
  const iosKeyboardBuffer = getIosKeyboardBuffer(safeBottomInset)

  onSettledRef.current = onKeyboardSettled

  const notifySettled = useCallback(() => {
    onSettledRef.current?.()
  }, [])

  const setKeyboardHeight = useCallback((height, duration = 250) => {
    cancelAnimation(keyboardHeight)

    if (duration <= 0) {
      keyboardHeight.value = height
      notifySettled()
      return
    }

    keyboardHeight.value = withTiming(
      height,
      {
        duration,
        easing: Easing.bezier(0.33, 0.01, 0, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(notifySettled)()
        }
      },
    )
  }, [keyboardHeight, notifySettled])

  useEffect(() => {
    const subscriptions = []

    const notifyIfVisible = (height) => {
      if (height > 0) onKeyboardVisible?.()
    }

    const hideKeyboard = (duration = 0) => {
      setKeyboardHeight(0, duration)
    }

    if (IS_ANDROID) {
      const onAndroidShow = () => {
        onKeyboardVisible?.()
        requestAnimationFrame(() => {
          notifySettled()
        })
      }

      const onAndroidHide = () => {
        notifySettled()
      }

      subscriptions.push(
        Keyboard.addListener('keyboardDidShow', onAndroidShow),
        Keyboard.addListener('keyboardDidHide', onAndroidHide),
      )
    } else {
      subscriptions.push(
        Keyboard.addListener('keyboardWillChangeFrame', (event) => {
          const windowHeight = Dimensions.get('window').height
          const rawHeight = Math.max(
            0,
            resolveKeyboardHeight(event),
            windowHeight - event.endCoordinates.screenY,
          )
          const nextHeight = rawHeight + iosKeyboardBuffer
          setKeyboardHeight(nextHeight, event.duration ?? 250)
          notifyIfVisible(nextHeight)
        }),
        Keyboard.addListener('keyboardDidShow', (event) => {
          const rawHeight = resolveKeyboardHeight(event)
          if (rawHeight > 0) {
            const height = rawHeight + iosKeyboardBuffer
            setKeyboardHeight(height, 0)
            notifyIfVisible(height)
          }
        }),
        Keyboard.addListener('keyboardWillHide', (event) => {
          setKeyboardHeight(0, event?.duration ?? 250)
        }),
        Keyboard.addListener('keyboardDidHide', () => {
          hideKeyboard(0)
        }),
      )
    }

    const dimensionSub = Dimensions.addEventListener('change', () => {
      if (IS_ANDROID) return
      const metrics = Keyboard.metrics?.()
      if (keyboardHeight.value > 0 && !metrics?.height) {
        hideKeyboard(0)
      }
    })
    subscriptions.push(dimensionSub)

    return () => {
      subscriptions.forEach(sub => sub.remove?.())
    }
  }, [iosKeyboardBuffer, keyboardHeight, notifySettled, onKeyboardVisible, setKeyboardHeight])

  const animatedKeyboardSpacerStyle = useAnimatedStyle(() => {
    if (IS_ANDROID) return { height: 0 }

    const kb = keyboardHeight.value
    if (kb <= 0) return { height: 0 }

    return { height: Math.max(kb - openInputPadding, 0) }
  })

  const animatedFooterStyle = useAnimatedStyle(() => {
    if (IS_ANDROID) {
      return {
        paddingBottom: closedBottomInset,
      }
    }

    const kb = keyboardHeight.value
    return {
      paddingBottom: kb > 0 ? openInputPadding : closedBottomInset,
    }
  })

  return {
    animatedKeyboardSpacerStyle,
    animatedFooterStyle,
  }
}
