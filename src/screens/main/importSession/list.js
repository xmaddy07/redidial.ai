import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/Feather'
import SettingHeader from '../../../component/settingHeader'
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero'
import LoadingView from '../../../component/LoadingView'
import { useTheme } from '../../../hooks/useTheme'
import { getImportSessions } from '../../../api'
import getListStyles from './listStyles'
import {
  normalizeSessionsList,
  normalizeSession,
  STATUS_LABELS,
  getStatusColor,
  formatDateTime,
  formatDuration,
} from './utils'

function StatusBadge({ status, colors, styles }) {
  const color = getStatusColor(status, colors)
  return (
    <View style={[styles.statusBadge, { backgroundColor: `${color}18`, borderColor: `${color}35` }]}>
      <Text style={[styles.statusBadgeText, { color }]}>
        {STATUS_LABELS[status] || status}
      </Text>
    </View>
  )
}

function SessionCard({ session, onPress, styles, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sessionCard, pressed && styles.sessionCardPressed]}
    >
      <View style={styles.sessionTopRow}>
        <View style={styles.fileIconWrap}>
          <Icon name="file-text" size={18} color={colors.primary} />
        </View>
        <View style={styles.sessionBody}>
          <Text style={styles.filename} numberOfLines={1}>
            {session.filename}
          </Text>
          <Text style={styles.createdAt}>{formatDateTime(session.createdAt)}</Text>
        </View>
        <StatusBadge status={session.status} colors={colors} styles={styles} />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{session.totalRows}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: colors.success }]}>{session.successfulRows}</Text>
          <Text style={styles.metricLabel}>Success</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: colors.danger || '#DC2626' }]}>
            {session.failedRows}
          </Text>
          <Text style={styles.metricLabel}>Failed</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {formatDuration(session.startedAt, session.completedAt)}
          </Text>
          <Text style={styles.metricLabel}>Duration</Text>
        </View>
      </View>

      <View style={styles.viewRow}>
        <Text style={styles.viewText}>View details</Text>
        <Icon name="chevron-right" size={16} color={colors.primary} />
      </View>
    </Pressable>
  )
}

export default function ImportSessionList({ navigation }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getListStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])
  const token = useSelector((state) => state.auth.token)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sessions, setSessions] = useState([])

  const loadSessions = useCallback(async (isRefresh = false) => {
    if (!token) return

    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await getImportSessions({ token })
      const list = normalizeSessionsList(response)
        .map(normalizeSession)
        .filter((item) => item?.id)
        .sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime()
          const bTime = new Date(b.createdAt || 0).getTime()
          return bTime - aTime
        })
      setSessions(list)
    } catch (error) {
      console.error('Import sessions load failed:', error?.message || error)
      setSessions([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  const handleRefresh = useCallback(() => {
    loadSessions(true)
  }, [loadSessions])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const completedCount = sessions.filter((s) => s.status === 'completed').length

  if (loading && sessions.length === 0) {
    return (
      <View style={styles.container}>
        <SettingHeader navigation={navigation} title="Import Sessions" />
        <LoadingView text="Loading import sessions..." flex />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title="Import Sessions" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <SettingsHero
          colors={colors}
          isDark={isDark}
          styles={styles}
          icon="upload-cloud"
          title="Vehicle Import Sessions"
          subtitle="Track CSV import jobs, row counts, and status for your organization."
        />

        <Pressable
          onPress={() => navigation.navigate('ImportSessionWizard')}
          style={({ pressed }) => [styles.newImportBtn, pressed && { opacity: 0.92 }]}
        >
          <Icon name="plus" size={18} color={colors.white} />
          <Text style={styles.newImportBtnText}>New Import</Text>
        </Pressable>

        <SettingsStatPills
          styles={styles}
          items={[
            { value: sessions.length, label: 'Total sessions' },
            { value: completedCount, label: 'Completed' },
          ]}
        />

        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="inbox" size={28} color={colors.gray} />
            </View>
            <Text style={styles.emptyTitle}>No import sessions</Text>
            <Text style={styles.emptyHint}>
              Start by uploading a CSV file with column mapping to import vehicles.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('ImportSessionWizard')}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Icon name="plus" size={16} color={colors.white} />
              <Text style={styles.primaryBtnText}>New Import</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Sessions</Text>
            <View style={styles.sessionList}>
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  styles={styles}
                  colors={colors}
                  onPress={() =>
                    navigation.navigate('ImportSessionDetail', { sessionId: session.id })
                  }
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
