import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { TouchableOpacity, GestureHandlerRootView } from 'react-native-gesture-handler'
import { BlurView } from '@react-native-community/blur'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { subscribeAlert } from '../../utils/alert'
import { useTheme } from '../../hooks/useTheme'
import { fonts } from '../../constant'
import { widthPercentageToDP as wp, heightPercentageToDP as hp, BREAKPOINTS } from '../../theme/layout'

const EMPTY_STATE = {
  visible: false,
  title: '',
  message: '',
  buttons: [],
  cancelable: true,
  onDismiss: null,
}

function inferAlertMeta(title = '', message = '') {
  const text = `${title} ${message}`.toLowerCase()

  if (/success|saved|verified|connected|sent|updated|removed|added/.test(text)) {
    return { icon: 'check-circle', tone: 'success' }
  }
  if (/error|failed|fail|unavailable|invalid/.test(text)) {
    return { icon: 'alert-circle', tone: 'danger' }
  }
  if (/permission|required|missing|sign in/.test(text)) {
    return { icon: 'shield', tone: 'warning' }
  }
  if (/delete|disconnect|log out|cancel subscription|are you sure/.test(text)) {
    return { icon: 'alert-triangle', tone: 'warning' }
  }
  if (/coming soon/.test(text)) {
    return { icon: 'clock', tone: 'info' }
  }

  return { icon: 'info', tone: 'info' }
}

function toneColors(tone, colors) {
  switch (tone) {
    case 'success':
      return { main: colors.success, soft: `${colors.success}18` }
    case 'danger':
      return { main: colors.danger, soft: `${colors.danger}18` }
    case 'warning':
      return { main: colors.orange, soft: `${colors.orange}18` }
    default:
      return { main: colors.primary, soft: `${colors.primary}18` }
  }
}

function AlertButton({ button, colors, themeMode, onPress, compact }) {
  const isCancel = button.style === 'cancel'
  const isDestructive = button.style === 'destructive'
  const touchStyle = [styles.btnTouch, compact && styles.btnTouchCompact]

  if (isCancel) {
    return (
      <TouchableOpacity
        style={[touchStyle, styles.btnOutline, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={[styles.btnText, compact && styles.btnTextCompact, { color: colors.text }]} numberOfLines={2}>
          {button.text}
        </Text>
      </TouchableOpacity>
    )
  }

  if (isDestructive) {
    return (
      <TouchableOpacity
        style={[touchStyle, styles.btnFilled, { backgroundColor: colors.danger }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={[styles.btnText, compact && styles.btnTextCompact, styles.btnTextPrimary]} numberOfLines={2}>
          {button.text}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity style={touchStyle} onPress={onPress} activeOpacity={0.88}>
      <LinearGradient
        pointerEvents="none"
        colors={
          themeMode === 'dark'
            ? [colors.primary, `${colors.primary}DD`]
            : [colors.primary, colors.accent || colors.primary]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
      />
      <Text style={[styles.btnText, compact && styles.btnTextCompact, styles.btnTextPrimary]} numberOfLines={2}>
        {button.text}
      </Text>
    </TouchableOpacity>
  )
}

export default function CustomAlertProvider({ children }) {
  const { colors, themeMode } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const [state, setState] = useState(EMPTY_STATE)

  const isCompact = screenWidth < BREAKPOINTS.compact
  const isShort = screenHeight < 700
  const useStackedButtons = state.buttons.length > 2

  useEffect(() => {
    return subscribeAlert((config) => {
      setState({ ...EMPTY_STATE, ...config, visible: true })
    })
  }, [])

  const close = useCallback(() => {
    setState(EMPTY_STATE)
  }, [])

  const handleBackdropPress = useCallback(() => {
    if (!state.cancelable) return
    state.onDismiss?.(-1)
    close()
  }, [state, close])

  const handleButtonPress = useCallback(
    (button, index) => {
      button.userOnPress?.()
      state.onDismiss?.(index)
      close()
    },
    [state, close],
  )

  const meta = useMemo(
    () => inferAlertMeta(state.title, state.message),
    [state.title, state.message],
  )
  const tone = useMemo(() => toneColors(meta.tone, colors), [meta.tone, colors])
  const orderedButtons = useMemo(() => {
    const withIndex = state.buttons.map((button, index) => ({ button, index }))
    if (!useStackedButtons || withIndex.length !== 2) return withIndex

    const cancelIdx = withIndex.findIndex(({ button }) => button.style === 'cancel')
    if (cancelIdx <= 0) return withIndex

    const next = [...withIndex]
    const [cancelEntry] = next.splice(cancelIdx, 1)
    next.unshift(cancelEntry)
    return next
  }, [state.buttons, useStackedButtons])
  const cardStyles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.cardBg,
          borderColor: themeMode === 'dark' ? colors.surfaceBorder : 'rgba(255,255,255,0.6)',
        },
        title: { color: colors.text },
        message: { color: colors.gray },
        iconWrap: { backgroundColor: tone.soft },
      }),
    [colors, themeMode, tone.soft],
  )

  return (
    <>
      {children}
      <Modal
        visible={state.visible}
        transparent
        animationType="fade"
        onRequestClose={handleBackdropPress}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <GestureHandlerRootView style={styles.modalRoot}>
        <View
          style={[
            styles.overlay,
            {
              paddingTop: Math.max(insets.top, hp(2)),
              paddingBottom: Math.max(insets.bottom, hp(2)),
              paddingHorizontal: isCompact ? wp(4) : wp(6),
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType={themeMode === 'dark' ? 'dark' : 'light'}
              blurAmount={10}
              reducedTransparencyFallbackColor="rgba(0,0,0,0.55)"
              pointerEvents="none"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidBackdrop]} pointerEvents="none" />
          )}

          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View style={styles.backdropTap} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.card,
              cardStyles.card,
              isCompact && styles.cardCompact,
              isShort && styles.cardShort,
            ]}
          >
            <View style={[styles.iconWrap, cardStyles.iconWrap, isCompact && styles.iconWrapCompact]}>
              <Icon name={meta.icon} size={isCompact ? 22 : 26} color={tone.main} />
            </View>

            {state.title ? (
              <Text style={[styles.title, cardStyles.title, isCompact && styles.titleCompact]}>{state.title}</Text>
            ) : null}

            {state.message ? (
              <Text style={[styles.message, cardStyles.message, isCompact && styles.messageCompact]}>{state.message}</Text>
            ) : null}

            <View style={[styles.actions, useStackedButtons && styles.actionsStacked]}>
              {orderedButtons.map(({ button, index }) => (
                <View
                  key={`${button.text}-${index}`}
                  style={[styles.btnSlot, useStackedButtons && styles.btnSlotStacked]}
                >
                  <AlertButton
                    button={button}
                    colors={colors}
                    themeMode={themeMode}
                    compact={isCompact}
                    onPress={() => handleButtonPress(button, index)}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  backdropTap: {
    ...StyleSheet.absoluteFillObject,
  },
  androidBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: wp(5.5),
    paddingTop: hp(2.8),
    paddingBottom: hp(2.4),
    alignItems: 'center',
    zIndex: 1,
    elevation: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
      },
    }),
  },
  cardCompact: {
    maxWidth: '100%',
    borderRadius: 18,
    paddingHorizontal: wp(4.5),
    paddingTop: hp(2.2),
    paddingBottom: hp(2),
  },
  cardShort: {
    paddingTop: hp(1.8),
    paddingBottom: hp(1.6),
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.6),
  },
  iconWrapCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: hp(1.2),
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 17,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: hp(2.2),
    paddingHorizontal: 4,
  },
  messageCompact: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: hp(1.8),
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  actionsStacked: {
    flexDirection: 'column',
  },
  btnSlot: {
    flex: 1,
    minWidth: 0,
  },
  btnSlotStacked: {
    flex: 0,
    width: '100%',
  },
  btnTouch: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  btnTouchCompact: {
    minHeight: 46,
  },
  btnOutline: {
    borderWidth: 1.5,
  },
  btnFilled: {},
  btnText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    textAlign: 'center',
  },
  btnTextCompact: {
    fontSize: 14,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
  },
})
