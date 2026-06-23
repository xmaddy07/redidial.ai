import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Image, ScrollView, Platform, ToastAndroid } from 'react-native'
import { Alert } from '../../../utils/alert'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import moment from 'moment'
import { images } from '../../../constant'
import SettingHeader from '../../../component/settingHeader'
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero'
import getStyles from './styles'
import EditOrganizationModal from '../../../component/organization/EditOrganizationModal'
import { useSelector, useDispatch } from 'react-redux'
import { fetchOrgPreferences } from '../../../redux/themeSlice'
import api from '../../../api'
import { useTheme } from '../../../hooks/useTheme'

function formatDate(value) {
  if (!value) return '—'
  const parsed = moment(value)
  return parsed.isValid() ? parsed.format('MMM D, YYYY') : value
}

function DetailField({ label, icon, value, styles, colors, isLast }) {
  return (
    <View>
      <View style={styles.fieldRow}>
        <View style={styles.iconBox}>
          <Icon name={icon} size={16} color={colors.primary} />
        </View>
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue}>{value || '—'}</Text>
        </View>
      </View>
      {!isLast && <View style={styles.rowDivider} />}
    </View>
  )
}

function DetailSection({ title, fields, styles, colors }) {
  if (!fields.length) return null

  return (
    <>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.sectionCard}>
        {fields.map((field, index) => (
          <DetailField
            key={field.label}
            label={field.label}
            icon={field.icon}
            value={field.value}
            styles={styles}
            colors={colors}
            isLast={index === fields.length - 1}
          />
        ))}
      </View>
    </>
  )
}

export default function Organization({ navigation }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])

  const dispatch = useDispatch()
  const token = useSelector(state => state?.auth?.token)
  const [organization, setOrganization] = useState({
    name: '',
    website: '',
    email: '',
    phone: '',
    pocName: '',
    pocPhone: '',
    address: '',
    logoPath: '',
    carGurusWebsite: '',
    carGurusFinancingLink: '',
    carFaxFinancingLink: '',
    businessHours: '',
    businessHoursList: [],
    createdAt: '',
    updatedAt: '',
  })

  const [isEditVisible, setIsEditVisible] = useState(false)
  const [form, setForm] = useState(organization)

  const formatBusinessHours = (value) => {
    if (Array.isArray(value)) {
      return value
        .filter(i => i && typeof i === 'object')
        .map(i => `${i.day}: ${i.hours}`)
        .join(', ')
    }
    if (typeof value === 'string') return value
    return ''
  }

  const mapOrganizationFromApi = (src) => ({
    name: src?.name || '',
    website: src?.website || '',
    email: src?.email || '',
    phone: src?.phone || '',
    pocName: src?.poc_name || '',
    pocPhone: src?.poc_phone || '',
    address: src?.address || '',
    logoPath: src?.logo_path || '',
    carGurusWebsite: src?.cargurus_website_link || '',
    carGurusFinancingLink: src?.financing_link || '',
    carFaxFinancingLink: src?.carfax_financing_link || '',
    businessHours: formatBusinessHours(src?.business_hours || src?.businessHours),
    businessHoursList: Array.isArray(src?.business_hours)
      ? src.business_hours
      : Array.isArray(src?.businessHours)
        ? src.businessHours
        : [],
    createdAt: src?.created_at || '',
    updatedAt: src?.updated_at || '',
  })

  const buildBusinessHoursArrayFromObject = (obj) => {
    if (!obj || typeof obj !== 'object') return []
    const ordered = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' },
    ]
    return ordered
      .map(d => ({ day: d.label, hours: (obj[d.key] ?? obj[d.label] ?? '').toString() }))
      .filter(item => item.hours.length > 0)
  }

  const buildBusinessHoursObjectFromArray = (arr) => {
    if (!Array.isArray(arr)) return {}
    const keyMap = {
      Monday: 'monday', Tuesday: 'tuesday', Wednesday: 'wednesday', Thursday: 'thursday', Friday: 'friday', Saturday: 'saturday', Sunday: 'sunday',
    }
    return arr.reduce((acc, item) => {
      const dayKey = keyMap[item?.day] || (item?.day || '').toLowerCase()
      if (dayKey) acc[dayKey] = item?.hours || ''
      return acc
    }, {})
  }

  const openEdit = () => {
    const hoursObj = buildBusinessHoursObjectFromArray(organization.businessHoursList)
    setForm({ ...organization, businessHours: hoursObj })
    setIsEditVisible(true)
  }

  const applyUpdate = async () => {
    try {
      const payload = {
        name: (form?.name || '').trim(),
        website: (form?.website || '').trim(),
        email: (form?.email || '').trim(),
        phone: (form?.phone || '').trim(),
        poc_name: (form?.pocName || '').trim(),
        poc_phone: (form?.pocPhone || '').trim(),
        address: (form?.address || '').trim(),
        cargurus_website_link: (form?.carGurusWebsite || '').trim(),
        financing_link: (form?.carGurusFinancingLink || '').trim(),
        carfax_financing_link: (form?.carFaxFinancingLink || '').trim(),
        business_hours: Array.isArray(form?.businessHours)
          ? form.businessHours
          : (form && typeof form.businessHours === 'object')
            ? buildBusinessHoursArrayFromObject(form.businessHours)
            : typeof form?.businessHours === 'string' && form.businessHours
              ? form.businessHours.split(',').map(s => {
                  const [day, hours] = s.split(':').map(x => (x || '').trim())
                  return day && hours ? { day, hours } : null
                }).filter(Boolean)
              : [],
      }

      const response = await api.updateMyOrganization({ token, payload })
      const failed = response && typeof response === 'object' && 'success' in response && response.success === false
      if (!failed) {
        const src = (response && response.data) ? response.data : response || form
        setOrganization(mapOrganizationFromApi(src))
        if (token) {
          dispatch(fetchOrgPreferences(token))
        }
        if (Platform.OS === 'android') {
          ToastAndroid.show('Organization updated successfully', ToastAndroid.SHORT)
        } else {
          Alert.alert('Success', 'Organization updated successfully')
        }
        setTimeout(() => {
          setIsEditVisible(false)
        }, 1000)
      } else {
        console.warn('Update failed:', response?.message || 'Unknown error')
      }
    } catch (e) {
      console.error('Error updating organization:', e)
    }
  }

  useEffect(() => {
    let isCancelled = false
    const fetchOrganization = async () => {
      try {
        const raw = await api.getOrganizationDetails(token)
        if (isCancelled) return

        const src = raw?.organization || raw || {}
        setOrganization(mapOrganizationFromApi(src))
      } catch (e) {
        // swallow errors on this screen
      }
    }
    fetchOrganization()
    return () => {
      isCancelled = true
    }
  }, [token])

  const contactFields = useMemo(() => [
    organization.email && { label: 'Email Address', icon: 'mail', value: organization.email },
    organization.phone && { label: 'Phone Number', icon: 'phone', value: organization.phone },
    organization.pocName && { label: 'Point of Contact', icon: 'user', value: organization.pocName },
    organization.pocPhone && { label: 'POC Phone', icon: 'phone-call', value: organization.pocPhone },
    organization.address && { label: 'Address', icon: 'map-pin', value: organization.address },
  ].filter(Boolean), [organization])

  const linkFields = useMemo(() => [
    organization.website && { label: 'Website', icon: 'globe', value: organization.website },
    organization.carGurusWebsite && { label: 'CarGurus Website', icon: 'link-2', value: organization.carGurusWebsite },
    organization.carGurusFinancingLink && { label: 'CarGurus Financing', icon: 'link', value: organization.carGurusFinancingLink },
    organization.carFaxFinancingLink && { label: 'CarFax Financing', icon: 'link', value: organization.carFaxFinancingLink },
  ].filter(Boolean), [organization])

  const metaFields = useMemo(() => [
    organization.createdAt && { label: 'Created', icon: 'calendar', value: formatDate(organization.createdAt) },
    organization.updatedAt && { label: 'Last Updated', icon: 'refresh-ccw', value: formatDate(organization.updatedAt) },
  ].filter(Boolean), [organization])

  const openDaysCount = useMemo(
    () => organization.businessHoursList.filter(
      (item) => item?.hours && !/closed/i.test(item.hours),
    ).length,
    [organization.businessHoursList],
  )

  const hasAnyData = Boolean(
    organization.name ||
    contactFields.length ||
    linkFields.length ||
    organization.businessHoursList.length ||
    metaFields.length,
  )

  const displayName = organization.name || 'Your Organization'

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title="Organization" />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHero
          colors={colors}
          isDark={isDark}
          styles={styles}
          icon="briefcase"
          title="Organization Profile"
          subtitle="Manage your company details, contacts, and business hours."
          actionLabel="Edit Details"
          onAction={openEdit}
          actionIcon="edit-2"
        />

        {hasAnyData && (
          <SettingsStatPills
            styles={styles}
            items={[
              { value: contactFields.length, label: 'Contacts' },
              { value: openDaysCount, label: 'Open days' },
              { value: linkFields.length, label: 'Links' },
            ]}
          />
        )}

        <View style={styles.mainCard}>
          <View style={styles.profileHero}>
            <LinearGradient
              colors={
                isDark
                  ? [`${colors.primary}22`, `${colors.primary}08`, 'transparent']
                  : [`${colors.primary}14`, `${colors.primary}06`, 'transparent']
              }
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.heroGradient}
            />
            <View style={styles.avatarBorder}>
              <Image
                source={organization.logoPath ? { uri: organization.logoPath } : images.img}
                style={styles.avatar}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.orgName} numberOfLines={2}>{displayName}</Text>
            {organization.website ? (
              <View style={styles.websiteChip}>
                <Icon name="globe" size={12} color={colors.primary} />
                <Text style={styles.websiteText} numberOfLines={1}>{organization.website}</Text>
              </View>
            ) : null}
          </View>

          {!hasAnyData && (
            <View style={[styles.emptyState, { marginHorizontal: 16, marginBottom: 16 }]}>
              <View style={styles.emptyIcon}>
                <Icon name="briefcase" size={24} color={colors.gray} />
              </View>
              <Text style={styles.emptyTitle}>No organization details yet</Text>
              <Text style={styles.emptyHint}>
                Add your company profile, contact info, and business hours to get started.
              </Text>
            </View>
          )}
        </View>

        <DetailSection
          title="Contact Information"
          fields={contactFields}
          styles={styles}
          colors={colors}
        />

        <DetailSection
          title="Integrations & Links"
          fields={linkFields}
          styles={styles}
          colors={colors}
        />

        {organization.businessHoursList.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Business Hours</Text>
            <View style={styles.sectionCard}>
              <View style={styles.hoursHeader}>
                <View style={styles.iconBox}>
                  <Icon name="clock" size={16} color={colors.primary} />
                </View>
                <Text style={styles.hoursHeaderText}>Weekly Schedule</Text>
              </View>
              {organization.businessHoursList.map((item, idx) => {
                const isClosed = /closed/i.test(item?.hours || '')
                const isLast = idx === organization.businessHoursList.length - 1
                return (
                  <View key={`${item?.day || 'day'}-${idx}`}>
                    <View style={styles.hoursRow}>
                      <Text style={styles.hoursDay}>{item?.day || ''}</Text>
                      <Text style={[styles.hoursTime, isClosed && styles.hoursClosed]}>
                        {item?.hours || '—'}
                      </Text>
                    </View>
                    {!isLast && <View style={styles.hoursRowDivider} />}
                  </View>
                )
              })}
            </View>
          </>
        )}

        <DetailSection
          title="Record Info"
          fields={metaFields}
          styles={styles}
          colors={colors}
        />
      </ScrollView>

      <EditOrganizationModal
        visible={isEditVisible}
        onClose={() => setIsEditVisible(false)}
        form={form}
        onChange={(changes) => setForm(prev => ({ ...prev, ...changes }))}
        onSubmit={applyUpdate}
      />
    </View>
  )
}
