import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, Platform, ToastAndroid, ActivityIndicator } from 'react-native'
import { Alert } from '../../../utils/alert'
import { useFocusEffect } from '@react-navigation/native'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/Feather'
import SettingHeader from '../../../component/settingHeader'
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero'
import LoadingView from '../../../component/LoadingView'
import TwoFactorSetupModal from '../../../component/twoFactor/TwoFactorSetupModal'
import BackupCodesModal from '../../../component/twoFactor/BackupCodesModal'
import { useTheme } from '../../../hooks/useTheme'
import getStyles from './styles'
import {
  getUser2faStatus,
  disableUser2fa,
  regenerateUser2faBackupCodes,
} from '../../../api'

const SECURITY_FEATURES = [
  {
    icon: 'smartphone',
    title: 'Authenticator app',
    desc: 'Use Google Authenticator or any TOTP app',
  },
  {
    icon: 'shield',
    title: 'Extra protection',
    desc: 'Adds a second step when signing in',
  },
  {
    icon: 'key',
    title: 'Backup codes',
    desc: 'Recover access if you lose your device',
  },
]

function showToast(title, message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
    return
  }
  Alert.alert(title, message)
}

function unwrapPayload(payload) {
  if (payload == null) return null
  return payload?.data ?? payload?.result ?? payload
}

function normalize2faStatus(payload) {
  const root = unwrapPayload(payload) || {}
  return {
    enabled: !!(root?.enabled ?? root?.isEnabled ?? root?.two_factor_enabled),
    hasBackupCodes: !!(root?.hasBackupCodes ?? root?.has_backup_codes),
    canReEnable: !!(root?.canReEnable ?? root?.can_re_enable),
    hasSecret: !!(root?.hasSecret ?? root?.has_secret),
  }
}

function pickBackupCodes(payload) {
  const root = unwrapPayload(payload)
  const codes = root?.backupCodes ?? root?.backup_codes ?? root?.codes
  return Array.isArray(codes) ? codes.map(String) : []
}

export default function TwoFA({ navigation }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])

  const token = useSelector((state) => state.auth.token)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState({
    enabled: false,
    hasBackupCodes: false,
    canReEnable: false,
    hasSecret: false,
  })
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  const [setupMode, setSetupMode] = useState('setup')
  const [backupCodesModalOpen, setBackupCodesModalOpen] = useState(false)
  const [regeneratedCodes, setRegeneratedCodes] = useState([])
  const [actionLoading, setActionLoading] = useState(false)

  const loadStatus = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) return

      if (!silent) setLoading(true)
      else setRefreshing(true)

      try {
        const response = await getUser2faStatus(token)
        setStatus(normalize2faStatus(response))
      } catch (error) {
        console.error('2FA status:', error?.message || error)
        if (!silent) {
          Alert.alert('Load failed', error?.message || 'Could not load 2FA status.')
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [token],
  )

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  useFocusEffect(
    useCallback(() => {
      loadStatus({ silent: true })
    }, [loadStatus]),
  )

  const openSetup = (mode = 'setup') => {
    setSetupMode(mode)
    setSetupModalOpen(true)
  }

  const handleEnablePress = () => {
    if (status.enabled) return

    if (status.canReEnable) {
      openSetup('reenable')
      return
    }

    openSetup('setup')
  }

  const handleSetupComplete = () => {
    loadStatus({ silent: true })
    showToast('2FA', status.canReEnable ? 'Two-factor authentication re-enabled.' : 'Two-factor authentication enabled.')
  }

  const handleDisable = () => {
    Alert.alert(
      'Disable 2FA',
      'Are you sure you want to disable two-factor authentication? Your account will be less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true)
              await disableUser2fa({ token })
              await loadStatus({ silent: true })
              showToast('2FA', 'Two-factor authentication disabled.')
            } catch (error) {
              Alert.alert('Disable failed', error?.message || 'Could not disable 2FA.')
            } finally {
              setActionLoading(false)
            }
          },
        },
      ],
    )
  }

  const handleRegenerateCodes = () => {
    Alert.alert(
      'Regenerate backup codes',
      'This will invalidate your existing backup codes. Save the new codes in a safe place.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true)
              const response = await regenerateUser2faBackupCodes(token)
              const codes = pickBackupCodes(response)
              if (!codes.length) {
                Alert.alert('No codes returned', 'Backup codes were not returned by the server.')
                return
              }
              setRegeneratedCodes(codes)
              setBackupCodesModalOpen(true)
              await loadStatus({ silent: true })
            } catch (error) {
              Alert.alert('Regenerate failed', error?.message || 'Could not regenerate backup codes.')
            } finally {
              setActionLoading(false)
            }
          },
        },
      ],
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <SettingHeader navigation={navigation} title="2FA" />
        <LoadingView text="Loading 2FA status..." flex />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title="2FA" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHero
          colors={colors}
          isDark={isDark}
          styles={styles}
          icon="shield"
          title="Two-Factor Authentication"
          subtitle="Secure your account with Google Authenticator for an extra layer of protection."
        />

        <SettingsStatPills
          styles={styles}
          items={[
            { value: status.enabled ? 'Enabled' : 'Disabled', label: 'Status' },
            { value: status.hasBackupCodes ? 'Yes' : 'No', label: 'Backup codes' },
          ]}
        />

        {status.enabled ? (
          <View style={styles.enabledBanner}>
            <Icon name="check-circle" size={20} color={colors.success} />
            <Text style={styles.enabledBannerText}>
              Two-factor authentication is active on your account.
            </Text>
          </View>
        ) : status.canReEnable ? (
          <View style={styles.reenableBanner}>
            <Icon name="refresh-cw" size={18} color={colors.primary} />
            <Text style={styles.reenableBannerText}>
              2FA was previously set up. You can re-enable it without scanning a new QR code.
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>How it protects you</Text>
        <View style={styles.card}>
          {SECURITY_FEATURES.map((feature, index) => (
            <View key={feature.title}>
              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Icon name={feature.icon} size={17} color={colors.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              </View>
              {index < SECURITY_FEATURES.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <Icon name="info" size={16} color={colors.primary} />
            <Text style={styles.infoTitle}>
              {status.enabled ? 'Managing 2FA' : 'Before you enable'}
            </Text>
          </View>
          <Text style={styles.infoText}>
            {status.enabled
              ? 'Use backup codes if you lose your authenticator device. Regenerating codes invalidates the old ones.'
              : "You'll need an authenticator app installed on your phone. After scanning the QR code, save your backup codes in a safe place."}
          </Text>
        </View>

        {!status.enabled ? (
          <Pressable
            onPress={handleEnablePress}
            disabled={actionLoading}
            style={({ pressed }) => [
              styles.successBtn,
              pressed && { opacity: 0.9 },
              actionLoading && styles.btnDisabled,
            ]}
          >
            {actionLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Icon name="lock" size={18} color={colors.white} />
                <Text style={styles.successBtnText}>
                  {status.canReEnable ? 'Re-enable 2FA' : 'Enable 2FA'}
                </Text>
              </>
            )}
          </Pressable>
        ) : (
          <View style={styles.actionGroup}>
            <Pressable
              onPress={handleRegenerateCodes}
              disabled={actionLoading}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.9 },
                actionLoading && styles.btnDisabled,
              ]}
            >
              <Icon name="refresh-cw" size={16} color={colors.appText || colors.text} />
              <Text style={styles.secondaryBtnText}>Regenerate backup codes</Text>
            </Pressable>

            <Pressable
              onPress={handleDisable}
              disabled={actionLoading}
              style={({ pressed }) => [
                styles.dangerBtn,
                pressed && { opacity: 0.9 },
                actionLoading && styles.btnDisabled,
              ]}
            >
              <Icon name="unlock" size={16} color={colors.danger || '#DC2626'} />
              <Text style={styles.dangerBtnText}>Disable 2FA</Text>
            </Pressable>
          </View>
        )}

        {refreshing ? (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.stateText}>Refreshing status...</Text>
          </View>
        ) : null}
      </ScrollView>

      <TwoFactorSetupModal
        visible={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        onComplete={handleSetupComplete}
        token={token}
        mode={setupMode}
      />

      <BackupCodesModal
        visible={backupCodesModalOpen}
        codes={regeneratedCodes}
        onClose={() => {
          setBackupCodesModalOpen(false)
          setRegeneratedCodes([])
        }}
      />
    </View>
  )
}
