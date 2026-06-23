import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, Linking, ActivityIndicator, Platform, ToastAndroid } from 'react-native'
import { Alert } from '../../../utils/alert'
import { useFocusEffect } from '@react-navigation/native'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import LoadingView from '../../../component/LoadingView'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import IconFA from 'react-native-vector-icons/FontAwesome'
import getStyles from './styles'
import { useTheme } from '../../../hooks/useTheme'
import SettingHeader from '../../../component/settingHeader'
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero'
import EmailConnectionModal from '../../../component/linkedAccount/EmailConnectionModal'
import {
  getOrganizationLinkedStatus,
  getGmailV2Authorization,
  disconnectOrganizationLinkedStatus,
  getFacebookAuthorization,
  getOrganizationFacebookLinkedStatus,
  disconnectOrganizationFacebookLinkedStatus,
} from '../../../api'
import { useSelector } from 'react-redux'
import moment from 'moment'

const EMAIL_TYPES = new Set(['GMAIL', 'IMAP', 'POP3'])
const TOTAL_INTEGRATIONS = 2

const INVALIDATION_LABELS = {
  RE_AUTH_REQUIRED: 'Re-authentication required',
  TOKEN_EXPIRED: 'Token expired',
  ACCESS_REVOKED: 'Access revoked',
}

const CONNECTION_LABELS = {
  GMAIL: 'Gmail (OAuth)',
  IMAP: 'IMAP',
  POP3: 'POP3',
}

const CONNECT_OPTIONS = [
  {
    id: 'gmail',
    title: 'Gmail OAuth',
    desc: 'Sign in with Google securely',
    icon: 'mail',
    color: '#EA4335',
  },
  {
    id: 'imap',
    title: 'Connect IMAP',
    desc: 'Use your email server settings',
    icon: 'server',
    color: null,
  },
  {
    id: 'pop3',
    title: 'Connect POP3',
    desc: 'Import mail via POP3',
    icon: 'download',
    color: null,
  },
]

const LINKED_SUCCESS_MESSAGES = {
  gmail: 'Gmail account connected successfully.',
  facebook: 'Facebook account connected successfully.',
}

function showToast(title, message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
    return
  }
  Alert.alert(title, message)
}

function pickInvalidationReason(status) {
  return (
    status?.last_auth_error ||
    status?.invalidation_reason ||
    status?.auth_invalidation ||
    status?.linked_invalidation_reason ||
    status?.error_code ||
    null
  )
}

function IntegrationCard({
  label,
  title,
  subtitle,
  iconNode,
  isActive,
  metaChips,
  footerLeft,
  footerAction,
  footerFull,
  styles,
  colors,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.serviceRow}>
          {iconNode}
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceLabel}>{label}</Text>
            <Text style={styles.serviceText} numberOfLines={1}>
              {title}
            </Text>
            {!!subtitle && (
              <Text style={styles.serviceSubtext} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={isActive ? styles.activeBadge : styles.inactiveBadge}>
            <Text style={isActive ? styles.activeBadgeText : styles.inactiveBadgeText}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {metaChips?.length > 0 ? (
        <View style={styles.metaChips}>
          {metaChips.map((chip) => (
            <View key={chip.key} style={styles.metaChip}>
              <Icon name={chip.icon} size={12} color={colors.gray} />
              <Text style={styles.metaChipText}>{chip.text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {footerFull ? (
        <>
          <View style={styles.divider} />
          {footerFull}
        </>
      ) : null}

      {!footerFull && (footerLeft || footerAction) ? (
        <>
          <View style={styles.divider} />
          <View style={styles.footerRow}>
            <View style={styles.footerActions}>{footerLeft}</View>
            {footerAction}
          </View>
        </>
      ) : null}
    </View>
  )
}

export default function LinkedAccount({ navigation, route }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])
  const token = useSelector((state) => state.auth.token)

  const [linkedStatus, setLinkedStatus] = useState(null)
  const [facebookStatus, setFacebookStatus] = useState(null)
  const [authorizing, setAuthorizing] = useState(false)
  const [facebookAuthorizing, setFacebookAuthorizing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [facebookDisconnecting, setFacebookDisconnecting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [emailModal, setEmailModal] = useState(null)

  const linkedType = linkedStatus?.linked_status
  const isEmailConnected = EMAIL_TYPES.has(linkedType)
  const isUnlinked = !isEmailConnected
  const invalidationReason = pickInvalidationReason(linkedStatus)
  const unlinkedAt = linkedStatus?.unlinked_at || linkedStatus?.disconnected_at
  const needsReauth = Boolean(invalidationReason || unlinkedAt)
  const isFacebookConnected = Boolean(
    facebookStatus?.facebook_linked ||
    facebookStatus?.linked ||
    facebookStatus?.is_linked,
  )
  const connectedCount = (isEmailConnected ? 1 : 0) + (isFacebookConnected ? 1 : 0)
  const availableCount = TOTAL_INTEGRATIONS - connectedCount

  const fetchStatuses = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const [emailRes, facebookRes] = await Promise.allSettled([
        getOrganizationLinkedStatus(token),
        getOrganizationFacebookLinkedStatus(token),
      ])
      if (emailRes.status === 'fulfilled') {
        setLinkedStatus(emailRes.value)
      } else {
        console.error('Error fetching linked status:', emailRes.reason)
      }
      if (facebookRes.status === 'fulfilled') {
        setFacebookStatus(facebookRes.value)
      } else {
        setFacebookStatus(null)
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  useFocusEffect(
    useCallback(() => {
      fetchStatuses()
    }, [fetchStatuses]),
  )

  useEffect(() => {
    if (route?.params?.authRequired) {
      Alert.alert(
        'Email reconnection required',
        'Your email connection needs attention. Please reconnect your account.',
      )
      navigation.setParams({ authRequired: undefined })
    }
  }, [route?.params?.authRequired, navigation])

  useEffect(() => {
    const linked = route?.params?.linked
    if (!linked) return
    const message = LINKED_SUCCESS_MESSAGES[linked]
    if (message) {
      showToast('Linked Accounts', message)
      fetchStatuses()
    }
    navigation.setParams({ linked: undefined })
  }, [route?.params?.linked, navigation, fetchStatuses])

  const openAuthUrl = async (getAuthFn, setBusy, providerLabel) => {
    try {
      setBusy(true)
      const res = await getAuthFn({ token })
      const url = res?.authUrl || res?.url || res?.authorizationUrl || res?.data?.url

      if (url) {
        const supported = await Linking.canOpenURL(url)
        if (supported) {
          await Linking.openURL(url)
        } else {
          Alert.alert('Cannot open URL', `No application can handle the ${providerLabel} authorization URL.`)
        }
      } else {
        Alert.alert('Authorization Failed', 'No authorization URL returned by server.')
      }
    } catch (e) {
      Alert.alert('Authorization Error', e?.message || `Something went wrong during ${providerLabel} authorization.`)
    } finally {
      setBusy(false)
    }
  }

  const handleGmailAuthorize = () => {
    openAuthUrl(getGmailV2Authorization, setAuthorizing, 'Gmail')
  }

  const handleFacebookAuthorize = () => {
    openAuthUrl(getFacebookAuthorization, setFacebookAuthorizing, 'Facebook')
  }

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect email',
      'Are you sure you want to disconnect this email account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setDisconnecting(true)
              await disconnectOrganizationLinkedStatus({ token })
              await fetchStatuses()
            } catch (error) {
              Alert.alert('Disconnect failed', error?.message || 'Could not disconnect the account.')
            } finally {
              setDisconnecting(false)
            }
          },
        },
      ],
    )
  }

  const handleFacebookDisconnect = () => {
    Alert.alert(
      'Disconnect Facebook',
      'Are you sure you want to disconnect your Facebook page?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setFacebookDisconnecting(true)
              await disconnectOrganizationFacebookLinkedStatus({ token })
              await fetchStatuses()
            } catch (error) {
              Alert.alert('Disconnect failed', error?.message || 'Could not disconnect Facebook.')
            } finally {
              setFacebookDisconnecting(false)
            }
          },
        },
      ],
    )
  }

  const handleConnectOption = (id) => {
    if (id === 'gmail') {
      handleGmailAuthorize()
      return
    }
    setEmailModal(id)
  }

  const handleEmailConnected = async () => {
    setLoading(true)
    await fetchStatuses()
    showToast('Linked Accounts', 'Email account connected successfully.')
  }

  const renderConnectOptions = () => (
    <View style={styles.connectOptions}>
      {CONNECT_OPTIONS.map((option) => (
        <Pressable
          key={option.id}
          onPress={() => handleConnectOption(option.id)}
          disabled={option.id === 'gmail' && authorizing}
          style={({ pressed }) => [
            styles.connectOptionRow,
            pressed && styles.connectOptionRowPressed,
            option.id === 'gmail' && authorizing && styles.btnDisabled,
          ]}
        >
          <LinearGradient
            colors={
              option.color
                ? [option.color, option.color]
                : [colors.primary, `${colors.primary}CC`]
            }
            style={styles.connectOptionIcon}
          >
            {option.id === 'gmail' && authorizing ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Icon name={option.icon} size={15} color={colors.white} />
            )}
          </LinearGradient>
          <View style={styles.connectOptionBody}>
            <Text style={styles.connectOptionTitle}>{option.title}</Text>
            <Text style={styles.connectOptionDesc}>{option.desc}</Text>
          </View>
          <Icon name="chevron-right" size={16} color={colors.gray} />
        </Pressable>
      ))}
    </View>
  )

  const renderEmailCard = () => {
    const typeLabel = CONNECTION_LABELS[linkedType] || 'Email Account'
    const metaChips = [
      { key: 'sync', icon: 'refresh-cw', text: 'Auto sync' },
      linkedType === 'GMAIL'
        ? { key: 'oauth', icon: 'lock', text: 'OAuth secure' }
        : { key: 'type', icon: 'server', text: linkedType },
    ]
    if (linkedStatus?.linked_at) {
      metaChips.push({
        key: 'date',
        icon: 'calendar',
        text: `Connected ${moment(linkedStatus.linked_at).format('DD MMM YYYY')}`,
      })
    }

    return (
      <IntegrationCard
        styles={styles}
        colors={colors}
        label="Email integration"
        title="Email Account"
        subtitle={typeLabel}
        isActive={isEmailConnected}
        metaChips={metaChips}
        iconNode={
          <LinearGradient
            colors={['#EA4335', '#D33426']}
            style={styles.serviceIconWrap}
          >
            <Icon name="mail" size={18} color={colors.white} />
          </LinearGradient>
        }
        footerFull={
          <Pressable
            onPress={handleDisconnect}
            disabled={disconnecting}
            style={({ pressed }) => [
              styles.disconnectBtn,
              pressed && styles.disconnectBtnPressed,
              disconnecting && styles.btnDisabled,
            ]}
          >
            {disconnecting ? (
              <ActivityIndicator color={colors.danger || '#EF4444'} size="small" />
            ) : (
              <>
                <Icon name="x-circle" size={14} color={colors.danger || '#EF4444'} />
                <Text style={styles.disconnectBtnText}>Disconnect</Text>
              </>
            )}
          </Pressable>
        }
      />
    )
  }

  const renderFacebookCard = () => {
    const pageName =
      facebookStatus?.page_name ||
      facebookStatus?.pageName ||
      facebookStatus?.name ||
      'Facebook Page'
    const metaChips = isFacebookConnected
      ? [
          { key: 'leads', icon: 'users', text: 'Lead import' },
          ...(facebookStatus?.linked_at
            ? [{
                key: 'date',
                icon: 'calendar',
                text: `Connected ${moment(facebookStatus.linked_at).format('DD MMM YYYY')}`,
              }]
            : []),
        ]
      : []

    return (
      <IntegrationCard
        styles={styles}
        colors={colors}
        label="Social integration"
        title={isFacebookConnected ? pageName : 'Facebook Account'}
        subtitle={
          isFacebookConnected
            ? 'Importing leads from Facebook'
            : 'Import leads from Facebook'
        }
        isActive={isFacebookConnected}
        metaChips={metaChips}
        iconNode={
          <LinearGradient
            colors={['#1877F2', '#0D65D9']}
            style={styles.serviceIconWrap}
          >
            <IconFA name="facebook" size={18} color={colors.white} />
          </LinearGradient>
        }
        footerFull={
          isFacebookConnected ? (
            <Pressable
              onPress={handleFacebookDisconnect}
              disabled={facebookDisconnecting}
              style={({ pressed }) => [
                styles.disconnectBtn,
                pressed && styles.disconnectBtnPressed,
                facebookDisconnecting && styles.btnDisabled,
              ]}
            >
              {facebookDisconnecting ? (
                <ActivityIndicator color={colors.danger || '#EF4444'} size="small" />
              ) : (
                <>
                  <Icon name="x-circle" size={14} color={colors.danger || '#EF4444'} />
                  <Text style={styles.disconnectBtnText}>Disconnect</Text>
                </>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={handleFacebookAuthorize}
              disabled={facebookAuthorizing}
              style={({ pressed }) => [
                styles.facebookConnectBtn,
                pressed && styles.facebookConnectBtnPressed,
                facebookAuthorizing && styles.btnDisabled,
              ]}
            >
              {facebookAuthorizing ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <IconFA name="facebook" size={15} color={colors.white} style={styles.facebookConnectIcon} />
                  <Text style={styles.facebookConnectText}>Connect Facebook</Text>
                </>
              )}
            </Pressable>
          )
        }
      />
    )
  }

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title="Linked Accounts" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SettingsHero
          colors={colors}
          isDark={isDark}
          styles={styles}
          icon="link-2"
          title="Linked Accounts"
          subtitle="Connect Gmail, IMAP, or POP3 to sync leads and communications."
          actionLabel={isUnlinked && !loading ? 'Connect email' : undefined}
          onAction={isUnlinked && !loading ? () => handleConnectOption('gmail') : undefined}
          actionLoading={authorizing}
        />

        {!loading && (
          <SettingsStatPills
            styles={styles}
            items={[
              { value: connectedCount, label: 'Connected' },
              { value: availableCount, label: 'Available' },
            ]}
          />
        )}

        {loading ? (
          <LoadingView skeleton="card" skeletonCount={2} />
        ) : (
          <>
            {needsReauth ? (
              <View style={styles.warningCard}>
                <Icon
                  name="alert-triangle"
                  size={16}
                  color={colors.warning || '#F59E0B'}
                />
                <View style={styles.warningBody}>
                  <Text style={styles.warningTitle}>
                    {invalidationReason
                      ? INVALIDATION_LABELS[invalidationReason] || invalidationReason
                      : 'Re-authentication required'}
                  </Text>
                  <Text style={styles.warningText}>
                    Your previous email connection is no longer valid. Please reconnect to resume syncing.
                  </Text>
                  {unlinkedAt ? (
                    <Text style={styles.warningMeta}>
                      Disconnected {moment(unlinkedAt).format('DD MMM YYYY, h:mm A')}
                    </Text>
                  ) : null}
                  <Pressable
                    onPress={handleGmailAuthorize}
                    disabled={authorizing}
                    style={({ pressed }) => [
                      styles.reauthBtn,
                      pressed && styles.reauthBtnPressed,
                      authorizing && styles.btnDisabled,
                    ]}
                  >
                    {authorizing ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <>
                        <Icon name="refresh-cw" size={13} color={colors.white} />
                        <Text style={styles.reauthBtnText}>Re-authorize</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : null}

            {isUnlinked ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Icon name="link" size={24} color={colors.gray} />
                </View>
                <Text style={styles.emptyTitle}>No accounts linked yet</Text>
                <Text style={styles.emptyHint}>
                  Connect your email to automatically sync leads, or link Facebook to import social leads.
                </Text>
                {renderConnectOptions()}
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Connected services</Text>
                {renderEmailCard()}
              </>
            )}

            <Text style={styles.sectionLabel}>
              {isUnlinked ? 'Available integrations' : 'More integrations'}
            </Text>
            {renderFacebookCard()}
          </>
        )}
      </ScrollView>

      <EmailConnectionModal
        visible={emailModal === 'imap'}
        protocol="imap"
        token={token}
        onClose={() => setEmailModal(null)}
        onConnected={handleEmailConnected}
      />
      <EmailConnectionModal
        visible={emailModal === 'pop3'}
        protocol="pop3"
        token={token}
        onClose={() => setEmailModal(null)}
        onConnected={handleEmailConnected}
      />
    </View>
  )
}
