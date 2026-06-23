import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/Feather'
import SettingHeader from '../../../component/settingHeader'
import LoadingView from '../../../component/LoadingView'
import { useTheme } from '../../../hooks/useTheme'
import { getImportSessionById } from '../../../api'
import getListStyles from './listStyles'
import {
  normalizeSession,
  unwrapPayload,
  getStatusColor,
  getDetailTitle,
  formatDateTime,
  formatDuration,
  getSuccessRate,
  getProcessedRows,
  getRemainingRows,
  STATUS_LABELS,
  isValidSessionId,
} from './utils'

function SummaryCard({ icon, label, value, subvalue, colors, styles }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: `${colors.primary}12` }]}>
        <Icon name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      {!!subvalue ? <Text style={styles.summarySubvalue}>{subvalue}</Text> : null}
    </View>
  )
}

export default function ImportSessionDetail({ navigation, route }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getListStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])
  const token = useSelector((state) => state.auth.token)
  const sessionId = route?.params?.sessionId

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)

  const loadSession = useCallback(async () => {
    if (!token || !isValidSessionId(sessionId)) {
      setError('Invalid import session ID.')
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const response = await getImportSessionById({ token, id: sessionId })
      const normalized = normalizeSession(unwrapPayload(response) || response)
      if (!normalized?.id) throw new Error('Import session not found.')
      setSession(normalized)
      setError(null)
    } catch (err) {
      setError(err?.message || 'Could not load import session.')
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [token, sessionId])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  if (!isValidSessionId(sessionId)) {
    return (
      <View style={styles.container}>
        <SettingHeader navigation={navigation} title="Import Session" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Invalid session</Text>
          <Text style={styles.emptyHint}>The import session ID is missing or invalid.</Text>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.primaryBtnText}>Back to list</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <SettingHeader navigation={navigation} title="Import Session" />
        <LoadingView text="Loading session..." flex />
      </View>
    )
  }

  if (error || !session) {
    return (
      <View style={styles.container}>
        <SettingHeader navigation={navigation} title="Import Session" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Could not load session</Text>
          <Text style={styles.emptyHint}>{error || 'Session not found.'}</Text>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.primaryBtnText}>Back to list</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const statusColor = getStatusColor(session.status, colors)
  const successRate = getSuccessRate(session)
  const processed = getProcessedRows(session)
  const remaining = getRemainingRows(session)

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title={getDetailTitle(session.status)} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{session.filename}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}35` }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {STATUS_LABELS[session.status] || session.status}
            </Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Success rate</Text>
            <Text style={styles.progressPercent}>{successRate}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${successRate}%`, backgroundColor: statusColor }]} />
          </View>
          <Text style={styles.progressText}>
            {session.successfulRows} of {session.totalRows} rows successful
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="file"
            label="File"
            value={session.filename}
            subvalue="CSV File"
            colors={colors}
            styles={styles}
          />
          <SummaryCard
            icon="check-circle"
            label="Success rate"
            value={`${successRate}%`}
            subvalue={`${session.successfulRows} imported`}
            colors={colors}
            styles={styles}
          />
          <SummaryCard
            icon="clock"
            label="Duration"
            value={formatDuration(session.startedAt, session.completedAt)}
            colors={colors}
            styles={styles}
          />
          <SummaryCard
            icon="hash"
            label="Status"
            value={STATUS_LABELS[session.status] || session.status}
            subvalue={`Session #${session.id}`}
            colors={colors}
            styles={styles}
          />
        </View>

        <Text style={styles.sectionLabel}>Import statistics</Text>
        <View style={styles.statsCard}>
          {[
            ['Total rows', session.totalRows],
            ['Processed', processed],
            ['Successful', session.successfulRows],
            ['Failed', session.failedRows],
            ['Remaining', remaining],
          ].map(([label, value]) => (
            <View key={label} style={styles.statRow}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Session details</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Session ID</Text>
            <Text style={styles.statValue}>{session.id}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Started</Text>
            <Text style={styles.statValue}>{formatDateTime(session.startedAt || session.createdAt)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>{formatDateTime(session.completedAt)}</Text>
          </View>
        </View>

        {session.errorMessage ? (
          <View style={styles.errorCard}>
            <View style={styles.errorTitleRow}>
              <Icon name="alert-circle" size={16} color={colors.danger || '#DC2626'} />
              <Text style={styles.errorTitle}>Error</Text>
            </View>
            <Text style={styles.errorText}>{session.errorMessage}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
        >
          <Icon name="arrow-left" size={15} color={colors.white} />
          <Text style={styles.primaryBtnText}>Back to list</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
