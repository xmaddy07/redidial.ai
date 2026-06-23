import React, { useEffect, useMemo, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, ActivityIndicator, Platform, Share, StyleSheet, Image } from 'react-native'
import { Alert } from '../../utils/alert'
import Icon from 'react-native-vector-icons/Feather'
import QRCode from 'react-native-qrcode-svg'
import { CodeField, Cursor } from 'react-native-confirmation-code-field'
import RNFS from 'react-native-fs'
import { fonts } from '../../constant'
import { useTheme } from '../../hooks/useTheme'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../theme/layout'
import {
  generateUser2fa,
  verifyUser2faToken,
  enableUser2fa,
  reEnableUser2fa,
} from '../../api'

const CELL_COUNT = 6
const MAX_QR_VALUE_LENGTH = 512
const MAX_TOTP_SECRET_LENGTH = 128

function isOtpAuthUrl(value) {
  return (
    typeof value === 'string' &&
    value.startsWith('otpauth://') &&
    value.length <= MAX_QR_VALUE_LENGTH
  )
}

function isQrImageUri(value) {
  if (typeof value !== 'string' || !value) return false
  if (value.startsWith('data:image/') || /^https?:\/\//i.test(value)) return true
  if (value.startsWith('otpauth://')) return false
  return /^[A-Za-z0-9+/=\s]+$/.test(value) && value.replace(/\s/g, '').length > 200
}

function toQrImageUri(value) {
  if (!isQrImageUri(value)) return ''
  if (value.startsWith('data:image/') || /^https?:\/\//i.test(value)) return value
  return `data:image/png;base64,${value.replace(/\s/g, '')}`
}

function pickQrImageUri(root) {
  const candidate = [root?.qrCode, root?.qr_code, root?.qrCodeUrl, root?.qr_code_url].find(
    isQrImageUri,
  )
  return candidate ? toQrImageUri(candidate) : ''
}

function normalizeSecret(secret) {
  const normalized = String(secret || '').trim()
  if (!normalized || normalized.length > MAX_TOTP_SECRET_LENGTH) return ''
  return normalized
}

function buildOtpAuthUrl(secret, account = 'Redidial') {
  const cleanSecret = normalizeSecret(secret)
  if (!cleanSecret) return ''

  const label = encodeURIComponent(`Redidial:${account}`)
  const issuer = encodeURIComponent('Redidial')
  return `otpauth://totp/${label}?secret=${cleanSecret}&issuer=${issuer}`
}

function unwrapPayload(payload) {
  if (payload == null) return null
  return payload?.data ?? payload?.result ?? payload
}

function pickBackupCodes(payload) {
  const root = unwrapPayload(payload)
  const codes = root?.backupCodes ?? root?.backup_codes ?? root?.codes
  return Array.isArray(codes) ? codes.map(String) : []
}

function pickGenerateData(payload) {
  const root = unwrapPayload(payload) || {}
  const secret = normalizeSecret(
    root?.secret ?? root?.manual_entry_key ?? root?.base32_secret ?? '',
  )
  const account = root?.account || root?.email || root?.user?.email || 'Redidial'
  const qrImageUri = pickQrImageUri(root)
  const otpAuthUrl = [root?.otpauthUrl, root?.otpauth_url].find(isOtpAuthUrl)
  const qrValue = otpAuthUrl || (secret ? buildOtpAuthUrl(secret, account) : '')

  return {
    secret,
    qrValue: isOtpAuthUrl(qrValue) ? qrValue : '',
    qrImageUri,
  }
}

async function shareBackupCodes(codes) {
  const text = [
    'Redidial — Two-Factor Authentication Backup Codes',
    '',
    ...codes,
    '',
    'Keep these codes in a safe place. Each code can only be used once.',
  ].join('\n')

  try {
    const path = `${RNFS.DocumentDirectoryPath}/redidial-2fa-backup-codes.txt`
    await RNFS.writeFile(path, text, 'utf8')

    await Share.share({
      title: '2FA Backup Codes',
      message: Platform.OS === 'android' ? text : undefined,
      url: Platform.OS === 'ios' ? `file://${path}` : undefined,
    })
  } catch (error) {
    await Share.share({ message: text, title: '2FA Backup Codes' })
  }
}

function TotpInput({ value, onChangeText, styles, colors, error }) {
  return (
    <View>
      <CodeField
        value={value}
        onChangeText={onChangeText}
        cellCount={CELL_COUNT}
        rootStyle={styles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.select({ ios: 'one-time-code', default: 'sms-otp' })}
        renderCell={({ index, symbol, isFocused }) => (
          <View
            key={index}
            style={[styles.codeCell, isFocused && styles.codeCellFocused]}
          >
            <Text style={styles.codeCellText}>
              {symbol || (isFocused ? <Cursor /> : null)}
            </Text>
          </View>
        )}
      />
      {!!error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

export default function TwoFactorSetupModal({
  visible,
  onClose,
  onComplete,
  token,
  mode = 'setup',
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => getStyles(colors), [colors])
  const isReEnable = mode === 'reenable'

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [secret, setSecret] = useState('')
  const [qrValue, setQrValue] = useState('')
  const [qrImageUri, setQrImageUri] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [totpError, setTotpError] = useState('')
  const [backupCodes, setBackupCodes] = useState([])

  const resetState = () => {
    setStep(isReEnable ? 2 : 1)
    setLoading(false)
    setSecret('')
    setQrValue('')
    setQrImageUri('')
    setTotpCode('')
    setTotpError('')
    setBackupCodes([])
  }

  useEffect(() => {
    if (!visible) {
      resetState()
      return
    }

    setStep(isReEnable ? 2 : 1)

    if (!isReEnable) {
      loadGenerate()
    }
  }, [visible, isReEnable])

  const loadGenerate = async () => {
    if (!token) return
    try {
      setLoading(true)
      const response = await generateUser2fa({ token })
      const data = pickGenerateData(response)
      setSecret(data.secret)
      setQrValue(data.qrValue)
      setQrImageUri(data.qrImageUri)
    } catch (error) {
      Alert.alert('Setup failed', error?.message || 'Could not generate 2FA credentials.')
      onClose?.()
    } finally {
      setLoading(false)
    }
  }

  const handleStepOneNext = () => {
    setStep(2)
    setTotpCode('')
    setTotpError('')
  }

  const handleVerifyAndEnable = async () => {
    const code = totpCode.trim()
    if (code.length !== CELL_COUNT) {
      setTotpError('Enter the 6-digit code from your authenticator app.')
      return
    }

    try {
      setLoading(true)
      setTotpError('')
      await verifyUser2faToken({ token, totpToken: code })

      const enableResponse = isReEnable
        ? await reEnableUser2fa({ token, totpToken: code })
        : await enableUser2fa({ token, totpToken: code })

      const codes = pickBackupCodes(enableResponse)
      setBackupCodes(codes)
      setStep(3)
    } catch (error) {
      setTotpError(error?.message || 'Invalid verification code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    onComplete?.()
    onClose?.()
  }

  const stepTitle =
    step === 1
      ? 'Scan QR code'
      : step === 2
        ? isReEnable
          ? 'Re-enable 2FA'
          : 'Verify code'
        : 'Backup codes'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Text style={styles.eyebrow}>
                {isReEnable ? 'Re-enable' : 'Setup'} · Step {step} of 3
              </Text>
              <Text style={styles.title}>{stepTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {loading && step !== 2 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.loadingText}>Preparing authenticator setup...</Text>
              </View>
            ) : null}

            {step === 1 && !loading ? (
              <>
                <Text style={styles.instruction}>
                  Open Google Authenticator (or any TOTP app) and scan this QR code.
                </Text>
                <View style={styles.qrWrap}>
                  {qrImageUri ? (
                    <Image
                      source={{ uri: qrImageUri }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                  ) : qrValue ? (
                    <QRCode value={qrValue} size={180} />
                  ) : null}
                </View>
                <Text style={styles.stepLabel}>Or enter manually</Text>
                <Text style={styles.instruction}>
                  Copy this secret key into your authenticator app if you cannot scan the code.
                </Text>
                <View style={styles.secretBox}>
                  <Text selectable style={styles.secretText}>
                    {secret || '—'}
                  </Text>
                </View>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Text style={styles.instruction}>
                  {isReEnable
                    ? 'Enter the 6-digit code from your authenticator app to re-enable two-factor authentication.'
                    : 'Enter the 6-digit verification code from your authenticator app to finish setup.'}
                </Text>
                <TotpInput
                  value={totpCode}
                  onChangeText={(text) => {
                    setTotpCode(text.replace(/\D/g, '').slice(0, CELL_COUNT))
                    setTotpError('')
                  }}
                  styles={styles}
                  colors={colors}
                  error={totpError}
                />
              </>
            ) : null}

            {step === 3 ? (
              <>
                <View style={styles.warningBox}>
                  <Icon name="alert-triangle" size={16} color={colors.orange || colors.warning} />
                  <Text style={styles.warningText}>
                    Save these backup codes now. Each code works once if you lose access to your
                    authenticator app.
                  </Text>
                </View>
                <View style={styles.codesBox}>
                  {backupCodes.length > 0 ? (
                    backupCodes.map((code) => (
                      <Text key={code} selectable style={styles.codeLine}>
                        {code}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.instruction}>
                      2FA is enabled. Backup codes were not returned — you can regenerate them from
                      the settings screen.
                    </Text>
                  )}
                </View>
                {backupCodes.length > 0 ? (
                  <Pressable
                    onPress={() => shareBackupCodes(backupCodes)}
                    style={({ pressed }) => [styles.downloadBtn, pressed && { opacity: 0.9 }]}
                  >
                    <Icon name="download" size={16} color={colors.primary} />
                    <Text style={styles.downloadBtnText}>Download backup codes</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {step === 1 ? (
              <>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.confirmBtn}
                  onPress={handleStepOneNext}
                  disabled={!qrValue && !qrImageUri && !secret}
                >
                  <Text style={styles.confirmBtnText}>Continue</Text>
                </Pressable>
              </>
            ) : null}

            {step === 2 ? (
              <>
                {!isReEnable ? (
                  <Pressable style={styles.cancelBtn} onPress={() => setStep(1)}>
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.cancelBtn} onPress={onClose}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.confirmBtn}
                  onPress={handleVerifyAndEnable}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      {isReEnable ? 'Re-enable 2FA' : 'Verify & Enable'}
                    </Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {step === 3 ? (
              <Pressable style={[styles.confirmBtn, { flex: 1 }]} onPress={handleFinish}>
                <Text style={styles.confirmBtnText}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      paddingHorizontal: wp(4),
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      overflow: 'hidden',
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp(4.5),
      paddingTop: hp(2),
      paddingBottom: hp(1.5),
    },
    titleWrap: {
      flex: 1,
      paddingRight: wp(2),
    },
    eyebrow: {
      color: colors.primary,
      fontFamily: fonts.semibold,
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    title: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: 17,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    body: {
      paddingHorizontal: wp(4.5),
      paddingBottom: hp(2),
    },
    loadingBox: {
      alignItems: 'center',
      paddingVertical: hp(4),
      gap: 12,
    },
    loadingText: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 13,
    },
    stepLabel: {
      color: colors.text,
      fontFamily: fonts.semibold,
      fontSize: 13,
      marginBottom: hp(0.8),
      marginTop: hp(0.5),
    },
    instruction: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: hp(1.2),
    },
    qrWrap: {
      alignSelf: 'center',
      padding: wp(3.5),
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: '#FFFFFF',
      marginBottom: hp(1.5),
    },
    qrImage: {
      width: 180,
      height: 180,
    },
    secretBox: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(1.5),
      marginBottom: hp(1),
    },
    secretText: {
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 11,
      lineHeight: 18,
      letterSpacing: 0.3,
    },
    codeFieldRoot: {
      justifyContent: 'space-between',
      marginTop: hp(1),
      marginBottom: hp(1),
    },
    codeCell: {
      width: 44,
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBg,
    },
    codeCellFocused: {
      borderColor: colors.primary,
    },
    codeCellText: {
      color: colors.text,
      fontFamily: fonts.medium,
      fontSize: 18,
    },
    errorText: {
      color: colors.danger,
      fontFamily: fonts.regular,
      fontSize: 12,
      marginTop: 4,
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: `${colors.orange || colors.warning || '#F59E0B'}12`,
      borderRadius: 12,
      padding: wp(3.5),
      marginBottom: hp(1.5),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.orange || colors.warning || '#F59E0B'}30`,
    },
    warningText: {
      flex: 1,
      color: colors.appText || colors.text,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
    },
    codesBox: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: wp(3.5),
      gap: 8,
      marginBottom: hp(1.5),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    codeLine: {
      color: colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
      letterSpacing: 1,
    },
    downloadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: hp(1.4),
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.primary}35`,
      backgroundColor: `${colors.primary}08`,
    },
    downloadBtnText: {
      color: colors.primary,
      fontFamily: fonts.semibold,
      fontSize: 13,
    },
    footer: {
      flexDirection: 'row',
      gap: wp(2.5),
      paddingHorizontal: wp(4.5),
      paddingVertical: hp(2),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: hp(1.5),
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      color: colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    confirmBtn: {
      flex: 1.4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: hp(1.5),
    },
    confirmBtnText: {
      color: colors.white,
      fontFamily: fonts.bold,
      fontSize: 13,
    },
  })
}
