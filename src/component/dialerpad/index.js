import React, { useState, useMemo, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialIcons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { fonts } from '../../constant'
import { useTheme } from '../../hooks/useTheme'
import { getCallUiPalette } from '../../utils/dialerTheme'

const MAX_DIGITS = 12
const { width: SCREEN_WIDTH } = Dimensions.get('window')
const HORIZONTAL_PADDING = 24
const KEY_GAP = 22
const KEY_SIZE = Math.min(
  78,
  Math.floor((SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - KEY_GAP * 2) / 3),
)

const KEYPAD_ROWS = [
  [
    { key: '1', letters: '' },
    { key: '2', letters: 'ABC' },
    { key: '3', letters: 'DEF' },
  ],
  [
    { key: '4', letters: 'GHI' },
    { key: '5', letters: 'JKL' },
    { key: '6', letters: 'MNO' },
  ],
  [
    { key: '7', letters: 'PQRS' },
    { key: '8', letters: 'TUV' },
    { key: '9', letters: 'WXYZ' },
  ],
  [
    { key: '*', letters: '' },
    { key: '0', letters: '+' },
    { key: '#', letters: '' },
  ],
]

const toDialDigits = (raw) => {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (value.startsWith('+')) {
    return `+${value.slice(1).replace(/[^\d]/g, '').slice(0, MAX_DIGITS)}`
  }
  return value.replace(/[^\d#*]/g, '').slice(0, MAX_DIGITS)
}

const formatPhoneForDisplay = (raw) => {
  const value = String(raw || '').trim()
  if (!value) return ''

  if (value.startsWith('+')) {
    const digits = value.slice(1).replace(/\D/g, '')
    if (digits.length <= 3) return `+${digits}`
    if (digits.length <= 6) return `+${digits.slice(0, 3)} ${digits.slice(3)}`
    if (digits.length <= 10) {
      return `+${digits.slice(0, 3)} (${digits.slice(3, 6)}) ${digits.slice(6)}`
    }
    return `+${digits.slice(0, 3)} (${digits.slice(3, 6)}) ${digits.slice(6, 10)}-${digits.slice(10, 12)}`
  }

  const digits = value.replace(/\D/g, '')
  const area = digits.slice(0, 3)
  const mid = digits.slice(3, 6)
  const last = digits.slice(6, 10)
  const extra = digits.slice(10, 12)

  if (digits.length <= 3) return area
  if (digits.length <= 6) return `(${area}) ${mid}`
  if (digits.length <= 10) return `(${area}) ${mid}-${last}`
  return `(${area}) ${mid}-${last}-${extra}`
}

function AmbientBackground({ palette }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[ambientStyles.orb, ambientStyles.orbTop, { backgroundColor: palette.ambientGlow }]} />
      <View style={[ambientStyles.orb, ambientStyles.orbBottom, { backgroundColor: palette.ambientGlowSoft }]} />
    </View>
  )
}

const ambientStyles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.7,
  },
  orbTop: {
    width: SCREEN_WIDTH * 1.1,
    height: SCREEN_WIDTH * 1.1,
    top: -SCREEN_WIDTH * 0.45,
    alignSelf: 'center',
  },
  orbBottom: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    bottom: -SCREEN_WIDTH * 0.22,
    right: -SCREEN_WIDTH * 0.15,
  },
})

function KeyButton({ keyLabel, letters, onPress, disabled, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
      style={styles.keyOuter}
    >
      <View style={styles.keyButton}>
        <Text style={styles.keyDigit}>{keyLabel}</Text>
        {letters ? (
          <Text style={styles.keyLetters}>{letters}</Text>
        ) : (
          <View style={styles.lettersSpacer} />
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function DialerPad({
  visible,
  onClose,
  onCall,
  initialNumber = '',
  calling = false,
}) {
  const insets = useSafeAreaInsets()
  const { colors, themeMode } = useTheme()
  const palette = useMemo(() => getCallUiPalette(colors, themeMode), [colors, themeMode])
  const styles = useMemo(() => createStyles(palette), [palette])
  const [dialNumber, setDialNumber] = useState('')

  useEffect(() => {
    if (visible) {
      setDialNumber(toDialDigits(initialNumber))
    } else {
      setDialNumber('')
    }
  }, [visible, initialNumber])

  const formatted = useMemo(() => formatPhoneForDisplay(dialNumber), [dialNumber])
  const hasNumber = dialNumber.replace(/[^\d]/g, '').length > 0
  const canCall = hasNumber && !calling

  const handleClose = () => {
    if (calling) return
    setDialNumber('')
    onClose?.()
  }

  const handleCall = () => {
    if (!canCall) return
    onCall?.(dialNumber)
  }

  const appendKey = (keyLabel) => {
    setDialNumber((prev) => {
      const next = `${prev}${keyLabel}`
      if (next.startsWith('+')) {
        return `+${next.slice(1).replace(/[^\d#*]/g, '').slice(0, MAX_DIGITS)}`
      }
      return next.replace(/[^\d#*]/g, '').slice(0, MAX_DIGITS)
    })
  }

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <LinearGradient
        colors={palette.bgGradient}
        locations={palette.bgGradientLocations}
        style={styles.screen}
      >
        <View style={[styles.inner, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
          <AmbientBackground palette={palette} />

          <View style={styles.topRow}>
            <View style={styles.displayCard}>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                activeOpacity={0.8}
                disabled={calling}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={22} color={palette.textMuted} />
              </TouchableOpacity>

              <Text style={styles.displayLabel}>
                {hasNumber ? 'Dialing' : 'New Call'}
              </Text>
              <Text
                style={[styles.numberText, !hasNumber && styles.placeholderText]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {hasNumber ? formatted : 'Enter Number'}
              </Text>
            </View>
          </View>

          <View style={styles.keypadSection}>
            {KEYPAD_ROWS.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.keypadRow}>
                {row.map(({ key, letters }) => (
                  <KeyButton
                    key={key}
                    keyLabel={key}
                    letters={letters}
                    onPress={() => appendKey(key)}
                    disabled={calling}
                    styles={styles}
                  />
                ))}
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerSide}>
              {hasNumber && !calling ? (
                <TouchableOpacity
                  style={styles.backspaceBtn}
                  activeOpacity={0.8}
                  onPress={() => setDialNumber((prev) => prev.slice(0, -1))}
                >
                  <MaterialCommunityIcons
                    name={Platform.OS === 'ios' ? 'backspace-outline' : 'backspace'}
                    size={24}
                    color={palette.textMuted}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.backspacePlaceholder} />
              )}
            </View>

            <View style={styles.callBtnWrap}>
              <View style={[styles.callGlow, { backgroundColor: palette.callGlow }]} />
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleCall}
                disabled={!canCall}
                style={!canCall && styles.callBtnDisabled}
              >
                <LinearGradient
                  colors={canCall ? palette.callGradient : [palette.textMuted, palette.textMuted]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.callBtn}
                >
                  {calling ? (
                    <ActivityIndicator size="small" color={palette.textOnPrimary} />
                  ) : (
                    <MaterialCommunityIcons
                      name="phone"
                      size={30}
                      color={palette.textOnPrimary}
                      style={styles.callIcon}
                    />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.footerSide} />
          </View>
        </View>
      </LinearGradient>
    </Modal>
  )
}

function createStyles(palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    inner: {
      flex: 1,
      paddingHorizontal: HORIZONTAL_PADDING,
    },
    topRow: {
      marginBottom: 28,
    },
    displayCard: {
      backgroundColor: palette.keySurface,
      borderRadius: 22,
      paddingVertical: 22,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100,
      position: 'relative',
      ...Platform.select({
        ios: {
          shadowColor: palette.keyShadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: palette.isDark ? 0.3 : 0.1,
          shadowRadius: 16,
        },
        android: { elevation: 4 },
      }),
    },
    displayLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: palette.primary,
      letterSpacing: 2.2,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    numberText: {
      fontFamily: fonts.bold,
      fontSize: 34,
      color: palette.dialText,
      letterSpacing: 0.8,
      textAlign: 'center',
    },
    placeholderText: {
      color: palette.textMuted,
      fontSize: 26,
      fontFamily: fonts.semibold,
      letterSpacing: 0.2,
    },
    closeBtn: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: palette.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(241,245,249,0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    keypadSection: {
      flex: 1,
      justifyContent: 'center',
      gap: KEY_GAP,
    },
    keypadRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    keyOuter: {
      width: KEY_SIZE,
      height: KEY_SIZE,
      borderRadius: KEY_SIZE / 2,
      ...Platform.select({
        ios: {
          shadowColor: palette.keyShadow,
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: palette.isDark ? 0.28 : 0.12,
          shadowRadius: 10,
        },
        android: { elevation: 4 },
      }),
    },
    keyButton: {
      flex: 1,
      borderRadius: KEY_SIZE / 2,
      backgroundColor: palette.keySurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyDigit: {
      fontFamily: fonts.semibold,
      fontSize: 28,
      color: palette.primary,
      lineHeight: 32,
    },
    keyLetters: {
      fontFamily: fonts.medium,
      fontSize: 8,
      color: palette.textMuted,
      letterSpacing: 1.6,
      marginTop: 2,
    },
    lettersSpacer: {
      height: 10,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 8,
      paddingBottom: 8,
    },
    footerSide: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backspaceBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: palette.keySurface,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: palette.keyShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: palette.isDark ? 0.22 : 0.08,
          shadowRadius: 8,
        },
        android: { elevation: 3 },
      }),
    },
    backspacePlaceholder: {
      width: 52,
      height: 52,
    },
    callBtnWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    callGlow: {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      opacity: 0.45,
    },
    callBtn: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    callBtnDisabled: {
      opacity: 0.4,
    },
    callIcon: {
      transform: [{ rotate: '-135deg' }],
    },
  })
}
