import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../theme/layout'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { fonts } from '../../constant'
import { useTheme } from '../../hooks/useTheme'
import { getCallUiPalette } from '../../utils/dialerTheme'
import {
  CallState,
  subscribeCallState,
  hangupActiveCall,
  setCallMuted,
  toggleCallSpeaker,
  getSpeakerEnabled,
  sendCallDigits,
  getCallConnectedAt,
} from '../../services/twilioVoice'

const DTMF_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
]

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const getInitials = (name, phone) => {
  const value = String(name || '').trim()
  if (value) {
    const parts = value.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return value.slice(0, 2).toUpperCase()
  }
  const digits = String(phone || '').replace(/\D/g, '')
  return digits.slice(-2) || '?'
}

const STATUS_LABELS = {
  [CallState.CONNECTING]: 'Calling...',
  [CallState.RINGING]: 'Ringing...',
  [CallState.CONNECTED]: 'Connected',
  [CallState.FAILED]: 'Call failed',
  [CallState.DISCONNECTED]: 'Call ended',
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

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
    opacity: 0.8,
  },
  orbTop: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    top: -SCREEN_WIDTH * 0.3,
    alignSelf: 'center',
  },
  orbBottom: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    bottom: -SCREEN_WIDTH * 0.15,
    right: -SCREEN_WIDTH * 0.15,
  },
})

export default function VoiceCallScreen({
  visible,
  contactName,
  contactPhone,
  avatarUri,
  onClose,
}) {
  const insets = useSafeAreaInsets()
  const { colors, themeMode } = useTheme()
  const palette = useMemo(() => getCallUiPalette(colors, themeMode), [colors, themeMode])
  const styles = useMemo(() => createStyles(palette), [palette])

  const [callState, setCallState] = useState(CallState.CONNECTING)
  const [elapsed, setElapsed] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaker, setIsSpeaker] = useState(false)
  const [showDialpad, setShowDialpad] = useState(false)
  const closeTimerRef = useRef(null)

  const displayName = useMemo(() => {
    const name = String(contactName || '').trim()
    return name || contactPhone || 'Unknown'
  }, [contactName, contactPhone])

  const initials = useMemo(
    () => getInitials(contactName, contactPhone),
    [contactName, contactPhone],
  )

  const statusLabel = STATUS_LABELS[callState] || 'Voice Call'
  const isConnected = callState === CallState.CONNECTED

  useEffect(() => {
    if (!visible) {
      setCallState(CallState.CONNECTING)
      setElapsed(0)
      setIsMuted(false)
      setIsSpeaker(false)
      setShowDialpad(false)
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      return undefined
    }

    const unsubscribe = subscribeCallState((state) => {
      setCallState(state)

      if (state === CallState.CONNECTED) {
        const startedAt = getCallConnectedAt()
        if (startedAt) {
          setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)))
        }
        getSpeakerEnabled().then(setIsSpeaker).catch(() => {})
      }

      if (state === CallState.DISCONNECTED || state === CallState.FAILED) {
        closeTimerRef.current = setTimeout(() => {
          onClose?.()
        }, 1200)
      }
    })

    return () => {
      unsubscribe()
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [visible, onClose])

  useEffect(() => {
    if (!visible || !isConnected) return undefined

    const startedAt = getCallConnectedAt()
    if (!startedAt) return undefined

    const tick = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)))
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [visible, isConnected])

  const onToggleMute = useCallback(async () => {
    const next = !isMuted
    try {
      await setCallMuted(next)
      setIsMuted(next)
    } catch (err) {
      console.warn('[VoiceCall] mute failed:', err?.message || err)
    }
  }, [isMuted])

  const onToggleSpeaker = useCallback(async () => {
    try {
      const enabled = await toggleCallSpeaker()
      setIsSpeaker(enabled)
    } catch (err) {
      console.warn('[VoiceCall] speaker failed:', err?.message || err)
    }
  }, [])

  const onEndCall = useCallback(async () => {
    try {
      await hangupActiveCall()
    } catch (err) {
      console.warn('[VoiceCall] hangup failed:', err?.message || err)
    }
    onClose?.()
  }, [onClose])

  const onDtmfPress = useCallback(async (digit) => {
    try {
      await sendCallDigits(digit)
    } catch (err) {
      console.warn('[VoiceCall] DTMF failed:', err?.message || err)
    }
  }, [])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onEndCall}
    >
      <LinearGradient
        colors={palette.bgGradient}
        locations={palette.bgGradientLocations}
        style={styles.root}
      >
        <AmbientBackground palette={palette} />
        <View style={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.mainSection}>
            <View style={styles.avatarSection}>
              <View style={styles.ringOuter}>
                <View style={styles.ringFar}>
                  <View style={styles.ringMid}>
                    <View style={styles.ringInner}>
                      {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                      ) : (
                        <LinearGradient
                          colors={palette.avatarGradient}
                          style={styles.avatarFallback}
                        >
                          <Text style={styles.avatarInitials}>{initials}</Text>
                        </LinearGradient>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.ringDot} />
              </View>

              <Text style={styles.contactName} numberOfLines={2}>{displayName}</Text>

              <View style={styles.statusPill}>
                {isConnected ? (
                  <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
                ) : (
                  <Text style={styles.statusPulse}>{statusLabel}</Text>
                )}
              </View>

              {isConnected ? (
                <Text style={styles.callTypeLabel}>Voice Call</Text>
              ) : contactPhone && displayName !== contactPhone ? (
                <Text style={styles.callTypeLabel} numberOfLines={1}>{contactPhone}</Text>
              ) : null}
            </View>

            {showDialpad ? (
              <View style={styles.dialpadWrap}>
                {DTMF_KEYS.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={styles.dialpadRow}>
                    {row.map((digit) => (
                      <TouchableOpacity
                        key={digit}
                        style={styles.dtmfKey}
                        onPress={() => onDtmfPress(digit)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.dtmfKeyText}>{digit}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.hideDialpadBtn}
                  onPress={() => setShowDialpad(false)}
                >
                  <Text style={styles.hideDialpadText}>Hide dialpad</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={styles.bottomSection}>
            {!showDialpad ? (
              <View style={styles.controlsRow}>
                <CallControl
                  label="MUTE"
                  icon={isMuted ? 'microphone-off' : 'microphone'}
                  active={isMuted}
                  onPress={onToggleMute}
                  styles={styles}
                  palette={palette}
                />
                <CallControl
                  label="DIALPAD"
                  icon="dialpad"
                  active={showDialpad}
                  onPress={() => setShowDialpad(true)}
                  styles={styles}
                  palette={palette}
                />
                <CallControl
                  label="SPEAKER"
                  icon={isSpeaker ? 'volume-high' : 'volume-medium'}
                  active={isSpeaker}
                  onPress={onToggleSpeaker}
                  styles={styles}
                  palette={palette}
                />
              </View>
            ) : null}

            <View style={styles.endCallSection}>
              <View style={styles.endCallGlowWrap}>
                <View style={[styles.endCallGlow, { backgroundColor: `${palette.danger}44` }]} />
                <TouchableOpacity onPress={onEndCall} activeOpacity={0.88} style={styles.endCallTouchable}>
                  <LinearGradient
                    colors={palette.endCallGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.endCallBtn}
                  >
                    <MaterialCommunityIcons name="phone-hangup" size={28} color={palette.textOnPrimary} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <Text style={styles.endCallLabel}>END CALL</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  )
}

function CallControl({ label, icon, active, onPress, styles, palette }) {
  return (
    <TouchableOpacity style={styles.controlItem} onPress={onPress} activeOpacity={0.78}>
      <View style={[styles.controlBtn, active && styles.controlBtnActive]}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={active ? palette.controlIconActive : palette.controlIcon}
        />
      </View>
      <Text style={[styles.controlLabel, active && styles.controlLabelActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

const AVATAR_SIZE = wp(28)

function createStyles(palette) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: wp(6),
    },
    mainSection: {
      flex: 1,
      justifyContent: 'center',
    },
    bottomSection: {
      paddingTop: hp(2),
    },
    avatarSection: {
      alignItems: 'center',
    },
    ringOuter: {
      width: AVATAR_SIZE + wp(18),
      height: AVATAR_SIZE + wp(18),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(2.5),
    },
    ringFar: {
      width: AVATAR_SIZE + wp(16),
      height: AVATAR_SIZE + wp(16),
      borderRadius: (AVATAR_SIZE + wp(16)) / 2,
      borderWidth: 1,
      borderColor: palette.ringBorderSoft,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.7,
    },
    ringMid: {
      width: AVATAR_SIZE + wp(10),
      height: AVATAR_SIZE + wp(10),
      borderRadius: (AVATAR_SIZE + wp(10)) / 2,
      borderWidth: 1,
      borderColor: palette.ringBorderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringInner: {
      width: AVATAR_SIZE + wp(4),
      height: AVATAR_SIZE + wp(4),
      borderRadius: (AVATAR_SIZE + wp(4)) / 2,
      borderWidth: 2,
      borderColor: palette.ringBorder,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: palette.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
        },
        android: { elevation: 8 },
      }),
    },
    ringDot: {
      position: 'absolute',
      right: wp(5),
      top: AVATAR_SIZE / 2,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: palette.primary,
      borderWidth: 2,
      borderColor: palette.bg,
    },
    avatarImage: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
    },
    avatarFallback: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      color: palette.textOnPrimary,
      fontFamily: fonts.semibold,
      fontSize: wp(8),
    },
    contactName: {
      color: palette.text,
      fontFamily: fonts.bold,
      fontSize: wp(6.8),
      textAlign: 'center',
      marginBottom: hp(1.4),
      letterSpacing: 0.3,
    },
    statusPill: {
      paddingHorizontal: wp(6),
      paddingVertical: hp(1),
      borderRadius: 999,
      backgroundColor: palette.keySurface,
      marginBottom: hp(1),
      minWidth: wp(32),
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: palette.keyShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: palette.isDark ? 0.2 : 0.08,
          shadowRadius: 10,
        },
        android: { elevation: 2 },
      }),
    },
    timer: {
      color: palette.primary,
      fontFamily: fonts.semibold,
      fontSize: wp(5.8),
      letterSpacing: 3,
      fontVariant: ['tabular-nums'],
    },
    statusPulse: {
      color: palette.statusText,
      fontFamily: fonts.medium,
      fontSize: wp(4),
      letterSpacing: 1.2,
    },
    callTypeLabel: {
      color: palette.textMuted,
      fontFamily: fonts.regular,
      fontSize: wp(3.2),
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-start',
      marginBottom: hp(3),
      paddingHorizontal: wp(2),
    },
    controlItem: {
      alignItems: 'center',
      width: wp(22),
    },
    controlBtn: {
      width: wp(15.5),
      height: wp(15.5),
      borderRadius: wp(7.75),
      backgroundColor: palette.keySurface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(1),
      ...Platform.select({
        ios: {
          shadowColor: palette.keyShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: palette.isDark ? 0.22 : 0.1,
          shadowRadius: 8,
        },
        android: { elevation: 3 },
      }),
    },
    controlBtnActive: {
      borderWidth: 1.5,
      borderColor: palette.controlActiveBorder,
    },
    controlLabel: {
      color: palette.textMuted,
      fontFamily: fonts.medium,
      fontSize: wp(2.7),
      letterSpacing: 1.4,
    },
    controlLabelActive: {
      color: palette.primary,
    },
    dialpadWrap: {
      alignItems: 'center',
      gap: hp(1.2),
    },
    dialpadRow: {
      flexDirection: 'row',
      gap: wp(4),
    },
    dtmfKey: {
      width: wp(16),
      height: wp(16),
      borderRadius: wp(8),
      backgroundColor: palette.dtmfBg,
      borderWidth: 1,
      borderColor: palette.controlBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dtmfKeyText: {
      color: palette.text,
      fontFamily: fonts.semibold,
      fontSize: wp(5),
    },
    hideDialpadBtn: {
      marginTop: hp(1),
      paddingVertical: hp(1),
      paddingHorizontal: wp(4),
    },
    hideDialpadText: {
      color: palette.primary,
      fontFamily: fonts.medium,
      fontSize: wp(3.2),
    },
    endCallSection: {
      alignItems: 'center',
    },
    endCallGlowWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(1),
    },
    endCallGlow: {
      position: 'absolute',
      width: wp(22),
      height: wp(22),
      borderRadius: wp(11),
      opacity: 0.6,
    },
    endCallTouchable: {
      borderRadius: wp(9.5),
    },
    endCallBtn: {
      width: wp(19),
      height: wp(19),
      borderRadius: wp(9.5),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.2)',
      ...Platform.select({
        ios: {
          shadowColor: palette.danger,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
        },
        android: { elevation: 8 },
      }),
    },
    endCallLabel: {
      color: palette.danger,
      fontFamily: fonts.medium,
      fontSize: wp(2.8),
      letterSpacing: 1.5,
    },
  })
}
