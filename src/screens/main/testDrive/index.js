import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import moment from 'moment'
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import Header from '../../../component/header'
import LoadingView from '../../../component/LoadingView'
import { getTestDriveInvites } from '../../../api'
import { useTheme } from '../../../hooks/useTheme'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import getStyles from './styles'
import TestDriveDetailModal from './TestDriveDetailModal'
import {
  VIEW_MODES,
  STATUS_FILTERS,
  WEEKDAY_LABELS,
  formatEventLabel,
  formatEventTime,
  isEventUpcoming,
  getVisibleRange,
  getCalendarDays,
  groupInvitesByDay,
  filterInvites,
  getRangeTitle,
  buildLeadFromInvite,
} from './utils'

const UPCOMING_COLOR = '#10B981'
const PAST_COLOR = '#64748B'
const CANCELLED_COLOR = '#94A3B8'

function SegmentedControl({
  options,
  value,
  onChange,
  rowStyle,
  optionStyle,
  optionActiveStyle,
  textStyle,
  textActiveStyle,
}) {
  return (
    <View style={rowStyle}>
      {options.map((option) => {
        const active = value === option
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[optionStyle, active && optionActiveStyle]}
          >
            <Text style={[textStyle, active && textActiveStyle]}>
              {option}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function SummaryCard({ upcomingCount, todayCount, totalCount, styles, colors }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <LinearGradient
          colors={[colors.primary, `${colors.primary}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryIconWrap}
        >
          <Icon name="calendar" size={22} color={colors.white} />
        </LinearGradient>
        <View style={styles.summaryTextWrap}>
          <Text style={styles.summaryTitle}>Test Drives</Text>
          <Text style={styles.summarySubtitle}>
            All scheduled test drives for your dealership
          </Text>
        </View>
      </View>

      <View style={styles.summaryStats}>
        <View style={[styles.statChip, { backgroundColor: `${UPCOMING_COLOR}14` }]}>
          <Text style={[styles.statValue, { color: UPCOMING_COLOR }]}>{upcomingCount}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={[styles.statChip, { backgroundColor: `${colors.primary}12` }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{todayCount}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={[styles.statChip, { backgroundColor: `${colors.primary}08` }]}>
          <Text style={styles.statValue}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <View style={[styles.legendRow, { marginTop: 14 }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: UPCOMING_COLOR }]} />
          <Text style={styles.legendText}>Upcoming</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: PAST_COLOR }]} />
          <Text style={styles.legendText}>Past</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: CANCELLED_COLOR }]} />
          <Text style={styles.legendText}>Cancelled</Text>
        </View>
      </View>
    </View>
  )
}

function EventPill({ invite, styles, selected, onPress }) {
  const cancelled = String(invite.status || '').toLowerCase() === 'cancelled'
  const upcoming = !cancelled && isEventUpcoming(invite)
  const dotColor = cancelled ? CANCELLED_COLOR : upcoming ? UPCOMING_COLOR : PAST_COLOR

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.eventPill,
        cancelled ? styles.eventPillCancelled : upcoming ? styles.eventPillUpcoming : styles.eventPillPast,
        selected && styles.eventPillSelected,
      ]}
    >
      <View style={[styles.eventDot, { backgroundColor: dotColor }]} />
      <Text style={styles.eventText} numberOfLines={1}>
        {formatEventLabel(invite)}
      </Text>
    </Pressable>
  )
}

function getStatusPillStyle(status, upcoming, cancelled, styles) {
  if (cancelled) {
    return {
      wrap: [styles.statusPill, { backgroundColor: `${CANCELLED_COLOR}18` }],
      text: [styles.statusPillText, { color: CANCELLED_COLOR }],
      label: 'Cancelled',
    }
  }
  if (upcoming) {
    return {
      wrap: [styles.statusPill, { backgroundColor: `${UPCOMING_COLOR}18` }],
      text: [styles.statusPillText, { color: UPCOMING_COLOR }],
      label: 'Upcoming',
    }
  }
  return {
    wrap: [styles.statusPill, { backgroundColor: `${PAST_COLOR}18` }],
    text: [styles.statusPillText, { color: PAST_COLOR }],
    label: 'Past',
  }
}

function DayEventsList({ day, invites, styles, colors, selectedInviteId, onSelectInvite }) {
  if (!invites.length) {
    return (
      <View style={styles.emptyDayState}>
        <View style={[styles.emptyDayIconWrap, { backgroundColor: `${colors.primary}10` }]}>
          <Icon name="calendar" size={30} color={colors.gray} />
        </View>
        <Text style={styles.emptyDayTitle}>No test drives</Text>
        <Text style={styles.emptyDaySubtitle}>
          Nothing scheduled for {day.format('MMMM D, YYYY')}.
        </Text>
      </View>
    )
  }

  return invites.map((invite) => {
    const cancelled = String(invite.status || '').toLowerCase() === 'cancelled'
    const upcoming = !cancelled && isEventUpcoming(invite)
    const vehicle = invite.vehicle_model || invite.lead?.vehicle_model || 'Vehicle TBD'
    const timeStr = formatEventTime(invite.scheduled_start)
    const statusPill = getStatusPillStyle(invite.status, upcoming, cancelled, styles)

    return (
      <Pressable
        key={invite.id}
        onPress={() => onSelectInvite(invite)}
        style={({ pressed }) => [
          styles.dayEventRow,
          selectedInviteId === invite.id && styles.eventPillSelected,
          pressed && styles.dayEventRowPressed,
        ]}
      >
        <View style={styles.dayEventTimeWrap}>
          <Text style={styles.dayEventTime}>{timeStr.replace(/[ap]$/i, '')}</Text>
          <Text style={styles.dayEventTimePeriod}>
            {timeStr.includes('p') ? 'PM' : 'AM'}
          </Text>
        </View>
        <View style={[styles.eventDot, { backgroundColor: cancelled ? CANCELLED_COLOR : upcoming ? UPCOMING_COLOR : PAST_COLOR, marginTop: 6 }]} />
        <View style={styles.dayEventBody}>
          <Text style={styles.dayEventTitle}>{invite.customer_name || 'Customer'}</Text>
          <Text style={styles.dayEventMeta}>{vehicle}</Text>
          <View style={statusPill.wrap}>
            <Text style={statusPill.text}>{statusPill.label}</Text>
          </View>
        </View>
        <View style={styles.dayEventChevron}>
          <Icon name="chevron-right" size={16} color={colors.gray} />
        </View>
      </Pressable>
    )
  })
}

export default function TestDrive() {
  const navigation = useNavigation()
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const { styleOptions } = useScreenLayout()
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])
  const token = useSelector((state) => state.auth.token)

  const [cursor, setCursor] = useState(() => moment().startOf('month'))
  const [viewMode, setViewMode] = useState('Month')
  const [statusFilter, setStatusFilter] = useState('All')
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [selectedInvite, setSelectedInvite] = useState(null)

  const visibleRange = useMemo(() => getVisibleRange(cursor, viewMode), [cursor, viewMode])
  const calendarDays = useMemo(() => getCalendarDays(cursor, viewMode), [cursor, viewMode])
  const filteredInvites = useMemo(() => filterInvites(invites, statusFilter), [invites, statusFilter])
  const invitesByDay = useMemo(() => groupInvitesByDay(filteredInvites), [filteredInvites])
  const rangeTitle = useMemo(() => getRangeTitle(cursor, viewMode), [cursor, viewMode])
  const todayKey = moment().format('YYYY-MM-DD')
  const currentMonth = cursor.month()

  const stats = useMemo(() => {
    const now = moment()
    const upcoming = filteredInvites.filter((inv) => {
      const cancelled = String(inv.status || '').toLowerCase() === 'cancelled'
      return !cancelled && isEventUpcoming(inv, now)
    }).length
    const today = filteredInvites.filter((inv) =>
      moment(inv.scheduled_start).format('YYYY-MM-DD') === todayKey,
    ).length
    return { upcoming, today, total: filteredInvites.length }
  }, [filteredInvites, todayKey])

  const fetchInvites = useCallback(async (isRefresh = false) => {
    if (!token) {
      setInvites([])
      setLoading(false)
      return
    }

    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const data = await getTestDriveInvites({
        token,
        start: visibleRange.start,
        end: visibleRange.end,
      })
      const rows = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
      setInvites(rows)
    } catch (err) {
      setError(err?.message || 'Failed to load test drives')
      setInvites([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token, visibleRange.start, visibleRange.end])

  useEffect(() => {
    fetchInvites(false)
  }, [fetchInvites])

  const shiftCursor = (direction) => {
    const unit = viewMode === 'Day' ? 'day' : viewMode === 'Week' ? 'week' : 'month'
    setCursor((prev) => prev.clone().add(direction, unit))
  }

  const goToToday = () => {
    const today = moment()
    if (viewMode === 'Day') setCursor(today.clone().startOf('day'))
    else if (viewMode === 'Week') setCursor(today.clone().startOf('week'))
    else setCursor(today.clone().startOf('month'))
  }

  const openInviteDetail = (invite) => {
    setSelectedInvite(invite)
  }

  const closeInviteDetail = () => {
    setSelectedInvite(null)
  }

  const viewConversation = (invite) => {
    const lead = buildLeadFromInvite(invite)
    closeInviteDetail()
    navigation.navigate('threads', { lead, id: lead.id })
  }

  const renderMonthWeekGrid = () => (
    <View style={styles.calendarCard}>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {calendarDays.map((day) => {
          const dayKey = day.format('YYYY-MM-DD')
          const dayEvents = invitesByDay.get(dayKey) || []
          const isCurrentMonth = viewMode === 'Month' ? day.month() === currentMonth : true
          const isToday = dayKey === todayKey

          return (
            <Pressable
              key={dayKey}
              onPress={() => {
                if (dayEvents.length === 1) openInviteDetail(dayEvents[0])
              }}
              style={[
                styles.dayCell,
                !isCurrentMonth && styles.dayCellMuted,
                isToday && styles.dayCellToday,
              ]}
            >
              {dayEvents.length > 0 && (
                <View style={styles.eventCountBadge}>
                  <Text style={styles.eventCountText}>{dayEvents.length}</Text>
                </View>
              )}

              <View style={[styles.dayNumberWrap, isToday && styles.dayNumberWrapToday]}>
                <Text
                  style={[
                    styles.dayNumber,
                    !isCurrentMonth && styles.dayNumberMuted,
                    isToday && styles.dayNumberToday,
                  ]}
                >
                  {day.format('D')}
                </Text>
              </View>

              {dayEvents.slice(0, 3).map((invite) => (
                <EventPill
                  key={invite.id}
                  invite={invite}
                  styles={styles}
                  selected={selectedInvite?.id === invite.id}
                  onPress={() => openInviteDetail(invite)}
                />
              ))}

              {dayEvents.length > 3 ? (
                <Text style={styles.moreEventsText}>+{dayEvents.length - 3} more</Text>
              ) : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )

  const renderDayView = () => {
    const day = calendarDays[0]
    const dayKey = day.format('YYYY-MM-DD')
    const dayEvents = invitesByDay.get(dayKey) || []

    return (
      <View style={styles.dayViewCard}>
        <View style={styles.dayViewHeader}>
          <Text style={styles.dayViewTitle}>{day.format('dddd, MMM D')}</Text>
          <Text style={styles.dayViewCount}>
            {dayEvents.length} {dayEvents.length === 1 ? 'drive' : 'drives'}
          </Text>
        </View>
        <DayEventsList
          day={day}
          invites={dayEvents}
          styles={styles}
          colors={colors}
          selectedInviteId={selectedInvite?.id}
          onSelectInvite={openInviteDetail}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header title="Test Drives" search={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchInvites(true)}
            tintColor={colors.primary}
          />
        }
      >
        <SummaryCard
          upcomingCount={stats.upcoming}
          todayCount={stats.today}
          totalCount={stats.total}
          styles={styles}
          colors={colors}
        />

        <View style={styles.controlsCard}>
          <View style={styles.navRow}>
            <Pressable onPress={() => shiftCursor(-1)} style={styles.navButton}>
              <Icon name="chevron-left" size={18} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => shiftCursor(1)} style={styles.navButton}>
              <Icon name="chevron-right" size={18} color={colors.text} />
            </Pressable>
            <Pressable onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Today</Text>
            </Pressable>
            <Text style={styles.rangeTitle} numberOfLines={1}>
              {rangeTitle}
            </Text>
          </View>

          <View style={styles.navRow}>
            <SegmentedControl
              options={VIEW_MODES}
              value={viewMode}
              onChange={setViewMode}
              rowStyle={styles.segmentedRow}
              optionStyle={styles.segmentedOption}
              optionActiveStyle={styles.segmentedOptionActive}
              textStyle={styles.segmentedText}
              textActiveStyle={styles.segmentedTextActive}
            />
          </View>

          <SegmentedControl
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={setStatusFilter}
            rowStyle={styles.statusRow}
            optionStyle={styles.statusOption}
            optionActiveStyle={styles.statusOptionActive}
            textStyle={styles.statusText}
            textActiveStyle={styles.statusTextActive}
          />
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <LoadingView skeleton="list" skeletonCount={6} />
        ) : viewMode === 'Day' ? (
          renderDayView()
        ) : (
          renderMonthWeekGrid()
        )}
      </ScrollView>

      <TestDriveDetailModal
        visible={!!selectedInvite}
        invite={selectedInvite}
        onClose={closeInviteDetail}
        onViewConversation={viewConversation}
      />
    </View>
  )
}
