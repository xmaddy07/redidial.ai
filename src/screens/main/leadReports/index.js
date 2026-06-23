import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, Platform, ToastAndroid, ActivityIndicator } from 'react-native'
import { Alert } from '../../../utils/alert'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useSelector } from 'react-redux'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import { Dropdown } from 'react-native-element-dropdown'
import moment from 'moment'
import SettingHeader from '../../../component/settingHeader'
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero'
import LoadingView from '../../../component/LoadingView'
import { useTheme } from '../../../hooks/useTheme'
import getStyles from './styles'
import {
  getOrgUsers,
  getLeadSummarySettings,
  saveLeadSummarySettings,
  sendLeadSummaryTest,
} from '../../../api'

const FREQUENCY_OPTIONS = [
  { label: 'Weekly (previous Mon–Sun)', shortLabel: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly (previous calendar month)', shortLabel: 'Monthly', value: 'MONTHLY' },
]

const TIMEZONE_OPTIONS = [
  { label: 'Default (America/New_York)', value: '' },
  { label: 'America/New_York', value: 'America/New_York' },
  { label: 'America/Chicago', value: 'America/Chicago' },
  { label: 'America/Denver', value: 'America/Denver' },
  { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
]

const ATTACHMENT_OPTIONS = [
  { label: 'None', value: 'NONE' },
  { label: 'CSV', value: 'CSV' },
  { label: 'PDF', value: 'PDF' },
  { label: 'Both (CSV + PDF)', value: 'BOTH' },
]

const RECIPIENT_OPTIONS = [
  { id: 'ORG_EMAIL', label: 'Organization email only' },
  { id: 'USER_IDS', label: 'Selected users' },
  { id: 'CUSTOM_EMAILS', label: 'Custom email addresses' },
]

const DEFAULT_FORM = {
  enabled: false,
  frequency: 'WEEKLY',
  sendTime: '09:00',
  timezone: '',
  recipientMode: 'ORG_EMAIL',
  recipientUserIds: [],
  customEmailsText: '',
  attachmentFormat: 'NONE',
  includeLeadDetail: false,
}

function showToast(title, message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
    return
  }
  Alert.alert(title, message)
}

function unwrapPayload(payload) {
  if (payload == null) return null
  return payload?.data ?? payload?.result ?? payload
}

function normalizeUsersList(payload) {
  const root = unwrapPayload(payload)
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.users)) return root.users
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data
  return []
}

function mapUser(user) {
  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.name ||
    'Unknown'
  const email = user?.email || ''
  const isBot =
    user?.type === 'Bot' ||
    user?.type === 'BOT' ||
    user?.role === 'BOT' ||
    /bot/i.test(name) ||
    /bot/i.test(email)

  return {
    id: String(user?.id ?? user?.user_id ?? user?.userId ?? ''),
    name,
    email,
    isBot,
  }
}

function normalizeFrequency(value) {
  const upper = String(value || 'WEEKLY').toUpperCase()
  return upper === 'MONTHLY' ? 'MONTHLY' : 'WEEKLY'
}

function normalizeRecipientMode(value) {
  const upper = String(value || 'ORG_EMAIL').toUpperCase()
  if (upper === 'USER_IDS' || upper === 'SELECTED_USERS') return 'USER_IDS'
  if (upper === 'CUSTOM_EMAILS' || upper === 'CUSTOM') return 'CUSTOM_EMAILS'
  return 'ORG_EMAIL'
}

function normalizeAttachmentFormat(value) {
  const upper = String(value || 'NONE').toUpperCase()
  if (['CSV', 'PDF', 'BOTH'].includes(upper)) return upper
  return 'NONE'
}

function normalizeSendTime(value) {
  const raw = String(value || '09:00').trim()
  const match12 = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i)
  if (match12) {
    let hours = Number(match12[1])
    const minutes = match12[2]
    const meridiem = (match12[3] || '').toLowerCase()
    if (meridiem === 'pm' && hours < 12) hours += 12
    if (meridiem === 'am' && hours === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:${minutes}`
  }

  const match24 = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (match24) {
    return `${String(Number(match24[1])).padStart(2, '0')}:${match24[2]}`
  }

  return '09:00'
}

function parseCustomEmails(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  return String(value || '')
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseSettings(payload) {
  const root = unwrapPayload(payload) || {}
  const settings = root?.settings ?? root

  const recipientUserIds = (
    settings?.recipientUserIds ??
    settings?.recipient_user_ids ??
    []
  )
    .map(String)
    .filter(Boolean)

  const customEmails = settings?.customEmails ?? settings?.custom_emails ?? []

  return {
    form: {
      enabled: !!(settings?.enabled ?? settings?.is_enabled),
      frequency: normalizeFrequency(settings?.frequency),
      sendTime: normalizeSendTime(settings?.sendTime ?? settings?.send_time),
      timezone: settings?.timezone ?? settings?.time_zone ?? '',
      recipientMode: normalizeRecipientMode(settings?.recipientMode ?? settings?.recipient_mode),
      recipientUserIds,
      customEmailsText: Array.isArray(customEmails) ? customEmails.join(', ') : String(customEmails || ''),
      attachmentFormat: normalizeAttachmentFormat(
        settings?.attachmentFormat ?? settings?.attachment_format,
      ),
      includeLeadDetail: !!(
        settings?.includeLeadDetail ??
        settings?.include_lead_detail ??
        settings?.includeLeadDetails
      ),
    },
    meta: {
      nextScheduledSend:
        root?.nextScheduledSend ??
        root?.next_scheduled_send ??
        settings?.nextScheduledSend ??
        settings?.next_scheduled_send ??
        null,
      lastSentAt:
        root?.lastSentAt ??
        root?.last_sent_at ??
        settings?.lastSentAt ??
        settings?.last_sent_at ??
        null,
      lastSentLeadCount:
        root?.lastSentLeadCount ??
        root?.last_sent_lead_count ??
        settings?.lastSentLeadCount ??
        settings?.last_sent_lead_count ??
        null,
      defaultTimezone:
        root?.defaultTimezone ??
        root?.default_timezone ??
        settings?.defaultTimezone ??
        'America/New_York',
    },
  }
}

function buildSavePayload(form) {
  return {
    enabled: form.enabled,
    frequency: form.frequency,
    sendTime: normalizeSendTime(form.sendTime),
    timezone: form.timezone || null,
    recipientMode: form.recipientMode,
    recipientUserIds: form.recipientUserIds
      .map((id) => {
        const numeric = Number(id)
        return Number.isFinite(numeric) ? numeric : id
      })
      .filter((id) => id !== '' && id != null),
    customEmails: parseCustomEmails(form.customEmailsText),
    attachmentFormat: form.attachmentFormat,
    includeLeadDetail: form.includeLeadDetail,
  }
}

function formatMetaDate(value) {
  if (!value) return null
  const parsed = moment(value)
  return parsed.isValid() ? parsed.format('MMM D, YYYY h:mm A') : String(value)
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Toggle({ value, onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toggleTrack, value ? styles.toggleTrackOn : styles.toggleTrackOff]}
    >
      <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
    </Pressable>
  )
}

function RadioCard({ label, selected, onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.radioCard, selected && styles.radioCardSelected]}
    >
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
    </Pressable>
  )
}

function Checkbox({ checked, colors, styles }) {
  return (
    <View style={[styles.checkboxOuter, checked && styles.checkboxOuterChecked]}>
      {checked ? <Icon name="check" size={13} color={colors.white} /> : null}
    </View>
  )
}

export default function LeadReports({ navigation }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])
  const token = useSelector((state) => state.auth.token)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [initialPayload, setInitialPayload] = useState(JSON.stringify(buildSavePayload(DEFAULT_FORM)))
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({
    nextScheduledSend: null,
    lastSentAt: null,
    lastSentLeadCount: null,
    defaultTimezone: 'America/New_York',
  })

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!token) return

    if (!silent) setLoading(true)

    try {
      const [settingsResponse, usersResponse] = await Promise.all([
        getLeadSummarySettings(token),
        getOrgUsers(token),
      ])

      const parsed = parseSettings(settingsResponse)
      const teamUsers = normalizeUsersList(usersResponse)
        .map(mapUser)
        .filter((user) => user.id && !user.isBot)

      const validUserIds = parsed.form.recipientUserIds.filter((id) =>
        teamUsers.some((user) => user.id === id),
      )

      const nextForm = { ...parsed.form, recipientUserIds: validUserIds }
      setForm(nextForm)
      setInitialPayload(JSON.stringify(buildSavePayload(nextForm)))
      setUsers(teamUsers)
      setMeta(parsed.meta)
    } catch (error) {
      console.error('Lead summary load failed:', error?.message || error)
      Alert.alert('Load failed', error?.message || 'Could not load lead report settings.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const hasChanges = useMemo(
    () => JSON.stringify(buildSavePayload(form)) !== initialPayload,
    [form, initialPayload],
  )

  const scheduleNote =
    form.frequency === 'MONTHLY'
      ? 'Monthly reports send on the 1st for the previous calendar month.'
      : 'Weekly reports send on Monday for the previous Mon–Sun week.'

  const timezoneLabel =
    form.timezone ||
    `Default (${meta.defaultTimezone || 'America/New_York'})`

  const allUsersSelected =
    users.length > 0 && form.recipientUserIds.length === users.length

  const toggleUser = (id) => {
    updateForm({
      recipientUserIds: form.recipientUserIds.includes(id)
        ? form.recipientUserIds.filter((item) => item !== id)
        : [...form.recipientUserIds, id],
    })
  }

  const toggleSelectAllUsers = () => {
    updateForm({
      recipientUserIds: allUsersSelected ? [] : users.map((user) => user.id),
    })
  }

  const handleSave = async () => {
    const payload = buildSavePayload(form)

    if (payload.recipientMode === 'USER_IDS' && payload.recipientUserIds.length === 0) {
      Alert.alert('Recipients required', 'Select at least one user for scheduled summaries.')
      return
    }

    if (payload.recipientMode === 'CUSTOM_EMAILS' && payload.customEmails.length === 0) {
      Alert.alert('Emails required', 'Enter at least one custom email address.')
      return
    }

    try {
      setSaving(true)
      await saveLeadSummarySettings(token, payload)
      setInitialPayload(JSON.stringify(payload))
      await loadData({ silent: true })
      showToast('Saved', 'Lead report preferences saved.')
    } catch (error) {
      Alert.alert('Save failed', error?.message || 'Could not save lead report settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleSendTest = async () => {
    try {
      setSendingTest(true)
      await sendLeadSummaryTest(token)
      showToast('Sent', 'Test summary email sent to your account email.')
    } catch (error) {
      Alert.alert('Send failed', error?.message || 'Could not send test summary.')
    } finally {
      setSendingTest(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <SettingHeader navigation={navigation} title="Lead Reports" />
        <LoadingView text="Loading lead report settings..." flex />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title="Lead Reports" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHero
          colors={colors}
          isDark={isDark}
          styles={styles}
          icon="bar-chart-2"
          title="Lead Reports"
          subtitle="Periodic lead summaries are emailed from noreply@redidial.ai. Separate from instant alerts in Intimation."
        />

        <SettingsStatPills
          styles={styles}
          items={[
            { value: form.enabled ? 'On' : 'Off', label: 'Summaries' },
            {
              value: form.frequency === 'MONTHLY' ? 'Monthly' : 'Weekly',
              label: 'Frequency',
            },
          ]}
        />

        {(meta.nextScheduledSend || meta.lastSentAt) && (
          <>
            <Text style={styles.sectionLabel}>Schedule status</Text>
            <View style={[styles.card, styles.metaCard]}>
              {meta.nextScheduledSend ? (
                <View style={styles.metaRow}>
                  <Icon name="calendar" size={15} color={colors.primary} />
                  <View style={styles.metaTextWrap}>
                    <Text style={styles.metaLabel}>Next scheduled send</Text>
                    <Text style={styles.metaValue}>{formatMetaDate(meta.nextScheduledSend)}</Text>
                  </View>
                </View>
              ) : null}
              {meta.lastSentAt ? (
                <View style={styles.metaRow}>
                  <Icon name="send" size={15} color={colors.gray} />
                  <View style={styles.metaTextWrap}>
                    <Text style={styles.metaLabel}>Last sent</Text>
                    <Text style={styles.metaValue}>
                      {formatMetaDate(meta.lastSentAt)}
                      {meta.lastSentLeadCount != null
                        ? ` · ${meta.lastSentLeadCount} lead${meta.lastSentLeadCount === 1 ? '' : 's'}`
                        : ''}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Automation</Text>
        <View style={[styles.card, styles.formCard]}>
          <View style={styles.enableRow}>
            <View style={styles.enableTextWrap}>
              <Text style={styles.enableTitle}>Enable scheduled lead summaries</Text>
              <Text style={styles.enableHint}>Send automated digest emails on your schedule</Text>
            </View>
            <Toggle
              value={form.enabled}
              onPress={() => updateForm({ enabled: !form.enabled })}
              styles={styles}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Schedule</Text>
        <View style={[styles.card, styles.formCard]}>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Frequency</Text>
            <Dropdown
              style={styles.dropdown}
              data={FREQUENCY_OPTIONS}
              labelField="shortLabel"
              valueField="value"
              value={form.frequency}
              onChange={(item) => updateForm({ frequency: item.value })}
              placeholder="Select frequency"
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownText}
              itemTextStyle={styles.dropdownItemText}
              containerStyle={styles.dropdownContainer}
              activeColor={`${colors.primary}12`}
              renderItem={(item, selected) => (
                <View style={[styles.dropdownItemRow, selected && styles.dropdownItemRowSelected]}>
                  <Text style={[styles.dropdownItemText, selected && styles.dropdownItemTextSelected]}>
                    {item.label}
                  </Text>
                  {selected ? <Icon name="check" size={16} color={colors.primary} /> : null}
                </View>
              )}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Send time (24h)</Text>
            <View style={styles.timeInputWrap}>
              <TextInput
                style={styles.timeInput}
                value={form.sendTime}
                onChangeText={(text) => updateForm({ sendTime: text })}
                placeholder="09:00"
                placeholderTextColor={colors.gray}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Icon name="clock" size={16} color={colors.gray} />
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Timezone</Text>
            <Dropdown
              style={styles.dropdown}
              data={TIMEZONE_OPTIONS}
              labelField="label"
              valueField="value"
              value={form.timezone}
              onChange={(item) => updateForm({ timezone: item.value })}
              placeholder="Select timezone"
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownText}
              itemTextStyle={styles.dropdownItemText}
              containerStyle={styles.dropdownContainer}
              activeColor={`${colors.primary}12`}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Recipients</Text>
        <View style={[styles.card, styles.formCard]}>
          <View style={styles.radioStack}>
            {RECIPIENT_OPTIONS.map((option) => (
              <RadioCard
                key={option.id}
                label={option.label}
                selected={form.recipientMode === option.id}
                onPress={() => updateForm({ recipientMode: option.id })}
                styles={styles}
              />
            ))}
          </View>

          {form.recipientMode === 'USER_IDS' ? (
            <View style={styles.recipientPanel}>
              <Pressable onPress={toggleSelectAllUsers} style={styles.selectAllRow}>
                <Checkbox
                  checked={allUsersSelected}
                  colors={colors}
                  styles={styles}
                />
                <Text style={styles.selectAllText}>
                  {allUsersSelected ? 'Deselect all' : 'Select all'} ({form.recipientUserIds.length} of{' '}
                  {users.length})
                </Text>
              </Pressable>

              <View style={styles.usersStack}>
                {users.map((user) => {
                  const isSelected = form.recipientUserIds.includes(user.id)
                  return (
                    <Pressable
                      key={user.id}
                      onPress={() => toggleUser(user.id)}
                      style={[
                        styles.userCard,
                        isSelected && styles.userCardSelected,
                      ]}
                    >
                      <Checkbox checked={isSelected} colors={colors} styles={styles} />
                      <LinearGradient
                        colors={[`${colors.primary}40`, `${colors.primary}22`]}
                        style={styles.avatar}
                      >
                        <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
                      </LinearGradient>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        {!!user.email && (
                          <Text style={styles.userEmail} numberOfLines={1}>
                            {user.email}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ) : null}

          {form.recipientMode === 'CUSTOM_EMAILS' ? (
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Custom emails</Text>
              <TextInput
                style={styles.customEmailInput}
                value={form.customEmailsText}
                onChangeText={(text) => updateForm({ customEmailsText: text })}
                placeholder="admin@dealer.com, sales@dealer.com"
                placeholderTextColor={colors.gray}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
              <Text style={styles.fieldHint}>Separate multiple addresses with commas.</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>Attachment</Text>
        <View style={[styles.card, styles.formCard]}>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Attachment format</Text>
            <Dropdown
              style={styles.dropdown}
              data={ATTACHMENT_OPTIONS}
              labelField="label"
              valueField="value"
              value={form.attachmentFormat}
              onChange={(item) => updateForm({ attachmentFormat: item.value })}
              placeholder="Select format"
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownText}
              itemTextStyle={styles.dropdownItemText}
              containerStyle={styles.dropdownContainer}
              activeColor={`${colors.primary}12`}
            />
          </View>

          <View style={styles.enableRow}>
            <View style={styles.enableTextWrap}>
              <Text style={styles.enableTitle}>Include lead detail rows</Text>
              <Text style={styles.enableHint}>Add per-lead rows in CSV/PDF attachments</Text>
            </View>
            <Toggle
              value={form.includeLeadDetail}
              onPress={() => updateForm({ includeLeadDetail: !form.includeLeadDetail })}
              styles={styles}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <Icon name="info" size={16} color={colors.primary} />
            <Text style={styles.infoTitle}>Delivery notes</Text>
          </View>
          <Text style={styles.noteText}>{scheduleNote}</Text>
          <Text style={styles.noteText}>Timezone: {timezoneLabel}</Text>
          <Text style={styles.noteText}>Emails are sent from noreply@redidial.ai</Text>
        </View>

        <View style={styles.footerRow}>
          <Pressable
            onPress={handleSave}
            disabled={saving || !hasChanges}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && !saving && hasChanges && { opacity: 0.9 },
              (saving || !hasChanges) && styles.primaryBtnDisabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Icon name="save" size={17} color={colors.white} />
                <Text style={styles.primaryBtnText}>Save</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleSendTest}
            disabled={sendingTest}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && !sendingTest && { opacity: 0.9 },
              sendingTest && styles.primaryBtnDisabled,
            ]}
          >
            {sendingTest ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                <Icon name="mail" size={15} color={colors.text} />
                <Text style={styles.secondaryBtnText}>Send test</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}
