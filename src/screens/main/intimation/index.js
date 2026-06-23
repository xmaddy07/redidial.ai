import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, Platform, ToastAndroid, ActivityIndicator } from 'react-native'
import { Alert } from '../../../utils/alert'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useSelector } from 'react-redux'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import SettingHeader from '../../../component/settingHeader'
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero'
import LoadingView from '../../../component/LoadingView'
import { useTheme } from '../../../hooks/useTheme'
import getStyles from './styles'
import {
  getOrgUsers,
  getLeadNotificationPreferences,
  saveLeadNotificationPreferences,
} from '../../../api'

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

function normalizeUsersList(payload) {
  const root = unwrapPayload(payload)
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.users)) return root.users
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data
  return []
}

function mapUser(user) {
  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.name ||
    'Unknown'
  const email = user?.email || ''
  const isBot =
    user?.type === 'Bot' ||
    user?.type === 'BOT' ||
    user?.role === 'BOT' ||
    /bot/i.test(name) ||
    /bot/i.test(email)

  return {
    id: String(user?.id ?? user?.user_id ?? user?.userId ?? ''),
    name,
    email,
    isBot,
  }
}

function pickNotifiedUserIds(payload) {
  const root = unwrapPayload(payload) || {}
  const ids =
    root?.notified_user_ids ??
    root?.notifiedUserIds ??
    root?.user_ids ??
    root?.userIds ??
    []

  if (!Array.isArray(ids)) return []
  return ids.map(String).filter(Boolean)
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Checkbox({ checked, colors, styles }) {
  return (
    <View style={[styles.checkboxOuter, checked && styles.checkboxOuterChecked]}>
      {checked ? <Icon name="check" size={13} color={colors.white} /> : null}
    </View>
  )
}

export default function Intimation({ navigation }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])

  const token = useSelector((state) => state.auth.token)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [initialSelectedIds, setInitialSelectedIds] = useState([])

  const loadData = useCallback(async () => {
    if (!token) return

    setLoading(true)

    try {
      const [usersResponse, preferencesResponse] = await Promise.all([
        getOrgUsers(token),
        getLeadNotificationPreferences(token).catch((error) => {
          console.warn('Lead notification preferences:', error?.message || error)
          return null
        }),
      ])

      const teamUsers = normalizeUsersList(usersResponse)
        .map(mapUser)
        .filter((user) => user.id && !user.isBot)

      const savedIds = pickNotifiedUserIds(preferencesResponse)
      const validSavedIds = savedIds.filter((id) => teamUsers.some((user) => user.id === id))

      setUsers(teamUsers)
      setSelectedIds(validSavedIds)
      setInitialSelectedIds(validSavedIds)
    } catch (error) {
      console.error('Intimation load failed:', error?.message || error)
      Alert.alert('Load failed', error?.message || 'Could not load notification settings.')
      setUsers([])
      setSelectedIds([])
      setInitialSelectedIds([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  const allSelected = users.length > 0 && selectedIds.length === users.length
  const selectedCount = selectedIds.length
  const hasChanges = useMemo(() => {
    if (selectedIds.length !== initialSelectedIds.length) return true
    const current = [...selectedIds].sort().join(',')
    const initial = [...initialSelectedIds].sort().join(',')
    return current !== initial
  }, [selectedIds, initialSelectedIds])

  const toggleUser = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : users.map((user) => user.id))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const payloadIds = selectedIds
        .map((id) => {
          const numeric = Number(id)
          return Number.isFinite(numeric) ? numeric : id
        })
        .filter((id) => id !== '' && id != null)

      await saveLeadNotificationPreferences(token, payloadIds)
      setInitialSelectedIds([...selectedIds])
      showToast('Saved', 'Lead notification preferences saved.')
    } catch (error) {
      Alert.alert('Save failed', error?.message || 'Could not save notification preferences.')
    } finally {
      setSaving(false)
    }
  }

  const selectedLabel = `${selectedCount} of ${users.length}`

  if (loading) {
    return (
      <View style={styles.container}>
        <SettingHeader navigation={navigation} title="Intimation" />
        <LoadingView text="Loading notification settings..." flex />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title="Intimation" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHero
          colors={colors}
          isDark={isDark}
          styles={styles}
          icon="bell"
          title="Lead Notification Settings"
          subtitle="Choose team members who receive instant email alerts when new leads are created."
        />

        <SettingsStatPills
          styles={styles}
          items={[
            { value: selectedLabel, label: 'Selected' },
            { value: users.length, label: 'Team members' },
          ]}
        />

        <Text style={styles.sectionLabel}>Team members</Text>

        {users.length > 0 ? (
          <Pressable
            onPress={toggleSelectAll}
            style={({ pressed }) => [
              styles.selectAllCard,
              pressed && styles.selectAllCardPressed,
            ]}
          >
            <Checkbox checked={allSelected} colors={colors} styles={styles} />
            <View style={styles.selectAllTextWrap}>
              <Text style={styles.selectAllTitle}>
                {allSelected ? 'Deselect all users' : 'Select all users'}
              </Text>
              <Text style={styles.selectAllHint}>
                {allSelected ? 'Clear everyone from instant alerts' : 'Include everyone on your team'}
              </Text>
            </View>
            <Icon name="users" size={18} color={colors.primary} />
          </Pressable>
        ) : null}

        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="users" size={24} color={colors.gray} />
            </View>
            <Text style={styles.emptyTitle}>No team members found</Text>
            <Text style={styles.emptyHint}>
              Add users to your organization to configure lead notification recipients.
            </Text>
          </View>
        ) : (
          <View style={styles.usersStack}>
            {users.map((user) => {
              const isSelected = selectedIds.includes(user.id)

              return (
                <Pressable
                  key={user.id}
                  onPress={() => toggleUser(user.id)}
                  style={({ pressed }) => [
                    styles.userCard,
                    isSelected && styles.userCardSelected,
                    pressed && styles.userCardPressed,
                  ]}
                >
                  <Checkbox checked={isSelected} colors={colors} styles={styles} />

                  <LinearGradient
                    colors={[`${colors.primary}40`, `${colors.primary}22`]}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
                  </LinearGradient>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    {!!user.email && (
                      <View style={styles.emailRow}>
                        <Icon name="mail" size={12} color={colors.gray} />
                        <Text style={styles.userEmail} numberOfLines={1}>
                          {user.email}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}

        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <Icon name="info" size={16} color={colors.primary} />
            <Text style={styles.infoTitle}>How it works</Text>
          </View>
          <Text style={styles.infoText}>
            Selected users receive an instant email when a new lead is created for your
            organization. This is different from Lead Reports, which sends scheduled summary
            emails. Save your preferences after making changes.
          </Text>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving || !hasChanges}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && !saving && hasChanges && { opacity: 0.9 },
            (saving || !hasChanges) && styles.primaryBtnDisabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Icon name="save" size={18} color={colors.white} />
              <Text style={styles.primaryBtnText}>Save Preferences</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  )
}
