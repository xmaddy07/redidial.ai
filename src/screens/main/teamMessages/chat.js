import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, Platform, ToastAndroid } from 'react-native'
import { Alert } from '../../../utils/alert'
import Animated from 'react-native-reanimated'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/MaterialIcons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useSelector } from 'react-redux'
import LoadingView from '../../../component/LoadingView'
import { getInternalMessages } from '../../../api'
import {
  getUsersOnlineStatus,
  getSocket,
  connectSocket,
  emitSocket,
  isSocketConnected,
  onSocket,
  offSocket,
} from '../../../services'
import {
  setActiveTeamConversation,
  emitTeamChatActivity,
} from '../../../utils/teamChatNotify'
import { useTheme } from '../../../hooks/useTheme'
import { useChatKeyboard } from '../../../hooks/useChatKeyboard'
import { formatMessageTime } from '../../../utils/chatMessageParser'
import getStyles from './chatStyles'
import {
  extractInternalChatMessage,
  mergeMessages,
  normalizeOrgUser,
  normalizeTeamMessage,
  parsePresenceChange,
  parseMessagesPage,
  markTeamConversationRead,
} from './utils'

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
  } else {
    Alert.alert('Team Messages', message)
  }
}

export default function TeamChat({ navigation, route }) {
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const { styleOptions, insets } = useScreenLayout()
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])
  const token = useSelector((state) => state.auth.token)
  const currentUser = useSelector((state) => state.auth.user)
  const currentUserId = currentUser?.id ?? currentUser?.user_id

  const peerUser = useMemo(
    () => normalizeOrgUser(route?.params?.user || {}),
    [route?.params?.user],
  )
  const conversationId = route?.params?.conversationId
    ? String(route.params.conversationId)
    : null
  const targetMessageId = route?.params?.messageId
    ? String(route.params.messageId)
    : null
  const isNewChat = route?.params?.isNewChat === true

  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(() => !isNewChat)
  const [isOnline, setIsOnline] = useState(false)
  const [socketReady, setSocketReady] = useState(isSocketConnected())
  const [highlightMessageId, setHighlightMessageId] = useState(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMoreOlder, setHasMoreOlder] = useState(false)
  const [olderCursor, setOlderCursor] = useState(null)
  const listRef = useRef(null)
  const isNearBottomRef = useRef(true)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const inputBottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 12)

  const isPinnedToBottom = useCallback(() => isNearBottomRef.current, [])

  const syncToBottom = useCallback((animated = false, force = false) => {
    if (!listRef.current) return
    if (!force && !isPinnedToBottom()) return
    const scroll = () => listRef.current?.scrollToEnd({ animated })
    scroll()
    requestAnimationFrame(() => {
      scroll()
      requestAnimationFrame(scroll)
    })
  }, [isPinnedToBottom])

  const onKeyboardVisible = useCallback(() => {
    isNearBottomRef.current = true
    syncToBottom(true, true)
  }, [syncToBottom])

  const onKeyboardSettled = useCallback(() => {
    syncToBottom(false)
  }, [syncToBottom])

  const { animatedFooterStyle, animatedKeyboardSpacerStyle } = useChatKeyboard(
    onKeyboardVisible,
    onKeyboardSettled,
    inputBottomInset,
  )

  const onListScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y
    isNearBottomRef.current = distanceFromBottom < 96
  }, [])

  const scrollToMessage = useCallback((messageId) => {
    const index = messagesRef.current.findIndex((m) => String(m.id) === String(messageId))
    if (index < 0) return
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 })
    })
    setHighlightMessageId(String(messageId))
    setTimeout(() => setHighlightMessageId(null), 2000)
  }, [])

  useEffect(() => {
    if (!token || !conversationId) {
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setHasMoreOlder(false)
    setOlderCursor(null)

    const loadMessages = async () => {
      if (!isNewChat) {
        setLoading(true)
      }

      try {
        let rawMessages = []

        if (targetMessageId) {
          const [aroundData, latestData] = await Promise.all([
            getInternalMessages({
              token,
              conversationId,
              cursor: Number(targetMessageId) + 1,
              limit: 80,
            }),
            getInternalMessages({ token, conversationId, limit: 80 }),
          ])

          const aroundItems = Array.isArray(aroundData)
            ? aroundData
            : aroundData?.items || aroundData?.messages || []
          const latestItems = Array.isArray(latestData)
            ? latestData
            : latestData?.items || latestData?.messages || []

          rawMessages = mergeMessages(aroundItems, latestItems)
        } else {
          const data = await getInternalMessages({ token, conversationId, limit: 80 })
          const page = parseMessagesPage(data, 80)
          rawMessages = page.items
          setHasMoreOlder(page.hasMore)
          setOlderCursor(page.nextCursor)
        }

        if (cancelled) return

        const items = rawMessages
          .map((item) => normalizeTeamMessage(item, currentUserId))
          .filter(Boolean)
        setMessages(items)

        if (targetMessageId) {
          setTimeout(() => scrollToMessage(targetMessageId), 300)
        } else if (items.length > 0) {
          isNearBottomRef.current = true
          setTimeout(() => syncToBottom(false, true), 50)
        }
      } catch (err) {
        if (cancelled) return
        if (!isNewChat) {
          showToast(err?.message || 'Failed to load messages')
        }
        setMessages([])
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadMessages()

    return () => {
      cancelled = true
    }
  }, [token, conversationId, currentUserId, targetMessageId, isNewChat, scrollToMessage, syncToBottom])

  useEffect(() => {
    if (!token) return undefined

    connectSocket(token)

    const joinConversation = () => {
      if (conversationId) {
        emitSocket('internalChatJoin', conversationId)
      }
    }

    if (conversationId) {
      setActiveTeamConversation(conversationId)
      markTeamConversationRead({ token, conversationId })
      if (isSocketConnected()) {
        joinConversation()
      }
    }

    const syncSocketState = () => setSocketReady(isSocketConnected())
    syncSocketState()

    const socket = getSocket()
    const onConnect = () => {
      setSocketReady(true)
      joinConversation()
    }
    const onDisconnect = () => setSocketReady(false)

    if (socket) {
      socket.on('connect', onConnect)
      socket.on('disconnect', onDisconnect)
    }

    const pollId = setInterval(syncSocketState, 2000)

    return () => {
      clearInterval(pollId)
      if (conversationId) {
        emitSocket('internalChatLeave', conversationId)
        setActiveTeamConversation(null)
      }
      if (socket) {
        socket.off('connect', onConnect)
        socket.off('disconnect', onDisconnect)
      }
    }
  }, [token, conversationId])

  useEffect(() => {
    if (!peerUser?.email) return undefined

    let cancelled = false
    getUsersOnlineStatus([peerUser.email])
      .then((status) => {
        if (cancelled) return
        if (Array.isArray(status)) {
          const entry = status.find(
            (item) => (item?.email || item?.userEmail)?.toLowerCase() === peerUser.email.toLowerCase(),
          )
          setIsOnline(!!(entry?.online ?? entry?.isOnline))
        } else if (status && typeof status === 'object') {
          const value = status[peerUser.email] ?? status[peerUser.email.toLowerCase()]
          setIsOnline(!!(value?.online ?? value))
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [peerUser?.email])

  const handlePresenceChange = useCallback((data) => {
    if (!peerUser?.email) return
    try {
      const change = parsePresenceChange(data)
      if (!change || change.email !== peerUser.email.toLowerCase()) return
      setIsOnline(change.online)
    } catch {
      // ignore malformed presence payloads
    }
  }, [peerUser?.email])

  useEffect(() => {
    onSocket('v1OnUserPresenceChange', handlePresenceChange)
    return () => offSocket('v1OnUserPresenceChange', handlePresenceChange)
  }, [handlePresenceChange])

  const handleSocketMessage = useCallback((data) => {
    const incoming = extractInternalChatMessage(data)
    if (!incoming?.content) return
    if (String(incoming.conversationId) !== String(conversationId)) return

    setMessages((prev) => {
      const exists = prev.some((message) => String(message.id) === String(incoming.id))
      if (exists) return prev
      return [
        ...prev,
        normalizeTeamMessage(
          {
            id: incoming.id,
            body: incoming.content,
            sender_id: incoming.senderId,
            created_at: incoming.createdAt,
          },
          currentUserId,
        ),
      ]
    })
    syncToBottom(true)
  }, [conversationId, currentUserId, syncToBottom])

  const handleSocketError = useCallback((data) => {
    const message =
      typeof data === 'string'
        ? data
        : data?.message || data?.error || 'Chat error'
    showToast(message)
  }, [])

  useEffect(() => {
    onSocket('internalChatMessage', handleSocketMessage)
    onSocket('internalChatError', handleSocketError)
    return () => {
      offSocket('internalChatMessage', handleSocketMessage)
      offSocket('internalChatError', handleSocketError)
    }
  }, [handleSocketMessage, handleSocketError])

  const loadOlderMessages = useCallback(async () => {
    if (!token || !conversationId || loadingOlder || !hasMoreOlder || olderCursor == null) {
      return
    }

    setLoadingOlder(true)
    try {
      const data = await getInternalMessages({
        token,
        conversationId,
        limit: 80,
        cursor: olderCursor,
      })
      const page = parseMessagesPage(data, 80)
      const olderItems = page.items
        .map((item) => normalizeTeamMessage(item, currentUserId))
        .filter(Boolean)

      setMessages((prev) => mergeMessages(olderItems, prev))
      setHasMoreOlder(page.hasMore)
      setOlderCursor(page.nextCursor ?? olderItems[0]?.id ?? null)
    } catch (err) {
      showToast(err?.message || 'Failed to load earlier messages')
    } finally {
      setLoadingOlder(false)
    }
  }, [token, conversationId, loadingOlder, hasMoreOlder, olderCursor, currentUserId])

  const onSend = () => {
    const text = draft.trim()
    if (!text || !conversationId) return

    if (!isSocketConnected()) {
      if (token) connectSocket(token)
    }

    if (!isSocketConnected()) {
      showToast('Connecting to chat... Try again in a moment.')
      return
    }

    const optimistic = normalizeTeamMessage(
      {
        id: `local-${Date.now()}`,
        body: text,
        sender_id: currentUserId,
        created_at: new Date().toISOString(),
        status: 'sending',
      },
      currentUserId,
    )

    setMessages((prev) => [...prev, optimistic])
    setDraft('')
    isNearBottomRef.current = true
    syncToBottom(true, true)

    emitSocket('internalChatSend', {
      conversationId: Number(conversationId) || conversationId,
      body: text,
    })

    emitTeamChatActivity({
      conversationId,
      user: peerUser,
      lastMessage: text,
      lastMessageAt: optimistic?.createdAt || new Date().toISOString(),
    })
  }

  const renderBubble = useCallback(({ item }) => {
    const isRight = item.side === 'right'
    const isHighlighted = highlightMessageId && String(item.id) === highlightMessageId

    return (
      <View style={[styles.row, isRight ? styles.rowRight : styles.rowLeft]}>
        <View
          style={[
            styles.bubble,
            isRight ? styles.bubbleRight : styles.bubbleLeft,
            isHighlighted && { borderWidth: 2, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.msgText, isRight && styles.msgTextRight]}>{item.content}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.timeText, isRight && styles.timeTextRight]}>
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    )
  }, [styles, colors, highlightMessageId])

  const showSkeleton = !isNewChat && loading && messages.length === 0
  const canSend = draft.trim().length > 0 && !!conversationId

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={[`${colors.primary}22`, `${colors.accent}18`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={[styles.chatHeader, { paddingTop: insets.top + 6 }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.headerBtn}
                activeOpacity={0.85}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="chevron-left" size={22} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {peerUser?.name || 'Teammate'}
                </Text>
                <View style={styles.headerStatusRow}>
                  <View
                    style={[
                      styles.headerStatusDot,
                      { backgroundColor: isOnline ? (colors.success || '#10B981') : colors.gray },
                    ]}
                  />
                  <Text style={styles.headerPhoneInline}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
                {peerUser?.email ? (
                  <Text style={styles.headerPhone} numberOfLines={1}>
                    {peerUser.email}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.chatBody}>
        {showSkeleton ? (
          <LoadingView skeleton="messages" style={styles.loadingSkeleton} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderBubble}
            style={styles.messageList}
            contentContainerStyle={[
              styles.listContent,
              messages.length > 0 && styles.listContentPinned,
            ]}
            onScroll={onListScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              if (!targetMessageId) syncToBottom(false)
            }}
            onLayout={() => syncToBottom(false)}
            onScrollToIndexFailed={() => syncToBottom(true, true)}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListHeaderComponent={
              hasMoreOlder ? (
                <TouchableOpacity
                  onPress={loadOlderMessages}
                  disabled={loadingOlder}
                  style={styles.listLoadEarlier}
                  activeOpacity={0.7}
                >
                  <Text style={styles.listLoadEarlierText}>
                    {loadingOlder ? 'Loading...' : 'Load earlier messages'}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.listEmptyWrap}>
                  <Text style={styles.listEmptyText}>
                    {socketReady ? 'No messages yet' : 'Connecting to chat...'}
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        <Animated.View style={[styles.inputFooter, animatedFooterStyle]}>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Your Messages"
              placeholderTextColor={colors.gray}
              value={draft}
              onChangeText={setDraft}
              style={styles.input}
              multiline
              scrollEnabled
              blurOnSubmit={false}
              textAlignVertical="top"
              onFocus={() => {
                isNearBottomRef.current = true
                syncToBottom(false, true)
              }}
            />
            <TouchableOpacity
              onPress={onSend}
              activeOpacity={0.8}
              style={[styles.sendBtn, !canSend && { opacity: 0.45 }]}
              disabled={!canSend}
            >
              <FontAwesome name="send" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Animated.View style={animatedKeyboardSpacerStyle} />
        </Animated.View>
      </View>
    </View>
  )
}
