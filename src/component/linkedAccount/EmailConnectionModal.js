import React, { useEffect, useMemo, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Switch, ActivityIndicator, useWindowDimensions } from 'react-native'
import { Alert } from '../../utils/alert'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Feather'
import Input from '../input'
import { fonts } from '../../constant'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../theme/layout'
import { useTheme } from '../../hooks/useTheme'
import {
  testImapConnection,
  connectImapAccount,
  testPop3Connection,
  connectPop3Account,
} from '../../api'

const PROVIDER_PRESETS = {
  gmail: {
    label: 'Gmail',
    host: 'imap.gmail.com',
    pop3Host: 'pop.gmail.com',
    port: '993',
    pop3Port: '995',
    ssl: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpSsl: true,
  },
  outlook: {
    label: 'Outlook',
    host: 'outlook.office365.com',
    pop3Host: 'outlook.office365.com',
    port: '993',
    pop3Port: '995',
    ssl: true,
    smtpHost: 'smtp.office365.com',
    smtpPort: '587',
    smtpSsl: true,
  },
  yahoo: {
    label: 'Yahoo',
    host: 'imap.mail.yahoo.com',
    pop3Host: 'pop.mail.yahoo.com',
    port: '993',
    pop3Port: '995',
    ssl: true,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: '465',
    smtpSsl: true,
  },
  custom: {
    label: 'Custom',
    host: '',
    pop3Host: '',
    port: '',
    pop3Port: '',
    ssl: true,
    smtpHost: '',
    smtpPort: '',
    smtpSsl: true,
  },
}

const EMPTY_FORM = {
  provider: 'gmail',
  email: '',
  password: '',
  host: '',
  port: '',
  ssl: true,
  smtpHost: '',
  smtpPort: '',
  smtpSsl: true,
  showSmtp: false,
}

function buildPayload(form) {
  const port = parseInt(form.port, 10)
  const smtpPort = parseInt(form.smtpPort, 10)
  const payload = {
    email: form.email.trim(),
    password: form.password,
    host: form.host.trim(),
    port: Number.isFinite(port) ? port : undefined,
    secure: form.ssl,
  }

  if (form.showSmtp && form.smtpHost.trim()) {
    payload.smtp = {
      host: form.smtpHost.trim(),
      port: Number.isFinite(smtpPort) ? smtpPort : undefined,
      secure: form.smtpSsl,
    }
  }

  return payload
}

export default function EmailConnectionModal({
  visible,
  protocol = 'imap',
  token,
  onClose,
  onConnected,
}) {
  const { colors } = useTheme()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const isCompact = screenWidth < 380
  const isWide = screenWidth >= 600
  const styles = useMemo(() => getStyles(colors, { isCompact, isWide, screenHeight }), [colors, isCompact, isWide, screenHeight])
  const [form, setForm] = useState(EMPTY_FORM)
  const [testing, setTesting] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [testPassed, setTestPassed] = useState(false)

  const title = protocol === 'imap' ? 'Connect via IMAP' : 'Connect via POP3'
  const providers = useMemo(() => Object.entries(PROVIDER_PRESETS), [])

  useEffect(() => {
    if (!visible) return
    const preset = PROVIDER_PRESETS.gmail
    const host = protocol === 'imap' ? preset.host : preset.pop3Host
    const port = protocol === 'imap' ? preset.port : preset.pop3Port
    setForm({
      ...EMPTY_FORM,
      provider: 'gmail',
      host,
      port,
      ssl: preset.ssl,
      smtpHost: preset.smtpHost,
      smtpPort: preset.smtpPort,
      smtpSsl: preset.smtpSsl,
    })
    setTestPassed(false)
  }, [visible, protocol])

  const applyProvider = (providerKey) => {
    const preset = PROVIDER_PRESETS[providerKey] || PROVIDER_PRESETS.custom
    const host = protocol === 'imap' ? preset.host : preset.pop3Host
    const port = protocol === 'imap' ? preset.port : preset.pop3Port
    setForm((prev) => ({
      ...prev,
      provider: providerKey,
      host,
      port,
      ssl: preset.ssl,
      smtpHost: preset.smtpHost,
      smtpPort: preset.smtpPort,
      smtpSsl: preset.smtpSsl,
    }))
    setTestPassed(false)
  }

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setTestPassed(false)
  }

  const validate = () => {
    if (!form.email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.')
      return false
    }
    if (!form.password) {
      Alert.alert('Missing password', 'Please enter your email password or app password.')
      return false
    }
    if (!form.host.trim()) {
      Alert.alert('Missing server', `Please enter the ${protocol.toUpperCase()} host.`)
      return false
    }
    if (!form.port.trim()) {
      Alert.alert('Missing port', `Please enter the ${protocol.toUpperCase()} port.`)
      return false
    }
    return true
  }

  const runTest = async () => {
    if (!validate()) return
    try {
      setTesting(true)
      const payload = buildPayload(form)
      const testFn = protocol === 'imap' ? testImapConnection : testPop3Connection
      await testFn({ token, payload })
      setTestPassed(true)
      Alert.alert('Connection successful', 'Server settings are valid. You can connect now.')
    } catch (error) {
      setTestPassed(false)
      Alert.alert('Connection failed', error?.message || 'Could not verify server settings.')
    } finally {
      setTesting(false)
    }
  }

  const runConnect = async () => {
    if (!validate()) return
    if (!testPassed) {
      Alert.alert('Test required', 'Please test the connection before connecting.')
      return
    }
    try {
      setConnecting(true)
      const payload = buildPayload(form)
      const connectFn = protocol === 'imap' ? connectImapAccount : connectPop3Account
      await connectFn({ token, payload })
      onConnected?.()
      onClose?.()
    } catch (error) {
      Alert.alert('Connect failed', error?.message || 'Could not connect this email account.')
    } finally {
      setConnecting(false)
    }
  }

  const busy = testing || connecting

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Icon name="arrow-left" size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Icon name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>Provider</Text>
            <View style={styles.providerRow}>
              {providers.map(([key, preset]) => {
                const active = form.provider === key
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.providerChip, active && styles.providerChipActive]}
                    onPress={() => applyProvider(key)}
                  >
                    <Text style={[styles.providerChipText, active && styles.providerChipTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <Input
              heading="Email"
              plac="you@company.com"
              val={form.email}
              onchan={(t) => updateForm({ email: t })}
              wid="100%"
              hig="6"
              brderclr={colors.border}
              autoCapitalize="none"
            />
            <Input
              heading="Password"
              plac="Email password or app password"
              val={form.password}
              onchan={(t) => updateForm({ password: t })}
              wid="100%"
              hig="6"
              brderclr={colors.border}
              isImg="yes"
            />

            <Input
              heading={`${protocol.toUpperCase()} host`}
              plac={`${protocol}.example.com`}
              val={form.host}
              onchan={(t) => updateForm({ host: t })}
              wid="100%"
              hig="6"
              brderclr={colors.border}
              autoCapitalize="none"
            />
            <Input
              heading={`${protocol.toUpperCase()} port`}
              plac="993"
              val={form.port}
              onchan={(t) => updateForm({ port: t })}
              wid="100%"
              hig="6"
              brderclr={colors.border}
            />

            <View style={styles.switchRow}>
              <Switch
                value={form.ssl}
                onValueChange={(v) => updateForm({ ssl: v })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
              <Text style={styles.switchLabel}>Use SSL</Text>
            </View>

            <TouchableOpacity
              style={styles.smtpToggle}
              onPress={() => updateForm({ showSmtp: !form.showSmtp })}
            >
              <Icon name={form.showSmtp ? 'chevron-down' : 'chevron-right'} size={16} color={colors.gray} />
              <Text style={styles.smtpToggleText}>Optional SMTP settings</Text>
            </TouchableOpacity>

            {form.showSmtp ? (
              <>
                <Input
                  heading="SMTP host"
                  plac="smtp.example.com"
                  val={form.smtpHost}
                  onchan={(t) => updateForm({ smtpHost: t })}
                  wid="100%"
                  hig="6"
                  brderclr={colors.border}
                  autoCapitalize="none"
                />
                <Input
                  heading="SMTP port"
                  plac="587"
                  val={form.smtpPort}
                  onchan={(t) => updateForm({ smtpPort: t })}
                  wid="100%"
                  hig="6"
                  brderclr={colors.border}
                />
                <View style={styles.switchRow}>
                  <Switch
                    value={form.smtpSsl}
                    onValueChange={(v) => updateForm({ smtpSsl: v })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                  <Text style={styles.switchLabel}>SMTP SSL</Text>
                </View>
              </>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.secondaryBtn, busy && styles.btnDisabled]}
              onPress={runTest}
              disabled={busy}
            >
              {testing ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.secondaryBtnText}>Test connection</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, (!testPassed || busy) && styles.btnDisabled]}
              onPress={runConnect}
              disabled={!testPassed || busy}
            >
              {connecting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const getStyles = (colors, { isCompact = false, isWide = false, screenHeight = 800 } = {}) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      paddingHorizontal: isWide ? wp(12) : wp(4),
    },
    card: {
      maxHeight: Math.min(screenHeight * 0.9, 720),
      width: '100%',
      maxWidth: isWide ? 520 : undefined,
      alignSelf: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: isCompact ? wp(3.5) : wp(4),
      paddingTop: hp(2),
      paddingBottom: hp(2),
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: hp(1.5),
    },
    title: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: isCompact ? 15 : 16,
      flex: 1,
      textAlign: 'center',
    },
    sectionLabel: {
      color: colors.gray,
      fontFamily: fonts.semibold,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: hp(1),
    },
    providerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: wp(2),
      marginBottom: hp(1.5),
    },
    providerChip: {
      paddingHorizontal: wp(3),
      paddingVertical: hp(0.8),
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
    },
    providerChipActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}15`,
    },
    providerChipText: {
      color: colors.gray,
      fontFamily: fonts.medium,
      fontSize: 12,
    },
    providerChipTextActive: {
      color: colors.primary,
      fontFamily: fonts.semibold,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2),
      marginBottom: hp(1.2),
    },
    switchLabel: {
      color: colors.text,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    smtpToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
      marginBottom: hp(1),
    },
    smtpToggleText: {
      color: colors.gray,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    actions: {
      flexDirection: isCompact ? 'column' : 'row',
      gap: wp(2),
      marginTop: hp(1),
    },
    secondaryBtn: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(1.5),
    },
    secondaryBtnText: {
      color: colors.primary,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    primaryBtn: {
      flex: 1,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(1.5),
    },
    primaryBtnText: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    btnDisabled: {
      opacity: 0.55,
    },
  })
