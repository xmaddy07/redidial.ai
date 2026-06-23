import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import LinearGradient from 'react-native-linear-gradient'
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import moment from 'moment'
import { Alert } from '../../../utils/alert'
import { getLeadById } from '../../../api'
import { useTheme } from '../../../hooks/useTheme'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { hp } from '../../../theme/layout'
import { upsertLead } from '../../../database/leadsCache'
import { syncThreadMessagesFromLead } from '../../../services/offlineSync'
import { emitOpenDialer } from '../../../utils/callEvents'
import getStyles from './styles'

const getInitials = (name) => {
  const value = String(name || '').trim()
  if (!value || value === '—') return '?'
  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return value.slice(0, 2).toUpperCase()
}

const formatDateTime = (value) => {
  if (!value || value === '-') return '—'
  const m = moment(value)
  return m.isValid() ? m.format('MMM DD, YYYY • hh:mm A') : '—'
}

const formatPrice = (value) => {
  if (value == null || value === '' || value === '—') return '—'
  const num = Number(String(value).replace(/[^0-9.-]/g, ''))
  if (Number.isFinite(num)) return `$${num.toLocaleString('en-US')}`
  return String(value)
}

const formatVin = (vin) => {
  if (!vin) return '—'
  const v = String(vin)
  return v.length > 8 ? `...${v.slice(-8)}` : v
}

const formatStatusLabel = (status) =>
  String(status || 'In Progress')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

function DetailCard({ icon, title, children, styles, colors }) {
  const primary = colors.primary
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[`${primary}88`, primary, colors.accent || primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardAccent}
      />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={[`${primary}28`, `${primary}12`]}
            style={styles.cardIconWrap}
          >
            {icon}
          </LinearGradient>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {children}
      </View>
    </View>
  )
}

function DetailField({ label, value, multiline, styles, children }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldValue, multiline && styles.fieldValueMultiline]}>
        {children || <Text style={styles.fieldValueText}>{value || '—'}</Text>}
      </View>
    </View>
  )
}

export default function LeadsDetail({ route }) {
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const pageBg = isDark ? (colors.appBg || colors.dark) : '#F1F5F9'
  const { styleOptions, insets } = useScreenLayout()
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])
  const navigation = useNavigation()
  const token = useSelector((state) => state?.auth?.token)
  const initialLead = route?.params?.lead || {}
  const leadId = route?.params?.id || initialLead?.id
  const [lead, setLead] = useState(initialLead)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isCancelled = false
    const fetchLead = async () => {
      if (!token || !leadId) return
      try {
        setLoading(true)
        const res = await getLeadById({ token, id: leadId })
        if (isCancelled) return
        setLead(res?.data || res || {})
      } catch {
        // keep fallback data on error
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }
    fetchLead()
    return () => { isCancelled = true }
  }, [token, leadId])

  const customer = useMemo(() => ({
    name: lead?.customer_name || lead?.name || 'Unknown',
    email: lead?.customer_email || lead?.email || '—',
    phone: lead?.customer_telephone || lead?.phone || '—',
    zip: lead?.customer_zip_code || lead?.zip || '—',
    comments: String(lead?.customer_comments || '').trim() || '—',
    createdAt: formatDateTime(
      lead?.created_at || lead?.createdAt || lead?.updated_at || lead?.updatedAt,
    ),
  }), [lead])

  const vehicle = useMemo(() => ({
    vin: lead?.vehicle_vin || '—',
    make: lead?.vehicle_make || '—',
    model: lead?.vehicle_model || '—',
    price: formatPrice(lead?.vehicle_listed_price),
    rating: lead?.vehicle_cargurus_rating || '—',
  }), [lead])

  const statusLabel = formatStatusLabel(lead?.status)
  const vehicleLabel = [vehicle.make, vehicle.model].filter((v) => v && v !== '—').join(' ')

  const heroGradient = useMemo(() => (
    isDark
      ? [`${colors.primary}50`, `${colors.primary}38`, `${colors.primary}28`]
      : [colors.primary, `${colors.primary}E6`, colors.accent || `${colors.primary}CC`]
  ), [colors.primary, colors.accent, isDark])

  const actionGradient = useMemo(
    () => [colors.primary, colors.accent || colors.primary],
    [colors.primary, colors.accent],
  )

  const openChat = useCallback(() => {
    if (!lead?.id) return
    const leadCopy = JSON.parse(JSON.stringify(lead))
    upsertLead(leadCopy).catch(() => {})
    if (Array.isArray(leadCopy.chats) && leadCopy.chats.length > 0) {
      syncThreadMessagesFromLead(leadCopy.id, leadCopy.chats).catch(() => {})
    }
    navigation.navigate('threads', { lead: leadCopy, id: leadCopy.id })
  }, [lead, navigation])

  const openDialer = useCallback(() => {
    const phone = String(lead?.customer_telephone || lead?.phone || '').trim()
    if (!phone || phone === '—') {
      Alert.alert('No phone number', 'This lead does not have a phone number on file.')
      return
    }
    emitOpenDialer({
      phoneNumber: phone,
      leadId: lead?.id,
      contactName: lead?.customer_name || lead?.name,
      avatarUri: lead?.profile_image || lead?.avatar || lead?.customer_avatar,
    })
  }, [lead])

  const renderRating = () => {
    const rating = Number(vehicle.rating)
    if (!Number.isFinite(rating) || rating <= 0) {
      return <Text style={styles.fieldValueText}>{vehicle.rating}</Text>
    }
    const stars = Math.min(5, Math.round(rating))
    return (
      <View style={styles.ratingRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon
            key={i}
            name="star"
            size={14}
            color={i < stars ? '#F59E0B' : (isDark ? colors.border : '#E2E8F0')}
            style={styles.ratingStar}
          />
        ))}
        <Text style={styles.fieldValueText}>{rating.toFixed(1)}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? [colors.headerBg || colors.appBg || '#15181F', colors.headerBg || colors.appBg || '#15181F', pageBg]
          : [`${colors.primary}16`, `${colors.primary}08`, pageBg]}
        style={styles.headerGradient}
      >
        <View style={[styles.header, { paddingTop: insets.top + hp(1) }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lead Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroInner}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarText}>{getInitials(customer.name)}</Text>
              </View>
              <View style={styles.heroContent}>
                <Text style={styles.heroName} numberOfLines={2}>{customer.name}</Text>
                <Text style={styles.heroSub} numberOfLines={1}>
                  {customer.phone !== '—' ? customer.phone : customer.email}
                </Text>
                <View style={styles.heroChipRow}>
                  <View style={styles.heroChip}>
                    <Text style={styles.heroChipText}>{statusLabel}</Text>
                  </View>
                  {vehicleLabel ? (
                    <View style={styles.heroChip}>
                      <Text style={styles.heroChipText} numberOfLines={1}>{vehicleLabel}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading lead details...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={openChat}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Icon name="message-circle" size={16} color="#FFFFFF" />
              <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Open Chat</Text>
            </TouchableOpacity>

            {customer.phone !== '—' ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={openDialer}
                activeOpacity={0.88}
              >
                <Icon name="phone" size={16} color={colors.primary} />
                <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <DetailCard
            title="Customer Information"
            styles={styles}
            colors={colors}
            icon={<Icon name="user" size={18} color={colors.primary} />}
          >
            <DetailField label="Full Name" value={customer.name} styles={styles} />
            <DetailField label="Email" value={customer.email} styles={styles} />
            <DetailField label="Phone" value={customer.phone} styles={styles} />
            <DetailField label="Zip Code" value={customer.zip} styles={styles} />
            <DetailField label="Created" value={customer.createdAt} styles={styles} />
          </DetailCard>

          <DetailCard
            title="Vehicle Details"
            styles={styles}
            colors={colors}
            icon={<Icon name="truck" size={18} color={colors.primary} />}
          >
            <DetailField label="VIN" value={formatVin(vehicle.vin)} styles={styles} />
            <DetailField label="Make" value={vehicle.make} styles={styles} />
            <DetailField label="Model" value={vehicle.model} styles={styles} />
            <DetailField label="Listed Price" value={vehicle.price} styles={styles} />
            <DetailField label="CarGurus Rating" styles={styles}>
              {renderRating()}
            </DetailField>
          </DetailCard>

          <DetailCard
            title="Customer Notes"
            styles={styles}
            colors={colors}
            icon={<Icon name="file-text" size={18} color={colors.primary} />}
          >
            <DetailField
              label="Comment"
              value={customer.comments}
              multiline
              styles={styles}
            />
          </DetailCard>
        </ScrollView>
      )}
    </View>
  )
}
