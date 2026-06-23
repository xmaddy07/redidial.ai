import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  ToastAndroid,
  Platform,
  TouchableOpacity,
} from 'react-native'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import LoadingView from '../../../component/LoadingView'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import SettingHeader from '../../../component/settingHeader'
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero'
import getStyles from './styles'
import { useTheme } from '../../../hooks/useTheme'
import CreateUserModal from '../../../component/users/CreateUserModal'
import EditUserModal from '../../../component/users/EditUserModal'
import { useSelector } from 'react-redux'
import api from '../../../api'
import { emitOrgUsersChanged } from '../../../utils/orgUsersEvents'
import { Alert } from '../../../utils/alert'

function normalizeUsersList(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.users)) return payload.users
  if (Array.isArray(payload.items)) return payload.items
  return []
}

function mapUser(u) {
  const firstName = u?.first_name || u?.firstName || ''
  const lastName = u?.last_name || u?.lastName || ''
  const name =
    [firstName, lastName].filter(Boolean).join(' ') || u?.name || 'Unknown'
  const email = u?.email || ''
  const isBot =
    u?.type === 'Bot' ||
    u?.user_type === 'BOT' ||
    /bot/i.test(name) ||
    /bot/i.test(email)

  return {
    id: u?.id?.toString?.() || u?.user_id?.toString?.() || Math.random().toString(36).slice(2, 8),
    first_name: firstName,
    last_name: lastName,
    name,
    email,
    type: isBot ? 'Bot' : u?.type || 'Human',
    is_active: u?.is_active ?? u?.isActive ?? true,
  }
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

export default function Users({ navigation }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])
  const token = useSelector((state) => state.auth.token)
  const currentUser = useSelector((state) => state.auth.user)

  const [query, setQuery] = useState('')
  const [isCreateVisible, setIsCreateVisible] = useState(false)
  const [isEditVisible, setIsEditVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [deactivatingId, setDeactivatingId] = useState(null)
  const [createFirstName, setCreateFirstName] = useState('')
  const [createLastName, setCreateLastName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const currentUserId = currentUser?.id ?? currentUser?.user_id

  const loadUsers = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const data = await api.getOrgUsers(token)
      const mapped = normalizeUsersList(data).map(mapUser)
      setUsers(mapped)
    } catch (e) {
      if (!silent) setUsers([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const visibleUsers = useMemo(() => {
    const currentEmail = currentUser?.email?.toLowerCase?.()
    return users.filter((user) => {
      if (currentUserId != null && Number(user.id) === Number(currentUserId)) return false
      if (currentEmail && user.email?.toLowerCase() === currentEmail) return false
      return true
    })
  }, [users, currentUserId, currentUser?.email])

  const filtered = useMemo(
    () =>
      visibleUsers.filter((u) =>
        [u.name, u.email, u.type, u.id].join(' ').toLowerCase().includes(query.toLowerCase()),
      ),
    [visibleUsers, query],
  )

  const humanCount = useMemo(
    () => visibleUsers.filter((u) => u.type !== 'Bot').length,
    [visibleUsers],
  )

  const openEdit = (user) => {
    setSelectedUser(user)
    setIsEditVisible(true)
  }

  const closeEdit = () => {
    setIsEditVisible(false)
    setSelectedUser(null)
  }

  const handleUserSaved = async (updated) => {
    setUsers((prev) =>
      prev.map((u) => (String(u.id) === String(updated.id) ? { ...u, ...updated } : u)),
    )
    closeEdit()
    emitOrgUsersChanged()
    loadUsers({ silent: true })

    if (Platform.OS === 'android') {
      ToastAndroid.show('User updated', ToastAndroid.SHORT)
    } else {
      Alert.alert('Success', 'User updated successfully')
    }
  }

  const handleDeactivate = (user) => {
    if (!user?.id || user.type === 'Bot') return

    Alert.alert(
      'Deactivate User',
      `Are you sure you want to deactivate ${user.name}? They will lose access to the organization.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Deactivate',
          style: 'destructive',
          onPress: async () => {
            setDeactivatingId(user.id)
            try {
              await api.deactivateUser({ token, userId: user.id })
              setUsers((prev) => prev.filter((u) => u.id !== user.id))
              emitOrgUsersChanged()
              if (Platform.OS === 'android') {
                ToastAndroid.show('User deactivated', ToastAndroid.SHORT)
              } else {
                Alert.alert('Success', 'User deactivated successfully')
              }
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to deactivate user')
            } finally {
              setDeactivatingId(null)
            }
          },
        },
      ],
    )
  }

  const renderItem = ({ item }) => {
    const isBot = item.type === 'Bot'
    const showActions = !isBot
    const isDeactivating = deactivatingId === item.id

    return (
      <View style={[styles.userCard, isBot && styles.userCardBot]}>
        <View style={styles.cardTop}>
          <LinearGradient
            colors={
              isBot
                ? [`${colors.primary}40`, `${colors.primary}22`]
                : [colors.primary, `${colors.primary}CC`]
            }
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </LinearGradient>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.typeBadge, isBot && styles.typeBadgeBot]}>
                  <Text style={[styles.typeBadgeText, isBot && styles.typeBadgeTextBot]}>
                    {item.type}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.emailRow}>
              <Icon name="mail" size={12} color={colors.gray} />
              <Text style={styles.emailText} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.idRow}>
          <Icon name="hash" size={12} color={colors.gray} />
          <Text style={styles.idText}>User ID: {item.id}</Text>
        </View>
        {showActions ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openEdit(item)}
              activeOpacity={0.7}
            >
              <Icon name="edit-2" size={14} color={colors.primary} />
              <Text style={styles.actionBtnTextPrimary}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() => handleDeactivate(item)}
              activeOpacity={0.7}
              disabled={isDeactivating}
            >
              <Icon name="user-x" size={14} color={colors.danger || '#EF4444'} />
              <Text style={styles.actionBtnTextDanger}>
                {isDeactivating ? 'Deactivating...' : 'Deactivate'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    )
  }

  const ListHeader = () => (
    <>
      <SettingsHero
        colors={colors}
        isDark={isDark}
        styles={styles}
        icon="users"
        title="User Management"
        subtitle="Manage team members, roles, and access for your organization."
        actionLabel="New"
        onAction={() => setIsCreateVisible(true)}
      />

      {!loading && (
        <SettingsStatPills
          styles={styles}
          items={[
            { value: visibleUsers.length, label: 'Total users' },
            { value: humanCount, label: 'Team members' },
          ]}
        />
      )}

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color={colors.gray} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, email or ID"
            placeholderTextColor={colors.gray}
            style={styles.searchInput}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Team members</Text>

      {loading ? <LoadingView skeleton="list" skeletonCount={5} /> : null}
    </>
  )

  const ListEmpty = () => {
    if (loading) return null
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Icon name="users" size={24} color={colors.gray} />
        </View>
        <Text style={styles.emptyTitle}>No users found</Text>
        <Text style={styles.emptyHint}>
          {query ? 'Try a different search term.' : 'Add your first team member to get started.'}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title="Users" />

      <FlatList
        style={styles.content}
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />

      <CreateUserModal
        visible={isCreateVisible}
        onClose={() => setIsCreateVisible(false)}
        firstName={createFirstName}
        lastName={createLastName}
        email={createEmail}
        password={createPassword}
        onChangeFirstName={setCreateFirstName}
        onChangeLastName={setCreateLastName}
        onChangeEmail={setCreateEmail}
        onChangePassword={setCreatePassword}
        onAdd={async () => {
          if (!createFirstName.trim() || !createEmail.trim() || !createPassword.trim()) return
          try {
            await api.createUser({
              token,
              payload: {
                first_name: createFirstName.trim(),
                last_name: createLastName.trim(),
                email: createEmail.trim(),
                password: createPassword.trim(),
              },
            })

            await loadUsers()
            emitOrgUsersChanged()

            if (Platform.OS === 'android') {
              ToastAndroid.show('User created', ToastAndroid.SHORT)
            }
            setCreateFirstName('')
            setCreateLastName('')
            setCreateEmail('')
            setCreatePassword('')
            setIsCreateVisible(false)
          } catch (e) {
            // keep modal open for correction
          }
        }}
      />

      <EditUserModal
        visible={isEditVisible}
        onClose={closeEdit}
        user={selectedUser}
        token={token}
        onSaved={handleUserSaved}
      />
    </View>
  )
}
