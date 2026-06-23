import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, TextInput, FlatList, Platform, ToastAndroid, TouchableOpacity, RefreshControl } from 'react-native'
import { Alert } from '../../../utils/alert'
import { useFocusEffect } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/Feather'
import LinearGradient from 'react-native-linear-gradient'
import Header from '../../../component/header'
import LoadingView from '../../../component/LoadingView'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useTheme } from '../../../hooks/useTheme'
import { getOrgUsers } from '../../../api'
import { connectSocket, getUsersOnlineStatus } from '../../../services'
import { isBotUser } from '../../../utils/threadAssignment'
import { normalizeUsersList } from '../../../utils/orgUsers'
import {
  normalizeOrgUser,
  applyOnlineStatusMap,
} from '../teamMessages/utils'
import getStyles from './styles'

function showToast(message, title = 'Organization Users') {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
  } else {
    Alert.alert(title, message)
  }
}

function mapOrgUserForDisplay(raw) {
  const user = normalizeOrgUser(raw)
  if (!user?.id) return null

  const isBot =
    String(user.user_type || '').toUpperCase() === 'BOT' || isBotUser(raw)

  return {
    ...user,
    userType: isBot ? 'BOT' : 'HUMAN',
  }
}

function excludeCurrentUser(users, currentUser) {
  const currentId = currentUser?.id ?? currentUser?.user_id
  const currentEmail = currentUser?.email?.toLowerCase?.()

  return users.filter((user) => {
    if (currentId != null && Number(user.id) === Number(currentId)) return false
    if (currentEmail && user.email?.toLowerCase() === currentEmail) return false
    return true
  })
}

function matchesSearch(user, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return [user.first_name, user.last_name, user.email]
    .join(' ')
    .toLowerCase()
    .includes(q)
}

export default function OrganizationUsers() {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(
    () => getStyles(colors, isDark, styleOptions),
    [colors, isDark, styleOptions],
  )

  const token = useSelector((state) => state.auth.token)
  const currentUser = useSelector((state) => state.auth.user)

  const [users, setUsers] = useState([])
  const [onlineMap, setOnlineMap] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    if (!token) {
      showToast('Please log in again')
    } else {
      connectSocket(token)
    }

    try {
      const data = await getOrgUsers(token)
      const mapped = excludeCurrentUser(
        normalizeUsersList(data).map(mapOrgUserForDisplay).filter(Boolean),
        currentUser,
      )

      setUsers(mapped)

      if (mapped.length === 0) {
        showToast('No users found')
      }

      if (token && mapped.length > 0) {
        const emails = mapped.map((user) => user.email).filter(Boolean)
        try {
          const status = await getUsersOnlineStatus(emails)
          setOnlineMap(applyOnlineStatusMap(status))
        } catch {
          showToast('Online status unavailable')
          setOnlineMap({})
        }
      }
    } catch (err) {
      const message = err?.message || 'Failed to load users'
      setError(message)
      setUsers([])
      setOnlineMap({})
      showToast(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, currentUser])

  const handleRefresh = useCallback(() => {
    loadUsers(true)
  }, [loadUsers])

  useFocusEffect(
    useCallback(() => {
      loadUsers()
    }, [loadUsers]),
  )

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesSearch(user, searchQuery)),
    [users, searchQuery],
  )

  const renderItem = useCallback(
    ({ item }) => {
      const isBot = item.userType === 'BOT'
      const isOnline = onlineMap[item.email?.toLowerCase?.()] ?? false

      return (
        <View style={[styles.userCard, isBot && styles.userCardBot]}>
          <View style={styles.cardTop}>
            <View style={styles.avatarWrap}>
              <LinearGradient
                colors={
                  isBot
                    ? [`${colors.primary}40`, `${colors.primary}22`]
                    : [colors.primary, `${colors.primary}CC`]
                }
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{item.initials}</Text>
              </LinearGradient>
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: isOnline
                      ? colors.success || '#10B981'
                      : colors.gray,
                  },
                ]}
              />
            </View>

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.typeBadge, isBot && styles.typeBadgeBot]}>
                    <Text
                      style={[
                        styles.typeBadgeText,
                        isBot && styles.typeBadgeTextBot,
                      ]}
                    >
                      {item.userType}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      !isOnline && styles.statusBadgeOffline,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        !isOnline && styles.statusBadgeTextOffline,
                      ]}
                    >
                      {isOnline ? 'Online' : 'Offline'}
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
        </View>
      )
    },
    [styles, colors, onlineMap],
  )

  const ListEmpty = () => {
    if (loading) return null

    return (
      <View style={styles.emptyState}>
        <Icon name="users" size={28} color={colors.gray} />
        <Text style={styles.emptyTitle}>No users found</Text>
        {searchQuery.trim() ? (
          <Text style={styles.emptyHint}>Try a different search term.</Text>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header title="Organization Users" search={false} />

      <View style={styles.content}>
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color={colors.gray} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users"
            placeholderTextColor={colors.gray}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Icon name="x" size={16} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <LoadingView skeleton="list" skeletonCount={6} flex />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            style={styles.flatList}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={ListEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </View>
  )
}
