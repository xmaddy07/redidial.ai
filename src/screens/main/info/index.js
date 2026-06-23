import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Linking, FlatList, Modal, Image } from 'react-native'
import { Alert } from '../../../utils/alert'
import { wp, hp } from '../../../theme/layout'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/Feather'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import LinearGradient from 'react-native-linear-gradient'
import EditLeadModal from '../../../component/EditLeadModal'
import { pick, types as DocTypes, isErrorWithCode, errorCodes } from '@react-native-documents/picker'
import {
  buildUploadNoteText,
  formatFileSize,
  getFileKind,
  getLatestChatId,
  isImageMime,
  resolveFileUrl,
} from '../../../utils/chatAttachments'
import TestDriveDetailModal from '../testDrive/TestDriveDetailModal'
import {
  getDncDataAdd,
  getDncDataRemove,
  getLeadById,
  getLeadNotes,
  createLeadNote,
  deleteLeadNote,
  getLeadAttachments,
  deleteAttachment,
  uploadChatAttachment,
  getTestDriveInvitesByLead,
  getCallSummariesForLead,
  getCallSummaryDetails,
  updateLead,
} from '../../../api'
import {
  formatDetailDateTime,
  getInviteStatusLabel,
} from '../testDrive/utils'
import { useTheme } from '../../../hooks/useTheme'
import getStyles from './styles'
import {
  fetchLeadDncStatus,
  normalizePhoneForDnc,
} from '../../../utils/dnc'

const INFO_TABS = [
  { id: 'Info', label: 'Info' },
  { id: 'Attachments', label: 'Attachments' },
  { id: 'Calls', label: 'Calls' },
  { id: 'Notes', label: 'Notes' },
  { id: 'TestDrive', label: 'Test Drive Invites' },
]

const normalizeList = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.notes)) return payload.notes
  if (Array.isArray(payload.attachments)) return payload.attachments
  return []
}

const formatCallDuration = (seconds) => {
  const total = Number(seconds)
  if (!Number.isFinite(total) || total <= 0) return '—'
  const mins = Math.floor(total / 60)
  const secs = Math.floor(total % 60)
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

const getCallTitle = (call) => {
  const direction = String(call?.direction || call?.call_direction || '').toLowerCase()
  const type = call?.call_type || call?.type || call?.source || 'Call'
  if (direction === 'inbound' || direction === 'incoming') return `Incoming ${type}`
  if (direction === 'outbound' || direction === 'outgoing') return `Outgoing ${type}`
  return String(type)
}

const formatDateTime = (value) => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  } catch {
    return String(value)
  }
}

const formatPrice = (value) => {
  if (value == null || value === '' || value === '—') return '—'
  const num = Number(String(value).replace(/[^0-9.-]/g, ''))
  if (Number.isFinite(num)) {
    return `$${num.toLocaleString('en-US')}`
  }
  return String(value)
}

const getInitials = (name) => {
  const value = String(name || '').trim()
  if (!value || value === '—') return '?'
  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return value.slice(0, 2).toUpperCase()
}

function EmptyState({ icon, title, message, styles }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  )
}

function InfoCard({ icon, title, onEdit, children, styles, colors }) {
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
          <View style={styles.cardHeaderLeft}>
            <LinearGradient
              colors={[`${primary}28`, `${primary}12`]}
              style={styles.cardIconWrap}
            >
              {icon}
            </LinearGradient>
            <Text style={styles.cardTitle}>{title}</Text>
          </View>
          {onEdit ? (
            <TouchableOpacity style={styles.editBtn} onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="edit-2" size={16} color={primary} />
            </TouchableOpacity>
          ) : null}
        </View>
        {children}
      </View>
    </View>
  )
}

function ReadonlyField({ label, value, multiline, styles }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldValue, multiline && styles.fieldValueMultiline]}>
        <Text style={styles.fieldValueText}>{value || '—'}</Text>
      </View>
    </View>
  )
}

export default function Info({ route, navigation }) {
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const pageBg = isDark ? (colors.appBg || colors.dark) : '#F1F5F9'
  const { styleOptions, insets } = useScreenLayout()
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])

  const token = useSelector(state => state?.auth?.token)
  const currentUser = useSelector(state => state?.auth?.user)
  const passedLead = route?.params?.lead
  const leadId = route?.params?.id || passedLead?.id

  const [lead, setLead] = useState(passedLead || {})
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('Info')
  const [organization, setOrganization] = useState(null)
  const [dncStatus, setDncStatus] = useState({ isDnc: false })
  const [dncLoading, setDncLoading] = useState(false)
  const [testDriveAt, setTestDriveAt] = useState(null)
  const [testDriveInvites, setTestDriveInvites] = useState([])
  const [testDriveLoading, setTestDriveLoading] = useState(false)
  const [selectedInvite, setSelectedInvite] = useState(null)

  const [calls, setCalls] = useState([])
  const [callsLoading, setCallsLoading] = useState(false)
  const [selectedCall, setSelectedCall] = useState(null)
  const [callDetailLoading, setCallDetailLoading] = useState(false)
  const [callDetail, setCallDetail] = useState(null)

  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [attachments, setAttachments] = useState([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [pendingUploads, setPendingUploads] = useState([])
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [attachmentPreview, setAttachmentPreview] = useState(null)

  const [editLeadOpen, setEditLeadOpen] = useState(false)
  const [savingLead, setSavingLead] = useState(false)
  const [commentsModalOpen, setCommentsModalOpen] = useState(false)
  const [commentsDraft, setCommentsDraft] = useState('')
  const [savingComments, setSavingComments] = useState(false)

  const fetchLeadDetails = useCallback(async () => {
    if (!token || !leadId) return
    try {
      setLoading(true)
      const res = await getLeadById({ token, id: leadId })
      const fetched = res?.data || res || {}
      setLead(fetched)
    } catch (e) {
      console.log('fetchLead error:', e?.message || e)
    } finally {
      setLoading(false)
    }
  }, [leadId, token])

  const loadTestDriveInvites = useCallback(async () => {
    if (!token || !leadId) return
    setTestDriveLoading(true)
    try {
      const res = await getTestDriveInvitesByLead({ token, leadId })
      const list = normalizeList(res)
      setTestDriveInvites(list)
      const upcoming = list.find((item) => item?.scheduled_start || item?.scheduled_at || item?.start_time)
      const when = upcoming?.scheduled_start || upcoming?.scheduled_at || upcoming?.start_time
      setTestDriveAt(when || lead?.test_drive_at || lead?.test_drive_date || null)
    } catch {
      setTestDriveInvites([])
      setTestDriveAt(lead?.test_drive_at || lead?.test_drive_date || null)
    } finally {
      setTestDriveLoading(false)
    }
  }, [token, leadId, lead?.test_drive_at, lead?.test_drive_date])

  const loadCalls = useCallback(async () => {
    if (!token || !leadId) return
    setCallsLoading(true)
    try {
      const res = await getCallSummariesForLead({ token, leadId })
      setCalls(normalizeList(res))
    } catch (err) {
      setCalls([])
      Alert.alert('Error', err?.message || 'Failed to load calls')
    } finally {
      setCallsLoading(false)
    }
  }, [token, leadId])

  useEffect(() => {
    if (!leadId) return
    if (passedLead?.id) {
      setLead(passedLead)
    } else {
      fetchLeadDetails()
    }
    loadTestDriveInvites()
  }, [leadId, passedLead, fetchLeadDetails, loadTestDriveInvites])

  const loadNotes = useCallback(async () => {
    if (!token || !leadId) return
    setNotesLoading(true)
    try {
      const res = await getLeadNotes({ token, leadId })
      setNotes(normalizeList(res))
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to load notes')
    } finally {
      setNotesLoading(false)
    }
  }, [token, leadId])

  const loadAttachments = useCallback(async () => {
    if (!token || !leadId) return
    setAttachmentsLoading(true)
    try {
      const res = await getLeadAttachments({ token, leadId })
      setAttachments(normalizeList(res))
      const leadRes = await getLeadById({ token, id: leadId })
      const fetched = leadRes?.data || leadRes || {}
      if (fetched?.id || fetched?.chats) {
        setLead((prev) => ({ ...prev, ...fetched }))
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to load attachments')
    } finally {
      setAttachmentsLoading(false)
    }
  }, [token, leadId])

  const userDisplayName = useMemo(() => {
    const first = currentUser?.first_name || currentUser?.firstName || ''
    const last = currentUser?.last_name || currentUser?.lastName || ''
    const name = [first, last].filter(Boolean).join(' ').trim()
    return name || currentUser?.name || currentUser?.email || 'Unknown'
  }, [currentUser])

  useEffect(() => {
    if (tab === 'Notes') loadNotes()
    if (tab === 'Attachments') loadAttachments()
    if (tab === 'Calls') loadCalls()
    if (tab === 'TestDrive') loadTestDriveInvites()
  }, [tab, loadNotes, loadAttachments, loadCalls, loadTestDriveInvites])

  const refreshDncStatus = useCallback(async () => {
    if (!token || !lead?.customer_telephone) {
      setDncStatus({ isDnc: false })
      return
    }

    try {
      setDncLoading(true)
      const result = await fetchLeadDncStatus({
        token,
        phone: lead.customer_telephone,
        user: currentUser,
        organization,
      })
      if (result.orgData?.id) {
        setOrganization((prev) => (
          prev?.id === result.orgData.id ? prev : result.orgData
        ))
      }
      setDncStatus({ isDnc: result.isDnc })
    } catch (error) {
      console.log('DNC check error:', error?.message || error)
    } finally {
      setDncLoading(false)
    }
  }, [token, lead?.customer_telephone, currentUser, organization])

  useEffect(() => {
    refreshDncStatus()
  }, [refreshDncStatus])

  const handleDncAction = async () => {
    const phone = normalizePhoneForDnc(lead?.customer_telephone) || lead?.customer_telephone

    if (!token || !phone) {
      Alert.alert('Error', 'A valid phone number is required for DNC.')
      return
    }

    try {
      setDncLoading(true)

      const status = await fetchLeadDncStatus({
        token,
        phone,
        user: currentUser,
        organization,
      })
      const orgId = status.orgId

      if (!orgId) {
        Alert.alert('Error', 'Organization not found. Please try again.')
        return
      }

      if (status.isDnc) {
        await getDncDataRemove({ token, number: phone, orgId })
        Alert.alert('Success', 'Customer removed from DNC list')
      } else {
        await getDncDataAdd({
          token,
          payload: {
            number: phone,
            name: lead?.customer_name || 'Unknown',
            email: lead?.customer_email || '',
            orgId,
            leadId: lead?.id || leadId,
            reason: 'Added from lead info screen',
          },
        })
        Alert.alert('Success', 'Customer added to DNC list')
      }

      await refreshDncStatus()
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to update DNC status')
    } finally {
      setDncLoading(false)
    }
  }

  const handleSaveLead = async (updated) => {
    if (!token || !leadId) return
    setSavingLead(true)
    try {
      await updateLead({
        token,
        id: leadId,
        payload: {
          customer_name: updated.customer_name,
          customer_email: updated.customer_email,
          customer_telephone: updated.customer_telephone,
          customer_zip_code: updated.customer_zip_code,
        },
      })
      setLead((prev) => ({ ...prev, ...updated }))
      setEditLeadOpen(false)
      Alert.alert('Success', 'Customer information updated')
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to update lead')
    } finally {
      setSavingLead(false)
    }
  }

  const openCommentsEdit = () => {
    setCommentsDraft(lead?.customer_comments || '')
    setCommentsModalOpen(true)
  }

  const handleSaveComments = async () => {
    if (!token || !leadId || savingComments) return
    setSavingComments(true)
    try {
      await updateLead({
        token,
        id: leadId,
        payload: { customer_comments: commentsDraft.trim() },
      })
      setLead((prev) => ({ ...prev, customer_comments: commentsDraft.trim() }))
      setCommentsModalOpen(false)
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to update comments')
    } finally {
      setSavingComments(false)
    }
  }

  const handleOpenCallDetail = async (call) => {
    const callId = call?.id || call?.call_id
    if (!callId || !token) {
      setSelectedCall(call)
      setCallDetail(call)
      return
    }

    setSelectedCall(call)
    setCallDetailLoading(true)
    try {
      const res = await getCallSummaryDetails({
        token,
        callId,
        callType: call?.call_type || call?.type,
      })
      setCallDetail(res?.data || res || call)
    } catch {
      setCallDetail(call)
    } finally {
      setCallDetailLoading(false)
    }
  }

  const handleCreateNote = async () => {
    const content = noteDraft.trim()
    if (!content || !token || !leadId || savingNote) return

    setSavingNote(true)
    try {
      await createLeadNote({ token, payload: { leadId, content, note: content } })
      setNoteDraft('')
      await loadNotes()
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to create note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteNote = (note) => {
    const noteId = note?.id
    if (!noteId || !token) return

    Alert.alert('Delete note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLeadNote({ token, id: noteId })
            await loadNotes()
          } catch (err) {
            Alert.alert('Error', err?.message || 'Failed to delete note')
          }
        },
      },
    ])
  }

  const handleOpenAttachment = (item) => {
    const url = resolveFileUrl(item)
    const mime = item?.mimetype || item?.mime_type || item?.type || ''
    const name = item?.name || item?.filename || item?.original_name || 'Attachment'
    if (!url) {
      Alert.alert('Attachment', name)
      return
    }
    if (isImageMime(mime, name)) {
      setAttachmentPreview({ url, name })
      return
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open attachment'))
  }

  const handlePickAttachments = async () => {
    if (uploadingAttachments) return
    try {
      const results = await pick({
        type: [DocTypes.allFiles],
        allowMultiSelection: true,
      })
      const mapped = results
        .filter((item) => item?.uri)
        .map((item, index) => ({
          id: `${Date.now()}-${index}`,
          uri: item.uri,
          name: item.name || `file-${Date.now()}-${index}`,
          type: item.type || 'application/octet-stream',
          size: item.size ?? null,
          kind: getFileKind(item.type, item.name),
        }))
      if (mapped.length) {
        setPendingUploads((prev) => [...prev, ...mapped])
      }
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return
      Alert.alert('Error', err?.message || 'Failed to pick files')
    }
  }

  const handleRemovePendingUpload = (id) => {
    setPendingUploads((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUploadPendingAttachments = async () => {
    if (!token || !leadId || uploadingAttachments || pendingUploads.length === 0) return

    let chatId = getLatestChatId(lead)
    if (!chatId) {
      try {
        const leadRes = await getLeadById({ token, id: leadId })
        const fetched = leadRes?.data || leadRes || {}
        setLead((prev) => ({ ...prev, ...fetched }))
        chatId = getLatestChatId(fetched)
      } catch {
        // handled below
      }
    }

    if (!chatId) {
      Alert.alert(
        'No active chat',
        'Send a message in this thread before uploading attachments.',
      )
      return
    }

    setUploadingAttachments(true)
    setUploadProgress(0)

    try {
      const queue = [...pendingUploads]
      for (let index = 0; index < queue.length; index += 1) {
        const file = queue[index]
        await uploadChatAttachment({
          token,
          chatId,
          file: {
            uri: file.uri,
            name: file.name,
            type: file.type,
          },
        })
        const noteText = buildUploadNoteText({
          fileName: file.name,
          fileSize: file.size,
          userName: userDisplayName,
        })
        await createLeadNote({
          token,
          payload: {
            leadId,
            content: noteText,
            note: noteText,
          },
        })
        setUploadProgress((index + 1) / queue.length)
      }
      setPendingUploads([])
      await loadAttachments()
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to upload attachments')
    } finally {
      setUploadingAttachments(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteAttachment = (item) => {
    const attachmentId = item?.id
    if (!attachmentId || !token) return

    Alert.alert('Delete attachment', 'Remove this attachment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAttachment({ token, id: attachmentId })
            await loadAttachments()
          } catch (err) {
            Alert.alert('Error', err?.message || 'Failed to delete attachment')
          }
        },
      },
    ])
  }

  const customer = useMemo(() => ({
    name: lead?.customer_name || '—',
    email: lead?.customer_email || '—',
    phone: lead?.customer_telephone || '—',
    zip: lead?.customer_zip_code || '—',
  }), [lead])

  const vehicle = useMemo(() => ({
    make: lead?.vehicle_make || lead?.make || '—',
    model: lead?.vehicle_model || lead?.model || '—',
    vin: lead?.vehicle_vin || lead?.vin || '—',
    price: formatPrice(lead?.vehicle_listed_price || lead?.price),
    rating: lead?.vehicle_cargurus_rating || '—',
  }), [lead])

  const dealer = useMemo(() => ({
    name: lead?.dealer_name || lead?.dealer || '—',
    address: lead?.dealer_address || lead?.address || '—',
  }), [lead])

  const statusLabel = lead?.status || 'In Progress'
  const comments = String(lead?.customer_comments || '').trim()

  const heroGradient = useMemo(() => (
    isDark
      ? [`${colors.primary}50`, `${colors.primary}38`, `${colors.primary}28`]
      : [colors.primary, `${colors.primary}E6`, colors.accent || `${colors.primary}CC`]
  ), [colors.primary, colors.accent, isDark])

  const tabGradient = useMemo(() => (
    [`${colors.primary}BB`, colors.primary, colors.accent || colors.primary]
  ), [colors.primary, colors.accent])

  const renderTabChip = ({ id, label }) => {
    const isActive = tab === id
    return (
      <TouchableOpacity
        key={id}
        onPress={() => setTab(id)}
        style={[styles.tabChip, isActive && styles.tabChipActive]}
        activeOpacity={0.88}
      >
        {isActive ? (
          <LinearGradient
            colors={tabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabChipGradient}
          />
        ) : null}
        <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderTabBar = () => (
    <View style={styles.tabBarWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {INFO_TABS.map(renderTabChip)}
      </ScrollView>
    </View>
  )

  const renderLeadHero = () => (
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
            <Text style={styles.heroName} numberOfLines={1}>{customer.name}</Text>
            <Text style={styles.heroSub} numberOfLines={1}>
              {customer.phone !== '—' ? customer.phone : customer.email}
            </Text>
            <View style={styles.heroChipRow}>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>{statusLabel}</Text>
              </View>
              {vehicle.model !== '—' ? (
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText} numberOfLines={1}>
                    {vehicle.make} {vehicle.model}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  )

  const renderInfoTab = () => (
    <>
      <InfoCard
        title="Customer Information"
        styles={styles}
        colors={colors}
        onEdit={() => setEditLeadOpen(true)}
        icon={<Icon name="user" size={18} color={colors.primary} />}
      >
        <ReadonlyField label="Name" value={customer.name} styles={styles} />
        <ReadonlyField label="Email" value={customer.email} styles={styles} />
        <ReadonlyField label="Phone" value={customer.phone} styles={styles} />
        <ReadonlyField label="Zip Code" value={customer.zip} styles={styles} />

        {lead?.customer_telephone ? (
          <>
            <View style={[styles.dncBanner, dncStatus?.isDnc && styles.dncBannerWarning]}>
              <MaterialCommunityIcons
                name={dncStatus?.isDnc ? 'cancel' : 'check-circle'}
                size={18}
                color={dncStatus?.isDnc ? colors.danger : colors.success}
              />
              <Text style={[styles.dncBannerText, dncStatus?.isDnc && styles.dncBannerTextWarning]}>
                {dncLoading
                  ? 'Checking DNC status...'
                  : dncStatus?.isDnc
                    ? 'This contact is on the Do Not Call list'
                    : 'Contact is not in DNC list'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.dncButton,
                dncStatus?.isDnc ? styles.dncButtonRemove : styles.dncButtonAdd,
              ]}
              onPress={handleDncAction}
              disabled={dncLoading}
              activeOpacity={0.85}
            >
              {dncLoading ? (
                <ActivityIndicator
                  color={dncStatus?.isDnc ? colors.white : colors.white}
                  size="small"
                />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={dncStatus?.isDnc ? 'check' : 'cancel'}
                    size={18}
                    color={colors.white}
                  />
                  <Text style={styles.dncButtonText}>
                    {dncStatus?.isDnc ? 'Remove from DNC' : 'Add to DNC'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : null}
      </InfoCard>

      <InfoCard
        title="Vehicle Information"
        styles={styles}
        colors={colors}
        onEdit={() => Alert.alert('Vehicle', 'Edit vehicle details from the Vehicles section in the app.')}
        icon={<MaterialCommunityIcons name="truck-outline" size={20} color={colors.primary} />}
      >
        <ReadonlyField label="Make" value={vehicle.make} styles={styles} />
        <ReadonlyField label="Model" value={vehicle.model} styles={styles} />
        <ReadonlyField label="VIN" value={vehicle.vin} styles={styles} />
        <ReadonlyField label="Listed Price" value={vehicle.price} styles={styles} />
        <ReadonlyField label="CarGurus Rating" value={String(vehicle.rating)} styles={styles} />
      </InfoCard>

      <InfoCard
        title="Dealer Information"
        styles={styles}
        colors={colors}
        icon={<MaterialCommunityIcons name="office-building-outline" size={20} color={colors.primary} />}
      >
        <ReadonlyField label="Name" value={dealer.name} styles={styles} />
        <ReadonlyField label="Address" value={dealer.address} styles={styles} multiline />
      </InfoCard>

      <InfoCard
        title="Status Information"
        styles={styles}
        colors={colors}
        icon={<Icon name="clipboard" size={18} color={colors.primary} />}
      >
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, statusLabel === 'In Progress' && styles.statusDotActive]} />
          <Text style={styles.statusLabel}>{statusLabel}</Text>
        </View>
        <ReadonlyField label="Created At" value={formatDateTime(lead?.created_at)} styles={styles} />
        <ReadonlyField label="Test Drive" value={formatDateTime(testDriveAt)} styles={styles} />
      </InfoCard>

      <InfoCard
        title="Customer Comments"
        styles={styles}
        colors={colors}
        onEdit={openCommentsEdit}
        icon={<Icon name="message-square" size={18} color={colors.primary} />}
      >
        <View style={styles.commentBox}>
          <Text style={styles.commentText}>{comments || '—'}</Text>
        </View>
      </InfoCard>
    </>
  )

  const renderCallsTab = () => (
    <View style={styles.tabPanel}>
      {callsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading calls...</Text>
        </View>
      ) : (
        <FlatList
          data={calls}
          keyExtractor={(item, index) => String(item?.id ?? item?.call_id ?? index)}
          scrollEnabled={false}
          ListEmptyComponent={(
            <EmptyState
              styles={styles}
              icon={<Icon name="phone" size={28} color={colors.primary} />}
              title="No calls yet"
              message="Call history for this lead will appear here once recorded."
            />
          )}
          renderItem={({ item }) => {
            const when = item?.created_at || item?.started_at || item?.call_date
            const summary = item?.summary || item?.transcription || item?.notes || ''
            return (
              <TouchableOpacity
                style={styles.listCard}
                onPress={() => handleOpenCallDetail(item)}
                activeOpacity={0.88}
              >
                <View style={styles.listCardRow}>
                  <LinearGradient
                    colors={[`${colors.primary}28`, `${colors.primary}12`]}
                    style={styles.callIconWrap}
                  >
                    <Icon name="phone" size={18} color={colors.primary} />
                  </LinearGradient>
                  <View style={styles.listCardContent}>
                    <View style={styles.listCardHeader}>
                      <Text style={styles.listCardTitle}>{getCallTitle(item)}</Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>
                          {String(item?.status || 'COMPLETED').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.listCardMeta}>
                      {formatDateTime(when)} · {formatCallDuration(item?.duration || item?.call_duration)}
                    </Text>
                    {summary ? (
                      <Text style={styles.listCardBody} numberOfLines={3}>{summary}</Text>
                    ) : null}
                  </View>
                  <Icon name="chevron-right" size={18} color={colors.gray} style={styles.listCardChevron} />
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )

  const renderTestDriveTab = () => (
    <View style={styles.tabPanel}>
      {testDriveLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading invites...</Text>
        </View>
      ) : (
        <FlatList
          data={testDriveInvites}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          scrollEnabled={false}
          ListEmptyComponent={(
            <EmptyState
              styles={styles}
              icon={<MaterialCommunityIcons name="car-outline" size={30} color={colors.primary} />}
              title="No test drives"
              message="Scheduled test drive invites for this lead will show up here."
            />
          )}
          renderItem={({ item }) => {
            const when = item?.scheduled_start || item?.scheduled_at || item?.start_time
            const inviteStatus = getInviteStatusLabel(item)
            const vehicleName = item?.vehicle_model || item?.lead?.vehicle_model || lead?.vehicle_model || '—'
            const isCancelled = inviteStatus === 'CANCELLED'
            return (
              <TouchableOpacity
                style={styles.listCard}
                onPress={() => setSelectedInvite(item)}
                activeOpacity={0.88}
              >
                <View style={styles.listCardHeader}>
                  <Text style={styles.listCardTitle}>{vehicleName}</Text>
                  <View style={[styles.statusBadge, isCancelled && styles.statusBadgeMuted]}>
                    <Text style={[styles.statusBadgeText, isCancelled && styles.statusBadgeTextMuted]}>
                      {inviteStatus}
                    </Text>
                  </View>
                </View>
                <Text style={styles.listCardMeta}>
                  {when ? formatDetailDateTime(when) : '—'}
                </Text>
                {item?.notes || item?.description ? (
                  <Text style={styles.listCardBody} numberOfLines={2}>
                    {item.notes || item.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )

  const renderNotesTab = () => (
    <View style={styles.tabPanel}>
      <View style={styles.noteComposerCard}>
        <View style={styles.noteComposer}>
          <TextInput
            value={noteDraft}
            onChangeText={setNoteDraft}
            placeholder="Write a note..."
            placeholderTextColor={colors.gray}
            style={styles.noteInput}
            multiline
          />
          <TouchableOpacity
            onPress={handleCreateNote}
            disabled={!noteDraft.trim() || savingNote}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={noteDraft.trim() && !savingNote
                ? [`${colors.primary}BB`, colors.primary, colors.accent || colors.primary]
                : ['#94A3B8', '#64748B']}
              style={[styles.noteSaveBtn, (!noteDraft.trim() || savingNote) && styles.noteSaveBtnDisabled]}
            >
              {savingNote ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.noteSaveText}>Add</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {notesLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          scrollEnabled={false}
          ListEmptyComponent={(
            <EmptyState
              styles={styles}
              icon={<Icon name="file-text" size={28} color={colors.primary} />}
              title="No notes yet"
              message="Add internal notes to keep your team aligned on this lead."
            />
          )}
          renderItem={({ item }) => (
            <View style={styles.noteCard}>
              <Text style={styles.noteBody}>{item?.content || item?.note || item?.text || '—'}</Text>
              <View style={styles.noteFooter}>
                <Text style={styles.noteMeta}>
                  {item?.created_at ? new Date(item.created_at).toLocaleString() : ''}
                </Text>
                <TouchableOpacity onPress={() => handleDeleteNote(item)}>
                  <Icon name="trash-2" size={16} color={colors.gray} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  )

  const renderAttachmentsTab = () => (
    <View style={styles.tabPanel}>
      <View style={styles.attachmentUploadCard}>
        <View style={styles.attachmentUploadHeader}>
          <Text style={styles.attachmentUploadTitle}>Upload files</Text>
          <Text style={styles.attachmentUploadHint}>
            Add images, documents, or videos to this thread.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.attachmentBrowseBtn}
          onPress={handlePickAttachments}
          disabled={uploadingAttachments}
          activeOpacity={0.88}
        >
          <Icon name="upload" size={16} color={colors.primary} />
          <Text style={styles.attachmentBrowseText}>Browse files</Text>
        </TouchableOpacity>

        {pendingUploads.length > 0 ? (
          <View style={styles.pendingUploadList}>
            {pendingUploads.map((file) => (
              <View key={file.id} style={styles.pendingUploadRow}>
                {file.kind === 'image' ? (
                  <Image source={{ uri: file.uri }} style={styles.pendingUploadThumb} />
                ) : (
                  <View style={styles.pendingUploadIcon}>
                    <MaterialCommunityIcons
                      name={file.kind === 'video' ? 'video-outline' : 'file-document-outline'}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                )}
                <View style={styles.pendingUploadMeta}>
                  <Text style={styles.pendingUploadName} numberOfLines={1}>{file.name}</Text>
                  <Text style={styles.pendingUploadSize}>{formatFileSize(file.size)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemovePendingUpload(file.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="x" size={16} color={colors.gray} />
                </TouchableOpacity>
              </View>
            ))}
            {uploadingAttachments ? (
              <View style={styles.uploadProgressWrap}>
                <View style={styles.uploadProgressTrack}>
                  <View style={[styles.uploadProgressFill, { width: `${Math.round(uploadProgress * 100)}%` }]} />
                </View>
                <Text style={styles.uploadProgressText}>
                  Uploading {Math.round(uploadProgress * 100)}%
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadSubmitBtn}
                onPress={handleUploadPendingAttachments}
                activeOpacity={0.88}
              >
                <Text style={styles.uploadSubmitText}>
                  Upload {pendingUploads.length} file{pendingUploads.length === 1 ? '' : 's'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>

      {attachmentsLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={attachments}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          scrollEnabled={false}
          ListEmptyComponent={(
            <EmptyState
              styles={styles}
              icon={<Icon name="paperclip" size={28} color={colors.primary} />}
              title="No attachments"
              message="Files shared in this conversation will appear here."
            />
          )}
          renderItem={({ item }) => {
            const name = item?.name || item?.filename || item?.original_name || 'Attachment'
            const mime = item?.mimetype || item?.mime_type || item?.type || ''
            const uploader = item?.uploaded_by_name
              || item?.uploader_name
              || item?.user?.name
              || item?.uploaded_by?.name
            const size = item?.size ?? item?.file_size
            const isImage = isImageMime(mime, name)

            return (
              <View style={styles.attachmentRow}>
                <TouchableOpacity
                  style={styles.attachmentRowMain}
                  onPress={() => handleOpenAttachment(item)}
                  activeOpacity={0.88}
                >
                  <View style={styles.attachmentIconWrap}>
                    {isImage && resolveFileUrl(item) ? (
                      <Image source={{ uri: resolveFileUrl(item) }} style={styles.attachmentThumb} />
                    ) : (
                      <Icon name="paperclip" size={18} color={colors.primary} />
                    )}
                  </View>
                  <View style={styles.attachmentMeta}>
                    <Text style={styles.attachmentName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.attachmentDate} numberOfLines={1}>
                      {size ? formatFileSize(size) : '—'}
                      {item?.created_at ? ` · ${new Date(item.created_at).toLocaleString()}` : ''}
                    </Text>
                    {uploader ? (
                      <Text style={styles.attachmentUploader} numberOfLines={1}>
                        {uploader}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleOpenAttachment(item)}
                  style={styles.attachmentActionBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="download" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteAttachment(item)}
                  style={styles.attachmentActionBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="trash-2" size={16} color={colors.gray} />
                </TouchableOpacity>
              </View>
            )
          }}
        />
      )}
    </View>
  )

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

        {renderLeadHero()}
        {renderTabBar()}
      </LinearGradient>

      {loading && tab === 'Info' ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading lead details...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {tab === 'Info' && renderInfoTab()}
          {tab === 'Attachments' && renderAttachmentsTab()}
          {tab === 'Calls' && renderCallsTab()}
          {tab === 'Notes' && renderNotesTab()}
          {tab === 'TestDrive' && renderTestDriveTab()}
        </ScrollView>
      )}

      <EditLeadModal
        visible={editLeadOpen}
        lead={lead}
        onClose={() => setEditLeadOpen(false)}
        onSave={handleSaveLead}
        saving={savingLead}
      />

      <TestDriveDetailModal
        visible={Boolean(selectedInvite)}
        invite={selectedInvite}
        onClose={() => setSelectedInvite(null)}
      />

      <Modal
        visible={Boolean(selectedCall)}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedCall(null)
          setCallDetail(null)
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropFlex}
            activeOpacity={1}
            onPress={() => {
              setSelectedCall(null)
              setCallDetail(null)
            }}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Call Details</Text>
            {callDetailLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.modalLoader} />
            ) : (
              <>
                <Text style={styles.listCardTitle}>{getCallTitle(callDetail || selectedCall)}</Text>
                <Text style={[styles.listCardMeta, { marginTop: hp(0.8), marginBottom: hp(1.5) }]}>
                  {formatDateTime(
                    callDetail?.created_at
                    || selectedCall?.created_at
                    || selectedCall?.started_at,
                  )}
                  {' · '}
                  {formatCallDuration(
                    callDetail?.duration
                    || selectedCall?.duration
                    || selectedCall?.call_duration,
                  )}
                </Text>
                <ScrollView style={styles.modalBodyScroll}>
                  <Text style={styles.listCardBody}>
                    {callDetail?.summary
                      || callDetail?.transcription
                      || callDetail?.notes
                      || selectedCall?.summary
                      || 'No summary available for this call.'}
                  </Text>
                </ScrollView>
              </>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setSelectedCall(null)
                  setCallDetail(null)
                }}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={commentsModalOpen} transparent animationType="slide" onRequestClose={() => setCommentsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdropFlex} activeOpacity={1} onPress={() => setCommentsModalOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Customer Comments</Text>
            <TextInput
              value={commentsDraft}
              onChangeText={setCommentsDraft}
              style={styles.modalInput}
              multiline
              placeholder="Customer comments..."
              placeholderTextColor={colors.gray}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCommentsModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveComments} disabled={savingComments} activeOpacity={0.88}>
                <LinearGradient
                  colors={[`${colors.primary}BB`, colors.primary, colors.accent || colors.primary]}
                  style={styles.modalSaveBtn}
                >
                  {savingComments ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(attachmentPreview)}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachmentPreview(null)}
      >
        <View style={styles.attachmentPreviewBackdrop}>
          <TouchableOpacity
            style={styles.attachmentPreviewClose}
            onPress={() => setAttachmentPreview(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="x" size={28} color={colors.white} />
          </TouchableOpacity>
          {attachmentPreview?.url ? (
            <>
              <Image
                source={{ uri: attachmentPreview.url }}
                style={styles.attachmentPreviewImage}
                resizeMode="contain"
              />
              {attachmentPreview?.name ? (
                <Text style={styles.attachmentPreviewCaption} numberOfLines={2}>
                  {attachmentPreview.name}
                </Text>
              ) : null}
            </>
          ) : null}
        </View>
      </Modal>
    </View>
  )
}
