import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Alert } from '../../utils/alert'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import DialerPad from '../dialerpad'
import VoiceCallScreen from '../voicecallscreen'
import { images } from '../../constant'
import { useTheme } from '../../hooks/useTheme'
import { onInitiateCall, onOpenDialer } from '../../utils/callEvents'
import { initiateOutboundCall } from '../../services/twilioVoice'

export default function GlobalDialer({ hidden = false, fabHidden = false }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => getStyles(colors, insets.bottom), [colors, insets.bottom])

  const token = useSelector((state) => state.auth.token)
  const user = useSelector((state) => state.auth.user)

  const [dialerVisible, setDialerVisible] = useState(false)
  const [dialerCalling, setDialerCalling] = useState(false)
  const [voiceCallVisible, setVoiceCallVisible] = useState(false)
  const [initialNumber, setInitialNumber] = useState('')
  const [pendingLeadId, setPendingLeadId] = useState(null)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [avatarUri, setAvatarUri] = useState(null)

  const placeCall = useCallback(async ({
    number,
    leadId = null,
    name = '',
    avatar = null,
  }) => {
    const trimmed = String(number || '').trim()
    if (!trimmed) return

    if (!token || !user) {
      Alert.alert('Sign in required', 'Please sign in to place calls.')
      return
    }

    setPendingLeadId(leadId)
    setContactName(name || '')
    setContactPhone(trimmed)
    setAvatarUri(avatar || null)
    setDialerCalling(true)
    setDialerVisible(false)
    setVoiceCallVisible(true)

    try {
      const result = await initiateOutboundCall({
        token,
        user,
        phoneNumber: trimmed,
        leadId,
      })
      console.log('[GlobalDialer] Twilio call started', result?.to)
    } catch (err) {
      console.error('[GlobalDialer] call failed:', err?.message || err, err?.details)
      setVoiceCallVisible(false)
      Alert.alert('Call failed', err?.message || 'Could not start the call.')
    } finally {
      setDialerCalling(false)
    }
  }, [token, user])

  const handleDialerCall = useCallback(async (number) => {
    if (!number || dialerCalling) return
    await placeCall({
      number,
      leadId: pendingLeadId,
      name: contactName,
      avatar: avatarUri,
    })
  }, [dialerCalling, placeCall, pendingLeadId, contactName, avatarUri])

  const openDialer = useCallback((phoneNumber = '', {
    leadId = null,
    name = '',
    avatar = null,
  } = {}) => {
    setPendingLeadId(leadId)
    setContactName(name || '')
    setAvatarUri(avatar || null)
    setInitialNumber(String(phoneNumber || ''))
    setDialerVisible(true)
  }, [])

  useEffect(() => {
    return onInitiateCall(({
      phoneNumber,
      leadId,
      contactName: name,
      avatarUri: avatar,
    } = {}) => {
      const phone = String(phoneNumber || '').trim()
      if (!phone) return
      placeCall({ number: phone, leadId, name, avatar })
    })
  }, [placeCall])

  useEffect(() => {
    return onOpenDialer(({
      phoneNumber,
      leadId,
      contactName: name,
      avatarUri: avatar,
    } = {}) => {
      const phone = String(phoneNumber || '').trim()
      if (!phone) return
      openDialer(phone, { leadId, name, avatar })
    })
  }, [openDialer])

  const onVoiceCallClose = useCallback(() => {
    setVoiceCallVisible(false)
    setContactName('')
    setContactPhone('')
    setAvatarUri(null)
    setPendingLeadId(null)
  }, [])

  if (hidden) return null

  return (
    <>
      {!fabHidden ? (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.fab}
          onPress={() => openDialer()}
          accessibilityRole="button"
          accessibilityLabel="Open phone dialer"
        >
          <Image source={images.phone} style={styles.fabIcon} resizeMode="contain" />
        </TouchableOpacity>
      ) : null}

      <DialerPad
        visible={dialerVisible}
        initialNumber={initialNumber}
        calling={dialerCalling}
        onClose={() => setDialerVisible(false)}
        onCall={handleDialerCall}
      />

      <VoiceCallScreen
        visible={voiceCallVisible}
        contactName={contactName}
        contactPhone={contactPhone}
        avatarUri={avatarUri}
        onClose={onVoiceCallClose}
      />
    </>
  )
}

const getStyles = (themeColors, bottomInset) => StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: Math.max(100, bottomInset + 12),
    width: 46,
    height: 46,
    borderRadius: 28,
    backgroundColor: themeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 999,
  },
  fabIcon: {
    width: 28,
    height: 28,
    tintColor: themeColors.white,
  },
})
