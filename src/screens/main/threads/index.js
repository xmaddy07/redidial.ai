import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { View, Text, Image, TouchableOpacity, TextInput, FlatList, InteractionManager, Switch, Pressable, ActivityIndicator, Modal, Platform } from 'react-native'
import { Alert } from '../../../utils/alert'
import Animated from 'react-native-reanimated'
import { useFocusEffect } from '@react-navigation/native'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../../theme/layout'
import getStyles from './styles'
import { images } from '../../../constant'
import { useSelector } from 'react-redux'
import { getOrganizationDetails, getLeadUserList, getOrgUsers, assignThreadToUser, assignThreadToMe, markThreadAsRead, makeCallWithAgent, getAgentCallStatus, hangupAgentCall } from '../../../api'
import { fetchLeadDncStatus } from '../../../utils/dnc'
import {
  loadThreadMessages,
  fetchThreadWithCache,
  sendChatMessageWithCache,
  sendChatMessageWithFileWithCache,
  saveSocketMessageToCache,
  finalizeOutboundMessageStatus,
  onPendingMessageSynced,
  syncPendingMessages,
} from '../../../services/offlineSync'
import { subscribeToNetwork, checkIsOnline } from '../../../utils/network'
import { onSocket, offSocket } from '../../../services'
import Icon from 'react-native-vector-icons/MaterialIcons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import LoadingView from '../../../component/LoadingView'
import { useTheme } from '../../../hooks/useTheme'
import { useChatKeyboard } from '../../../hooks/useChatKeyboard'
import {
  resolveCurrentAssignee,
  isAssignmentSystemText,
} from '../../../utils/threadAssignment'
import { isSystemPayload, formatMessageDateTime, formatMessageTime, formatOutboundMessageStatus, isStructuredChatMessage, shouldShowSystemMessageDateTime, isOutgoingCallSystemText } from '../../../utils/chatMessageParser'
import { mapOrgUserForAssign, normalizeUsersList } from '../../../utils/orgUsers'
import { pick, types as DocTypes, isErrorWithCode, errorCodes } from '@react-native-documents/picker'
import ImagePicker from 'react-native-image-crop-picker'
import { emitInitiateCall } from '../../../utils/callEvents'
import {
  buildDefaultFileMessage,
  getFileKind,
  normalizeLocalFileUri,
} from '../../../utils/chatAttachments'
import {
  ChatMessageFiles,
  PendingFilePreview,
  getMessageFiles,
} from '../../../component/chatMessageFiles'
import AttachPickerModal from '../../../component/attachPickerModal'
import FormattedChatMessage from '../../../component/formattedChatMessage'

const TERMINAL_BOT_CALL_STATUSES = new Set([
  'completed',
  'busy',
  'failed',
  'no-answer',
  'no_answer',
  'canceled',
  'cancelled',
  'hangup',
  'ended',
])

const formatBotCallStatus = (status) => {
  const value = String(status || 'ringing').toLowerCase().replace(/_/g, '-')
  if (value.includes('ring') || value === 'queued' || value === 'initiated' || value === 'dialing') {
    return 'Ringing'
  }
  if (value.includes('progress') || value === 'answered' || value === 'in-call') {
    return 'In progress'
  }
  if (value === 'completed') return 'Completed'
  if (value === 'busy') return 'Busy'
  if (value === 'failed') return 'Failed'
  if (value.includes('no-answer')) return 'No answer'
  if (value.includes('cancel') || value === 'ended' || value === 'hangup') return 'Ended'
  return 'Ringing'
}

const extractCallSid = (payload) => (
  payload?.callSid
  || payload?.call_sid
  || payload?.sid
  || payload?.data?.callSid
  || payload?.data?.call_sid
  || payload?.data?.sid
  || null
)

const extractCallStatus = (payload) => (
  payload?.status
  || payload?.callStatus
  || payload?.call_status
  || payload?.data?.status
  || payload?.data?.callStatus
  || payload?.data?.call_status
  || 'ringing'
)

const isTerminalBotCallStatus = (status) => (
  TERMINAL_BOT_CALL_STATUSES.has(String(status || '').toLowerCase().replace(/_/g, '-'))
)

export default function Threads({ navigation, route }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions, screenWidth, insets } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])
  const token = useSelector(state => state?.auth?.token)
  const currentUser = useSelector(state => state?.auth?.user)
  const currentUserId = currentUser?.id ?? currentUser?.user_id
  const initialLead = useMemo(() => route?.params?.lead || {}, [route?.params?.lead])
  const leadId = route?.params?.id || initialLead?.id
  const [lead, setLead] = useState(initialLead)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [draft, setDraft] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [assignMenuOpen, setAssignMenuOpen] = useState(false)
  const [orgUsers, setOrgUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [sendingFile, setSendingFile] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [isDnc, setIsDnc] = useState(false)
  const [botCallBarVisible, setBotCallBarVisible] = useState(false)
  const [botCallStatus, setBotCallStatus] = useState('ringing')
  const [botCallSid, setBotCallSid] = useState(null)
  const [botCallLoading, setBotCallLoading] = useState(false)
  const botCallPollRef = useRef(null)
  const listRef = useRef(null)
  const assignBadgeRef = useRef(null)
  const shouldScrollToEndRef = useRef(true)
  const isNearBottomRef = useRef(true)
  const [dropdownAnchor, setDropdownAnchor] = useState(null)
  const isSearchActiveRef = useRef(false)

  const isPinnedToBottom = useCallback(() => isNearBottomRef.current, [])

  const syncToBottom = useCallback((animated = false, force = false) => {
    if (!listRef.current) return
    if (!force && !isPinnedToBottom()) return

    const inverted = !isSearchActiveRef.current
    const scroll = () => {
      if (inverted) {
        listRef.current?.scrollToOffset({ offset: 0, animated })
      } else {
        listRef.current?.scrollToEnd({ animated })
      }
    }

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

  const inputBottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 12)

  const { animatedFooterStyle, animatedKeyboardSpacerStyle } = useChatKeyboard(
    onKeyboardVisible,
    onKeyboardSettled,
    inputBottomInset,
  )

  const onListScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    if (isSearchActiveRef.current) {
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y
      isNearBottomRef.current = distanceFromBottom < 96
      return
    }
    isNearBottomRef.current = contentOffset.y < 96
  }, [])

  const onListContentSizeChange = useCallback(() => {
    if (isSearchActiveRef.current) return
    if (!shouldScrollToEndRef.current && !isPinnedToBottom()) return
    syncToBottom(false)
  }, [isPinnedToBottom, syncToBottom])

  const onListLayout = useCallback(() => {
    if (isSearchActiveRef.current) return
    syncToBottom(false)
  }, [syncToBottom])

  const applyThreadData = useCallback((nextMessages, nextLead) => {
    if (Array.isArray(nextMessages)) {
      setMessages(nextMessages)
    }
    if (nextLead) {
      setLead(nextLead)
    }
  }, [])

  const refreshFromSQLite = useCallback(async () => {
    if (!leadId) return []
    const cached = await loadThreadMessages(leadId)
    setMessages(cached)
    return cached
  }, [leadId])

  const scheduleDeliveredStatusClear = useCallback((messageLocalId) => {
    if (!messageLocalId || !leadId) return
    setTimeout(() => {
      finalizeOutboundMessageStatus(messageLocalId, leadId)
        .then((fresh) => setMessages(fresh))
        .catch(() => {})
    }, 2000)
  }, [leadId])

  const syncWithServer = useCallback(async (showSpinner = false) => {
    if (!leadId) return
    if (showSpinner) setSyncing(true)
    try {
      const result = await fetchThreadWithCache(token, leadId)
      applyThreadData(result.messages, result.lead)
    } catch {
      await refreshFromSQLite()
    } finally {
      if (showSpinner) setSyncing(false)
    }
  }, [leadId, token, applyThreadData, refreshFromSQLite])

  const closeAssignMenu = useCallback(() => {
    setAssignMenuOpen(false)
    setDropdownAnchor(null)
  }, [])

  const loadOrgUsers = useCallback(async () => {
    if (!token) return []
    setLoadingUsers(true)
    try {
      let data
      try {
        data = await getLeadUserList(token)
      } catch {
        data = await getOrgUsers(token)
      }
      const mapped = normalizeUsersList(data)
        .map(mapOrgUserForAssign)
        .filter((user) => user.id != null)
      setOrgUsers(mapped)
      return mapped
    } catch (err) {
      const online = await checkIsOnline()
      if (online) {
        Alert.alert('Error', err?.message || 'Failed to load users')
      }
      return []
    } finally {
      setLoadingUsers(false)
    }
  }, [token])


  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      if (!leadId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const cached = await loadThreadMessages(leadId)
        if (cancelled) return

        setMessages(cached)
        if (cached.length > 0) {
          setLoading(false)
        }

        if (initialLead?.id || initialLead?.customer_name) {
          setLead(initialLead)
        }

        await syncWithServer(false)
      } catch {
        if (!cancelled) {
          await refreshFromSQLite()
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [leadId, token, syncWithServer, refreshFromSQLite, initialLead])

  useFocusEffect(
    useCallback(() => {
      if (!leadId) return undefined
      syncWithServer(false)
      if (token) {
        markThreadAsRead({ token, leadId }).catch(() => {})
      }

      let cancelled = false
      const loadDnc = async () => {
        const phone = lead?.customer_telephone
        if (!token || !phone) {
          if (!cancelled) setIsDnc(false)
          return
        }
        try {
          const result = await fetchLeadDncStatus({
            token,
            phone,
            user: currentUser,
          })
          if (!cancelled) setIsDnc(result.isDnc)
        } catch {
          if (!cancelled) setIsDnc(false)
        }
      }
      loadDnc()

      return () => {
        cancelled = true
        closeAssignMenu()
      }
    }, [leadId, token, lead?.customer_telephone, currentUser, syncWithServer, closeAssignMenu]),
  )

  useEffect(() => {
    if (!token || !leadId) return undefined

    getOrganizationDetails(token).catch(() => {})

    const handleNewMessage = async (data) => {
      try {
        const message = data?.message || data
        if (!message) return
        if (leadId && message.lead_id && String(message.lead_id) !== String(leadId)) return

        const updated = await saveSocketMessageToCache(leadId, message)
        setMessages(updated)
        syncToBottom(true)

        const raw = typeof message.text === 'string' ? message.text : message.content || ''
        const isAssignment = isSystemPayload(raw) && isAssignmentSystemText(
          (() => {
            try {
              const obj = JSON.parse(String(raw))
              const first = obj?.user?.first_name || obj?.user?.firstName || ''
              const last = obj?.user?.last_name || obj?.user?.lastName || ''
              const name = [first, last].filter(Boolean).join(' ').trim()
                || obj?.user?.name || obj?.user?.email || ''
              return `${obj?.msg || obj?.message || ''}${name}`.trim()
            } catch {
              return raw
            }
          })(),
        )
        if (isAssignment) {
          syncWithServer(false)
        }
      } catch {
        // ignore malformed socket payloads
      }
    }

    onSocket('v1NewMessage', handleNewMessage)
    return () => offSocket('v1NewMessage', handleNewMessage)
  }, [leadId, token, syncToBottom, syncWithServer])

  useEffect(() => {
    if (!leadId) return undefined

    return onPendingMessageSynced(({ leadId: syncedLeadId, localId: syncedLocalId }) => {
      if (String(syncedLeadId) !== String(leadId)) return
      loadThreadMessages(leadId)
        .then((fresh) => {
          setMessages(fresh)
          scheduleDeliveredStatusClear(syncedLocalId)
          syncToBottom(true, true)
        })
        .catch(() => {})
    })
  }, [leadId, scheduleDeliveredStatusClear, syncToBottom])

  useEffect(() => {
    if (!token || !leadId) return undefined

    const refreshAfterReconnect = async () => {
      try {
        await syncPendingMessages(token)
        const fresh = await loadThreadMessages(leadId)
        setMessages(fresh)
        fresh.forEach((message) => {
          if (message.status === 'delivered' && message.localId) {
            scheduleDeliveredStatusClear(message.localId)
          }
        })
        syncToBottom(true, true)
      } catch {
        await refreshFromSQLite()
      }
    }

    return subscribeToNetwork(({ cameOnline }) => {
      if (cameOnline) {
        refreshAfterReconnect()
      }
    })
  }, [token, leadId, scheduleDeliveredStatusClear, syncToBottom, refreshFromSQLite])

  const currentAssignee = useMemo(
    () => resolveCurrentAssignee(lead, messages),
    [lead, messages],
  )

  const isBotHandling = Boolean(currentAssignee?.isBot)

  const userDisplayName = useMemo(() => {
    const first = currentUser?.first_name || currentUser?.firstName || ''
    const last = currentUser?.last_name || currentUser?.lastName || ''
    const name = [first, last].filter(Boolean).join(' ').trim()
    return name || currentUser?.name || currentUser?.email || 'Unknown'
  }, [currentUser])

  const canSend = Boolean((draft.trim() || pendingFile) && !isBotHandling && !sendingFile)

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return messages
    return messages.filter((m) => (m?.text || '').toLowerCase().includes(q))
  }, [messages, searchQuery])

  const isSearchActive = searchQuery.trim().length > 0
  const useInvertedList = !isSearchActive && !isSearching

  const listData = useMemo(() => {
    if (!useInvertedList) return filteredMessages
    return [...filteredMessages].reverse()
  }, [filteredMessages, useInvertedList])

  useEffect(() => {
    isSearchActiveRef.current = isSearchActive || isSearching
  }, [isSearchActive, isSearching])

  useEffect(() => {
    if (loading) return undefined
    if (isSearchActive) {
      const task = InteractionManager.runAfterInteractions(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true })
      })
      return () => task.cancel()
    }

    if (filteredMessages.length === 0 || !shouldScrollToEndRef.current) return undefined
    const task = InteractionManager.runAfterInteractions(() => {
      syncToBottom(false, true)
      shouldScrollToEndRef.current = false
    })
    return () => task.cancel()
  }, [loading, isSearchActive, filteredMessages.length, syncToBottom])

  const onToggleSearch = () => {
    setIsSearching((prev) => {
      const next = !prev
      if (next) {
        requestAnimationFrame(() => {
          listRef.current?.scrollToOffset({ offset: 0, animated: false })
        })
      } else {
        setSearchQuery('')
        shouldScrollToEndRef.current = true
        syncToBottom(true, true)
      }
      return next
    })
  }

  const onCloseSearch = () => {
    setIsSearching(false)
    setSearchQuery('')
    shouldScrollToEndRef.current = true
    syncToBottom(true, true)
  }

  const measureAssignBadge = useCallback(() => new Promise((resolve) => {
    if (!assignBadgeRef.current) {
      resolve(null)
      return
    }
    assignBadgeRef.current.measureInWindow((x, y, width, height) => {
      resolve({
        top: y + height + 6,
        right: Math.max(wp(3), screenWidth - (x + width)),
      })
    })
  }), [screenWidth])

  const onToggleAssignMenu = useCallback(async () => {
    if (assignMenuOpen) {
      closeAssignMenu()
      return
    }

    const anchor = await measureAssignBadge()
    setDropdownAnchor(anchor)
    setAssignMenuOpen(true)
    if (orgUsers.length === 0) {
      loadOrgUsers()
    }
  }, [assignMenuOpen, closeAssignMenu, measureAssignBadge, orgUsers.length, loadOrgUsers])

  const onAssignToMe = useCallback(async () => {
    if (!token || !leadId || assigning) return

    setAssigning(true)
    try {
      await assignThreadToMe({ token, leadId })
      closeAssignMenu()
      await syncWithServer(false)
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to assign thread to you')
    } finally {
      setAssigning(false)
    }
  }, [token, leadId, assigning, syncWithServer, closeAssignMenu])

  const onAssignUser = useCallback(async (user) => {
    if (!token || !leadId || assigning || user?.id == null) return

    setAssigning(true)
    try {
      await assignThreadToUser({ token, leadId, userId: user.id })
      closeAssignMenu()
      await syncWithServer(false)
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to assign thread')
    } finally {
      setAssigning(false)
    }
  }, [token, leadId, assigning, syncWithServer, closeAssignMenu])

  const onBotToggle = useCallback(async (enabled) => {
    if (!token || !leadId || assigning) return

    let users = orgUsers
    if (users.length === 0) {
      users = await loadOrgUsers()
    }

    const targetUser = enabled
      ? users.find((user) => user.isBot)
      : users.find((user) => String(user.id) === String(currentUserId))

    if (!targetUser?.id) {
      Alert.alert(
        'Error',
        enabled ? 'Bot user not found' : 'Could not find your user account',
      )
      return
    }

    setAssigning(true)
    try {
      await assignThreadToUser({ token, leadId, userId: targetUser.id })
      await syncWithServer(false)
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to update bot assignment')
    } finally {
      setAssigning(false)
    }
  }, [
    token,
    leadId,
    assigning,
    orgUsers,
    loadOrgUsers,
    currentUserId,
    syncWithServer,
  ])

  const renderAssignMenu = () => (
    <Modal
      visible={assignMenuOpen}
      transparent
      animationType="fade"
      onRequestClose={closeAssignMenu}
    >
      <View style={styles.assignModalRoot}>
        <Pressable style={styles.assignModalOverlay} onPress={closeAssignMenu} />
        {dropdownAnchor ? (
          <View
            style={[
              styles.assignDropdownModal,
              { top: dropdownAnchor.top, right: dropdownAnchor.right },
            ]}
          >
            {loadingUsers ? (
              <View style={styles.assignDropdownLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.assignDropdownItem, styles.assignDropdownItemHighlight]}
                  onPress={onAssignToMe}
                  disabled={assigning}
                >
                  <Text style={styles.assignDropdownText}>Assign to me</Text>
                </TouchableOpacity>
                {orgUsers.map((user) => (
                  <TouchableOpacity
                    key={String(user.id)}
                    style={styles.assignDropdownItem}
                    onPress={() => onAssignUser(user)}
                    disabled={assigning}
                  >
                    <Text style={styles.assignDropdownText}>{user.name}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            {!loadingUsers && orgUsers.length === 0 ? (
              <Text style={styles.assignDropdownEmpty}>No users available</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  )

  const renderDncIcon = () => {
    if (!isDnc) return null
    return (
      <View style={styles.dncIconWrap}>
        <MaterialCommunityIcons name="cancel" size={15} color={colors.danger} />
      </View>
    )
  }

  const renderAssigneeBadge = () => (
    <View
      ref={assignBadgeRef}
      collapsable={false}
      style={styles.assignBadgeWrap}
    >
      <TouchableOpacity
        style={styles.assignBadge}
        onPress={onToggleAssignMenu}
        activeOpacity={0.85}
        disabled={assigning}
      >
        <View style={[
          styles.assignAvatar,
          currentAssignee?.isBot ? styles.assignAvatarBot : styles.assignAvatarHuman,
        ]}>
          <Text style={[
            styles.assignAvatarText,
            currentAssignee?.isBot ? styles.assignAvatarTextBot : styles.assignAvatarTextHuman,
          ]}>
            {currentAssignee?.isBot
              ? 'B'
              : (currentAssignee?.name?.[0] || '?').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.assignBadgeText} numberOfLines={1}>
          {currentAssignee
            ? `Assigned to: ${currentAssignee.name}`
            : 'Assign to...'}
        </Text>
        <TouchableOpacity
          style={styles.assignEditBtn}
          onPress={onToggleAssignMenu}
          activeOpacity={0.85}
          disabled={assigning}
        >
          <Icon name="edit" size={13} color={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  )

  const renderHeaderActions = () => (
    <>
      <TouchableOpacity onPress={onToggleSearch} style={styles.headerActionBtn}>
        <Image source={images.search} style={styles.headerActionIcon} resizeMode="contain" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onCallLead} style={styles.headerActionBtn}>
        <Icon name="headphones" size={20} color={colors.text} />
      </TouchableOpacity>
      {/* <TouchableOpacity onPress={onBotCallPress} style={styles.headerActionBtn}>
        <Icon name="play-arrow" size={22} color={colors.text} />
      </TouchableOpacity> */}
    </>
  )

  const renderContactInfo = () => (
    <TouchableOpacity
      onPress={() => navigation.navigate('info', { id: leadId, lead })}
      style={styles.headerCenter}
    >
      <Text style={styles.headerName} numberOfLines={1}>
        {lead?.customer_name || '—'}
      </Text>
      <Text style={styles.headerPhone} numberOfLines={1}>
        {lead?.customer_telephone || '—'}
      </Text>
    </TouchableOpacity>
  )

  const setPendingFromPick = useCallback((file) => {
    if (!file?.uri) return
    const uri = normalizeLocalFileUri(file.uri) || file.uri
    setPendingFile({
      uri,
      name: file.name,
      type: file.type,
      size: file.size ?? null,
      kind: getFileKind(file.type, file.name),
    })
  }, [])

  const onSend = async () => {
    if (!canSend || !leadId) return

    if (pendingFile) {
      const content = draft.trim() || buildDefaultFileMessage(pendingFile.name)
      const fileToSend = { ...pendingFile }
      const localId = Date.now()
      setDraft('')
      setPendingFile(null)
      setSendingFile(true)
      isNearBottomRef.current = true
      shouldScrollToEndRef.current = true

      const optimisticMessage = {
        id: `m-${localId}`,
        side: 'right',
        text: content,
        files: [{
          name: fileToSend.name,
          mime: fileToSend.type,
          size: fileToSend.size,
          url: fileToSend.uri,
          kind: fileToSend.kind,
          local: true,
        }],
        time: formatMessageTime(new Date().toISOString()),
        status: 'sending',
        syncStatus: 'pending',
        localId: String(localId),
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimisticMessage])
      syncToBottom(true, true)

      try {
        const result = await sendChatMessageWithFileWithCache(token, {
          content,
          local_id: localId,
          lead_id: leadId,
          file: fileToSend,
          userName: userDisplayName,
        })
        if (Array.isArray(result.messages)) {
          setMessages(result.messages)
          if (!result.offline && !result.queued) {
            scheduleDeliveredStatusClear(localId)
          }
        } else {
          await refreshFromSQLite()
        }
        syncToBottom(true, true)
      } catch (err) {
        Alert.alert('Error', err?.message || 'Failed to send attachment')
        await refreshFromSQLite()
      } finally {
        setSendingFile(false)
      }
      return
    }

    const content = draft.trim()
    const localId = Date.now()
    setDraft('')
    isNearBottomRef.current = true
    shouldScrollToEndRef.current = true

    const optimisticMessage = {
      id: `m-${localId}`,
      side: 'right',
      text: content,
      time: formatMessageTime(new Date().toISOString()),
      status: 'sending',
      syncStatus: 'pending',
      localId: String(localId),
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMessage])
    syncToBottom(true, true)

    try {
      const result = await sendChatMessageWithCache(token, {
        content,
        local_id: localId,
        lead_id: leadId,
      })
      if (Array.isArray(result.messages)) {
        setMessages(result.messages)
        if (!result.offline && !result.queued) {
          scheduleDeliveredStatusClear(localId)
        }
      } else {
        await refreshFromSQLite()
      }
      syncToBottom(true, true)
    } catch {
      await refreshFromSQLite()
    }
  }

  const pickImage = useCallback(async () => {
    if (pendingFile) return
    try {
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: false,
      })
      if (!image?.path) return
      setPendingFromPick({
        uri: normalizeLocalFileUri(image.path) || image.path,
        name: image.filename || `photo-${Date.now()}.jpg`,
        type: image.mime || 'image/jpeg',
        size: image.size ?? null,
      })
    } catch (err) {
      if (err?.code === 'E_PICKER_CANCELLED') return
      Alert.alert('Error', err?.message || 'Failed to pick image')
    }
  }, [pendingFile, setPendingFromPick])

  const pickVideo = useCallback(async () => {
    if (pendingFile) return
    try {
      const video = await ImagePicker.openPicker({
        mediaType: 'video',
      })
      if (!video?.path) return
      const name = video.filename || `video-${Date.now()}.mp4`
      setPendingFromPick({
        uri: normalizeLocalFileUri(video.path) || video.path,
        name,
        type: video.mime || 'video/mp4',
        size: video.size ?? null,
      })
    } catch (err) {
      if (err?.code === 'E_PICKER_CANCELLED') return
      Alert.alert('Error', err?.message || 'Failed to pick video')
    }
  }, [pendingFile, setPendingFromPick])

  const pickDocument = useCallback(async () => {
    if (pendingFile) return
    try {
      const [result] = await pick({
        type: [DocTypes.pdf, DocTypes.doc, DocTypes.docx],
        allowMultiSelection: false,
      })
      if (!result?.uri) return
      setPendingFromPick({
        uri: result.uri,
        name: result.name || `file-${Date.now()}`,
        type: result.type || 'application/octet-stream',
        size: result.size ?? null,
      })
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return
      Alert.alert('Error', err?.message || 'Failed to pick file')
    }
  }, [pendingFile, setPendingFromPick])

  const onAttachPress = useCallback(() => {
    if (isBotHandling || sendingFile || pendingFile) return
    setAttachMenuOpen(true)
  }, [isBotHandling, sendingFile, pendingFile])

  const stopBotCallPolling = useCallback(() => {
    if (botCallPollRef.current) {
      clearInterval(botCallPollRef.current)
      botCallPollRef.current = null
    }
  }, [])

  const refreshBotCallStatus = useCallback(async (callSid) => {
    if (!token || !callSid) return
    try {
      const res = await getAgentCallStatus({ token, callSid })
      const nextStatus = extractCallStatus(res)
      console.log('[BotCall] status update:', { callSid, nextStatus })
      setBotCallStatus(nextStatus)
      if (isTerminalBotCallStatus(nextStatus)) {
        stopBotCallPolling()
        setTimeout(() => {
          setBotCallBarVisible(false)
          setBotCallSid(null)
          setBotCallStatus('ringing')
        }, 1200)
      }
    } catch (err) {
      console.warn('[BotCall] status poll failed:', err?.message || err)
    }
  }, [token, stopBotCallPolling])

  const startBotCallPolling = useCallback((callSid) => {
    stopBotCallPolling()
    refreshBotCallStatus(callSid)
    botCallPollRef.current = setInterval(() => {
      refreshBotCallStatus(callSid)
    }, 2500)
  }, [refreshBotCallStatus, stopBotCallPolling])

  useEffect(() => () => stopBotCallPolling(), [stopBotCallPolling])

  const onDismissBotCallBar = useCallback(() => {
    setBotCallBarVisible(false)
  }, [])

  const onHangupBotCall = useCallback(async () => {
    if (!token || !botCallSid || botCallLoading) return

    console.log('[BotCall] hangup requested', { callSid: botCallSid })
    setBotCallLoading(true)
    try {
      await hangupAgentCall({ token, callSid: botCallSid })
      setBotCallStatus('ended')
      stopBotCallPolling()
      setTimeout(() => {
        setBotCallBarVisible(false)
        setBotCallSid(null)
        setBotCallStatus('ringing')
      }, 800)
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to hang up call')
    } finally {
      setBotCallLoading(false)
    }
  }, [token, botCallSid, botCallLoading, stopBotCallPolling])

  const startBotCall = useCallback(async (phone) => {
    if (!token) {
      console.warn('[BotCall] skipped: missing auth token')
      return
    }
    if (botCallLoading) {
      console.warn('[BotCall] skipped: call already starting')
      return
    }

    console.log('[BotCall] starting', { leadId, phone })

    setBotCallBarVisible(true)
    setBotCallStatus('ringing')
    setBotCallLoading(true)

    try {
      const res = await makeCallWithAgent({
        token,
        phoneNumber: phone.replace(/[^\d+]/g, ''),
        leadId,
      })
      const callSid = extractCallSid(res)
      console.log('[BotCall] started', { callSid, response: res })
      if (!callSid) {
        throw new Error('Call started but no call ID was returned')
      }
      setBotCallSid(callSid)
      const nextStatus = extractCallStatus(res)
      setBotCallStatus(nextStatus)
      if (!isTerminalBotCallStatus(nextStatus)) {
        startBotCallPolling(callSid)
      }
    } catch (err) {
      console.error('[BotCall] failed:', err?.message || err, err?.details)
      setBotCallBarVisible(false)
      setBotCallSid(null)
      setBotCallStatus('ringing')
      Alert.alert('Bot call failed', err?.message || 'Could not start bot call')
    } finally {
      setBotCallLoading(false)
    }
  }, [token, leadId, botCallLoading, startBotCallPolling])

  const onBotCallPress = useCallback(async () => {
    console.log('[BotCall] button pressed', { leadId, isDnc, botCallSid, botCallStatus })

    if (botCallSid && !isTerminalBotCallStatus(botCallStatus)) {
      console.log('[BotCall] reopening active call bar')
      setBotCallBarVisible(true)
      return
    }

    const phone = String(lead?.customer_telephone || '').trim()
    if (!phone) {
      console.warn('[BotCall] skipped: lead has no phone number')
      Alert.alert('No phone number', 'This lead does not have a phone number on file.')
      return
    }

    if (isDnc) {
      console.log('[BotCall] DNC lead — showing confirmation')
      Alert.alert(
        'Do Not Call',
        'This contact is on the Do Not Call list. Bot calls are not recommended.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call anyway',
            style: 'destructive',
            onPress: () => startBotCall(phone),
          },
        ],
      )
      return
    }

    await startBotCall(phone)
  }, [botCallSid, botCallStatus, lead?.customer_telephone, isDnc, startBotCall, leadId])

  const onCallLead = useCallback(() => {
    const phone = String(lead?.customer_telephone || '').trim()
    if (!phone) {
      Alert.alert('No phone number', 'This lead does not have a phone number on file.')
      return
    }
    console.log('[Dialer] calling lead directly', { leadId, phone })
    emitInitiateCall({
      phoneNumber: phone,
      leadId,
      contactName: lead?.customer_name,
      avatarUri: lead?.profile_image || lead?.avatar || lead?.customer_avatar,
    })
  }, [lead?.customer_telephone, lead?.customer_name, lead?.profile_image, lead?.avatar, lead?.customer_avatar, leadId])

  const renderBotCallBar = () => {
    if (!botCallBarVisible) return null

    return (
      <View style={styles.botCallBarWrap}>
        <View style={styles.botCallBar}>
        <View style={[styles.botCallIconBtn, styles.botCallActiveBtn]}>
          <MaterialCommunityIcons name="phone-ring" size={18} color={colors.primary} />
        </View>
        <TouchableOpacity
          style={[styles.botCallIconBtn, styles.botCallHangupBtn]}
          onPress={onHangupBotCall}
          activeOpacity={0.85}
          disabled={botCallLoading || !botCallSid}
        >
          {botCallLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <MaterialCommunityIcons name="phone-hangup" size={18} color={colors.white} />
          )}
        </TouchableOpacity>
        <View style={styles.botCallStatusPill}>
          <Text style={styles.botCallStatusText}>
            {formatBotCallStatus(botCallStatus)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDismissBotCallBar}
          style={styles.botCallDismissBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderBubble = useCallback(({ item }) => {
    if (item?.type === 'system') {
      const showDateTime = shouldShowSystemMessageDateTime(item.text)
      const systemDateTime = showDateTime ? formatMessageDateTime(item.createdAt) : ''
      const isAssignment = isAssignmentSystemText(item.text)
      const isOutgoingCall = isOutgoingCallSystemText(item.text)
      const isPremiumSystem = isAssignment || isOutgoingCall

      if (isPremiumSystem) {
        const assignmentMatch = isAssignment
          ? String(item.text).match(/^(Assigned to:\s*)(.+)$/i)
          : null

        return (
          <View style={[styles.row, styles.rowCenter]}>
            <View style={[styles.systemPill, isOutgoingCall && styles.systemPillStacked]}>
              <View style={styles.systemPillIconWrap}>
                <Icon
                  name={isAssignment ? 'assignment-ind' : 'call-made'}
                  size={15}
                  color={colors.primary}
                />
              </View>
              <View style={styles.systemPillContent}>
                {isAssignment ? (
                  <Text style={styles.systemPillText} numberOfLines={2}>
                    {assignmentMatch ? (
                      <>
                        <Text style={styles.systemPillLabel}>{assignmentMatch[1]}</Text>
                        <Text style={styles.systemPillName}>{assignmentMatch[2]}</Text>
                      </>
                    ) : (
                      item.text
                    )}
                    {systemDateTime ? (
                      <Text style={styles.systemPillMetaInline}> · {systemDateTime}</Text>
                    ) : null}
                  </Text>
                ) : (
                  <>
                    <Text style={styles.systemPillText}>{item.text}</Text>
                    {systemDateTime ? (
                      <View style={styles.systemPillMetaChip}>
                        <Icon name="schedule" size={11} color={colors.gray} />
                        <Text style={styles.systemPillMeta}>{systemDateTime}</Text>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            </View>
          </View>
        )
      }

      return (
        <View style={[styles.row, styles.rowCenter]}>
          <LinearGradient
            colors={[`${colors.primary}4D`, `${colors.accent}4D`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.systemBubble}
          >
            <Text style={styles.systemText}>{item.text}</Text>
          </LinearGradient>
        </View>
      )
    }
    const isRight = item.side === 'right'
    const outboundStatus = isRight ? formatOutboundMessageStatus(item.status) : null
    const messageFiles = getMessageFiles(item)
    const hasFiles = messageFiles.length > 0
    const showText = Boolean(item.text?.trim()) && !(
      hasFiles
      && /^(Shared a file:|\[Attachment\])/i.test(String(item.text).trim())
    )
    const isStructured = showText && isStructuredChatMessage(item.text)

    return (
      <View style={styles.messageItem}>
        <View style={[styles.row, isRight ? styles.rowRight : styles.rowLeft]}>
          <View style={[
            styles.bubble,
            isRight ? styles.bubbleRight : styles.bubbleLeft,
            isStructured && (isRight ? styles.bubbleStandaloneRight : styles.bubbleStandaloneLeft),
            hasFiles && !showText && styles.bubbleAttachmentOnly,
          ]}>
          {hasFiles ? (
            <ChatMessageFiles
              item={item}
              isRight={isRight}
              styles={styles}
              colors={colors}
              onPreviewImage={(url, name) => setImagePreview({ url, name })}
            />
          ) : null}
          {showText ? (
            isStructured ? (
              <FormattedChatMessage
                text={item.text}
                style={[styles.msgText, isRight && styles.msgTextRight]}
                blockStyle={styles.msgFormattedBlock}
                listItemStyle={styles.msgFormattedListItem}
              />
            ) : (
              <Text style={[styles.msgText, isRight && styles.msgTextRight]}>{item.text}</Text>
            )
          ) : null}
          <View style={styles.metaRow}>
            <Text style={[styles.timeText, isRight && styles.timeTextRight]}>
              {item.time}{outboundStatus ? ` · ${outboundStatus}` : ''}
            </Text>
          </View>
          </View>
        </View>
      </View>
    )
  }, [colors, styles])

  const showSkeleton = loading && messages.length === 0

  const listHeader = useMemo(() => {
    if (!isSearchActive) return null
    return (
      <View style={styles.searchResultsHeader}>
        <Text style={styles.searchResultsText}>
          {filteredMessages.length} result{filteredMessages.length === 1 ? '' : 's'}
        </Text>
      </View>
    )
  }, [filteredMessages.length, isSearchActive, styles])

  return (
    <View style={styles.container}>
      <View style={styles.chatShell}>
      {isSearching ? (
        <View style={styles.headerWrap}>
        <LinearGradient
          colors={[`${colors.primary}22`, `${colors.accent}18`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={[styles.chatHeader, styles.searchHeader, { paddingTop: insets.top + hp(0.6) }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={onCloseSearch}
                style={styles.headerBtn}
                activeOpacity={0.85}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="chevron-left" size={22} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.searchInputWrap}>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search messages"
                  placeholderTextColor={colors.gray}
                  style={styles.searchInput}
                  returnKeyType="search"
                  autoFocus
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {!!searchQuery && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.searchClearBtn}
                  >
                    <Icon name="close" size={18} color={colors.gray} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
        </View>
      ) : (
        <View style={styles.headerWrap}>
        <LinearGradient
          colors={[`${colors.primary}22`, `${colors.accent}18`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={[styles.chatHeader, { paddingTop: insets.top + hp(0.6) }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.headerBtn}
                activeOpacity={0.85}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="chevron-left" size={22} color={colors.text} />
              </TouchableOpacity>
              {renderContactInfo()}
            </View>
            <View style={styles.headerRight}>
              {renderDncIcon()}
              {renderAssigneeBadge()}
              {renderHeaderActions()}
            </View>
          </View>
        </LinearGradient>
        </View>
      )}

      {renderBotCallBar()}

      <View style={styles.chatBody}>
        {showSkeleton ? (
          <LoadingView skeleton="messages" style={styles.loadingSkeleton} />
        ) : (
          <FlatList
            ref={listRef}
            data={listData}
            inverted={useInvertedList}
            keyExtractor={item => item.id}
            renderItem={renderBubble}
            style={styles.messageList}
            contentContainerStyle={[
              styles.listContent,
              (isSearchActive || isSearching) && styles.listContentSearch,
            ]}
            ListHeaderComponent={listHeader}
            onScroll={onListScroll}
            scrollEventThrottle={16}
            onLayout={onListLayout}
            onContentSizeChange={onListContentSizeChange}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            initialNumToRender={30}
            maxToRenderPerBatch={30}
            windowSize={15}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListEmptyComponent={
              !loading ? (
                <View style={styles.listEmptyWrap}>
                  <Text style={styles.listEmptyText}>
                    {isSearchActive
                      ? 'No messages match your search'
                      : syncing
                        ? 'Syncing messages...'
                        : 'No messages yet'}
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {isBotHandling ? (
          <View style={[styles.botHandlingBar, { marginBottom: inputBottomInset }]}>
            <View style={styles.botHandlingLeft}>
              <Icon name="bolt" size={18} color={colors.primary} />
              <Text style={styles.botHandlingText}>Bot is handling this conversation</Text>
            </View>
            <Switch
              value={isBotHandling}
              onValueChange={onBotToggle}
              disabled={assigning}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
            />
          </View>
        ) : (
          <Animated.View style={[styles.inputFooter, animatedFooterStyle]}>
            <PendingFilePreview
              file={pendingFile}
              styles={styles}
              colors={colors}
              onRemove={() => setPendingFile(null)}
            />
            <View style={styles.inputRow}>
              <TouchableOpacity
                onPress={onAttachPress}
                activeOpacity={0.8}
                style={[
                  styles.attachBtn,
                  (sendingFile || isBotHandling || pendingFile) && styles.attachBtnDisabled,
                ]}
                disabled={sendingFile || Boolean(pendingFile)}
              >
                {sendingFile ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons name="paperclip" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
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
                style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                disabled={!canSend}
              >
                <FontAwesome name="send" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>
            <Animated.View style={animatedKeyboardSpacerStyle} />
          </Animated.View>
        )}
      </View>
      </View>

      {renderAssignMenu()}

      <AttachPickerModal
        visible={attachMenuOpen}
        onClose={() => setAttachMenuOpen(false)}
        onPickImage={pickImage}
        onPickDocument={pickDocument}
        onPickVideo={pickVideo}
        colors={colors}
        isDark={themeMode === 'dark'}
        bottomInset={inputBottomInset}
      />

      <Modal
        visible={Boolean(imagePreview)}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePreview(null)}
      >
        <View style={styles.imagePreviewBackdrop}>
          <TouchableOpacity
            style={styles.imagePreviewClose}
            onPress={() => setImagePreview(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          {imagePreview?.url ? (
            <>
              <Image
                source={{ uri: imagePreview.url }}
                style={styles.imagePreviewImage}
                resizeMode="contain"
              />
              {imagePreview?.name ? (
                <Text style={styles.imagePreviewCaption} numberOfLines={2}>
                  {imagePreview.name}
                </Text>
              ) : null}
            </>
          ) : null}
        </View>
      </Modal>
    </View>
  )
}
