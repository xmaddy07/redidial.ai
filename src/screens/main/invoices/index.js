import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, Linking, Platform, ToastAndroid, ActivityIndicator } from 'react-native'
import { Alert } from '../../../utils/alert'
import { useFocusEffect } from '@react-navigation/native'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/Feather'
import moment from 'moment'
import SettingHeader from '../../../component/settingHeader'
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero'
import LoadingView from '../../../component/LoadingView'
import InvoiceDetailModal from '../../../component/invoices/InvoiceDetailModal'
import getStyles from './styles'
import { useTheme } from '../../../hooks/useTheme'
import { getStripeUserInvoices, getStripeUserInvoicesByEmail } from '../../../api'

const PAGE_SIZE = 10

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'free', label: 'Free' },
]

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

function toAmount(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.abs(numeric) >= 100 && Number.isInteger(numeric) ? numeric / 100 : numeric
}

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || 'USD').toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

function formatTimestamp(value) {
  if (value == null || value === '') return null
  const parsed =
    typeof value === 'number'
      ? moment.unix(value > 1e12 ? value / 1000 : value)
      : moment(value)
  return parsed.isValid() ? parsed.format('MMM D, YYYY') : null
}

function formatAddress(address) {
  if (!address) return null
  if (typeof address === 'string') return address
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(', '),
    address.country,
  ].filter(Boolean)
  return parts.join('\n') || null
}

function normalizeLineItems(raw) {
  const lines =
    raw?.lines?.data ||
    raw?.line_items ||
    raw?.items ||
    (Array.isArray(raw?.lines) ? raw.lines : [])

  if (!Array.isArray(lines)) return []

  return lines.map((line) => {
    const amount = toAmount(line.amount ?? line.price?.unit_amount ?? line.unit_amount ?? 0)
    const currency = line.currency || raw.currency || 'USD'
    return {
      description: line.description || line.plan?.nickname || line.price?.nickname || 'Item',
      quantity: line.quantity ?? null,
      amount,
      amountDisplay: formatCurrency(amount, currency),
    }
  })
}

function resolveStatusKey(raw, amount) {
  if (amount === 0) return 'free'

  const status = String(raw?.status || raw?.invoice_status || '').toLowerCase()
  const dueUnix = raw?.due_date ?? raw?.dueDate
  const dueMoment =
    dueUnix != null
      ? moment.unix(typeof dueUnix === 'number' && dueUnix > 1e12 ? dueUnix / 1000 : dueUnix)
      : null

  if (status === 'paid') return 'paid'
  if (status === 'open' && dueMoment?.isValid() && dueMoment.isBefore(moment(), 'day')) {
    return 'overdue'
  }
  if (status === 'open' || status === 'draft' || status === 'uncollectible') return 'pending'
  if (amount > 0 && status !== 'paid' && status !== 'void') return 'pending'
  return 'pending'
}

function statusLabel(statusKey) {
  const labels = {
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
    free: 'Free',
  }
  return labels[statusKey] || 'Pending'
}

function statusColor(statusKey, colors) {
  if (statusKey === 'paid') return colors.success
  if (statusKey === 'overdue') return colors.danger || '#DC2626'
  if (statusKey === 'free') return colors.primary
  return colors.orange || colors.warning || '#F59E0B'
}

function normalizeInvoice(raw) {
  const currency = raw?.currency || 'USD'
  const total = toAmount(raw?.total ?? raw?.amount_due ?? raw?.amount_paid ?? raw?.total_amount ?? 0)
  const subtotal = toAmount(raw?.subtotal ?? raw?.subtotal_excluding_tax ?? total)
  const tax = toAmount(raw?.tax ?? raw?.total_tax_amounts?.[0]?.amount ?? 0)
  const statusKey = resolveStatusKey(raw, total)
  const customer =
    raw?.customer_name ||
    raw?.customerName ||
    raw?.customer_email ||
    raw?.customerEmail ||
    raw?.customer?.name ||
    raw?.customer?.email ||
    '—'

  const paidAtUnix = raw?.status_transitions?.paid_at ?? raw?.paid_at
  const paymentMethod =
    raw?.charge?.payment_method_details?.card?.brand &&
    raw?.charge?.payment_method_details?.card?.last4
      ? `${raw.charge.payment_method_details.card.brand.toUpperCase()} •••• ${raw.charge.payment_method_details.card.last4}`
      : raw?.payment_method || null

  return {
    id: String(raw?.id || raw?.invoice_id || raw?.invoiceId || Math.random()),
    invoiceNumber: raw?.number || raw?.invoice_number || raw?.invoiceNumber || raw?.id || '—',
    customer,
    customerEmail:
      raw?.customer_email || raw?.customerEmail || raw?.customer?.email || null,
    date: formatTimestamp(raw?.created ?? raw?.invoice_date ?? raw?.date) || '—',
    dueDate: formatTimestamp(raw?.due_date ?? raw?.dueDate) || '—',
    amount: total,
    amountDisplay: formatCurrency(total, currency),
    subtotalDisplay: formatCurrency(subtotal, currency),
    taxDisplay: tax > 0 ? formatCurrency(tax, currency) : null,
    status: statusLabel(statusKey),
    statusKey,
    statusColor: null,
    initials: customer
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    invoicePdf: raw?.invoice_pdf || raw?.invoicePdf || null,
    hostedInvoiceUrl: raw?.hosted_invoice_url || raw?.hostedInvoiceUrl || null,
    fromName: raw?.account_name || raw?.from?.name || 'Redidial',
    fromEmail: raw?.account_email || raw?.from?.email || null,
    billToAddress: formatAddress(raw?.customer_address || raw?.customer?.address),
    lineItems: normalizeLineItems(raw),
    paidAt: paidAtUnix ? formatTimestamp(paidAtUnix) : null,
    paymentMethod,
    raw,
  }
}

function normalizeInvoices(payload) {
  const root = unwrapPayload(payload)
  const list =
    root?.invoices ||
    root?.data?.invoices ||
    (Array.isArray(root?.data) ? root.data : null) ||
    (Array.isArray(root) ? root : [])

  if (!Array.isArray(list)) return []
  return list.map(normalizeInvoice).sort((a, b) => {
    const aTime = moment(a.date, 'MMM D, YYYY').valueOf()
    const bTime = moment(b.date, 'MMM D, YYYY').valueOf()
    return bTime - aTime
  })
}

function resolveUserEmail(user) {
  return (user?.email || user?.contactEmail || '').trim()
}

function resolveUserId(user) {
  return user?.id ?? user?.userId ?? user?.user_id ?? null
}

function getClientInitials(client) {
  return String(client || '—')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Checkbox({ checked, onPress, styles, colors }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[styles.checkbox, checked && styles.checkboxChecked]}
    >
      {checked ? <Icon name="check" size={12} color={colors.white} /> : null}
    </Pressable>
  )
}

function InvoiceRow({
  invoice,
  styles,
  colors,
  isDark,
  selected,
  onToggleSelect,
  onPress,
}) {
  const badgeColor = invoice.statusColor || statusColor(invoice.statusKey, colors)

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.invoiceCard,
        selected && styles.invoiceCardSelected,
        pressed && styles.invoiceCardPressed,
      ]}
    >
      <Checkbox
        checked={selected}
        onPress={onToggleSelect}
        styles={styles}
        colors={colors}
      />

      <View
        style={[
          styles.clientAvatar,
          {
            backgroundColor: isDark ? `${colors.primary}40` : `${colors.primary}20`,
          },
        ]}
      >
        <Text style={[styles.clientInitials, { color: colors.primary }]}>
          {invoice.initials || getClientInitials(invoice.customer)}
        </Text>
      </View>

      <View style={styles.invoiceBody}>
        <View style={styles.invoiceTopRow}>
          <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${badgeColor}18`,
                borderColor: `${badgeColor}35`,
              },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
              {invoice.status}
            </Text>
          </View>
        </View>
        <Text style={styles.invoiceClient} numberOfLines={1}>
          {invoice.customer}
        </Text>
        <Text style={styles.invoiceDate}>
          {invoice.date}
          {invoice.dueDate && invoice.dueDate !== '—' ? ` · Due ${invoice.dueDate}` : ''}
        </Text>
      </View>

      <View style={styles.invoiceRight}>
        <Text style={styles.invoiceAmount}>{invoice.amountDisplay}</Text>
        <View style={styles.chevronWrap}>
          <Icon name="chevron-right" size={16} color={colors.gray} />
        </View>
      </View>
    </Pressable>
  )
}

export default function Invoices({ navigation }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])

  const token = useSelector((state) => state.auth.token)
  const user = useSelector((state) => state.auth.user)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [detailInvoice, setDetailInvoice] = useState(null)

  const loadInvoices = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) return

      if (!silent) setLoading(true)
      else setRefreshing(true)

      try {
        const userId = resolveUserId(user)
        const email = resolveUserEmail(user)
        let response = null

        if (userId != null) {
          try {
            response = await getStripeUserInvoices({ token, userId })
          } catch (error) {
            console.warn('Invoices by user:', error?.message || error)
          }
        }

        let list = normalizeInvoices(response)
        if (!list.length && email) {
          try {
            const byEmail = await getStripeUserInvoicesByEmail({ token, email })
            list = normalizeInvoices(byEmail)
          } catch (error) {
            console.warn('Invoices by email:', error?.message || error)
          }
        }

        setInvoices(
          list.map((invoice) => ({
            ...invoice,
            statusColor: statusColor(invoice.statusKey, colors),
          })),
        )
        setSelectedIds(new Set())
        setPage(1)
      } catch (error) {
        console.error('Failed to load invoices:', error?.message || error)
        Alert.alert('Load failed', error?.message || 'Could not load invoices.')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [token, user, colors],
  )

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  useFocusEffect(
    useCallback(() => {
      loadInvoices({ silent: true })
    }, [loadInvoices]),
  )

  useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
  }, [searchQuery, filter])

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return invoices.filter((invoice) => {
      const matchesFilter = filter === 'all' || invoice.statusKey === filter
      const matchesSearch =
        !q ||
        String(invoice.invoiceNumber).toLowerCase().includes(q) ||
        String(invoice.customer).toLowerCase().includes(q) ||
        String(invoice.id).toLowerCase().includes(q) ||
        invoice.amountDisplay.toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [invoices, searchQuery, filter])

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE))

  const pageInvoices = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredInvoices.slice(start, start + PAGE_SIZE)
  }, [filteredInvoices, page])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const summary = useMemo(() => {
    const total = invoices.length
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const paidAmount = invoices
      .filter((invoice) => invoice.statusKey === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0)

    return {
      total,
      totalAmountDisplay: formatCurrency(totalAmount),
      paidAmountDisplay: formatCurrency(paidAmount),
    }
  }, [invoices])

  const allPageSelected =
    pageInvoices.length > 0 && pageInvoices.every((invoice) => selectedIds.has(invoice.id))

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageInvoices.forEach((invoice) => next.delete(invoice.id))
      } else {
        pageInvoices.forEach((invoice) => next.add(invoice.id))
      }
      return next
    })
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDownload = async (invoice) => {
    const url = invoice.invoicePdf || invoice.hostedInvoiceUrl
    if (!url) {
      Alert.alert('Download unavailable', 'No PDF or hosted invoice URL is available for this invoice.')
      return
    }

    try {
      const supported = await Linking.canOpenURL(url)
      if (!supported) {
        Alert.alert('Cannot open invoice', 'No application can handle this invoice URL.')
        return
      }
      await Linking.openURL(url)
    } catch (error) {
      Alert.alert('Download failed', error?.message || 'Could not open the invoice.')
    }
  }

  const handleBulkActions = () => {
    if (selectedIds.size === 0) {
      showToast('Invoices', 'Select at least one invoice first.')
      return
    }
    Alert.alert('Bulk actions', 'Bulk actions are not available in the mobile app yet.')
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <SettingHeader navigation={navigation} title="Invoices" />
        <LoadingView text="Loading invoices..." flex />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title="Invoices" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHero
          colors={colors}
          isDark={isDark}
          styles={styles}
          icon="file-text"
          title="Billing & Receipts"
          subtitle="Track payments, review invoice history, and stay on top of outstanding balances."
        />

        <SettingsStatPills
          styles={styles}
          items={[
            { value: summary.total, label: 'Total invoices' },
            { value: summary.totalAmountDisplay, label: 'Total amount' },
            { value: summary.paidAmountDisplay, label: 'Paid amount' },
          ]}
        />

        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color={colors.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by invoice ID or customer..."
              placeholderTextColor={colors.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Icon name="x" size={16} color={colors.gray} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {FILTERS.map((item) => {
            const active = filter === item.key
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={styles.actionRow}>
          <Pressable
            onPress={handleBulkActions}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9 }]}
          >
            <Icon name="layers" size={15} color={colors.appText || colors.text} />
            <Text style={styles.actionBtnText}>
              Bulk Actions{selectedIds.size ? ` (${selectedIds.size})` : ''}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Alert.alert('Send invoice', 'Sending invoices is not available in the mobile app yet.')
            }
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9 }]}
          >
            <Icon name="send" size={15} color={colors.appText || colors.text} />
            <Text style={styles.actionBtnText}>Send Invoice</Text>
          </Pressable>
        </View>

        <View style={styles.listHeader}>
          <Pressable onPress={toggleSelectAllPage} style={styles.selectAllRow}>
            <Checkbox
              checked={allPageSelected}
              onPress={toggleSelectAllPage}
              styles={styles}
              colors={colors}
            />
            <Text style={styles.selectAllText}>
              Select all on page ({pageInvoices.length})
            </Text>
          </Pressable>
          <Text style={styles.resultCount}>
            {filteredInvoices.length} result{filteredInvoices.length === 1 ? '' : 's'}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>
          {filteredInvoices.length === 1 ? 'Invoice' : 'Invoices'}
        </Text>

        {filteredInvoices.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="inbox" size={24} color={colors.gray} />
            </View>
            <Text style={styles.emptyTitle}>No invoices found</Text>
            <Text style={styles.emptyHint}>
              Try adjusting your search or filter to find what you are looking for.
            </Text>
          </View>
        ) : (
          <View style={styles.invoiceList}>
            {pageInvoices.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                styles={styles}
                colors={colors}
                isDark={isDark}
                selected={selectedIds.has(invoice.id)}
                onToggleSelect={() => toggleSelect(invoice.id)}
                onPress={() => setDetailInvoice(invoice)}
              />
            ))}
          </View>
        )}

        {filteredInvoices.length > PAGE_SIZE ? (
          <View style={styles.pagination}>
            <Pressable
              onPress={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              style={({ pressed }) => [
                styles.pageBtn,
                page <= 1 && styles.pageBtnDisabled,
                pressed && page > 1 && { opacity: 0.9 },
              ]}
            >
              <Icon name="chevron-left" size={18} color={colors.appText || colors.text} />
            </Pressable>

            <Text style={styles.pageLabel}>
              Page {page} of {totalPages}
            </Text>

            <Pressable
              onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              style={({ pressed }) => [
                styles.pageBtn,
                page >= totalPages && styles.pageBtnDisabled,
                pressed && page < totalPages && { opacity: 0.9 },
              ]}
            >
              <Icon name="chevron-right" size={18} color={colors.appText || colors.text} />
            </Pressable>
          </View>
        ) : null}

        {refreshing ? (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.stateText}>Refreshing invoices...</Text>
          </View>
        ) : null}
      </ScrollView>

      <InvoiceDetailModal
        visible={!!detailInvoice}
        invoice={detailInvoice}
        onClose={() => setDetailInvoice(null)}
        onDownload={handleDownload}
      />
    </View>
  )
}
