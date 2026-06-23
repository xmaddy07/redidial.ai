import React, { memo, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  SectionList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import { useSelector } from 'react-redux'
import moment from 'moment'
import LoadingView from '../../../component/LoadingView'
import { useTheme } from '../../../hooks/useTheme'
import {
  getNotificationsListAll,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../../api'
import {
  adjustNotificationUnreadCount,
  isNotificationUnread,
  refreshNotificationUnreadCount,
  setNotificationUnreadCount,
} from '../../../utils/notificationUnread'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import getStyles from './styles'

const NOTIFICATION_META = {
  call: { icon: 'phone-incoming', label: 'Call', color: '#10B981' },
  lead: { icon: 'trending-up', label: 'Lead', color: '#3B82F6' },
  message: { icon: 'message-circle', label: 'Message', color: '#8B5CF6' },
  chat: { icon: 'message-circle', label: 'Chat', color: '#8B5CF6' },
  alert: { icon: 'alert-circle', label: 'Alert', color: '#F97316' },
  warning: { icon: 'alert-triangle', label: 'Warning', color: '#F59E0B' },
  user: { icon: 'user', label: 'User', color: '#10B981' },
  team: { icon: 'users', label: 'Team', color: '#06B6D4' },
  system: { icon: 'settings', label: 'System', color: '#64748B' },
  default: { icon: 'bell', label: 'Update', color: '#3B82F6' },
}

function tryParseJson(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

function pickReadableText(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map(pickReadableText).filter(Boolean).join(' · ')
  }
  if (typeof value === 'object') {
    const preferred = ['msg', 'message', 'text', 'body', 'content', 'description', 'summary']
    for (const key of preferred) {
      if (value[key]) return pickReadableText(value[key])
    }
    const name =
      value.name ||
      value.fullName ||
      value.full_name ||
      [value.first_name, value.last_name].filter(Boolean).join(' ') ||
      value.email ||
      value.phone
    if (name) return String(name)
  }
  return ''
}

function formatNotificationMessage(item) {
  const candidates = [
    item?.message,
    item?.description,
    item?.content,
    item?.body,
    item?.payload,
    item?.data,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue

    if (typeof candidate === 'object') {
      const text = pickReadableText(candidate)
      if (text && !text.startsWith('{')) return text
      continue
    }

    const parsed = tryParseJson(candidate)
    if (parsed) {
      const text = pickReadableText(parsed)
      if (text) return text
      continue
    }

    const plain = String(candidate).trim()
    if (plain && !plain.startsWith('{')) return plain
  }

  return ''
}

function formatNotificationTitle(item) {
  const title = item?.title || item?.name || item?.type || 'Notification'
  return String(title).replace(/\s+/g, ' ').trim()
}

function resolveMeta(item, message) {
  const title = String(item?.title || '').toLowerCase()
  const type = String(item?.type || item?.category || '').toLowerCase()
  const body = String(message || '').toLowerCase()
  const combined = `${title} ${type} ${body}`

  if (combined.includes('call') || combined.includes('incoming') || combined.includes('duration')) {
    return NOTIFICATION_META.call
  }
  if (title.includes('message') || type.includes('message') || type.includes('chat')) {
    return NOTIFICATION_META.message
  }
  if (title.includes('lead') || type.includes('lead')) {
    return NOTIFICATION_META.lead
  }

  for (const [key, meta] of Object.entries(NOTIFICATION_META)) {
    if (key !== 'default' && combined.includes(key)) return meta
  }
  return NOTIFICATION_META.default
}

function isUnread(item) {
  return isNotificationUnread(item)
}

function withReadState(item, read = true) {
  return { ...item, isRead: read, read, is_read: read }
}

function getNotificationId(item) {
  return item?.id ?? item?._id ?? null
}

function isSocketOnlyNotification(item) {
  const id = Number(getNotificationId(item))
  return Number.isFinite(id) && id > 0 && id < 1_000_000
}

function collectParsedObjects(item) {
  const objects = []
  const sources = [
    item?.payload,
    item?.data,
    item?.metadata,
    item?.meta,
    item?.message,
    item?.description,
    item?.content,
    item?.body,
  ]

  for (const src of sources) {
    if (!src) continue
    if (typeof src === 'object') {
      objects.push(src)
      continue
    }
    const parsed = tryParseJson(src)
    if (parsed && typeof parsed === 'object') objects.push(parsed)
  }

  return objects
}

function pickLeadIdFromObject(obj) {
  if (!obj || typeof obj !== 'object') return null
  const candidates = [
    obj.lead_id,
    obj.leadId,
    obj.lead?.id,
    obj.lead?.lead_id,
    obj.entity_id,
    obj.entityId,
    obj.reference_id,
    obj.referenceId,
    obj.target_id,
    obj.targetId,
    obj.user?.lead_id,
    obj.user?.leadId,
  ]

  for (const id of candidates) {
    if (id != null && id !== '') return String(id)
  }
  return null
}

function extractLeadId(item) {
  const direct = [
    item?.lead_id,
    item?.leadId,
    item?.lead?.id,
    item?.entity_id,
    item?.entityId,
    item?.reference_id,
    item?.referenceId,
  ]

  for (const id of direct) {
    if (id != null && id !== '') return String(id)
  }

  for (const obj of collectParsedObjects(item)) {
    const id = pickLeadIdFromObject(obj)
    if (id) return id
  }

  const title = String(item?.title || '').toLowerCase()
  const type = String(item?.type || '').toLowerCase()
  if (
    (title.includes('new lead') || type.includes('lead')) &&
    !title.includes('message') &&
    item?.id
  ) {
    return String(item.id)
  }

  return null
}

function resolveNavigationTarget(item, message) {
  const title = String(item?.title || '').toLowerCase()
  const type = String(item?.type || item?.category || '').toLowerCase()
  const body = String(message || '').toLowerCase()
  const combined = `${title} ${type} ${body}`

  if (type === 'auth_required' || combined.includes('auth_required') || combined.includes('re-auth')) {
    return 'linkedAccount'
  }

  const isChatRelated =
    title.includes('message') ||
    type.includes('message') ||
    type.includes('chat') ||
    combined.includes('incoming call') ||
    type.includes('call') ||
    body.includes('duration:')

  if (isChatRelated) return 'threads'

  const isLeadRelated =
    title.includes('new lead') ||
    (type.includes('lead') && !title.includes('message')) ||
    (combined.includes('new lead') && !title.includes('message'))

  if (isLeadRelated) return 'leadsDetail'

  return null
}

function navigateFromNotification(navigation, item, message) {
  const target = resolveNavigationTarget(item, message)
  if (!target) return

  if (target === 'linkedAccount') {
    navigation.navigate('linkedAccount', { authRequired: true })
    return
  }

  const leadId = extractLeadId(item)
  const tabScreen = target === 'threads' ? 'Chat' : 'Leads'

  if (leadId) {
    navigation.navigate(target, { id: leadId })
    return
  }

  navigation.navigate('drawer', {
    screen: 'MainTabs',
    params: { screen: tabScreen },
  })
}

function getSectionKey(time) {
  if (!moment(time).isValid()) return 'Earlier'
  const m = moment(time)
  const today = moment().startOf('day')
  const yesterday = moment().subtract(1, 'day').startOf('day')
  const weekAgo = moment().subtract(7, 'days').startOf('day')

  if (m.isSameOrAfter(today)) return 'Today'
  if (m.isSameOrAfter(yesterday)) return 'Yesterday'
  if (m.isSameOrAfter(weekAgo)) return 'This Week'
  return 'Earlier'
}

function groupIntoSections(items) {
  const buckets = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] }
  for (const item of items) {
    const time = item?.time || item?.createdAt || item?.created_at || ''
    buckets[getSectionKey(time)].push(item)
  }
  return Object.entries(buckets)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }))
}

function NotificationItem({ item, styles, colors, isDark, onPress }) {
  const title = formatNotificationTitle(item)
  const message = formatNotificationMessage(item)
  const time = item?.time || item?.createdAt || item?.created_at || ''
  const displayTime = moment(time).isValid() ? moment(time).fromNow() : time
  const unread = isUnread(item)
  const meta = resolveMeta(item, message)
  const accent = meta.color || colors.primary
  const cardBg = isDark ? colors.cardBg : colors.white || colors.cardBg
  const isNavigable = Boolean(resolveNavigationTarget(item, message))

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardPressable,
        !unread && styles.cardRead,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.card, unread && styles.cardUnread, { backgroundColor: cardBg }]}>
        <View style={[styles.accentStripe, { backgroundColor: unread ? accent : `${accent}55` }]} />
        <View style={styles.cardContent}>
          <View style={[styles.iconCircle, { backgroundColor: `${accent}14` }]}>
            <Icon name={meta.icon} size={17} color={accent} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text
                numberOfLines={1}
                style={[styles.title, unread && styles.titleUnread]}
              >
                {title}
              </Text>
              {unread && <View style={[styles.unreadDot, { backgroundColor: accent }]} />}
            </View>

            {!!message && (
              <View style={[styles.messageBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : `${accent}08` }]}>
                <Text numberOfLines={2} style={styles.message}>
                  {message}
                </Text>
              </View>
            )}

            <View style={styles.cardFooter}>
              <View style={[styles.typePill, { backgroundColor: `${accent}14` }]}>
                <Text style={[styles.typePillText, { color: accent }]}>{meta.label}</Text>
              </View>
              <View style={styles.footerRight}>
                {!!time && <Text style={styles.time}>{displayTime}</Text>}
                {isNavigable && (
                  <View style={[styles.chevronWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.inputBg }]}>
                    <Icon name="chevron-right" size={14} color={colors.gray} />
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

function SummaryCard({ count, unreadCount, styles, colors }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <LinearGradient
          colors={[colors.primary, `${colors.primary}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryIconWrap}
        >
          <Icon name="bell" size={20} color={colors.white} />
        </LinearGradient>
        <View style={styles.summaryTextWrap}>
          <Text style={styles.summaryTitle}>Your Inbox</Text>
          <Text style={styles.summarySubtitle}>
            {count === 0 ? 'You are all caught up' : 'Recent activity from your workspace'}
          </Text>
        </View>
      </View>
      {count > 0 && (
        <View style={styles.summaryStats}>
          <View style={[styles.statChip, { backgroundColor: `${colors.primary}14` }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={[styles.statChip, { backgroundColor: `${colors.primary}08` }]}>
            <Text style={styles.statValue}>{count}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      )}
    </View>
  )
}

function EmptyState({ styles, colors, isDark }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyCard}>
        <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : `${colors.primary}10` }]}>
          <Icon name="bell-off" size={28} color={colors.gray} />
        </View>
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptySubtitle}>
          When something important happens, you will see it here.
        </Text>
      </View>
    </View>
  )
}

const keyExtractor = (item, index) => `${item?.id || item?._id || index}`

function normalizeResponseToList(resp) {
  if (!resp) return { list: [], total: 0, unreadTotal: null, serverPaginated: false }
  const list = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : []
  const baseTotal = resp?.total ?? resp?.meta?.total ?? resp?.totalCount ?? resp?.total_count ?? list.length
  const total = Number(baseTotal || 0)
  const unreadCandidates = [
    resp?.unread,
    resp?.unreadCount,
    resp?.unread_count,
    resp?.totalUnread,
    resp?.total_unread,
    resp?.meta?.unread,
    resp?.meta?.unreadCount,
    resp?.meta?.unread_count,
    resp?.data?.unread,
    resp?.data?.unreadCount,
  ]
  let unreadTotal = null
  for (const value of unreadCandidates) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) {
      unreadTotal = parsed
      break
    }
  }
  const serverPaginated =
    typeof resp?.total !== 'undefined' ||
    typeof resp?.meta?.total !== 'undefined' ||
    typeof resp?.totalCount !== 'undefined'
  return { list, total, unreadTotal, serverPaginated }
}

function dedupeById(existing, incoming) {
  const seen = new Set()
  const result = []
  for (const item of [...existing, ...incoming]) {
    const key = item?.id || item?._id || `${item?.title}-${item?.time}` || Math.random().toString(36)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
]

function TabBar({ activeTab, unreadCount, onChange, styles, colors }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabBar}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.key
        const label =
          tab.key === 'unread' && unreadCount > 0
            ? `${tab.label} (${unreadCount})`
            : tab.label
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tabChip, active && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
              {label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

function Notifications({ navigation }) {
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const { styleOptions } = useScreenLayout()
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])
  const token = useSelector(state => state?.auth?.token)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [size] = useState(10)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [totalNotifications, setTotalNotifications] = useState(0)
  const [totalUnread, setTotalUnread] = useState(0)

  const markItemRead = async (item) => {
    const notificationId = getNotificationId(item)
    if (!notificationId || !isUnread(item)) return

    setItems(prev =>
      prev.map(entry =>
        getNotificationId(entry) === notificationId ? withReadState(entry) : entry,
      ),
    )
    adjustNotificationUnreadCount(-1)
    setTotalUnread(prev => Math.max(0, prev - 1))

    if (isSocketOnlyNotification(item)) return

    try {
      await markNotificationRead({ token, notificationId })
    } catch {
      setItems(prev =>
        prev.map(entry =>
          getNotificationId(entry) === notificationId ? withReadState(entry, false) : entry,
        ),
      )
      adjustNotificationUnreadCount(1)
      setTotalUnread(prev => prev + 1)
    }
  }

  const handleMarkAllRead = async () => {
    if (markingAllRead || totalUnread === 0) return
    try {
      setMarkingAllRead(true)
      setItems(prev => prev.map(entry => (isUnread(entry) ? withReadState(entry) : entry)))
      setNotificationUnreadCount(0)
      setTotalUnread(0)
      await markAllNotificationsRead({ token })
    } catch {
      loadNotifications(true)
    } finally {
      setMarkingAllRead(false)
    }
  }

  const handleNotificationPress = async (item) => {
    const message = formatNotificationMessage(item)
    await markItemRead(item)
    navigateFromNotification(navigation, item, message)
  }

  const loadNotifications = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true)
      const nextPage = 1
      const resp = await getNotificationsListAll({ token, page: nextPage, size })
      const { list, total, unreadTotal, serverPaginated } = normalizeResponseToList(resp)
      const effectiveList = serverPaginated ? list : list.slice(0, size)
      setItems(effectiveList)
      setPage(1)
      const computedTotal = serverPaginated ? total : list.length
      setTotalNotifications(computedTotal)
      setHasMore(effectiveList.length < computedTotal)
      const unreadFromCount = await refreshNotificationUnreadCount(token)
      setTotalUnread(
        unreadFromCount != null
          ? unreadFromCount
          : unreadTotal != null
            ? unreadTotal
            : 0,
      )
    } catch {
      setItems([])
      setTotalNotifications(0)
      setTotalUnread(0)
      setHasMore(false)
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications(false)
  }, [token])

  const loadMore = async () => {
    if (loadingMore || loading || refreshing || !hasMore) return
    try {
      setLoadingMore(true)
      const nextPage = page + 1
      const resp = await getNotificationsListAll({ token, page: nextPage, size })
      const { list, total, serverPaginated } = normalizeResponseToList(resp)
      let incoming = list
      if (!serverPaginated) {
        const start = (nextPage - 1) * size
        const end = nextPage * size
        incoming = list.slice(start, end)
      }
      setItems(prev => dedupeById(prev, incoming))
      setPage(nextPage)
      const computedTotal = serverPaginated ? total : list.length
      setHasMore(nextPage * size < computedTotal)
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  const sections = useMemo(() => {
    const filtered =
      activeTab === 'unread' ? items.filter(isUnread) : items
    return groupIntoSections(filtered)
  }, [items, activeTab])
  const isEmptyForTab =
    activeTab === 'unread' ? totalUnread === 0 : totalNotifications === 0

  const renderFooter = () => {
    if (!loadingMore) return <View style={styles.footerSpacer} />
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Icon name="arrow-left" size={20} color={colors.headerText} />
          </Pressable>
          <View style={styles.headerSpacer} />
          <View style={styles.titleOverlay} pointerEvents="none">
            <Text style={styles.headerTitle} numberOfLines={1}>
              Notifications
            </Text>
          </View>
          {totalUnread > 0 ? (
            <Pressable
              onPress={handleMarkAllRead}
              disabled={markingAllRead}
              hitSlop={8}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
                markingAllRead && styles.iconButtonDisabled,
              ]}
            >
              {markingAllRead ? (
                <ActivityIndicator size="small" color={colors.headerText} />
              ) : (
                <Icon name="check-circle" size={20} color={colors.headerText} />
              )}
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
        <View style={styles.bottomAccent} />
      </View>

      {loading ? (
        <LoadingView skeleton="list" flex />
      ) : totalNotifications === 0 ? (
        <EmptyState styles={styles} colors={colors} isDark={isDark} />
      ) : isEmptyForTab ? (
        <View style={styles.filteredEmptyWrap}>
          <TabBar
            activeTab={activeTab}
            unreadCount={totalUnread}
            onChange={setActiveTab}
            styles={styles}
            colors={colors}
          />
          <View style={styles.filteredEmptyState}>
            <Icon name="check-circle" size={28} color={colors.gray} />
            <Text style={styles.filteredEmptyTitle}>No unread notifications</Text>
            <Text style={styles.filteredEmptySubtitle}>You are all caught up.</Text>
          </View>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              styles={styles}
              colors={colors}
              isDark={isDark}
              onPress={() => handleNotificationPress(item)}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{title}</Text>
              <View style={styles.sectionLine} />
            </View>
          )}
          ListHeaderComponent={
            <>
              <SummaryCard
                count={totalNotifications}
                unreadCount={totalUnread}
                styles={styles}
                colors={colors}
              />
              <TabBar
                activeTab={activeTab}
                unreadCount={totalUnread}
                onChange={setActiveTab}
                styles={styles}
                colors={colors}
              />
            </>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              tintColor={colors.primary}
            />
          }
          onEndReachedThreshold={0.2}
          onEndReached={loadMore}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  )
}

export default memo(Notifications)
