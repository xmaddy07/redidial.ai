import React, { useMemo } from 'react'
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import { useTheme } from '../../../hooks/useTheme'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { getTestDriveDetailModalStyles } from './testDriveDetailModalStyles'
import {
  formatDetailDateTime,
  getInviteStatusLabel,
  isEventUpcoming,
} from './utils'

const UPCOMING_COLOR = '#10B981'
const PAST_COLOR = '#64748B'
const CANCELLED_COLOR = '#94A3B8'

function DetailField({ label, value, icon, styles, colors, isLast }) {
  return (
    <View>
      <View style={styles.detailFieldRow}>
        <View style={[styles.detailIconBox, { backgroundColor: `${colors.primary}12` }]}>
          <Icon name={icon} size={16} color={colors.primary} />
        </View>
        <View style={styles.detailFieldContent}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value || '—'}</Text>
        </View>
      </View>
      {!isLast && <View style={styles.detailDivider} />}
    </View>
  )
}

export default function TestDriveDetailModal({
  visible,
  invite,
  onClose,
  onViewConversation,
}) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(
    () => getTestDriveDetailModalStyles(colors, isDark, styleOptions),
    [colors, isDark, styleOptions],
  )

  if (!invite) return null

  const cancelled = String(invite.status || '').toLowerCase() === 'cancelled'
  const upcoming = !cancelled && isEventUpcoming(invite)
  const statusLabel = getInviteStatusLabel(invite)
  const statusColor = cancelled ? CANCELLED_COLOR : upcoming ? UPCOMING_COLOR : PAST_COLOR
  const phone = invite.lead?.customer_telephone || '—'
  const vehicle = invite.vehicle_model || invite.lead?.vehicle_model || '—'

  const openCalendar = () => {
    const url = invite.calendar_event_link
    if (url) Linking.openURL(url).catch(() => {})
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.headerShell}>
            <LinearGradient
              colors={[colors.primary, `${colors.primary}DD`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
              pointerEvents="none"
            />
            <View style={styles.headerContent}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIconWrap}>
                    <Icon name="truck" size={20} color={colors.white} />
                  </View>
                  <View style={styles.headerTextWrap}>
                    <Text style={styles.title}>Test Drive</Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                      {invite.customer_name || 'Customer'}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  style={({ pressed }) => [styles.closeBtn, pressed && styles.btnPressed]}
                >
                  <Icon name="x" size={20} color={colors.primary} />
                </Pressable>
              </View>

              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.detailsCard}>
              <DetailField label="Customer" value={invite.customer_name} icon="user" styles={styles} colors={colors} />
              <DetailField label="Email" value={invite.customer_email} icon="mail" styles={styles} colors={colors} />
              <DetailField label="Phone" value={phone} icon="phone" styles={styles} colors={colors} />
              <DetailField label="Vehicle" value={vehicle} icon="truck" styles={styles} colors={colors} />
              <DetailField label="Start" value={formatDetailDateTime(invite.scheduled_start)} icon="clock" styles={styles} colors={colors} />
              <DetailField label="End" value={formatDetailDateTime(invite.scheduled_end)} icon="calendar" styles={styles} colors={colors} isLast />
            </View>

            <Pressable
              onPress={openCalendar}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            >
              <Icon name="external-link" size={17} color={colors.white} style={styles.primaryBtnIcon} />
              <Text style={styles.primaryBtnText}>Open in Google Calendar</Text>
            </Pressable>

            <Pressable
              onPress={() => onViewConversation?.(invite)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            >
              <Icon name="message-circle" size={17} color={colors.primary} />
              <Text style={styles.secondaryBtnText}>View conversation</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
