import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, TouchableOpacity, Image, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native'
import { Alert } from '../../../utils/alert'
import Icon from 'react-native-vector-icons/Feather'
import { useFocusEffect } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import Header from '../../../component/header'
import CustomerFilterModal, { CHAT_STATUS_FILTERS } from '../../../component/CustomerFilterModal'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { wp } from '../../../theme/layout'
import getStyles from './styles'
import { images } from '../../../constant'
import { searchLeads, getLeadById } from '../../../api'
import { fetchLeadsWithCache, syncThreadMessagesFromLead } from '../../../services/offlineSync'
import { upsertLead } from '../../../database/leadsCache'
import { onSocket, offSocket } from '../../../services'
import { parseStructuredText } from '../../../utils/chatMessageParser'
import LinearGradient from 'react-native-linear-gradient'
import LoadingView from '../../../component/LoadingView'
import { useTheme } from '../../../hooks/useTheme'
import { getLatestThreadAssignment } from '../../../utils/threadAssignment'

const matchesChatFilter = (status, filter) => {
  const s = String(status || '')
  if (filter === 'In Progress') return s === 'In Progress'
  if (filter === 'Completed') return s === 'Sold' || s === 'Completed'
  return true
}

const getLeadDisplayName = (lead) => {
  const name = String(lead?.customer_name || '').trim()
  if (name) return name
  if (lead?.customer_telephone) return lead.customer_telephone
  if (lead?.customer_email) return lead.customer_email
  return '—'
}

const getLeadInitials = (lead) => {
  const name = getLeadDisplayName(lead)
  if (name === '—') return '?'
  if (/^\+?[\d\s()-]+$/.test(name)) return '#'
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const isIncomingCallLead = (lead) => {
  const name = String(lead?.customer_name || '').trim()
  return !name && Boolean(lead?.customer_telephone) && !String(lead?.customer_comments || '').trim()
}

const getLeadPreviewText = (lead) => {
  const comments = String(lead?.customer_comments || '').trim()
  if (comments) return comments
  const vehicle = getLeadVehicleLabel(lead)
  return vehicle || ''
}

const getLeadVehicleLabel = (lead) => {
  const parts = [lead?.vehicle_make, lead?.vehicle_model].filter(Boolean)
  return parts.join(' ').trim()
}

const getLeadThreadTime = (lead) => {
  if (lead?.updated_at) return lead.updated_at
  const latest = getLatestThreadAssignment(lead)
  if (latest?.assigned_at) return latest.assigned_at
  return lead?.created_at || null
}

const hasNoPhone = (lead) => {
  return !String(lead?.customer_telephone || '').trim()
}

const matchesLeadSearch = (lead, q) => {
  const searchable = [
    getLeadDisplayName(lead),
    lead?.customer_telephone,
    lead?.customer_email,
    lead?.customer_comments,
    lead?.vehicle_make,
    lead?.vehicle_model,
    lead?.vehicle_vin,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return searchable.includes(q)
}

const formatThreadTime = (dateString) => {
  if (!dateString) return 'Not assigned'

  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  if (dateOnly.getTime() === today.getTime()) {
    return time
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  }
  if (date.getTime() > weekAgo.getTime()) {
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

const PAGE_SIZE = 50

const extractLeadRows = (response) => (
  response?.items || response?.data || response?.results || []
)

const extractPaginationMeta = (response) => (
  response?.pagination || response?.meta || response?.pageInfo || null
)

const inferHasMore = ({ response, page, itemsLength }) => {
  const meta = extractPaginationMeta(response)
  if (meta) {
    if (typeof meta.hasMore === 'boolean') return meta.hasMore
    if (typeof meta.hasNextPage === 'boolean') return meta.hasNextPage
    if (typeof meta.nextPage !== 'undefined' && meta.nextPage !== null) {
      return Number(meta.nextPage) > Number(page)
    }
    if (typeof meta.totalPages === 'number' && Number.isFinite(meta.totalPages)) {
      return Number(page) < Number(meta.totalPages)
    }
    if (typeof meta.pageCount === 'number' && Number.isFinite(meta.pageCount)) {
      return Number(page) < Number(meta.pageCount)
    }
    if (typeof meta.total === 'number' && Number.isFinite(meta.total)) {
      const pageSize = Number(meta.pageSize || meta.limit || PAGE_SIZE)
      return Number(page) * pageSize < Number(meta.total)
    }
  }
  return itemsLength > 0
}

const bumpLeadInList = (list, leadId, patch = {}) => {
  const id = String(leadId)
  const idx = list.findIndex((row) => String(row?.id) === id)
  if (idx === -1) return list
  const updated = { ...list[idx], ...patch, updated_at: patch.updated_at || new Date().toISOString() }
  return [updated, ...list.slice(0, idx), ...list.slice(idx + 1)]
}

export default function Chat({ navigation }) {
  const { layout, styleOptions } = useScreenLayout({ tabBarAware: true })
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const styles = useMemo(
    () => getStyles(colors, isDark, styleOptions),
    [colors, isDark, styleOptions],
  )

  const { token } = useSelector(state => state.auth)
  const [filterValue, setFilterValue] = useState('All')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [leadsData, setLeadsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fromCache, setFromCache] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [pageIndex, setPageIndex] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const searchRequestRef = useRef(0)

  const fetchLeadsData = useCallback(async ({ page = 1, append = false } = {}) => {
    if (!token) {
      const { loadCachedLeads } = await import('../../../services/offlineSync')
      const cached = await loadCachedLeads()
      setLeadsData(cached)
      setFromCache(cached.length > 0)
      setHasMore(false)
      return
    }

    if (page === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const { data, fromCache: cached } = await fetchLeadsWithCache(token, {
        pageIndex: page,
        pageSize: PAGE_SIZE,
        filterData: { status: '' },
      })
      const items = extractLeadRows(data)
      setLeadsData((prev) => (append ? [...prev, ...items] : items))
      setFromCache(cached)
      setPageIndex(page)
      setHasMore(inferHasMore({ response: data, page, itemsLength: items.length }))
    } catch (err) {
      const { loadCachedLeads } = await import('../../../services/offlineSync')
      const cached = await loadCachedLeads()
      if (cached.length > 0 && page === 1) {
        setLeadsData(cached)
        setFromCache(true)
        setError(null)
        setHasMore(false)
      } else if (page === 1) {
        setError(err.message || 'Failed to fetch leads data')
        Alert.alert('Error', err.message || 'Failed to fetch leads data')
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [token])

  const fetchSearchResults = useCallback(async (searchTerm) => {
    const trimmed = String(searchTerm || '').trim()
    if (!trimmed) {
      await fetchLeadsData({ page: 1, append: false })
      return
    }

    if (!token) {
      const { loadCachedLeads } = await import('../../../services/offlineSync')
      const cached = await loadCachedLeads()
      const q = trimmed.toLowerCase()
      const results = cached.filter((lead) => matchesLeadSearch(lead, q))
      setLeadsData(results)
      setFromCache(true)
      setIsSearching(false)
      return
    }

    const requestId = ++searchRequestRef.current
    setIsSearching(true)
    setError(null)

    try {
      console.log('[Chat] searching leads:', trimmed)
      const response = await searchLeads({
        token,
        pageIndex: 1,
        pageSize: 10,
        searchQuery: trimmed,
      })
      if (requestId !== searchRequestRef.current) return

      const items = extractLeadRows(response)
      setLeadsData(items)
      setFromCache(false)
      setHasMore(false)
    } catch (err) {
      if (requestId !== searchRequestRef.current) return

      const { loadCachedLeads } = await import('../../../services/offlineSync')
      const cached = await loadCachedLeads()
      const q = trimmed.toLowerCase()
      const results = cached.filter((lead) => matchesLeadSearch(lead, q))
      if (results.length > 0) {
        setLeadsData(results)
        setFromCache(true)
        setError(null)
      } else {
        setLeadsData([])
        setError(err.message || 'Failed to search leads')
      }
    } finally {
      if (requestId === searchRequestRef.current) {
        setIsSearching(false)
      }
    }
  }, [token, fetchLeadsData])

  useEffect(() => {
    if (!token) {
      fetchLeadsData()
      return undefined
    }

    const handle = setTimeout(() => {
      const trimmed = query.trim()
      if (trimmed) {
        fetchSearchResults(trimmed)
      } else {
        fetchLeadsData({ page: 1, append: false })
      }
    }, 400)

    return () => clearTimeout(handle)
  }, [query, token, fetchLeadsData, fetchSearchResults])

  const filtered = useMemo(() => {
    if (filterValue === 'All') return leadsData
    return leadsData.filter((lead) => matchesChatFilter(lead.status, filterValue))
  }, [filterValue, leadsData])

  const handleRefresh = useCallback(() => {
    if (query.trim()) {
      fetchSearchResults(query.trim())
      return
    }
    fetchLeadsData({ page: 1, append: false })
  }, [query, fetchLeadsData, fetchSearchResults])

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || isSearching || !hasMore || query.trim()) return
    fetchLeadsData({ page: pageIndex + 1, append: true })
  }, [loading, loadingMore, isSearching, hasMore, query, pageIndex, fetchLeadsData])

  const refreshLeadInList = useCallback(async (leadId) => {
    if (!token || !leadId) return
    try {
      const res = await getLeadById({ token, id: leadId })
      const lead = res?.data || res || {}
      if (!lead?.id) return
      await upsertLead(lead)
      setLeadsData((prev) => {
        const exists = prev.some((row) => String(row?.id) === String(leadId))
        if (exists) return bumpLeadInList(prev, leadId, lead)
        return [lead, ...prev]
      })
      setFromCache(false)
    } catch {
      // ignore transient socket refresh errors
    }
  }, [token])

  useFocusEffect(
    useCallback(() => {
      if (!token) return undefined

      const handleNewMessage = (data) => {
        const message = data?.message || data
        const leadId = message?.lead_id
        if (!leadId) return

        const preview = parseStructuredText(
          typeof message.text === 'string' ? message.text : message.content || '',
        )
        setLeadsData((prev) => {
          const exists = prev.some((row) => String(row?.id) === String(leadId))
          if (!exists) {
            refreshLeadInList(leadId)
            return prev
          }
          return bumpLeadInList(prev, leadId, {
            customer_comments: preview || undefined,
            updated_at: message.created_at || new Date().toISOString(),
          })
        })
      }

      const handleLeadUpdate = (data) => {
        const lead = data?.lead || data
        const leadId = lead?.id || data?.leadId || data?.id
        if (!leadId) return
        if (lead && typeof lead === 'object' && lead.id) {
          upsertLead(lead).catch(() => {})
          setLeadsData((prev) => {
            const exists = prev.some((row) => String(row?.id) === String(leadId))
            if (exists) return bumpLeadInList(prev, leadId, lead)
            return [lead, ...prev]
          })
          return
        }
        refreshLeadInList(leadId)
      }

      onSocket('v1NewMessage', handleNewMessage)
      onSocket('v1OnLeadUpdate', handleLeadUpdate)

      return () => {
        offSocket('v1NewMessage', handleNewMessage)
        offSocket('v1OnLeadUpdate', handleLeadUpdate)
      }
    }, [token, refreshLeadInList]),
  )

  const openThread = useCallback((item) => {
    const leadCopy = JSON.parse(JSON.stringify(item))
    upsertLead(leadCopy).catch(() => {})
    if (Array.isArray(leadCopy.chats) && leadCopy.chats.length > 0) {
      syncThreadMessagesFromLead(leadCopy.id, leadCopy.chats).catch(() => {})
    }
    navigation.navigate('threads', { lead: leadCopy })
  }, [navigation])

  const renderThread = useCallback(({ item }) => {
    const displayName = getLeadDisplayName(item)
    const previewText = getLeadPreviewText(item)
    const incomingCall = isIncomingCallLead(item)
    const noPhone = hasNoPhone(item)
    const initials = getLeadInitials(item)
    const hasComments = Boolean(String(item?.customer_comments || '').trim())

    return (
      <Pressable
        onPress={() => openThread(item)}
        style={styles.threadItem}
        android_ripple={{
          color: `${colors.primary}18`,
          borderless: false,
        }}
      >
        {({ pressed }) => (
          <View style={[styles.threadItemInner, pressed && styles.threadItemPressed]}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[colors.primary, `${colors.primary}CC`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            </View>

            <View style={styles.threadCenter}>
              <View style={styles.threadTopRow}>
                <View style={styles.threadNameRow}>
                  <Text style={styles.threadName} numberOfLines={1}>{displayName}</Text>
                  {incomingCall ? (
                    <View style={styles.incomingCallBadge}>
                      <Text style={styles.incomingCallBadgeText}>Incoming Call</Text>
                    </View>
                  ) : null}
                  {noPhone ? (
                    <View style={styles.noPhoneBadge}>
                      <Text style={styles.noPhoneBadgeText}>No Phone</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.threadTime}>
                  {formatThreadTime(getLeadThreadTime(item))}
                </Text>
              </View>
              {previewText ? (
                <Text
                  style={[styles.threadPreview, !hasComments && styles.threadPreviewMuted]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {previewText}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </Pressable>
    )
  }, [styles, colors, openThread])

  const EmptyList = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Icon name="message-circle" size={layout.isCompact ? wp(7) : wp(8)} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyText}>
        {query.trim()
          ? 'Try a different search term or clear filters.'
          : 'Leads with active threads will appear here.'}
      </Text>
    </View>
  )

  const hasActiveChips = fromCache || filterValue !== 'All'

  return (
    <View style={styles.container}>
      <Header
        title="Chat"
        search={false}
        showFilter
        filterActive={filterValue !== 'All'}
        onPressFilter={() => setIsFilterOpen(true)}
      />

      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.topSectionInner}>
            {hasActiveChips ? (
              <View style={styles.chipRow}>
                {fromCache ? (
                  <View style={styles.activeFilterChip}>
                    <Icon name="wifi-off" size={12} color={colors.primary} />
                    <Text style={styles.activeFilterText}>Cached data</Text>
                  </View>
                ) : null}
                {filterValue !== 'All' ? (
                  <View style={styles.activeFilterChip}>
                    <Icon name="filter" size={12} color={colors.primary} />
                    <Text style={styles.activeFilterText}>{filterValue}</Text>
                    <TouchableOpacity
                      onPress={() => setFilterValue('All')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="x" size={14} color={colors.gray} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.searchWrap}>
              <Image source={images.search} style={styles.searchIcon} resizeMode="contain" />
              <TextInput
                placeholder="Search conversations"
                placeholderTextColor={colors.gray}
                value={query}
                onChangeText={setQuery}
                style={styles.searchInput}
                returnKeyType="search"
                clearButtonMode="never"
              />
              {!!query && (
                <TouchableOpacity
                  onPress={() => setQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="x" size={16} color={colors.gray} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {loading || isSearching ? (
          <LoadingView skeleton="list" flex />
        ) : (
          <View style={styles.listPanel}>
            <FlatList
              data={filtered}
              keyExtractor={item => item.id.toString()}
              renderItem={renderThread}
              ListEmptyComponent={EmptyList}
              contentContainerStyle={styles.listContent}
              refreshing={loading || isSearching}
              onRefresh={handleRefresh}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.35}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.listFooter}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>

      <CustomerFilterModal
        visible={isFilterOpen}
        value={filterValue}
        onClose={() => setIsFilterOpen(false)}
        onApply={setFilterValue}
        title="Filter Chats"
        options={CHAT_STATUS_FILTERS}
      />
    </View>
  )
}
