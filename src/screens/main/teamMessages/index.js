import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, Pressable, Image, Platform, ToastAndroid, AppState } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Alert } from '../../../utils/alert'
import { useSelector } from 'react-redux'
import Header from '../../../component/header'
import LoadingView from '../../../component/LoadingView'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import TeamIcon from 'react-native-vector-icons/Ionicons'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import getChatStyles from '../chat/styles'
import {
  getOrgUsers,
  getInternalConversations,
  createInternalConversation,
} from '../../../api'
import {
  getUsersOnlineStatus,
  getSocket,
  connectSocket,
  onSocket,
  offSocket,
} from '../../../services'
import {
  onTeamChatUnreadChanged,
  getConversationUnread,
  syncUnreadFromConversations,
  onTeamChatActivity,
  onTeamChatIncoming,
} from '../../../utils/teamChatNotify'
import { onOrgUsersChanged } from '../../../utils/orgUsersEvents'
import { useTheme } from '../../../hooks/useTheme'
import { images } from '../../../constant'
import {
  formatThreadTime,
  filterTeammates,
  normalizeTeamChat,
  parsePresenceChange,
  applyOnlineStatusMap,
  sortChatsByActivity,
  getChattedTeamList,
  getNewTeamUsers,
  hasTeamChatHistory,
  markTeamConversationRead,
} from './utils'

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
  } else {
    Alert.alert('Team Messages', message)
  }
}

export default function TeamMessages({ navigation }) {
  const { layout, styleOptions } = useScreenLayout({ tabBarAware: true })
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const styles = useMemo(
    () => getChatStyles(colors, isDark, styleOptions),
    [colors, isDark, styleOptions],
  )

  const token = useSelector((state) => state.auth.token)
  const currentUser = useSelector((state) => state.auth.user)
  const currentUserId = currentUser?.id ?? currentUser?.user_id

  const [users, setUsers] = useState([])
  const [chats, setChats] = useState([])
  const [onlineMap, setOnlineMap] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [openingChatId, setOpeningChatId] = useState(null)
  const [showNewUsers, setShowNewUsers] = useState(false)
  const [unreadTick, setUnreadTick] = useState(0)
  const hasLoadedRef = useRef(false)
  const usersRef = useRef(users)
  usersRef.current = users

  useEffect(() => onTeamChatUnreadChanged(() => setUnreadTick((t) => t + 1)), [])

  useEffect(() => {
    if (token) connectSocket(token)
  }, [token])

  const refreshPresence = useCallback(async (emails) => {
    if (!emails?.length) return
    try {
      const status = await getUsersOnlineStatus(emails)
      setOnlineMap(applyOnlineStatusMap(status))
    } catch {
      // optional presence lookup
    }
  }, [])

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!token) return

    if (!silent) setLoading(true)
    setError(null)

    try {
      const [usersData, chatsData] = await Promise.all([
        getOrgUsers(token),
        getInternalConversations(token),
      ])

      const mappedUsers = filterTeammates(
        Array.isArray(usersData) ? usersData : usersData?.items || [],
        currentUserId,
      )

      const mappedChats = sortChatsByActivity(
        (Array.isArray(chatsData) ? chatsData : chatsData?.items || chatsData?.conversations || [])
          .map((item) => normalizeTeamChat(item, currentUserId))
          .filter((chat) => chat?.conversationId && chat?.user),
      )

      setUsers(mappedUsers)
      setChats(mappedChats)
      syncUnreadFromConversations(mappedChats)

      const emails = mappedUsers.map((user) => user.email).filter(Boolean)
      await refreshPresence(emails)
    } catch (err) {
      setError(err?.message || 'Failed to load team messages')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, currentUserId, refreshPresence])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        loadData({ silent: true })
      }
    })
    return () => sub.remove()
  }, [loadData])

  useFocusEffect(
    useCallback(() => {
      loadData({ silent: hasLoadedRef.current })
      hasLoadedRef.current = true
    }, [loadData]),
  )

  useEffect(() => onOrgUsersChanged(() => loadData({ silent: true })), [loadData])

  useEffect(() => {
    return onTeamChatActivity((payload) => {
      if (!payload?.conversationId) return

      const conversationId = String(payload.conversationId)
      setChats((prev) => {
        const existing = prev.find((chat) => String(chat.conversationId) === conversationId)
        const nextChat = normalizeTeamChat(
          {
            id: conversationId,
            peer: payload.user || existing?.user,
            last_message: payload.lastMessage,
            last_message_at: payload.lastMessageAt,
            unread_count: existing?.unreadCount || 0,
          },
          currentUserId,
        )

        if (!nextChat) return prev

        const others = prev.filter((chat) => String(chat.conversationId) !== conversationId)
        return sortChatsByActivity([nextChat, ...others])
      })
    })
  }, [currentUserId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return undefined

    const onReconnect = () => {
      const emails = users.map((user) => user.email).filter(Boolean)
      refreshPresence(emails)
    }

    socket.on('reconnect', onReconnect)
    return () => socket.off('reconnect', onReconnect)
  }, [users, refreshPresence])

  const handlePresenceChange = useCallback((data) => {
    try {
      const change = parsePresenceChange(data)
      if (!change) return
      setOnlineMap((prev) => ({ ...prev, [change.email]: change.online }))
    } catch {
      // ignore malformed presence payloads
    }
  }, [])

  useEffect(() => {
    onSocket('v1OnUserPresenceChange', handlePresenceChange)
    return () => offSocket('v1OnUserPresenceChange', handlePresenceChange)
  }, [handlePresenceChange])

  useEffect(() => {
    return onTeamChatIncoming((result) => {
      if (!result?.conversationId) return

      const { incoming, conversationId, unreadCount } = result

      setChats((prev) => {
        const existing = prev.find((chat) => String(chat.conversationId) === conversationId)
        const peerUser = existing?.user || usersRef.current.find(
          (user) => Number(user.id) === Number(incoming.senderId),
        )

        const nextChat = normalizeTeamChat(
          {
            id: conversationId,
            peer: peerUser,
            last_message: incoming.content,
            last_message_at: incoming.createdAt,
            unread_count: unreadCount,
          },
          currentUserId,
        )

        if (nextChat) {
          nextChat.unreadCount = unreadCount
        }

        const others = prev.filter((chat) => String(chat.conversationId) !== conversationId)
        return nextChat ? sortChatsByActivity([nextChat, ...others]) : prev
      })
      setUnreadTick((tick) => tick + 1)
    })
  }, [currentUserId])

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []

    return users.filter((user) =>
      [user.name, user.email, user.first_name, user.last_name]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [searchQuery, users])

  const openChat = useCallback(async (user, existingConversationId, { isNewChat = false } = {}) => {
    if (!user?.id || !token) return

    setSearchQuery('')
    setOpeningChatId(user.id)

    try {
      let conversationId = existingConversationId

      if (!conversationId) {
        const existing = chats.find(
          (chat) => Number(chat.user?.id) === Number(user.id),
        )
        conversationId = existing?.conversationId
      }

      if (!conversationId) {
        const created = await createInternalConversation({
          token,
          peerUserId: user.id,
        })
        conversationId =
          created?.id ??
          created?.conversation_id ??
          created?.conversationId
      }

      if (!conversationId) {
        showToast('Could not open conversation')
        return
      }

      markTeamConversationRead({ token, conversationId })
      setChats((prev) =>
        prev.map((chat) =>
          String(chat.conversationId) === String(conversationId)
            ? { ...chat, unreadCount: 0 }
            : chat,
        ),
      )
      setUnreadTick((tick) => tick + 1)

      navigation.navigate('teamChat', {
        user,
        conversationId: String(conversationId),
        isNewChat,
      })
    } catch (err) {
      showToast(err?.message || 'Failed to open conversation')
    } finally {
      setOpeningChatId(null)
    }
  }, [token, chats, navigation])

  const renderTeammateRow = useCallback(({ item }) => {
    const isOnline = onlineMap[item.email?.toLowerCase?.()] ?? false
    const hasHistory = chats.some(
      (chat) => Number(chat.user?.id) === Number(item.id) && hasTeamChatHistory(chat),
    )

    return (
      <Pressable
        onPress={() => openChat(item, undefined, { isNewChat: !hasHistory })}
        style={styles.threadItem}
        android_ripple={{ color: `${colors.primary}18`, borderless: false }}
        disabled={Number(openingChatId) === Number(item.id)}
      >
        {({ pressed }) => (
          <View style={[styles.threadItemInner, pressed && styles.threadItemPressed]}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>{item.initials}</Text>
                </LinearGradient>
                <View
                  style={[
                    styles.avatarOnlineDot,
                    { backgroundColor: isOnline ? (colors.success || '#10B981') : colors.gray },
                  ]}
                />
              </View>
            </View>
            <View style={styles.threadCenter}>
              <View style={styles.threadTopRow}>
                <View style={styles.threadNameRow}>
                  <Text style={styles.threadName} numberOfLines={1}>{item.name}</Text>
                  <View
                    style={[
                      styles.incomingCallBadge,
                      !isOnline && { backgroundColor: `${colors.gray}22` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.incomingCallBadgeText,
                        !isOnline && { color: colors.gray },
                      ]}
                    >
                      {isOnline ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.threadPreview, styles.threadPreviewMuted]} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    )
  }, [styles, colors, onlineMap, openChat, openingChatId, chats])

  const renderChatRow = useCallback(({ item }) => {
    const isOnline = onlineMap[item.user?.email?.toLowerCase?.()] ?? false
    const unread = getConversationUnread(item.conversationId) || item.unreadCount || 0
    const preview = item.lastMessage || 'Start a conversation'
    const hasUnread = unread > 0

    return (
      <Pressable
        onPress={() => openChat(item.user, item.conversationId)}
        style={styles.threadItem}
        android_ripple={{ color: `${colors.primary}18`, borderless: false }}
      >
        {({ pressed }) => (
          <View style={[styles.threadItemInner, pressed && styles.threadItemPressed]}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrap}>
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>{item.user?.initials || '?'}</Text>
                </LinearGradient>
                <View
                  style={[
                    styles.avatarOnlineDot,
                    { backgroundColor: isOnline ? (colors.success || '#10B981') : colors.gray },
                  ]}
                />
              </View>
            </View>
            <View style={styles.threadCenter}>
              <View style={styles.threadTopRow}>
                <View style={styles.threadNameRow}>
                  <Text
                    style={[styles.threadName, hasUnread && styles.threadNameUnread]}
                    numberOfLines={1}
                  >
                    {item.user?.name}
                  </Text>
                  <View
                    style={[
                      styles.incomingCallBadge,
                      !isOnline && { backgroundColor: `${colors.gray}22` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.incomingCallBadgeText,
                        !isOnline && { color: colors.gray },
                      ]}
                    >
                      {isOnline ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                  {hasUnread ? (
                    <View style={[styles.incomingCallBadge, styles.unreadCountBadge]}>
                      <Text style={[styles.incomingCallBadgeText, styles.unreadCountBadgeText]}>
                        {unread > 9 ? '9+' : unread}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.threadTime}>
                  {formatThreadTime(item.lastMessageAt)}
                </Text>
              </View>
              <Text
                style={[styles.threadPreview, hasUnread && styles.threadPreviewUnread]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {preview}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    )
  }, [styles, colors, onlineMap, openChat, unreadTick])

  const chattedList = useMemo(() => getChattedTeamList(chats), [chats])
  const newUsersList = useMemo(() => getNewTeamUsers(users, chats), [users, chats])

  const filteredNewUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return newUsersList

    return newUsersList.filter((user) =>
      [user.name, user.email, user.first_name, user.last_name]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [searchQuery, newUsersList])

  const showSearchResults = searchQuery.trim().length > 0 && !showNewUsers
  const listData = showNewUsers
    ? filteredNewUsers
    : showSearchResults
      ? searchResults
      : chattedList
  const isNewUserView = showNewUsers
  const newUserCount = newUsersList.length

  const EmptyList = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        {isNewUserView ? (
          <TeamIcon
            name="people-circle"
            size={layout.isCompact ? 36 : 40}
            color={colors.primary}
          />
        ) : (
          <Icon
            name="message-circle"
            size={layout.isCompact ? 28 : 32}
            color={colors.primary}
          />
        )}
      </View>
      <Text style={styles.emptyTitle}>
        {error
          ? 'Could not load conversations'
          : isNewUserView
            ? 'No new teammates'
            : showSearchResults
              ? 'No teammates found'
              : 'No conversations yet'}
      </Text>
      <Text style={styles.emptyText}>
        {error
          ? error
          : isNewUserView
            ? 'Everyone on your team has been contacted.'
            : showSearchResults
              ? 'Try a different name or email.'
              : 'Tap the team button to start chatting with a teammate.'}
      </Text>
      {error ? (
        <TouchableOpacity onPress={() => loadData()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )

  return (
    <View style={styles.container}>
      <Header
        title="Team Messages"
        search={false}
        showProfile
        showNotificationBadge={false}
      />

      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.topSectionInner}>
            <View style={styles.searchRow}>
              <View style={[styles.searchWrap, styles.searchWrapGrow]}>
                <Image source={images.search} style={styles.searchIcon} resizeMode="contain" />
                <TextInput
                  placeholder={isNewUserView ? 'Search new teammates' : 'Search teammates'}
                  placeholderTextColor={colors.gray}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {!!searchQuery && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="x" size={16} color={colors.gray} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  setShowNewUsers((prev) => !prev)
                  setSearchQuery('')
                }}
                style={[styles.newUserBtn, isNewUserView && styles.newUserBtnActive]}
                activeOpacity={0.85}
                accessibilityLabel="Show new teammates"
              >
                <TeamIcon
                  name={isNewUserView ? 'people-circle' : 'people-circle-outline'}
                  size={layout.isCompact ? 24 : 26}
                  color={isNewUserView ? colors.primary : colors.gray}
                />
                {newUserCount > 0 && !isNewUserView ? (
                  <View style={styles.newUserBadge}>
                    <Text style={styles.newUserBadgeText}>
                      {newUserCount > 9 ? '9+' : newUserCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {loading ? (
          <LoadingView skeleton="list" flex />
        ) : (
          <View style={styles.listPanel}>
            <FlatList
              data={listData}
              keyExtractor={(item) => String(
                isNewUserView || showSearchResults
                  ? item.id
                  : (item.conversationId || item.id),
              )}
              renderItem={isNewUserView || showSearchResults ? renderTeammateRow : renderChatRow}
              ListEmptyComponent={EmptyList}
              contentContainerStyle={styles.listContent}
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                loadData({ silent: true })
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}
      </View>
    </View>
  )
}
