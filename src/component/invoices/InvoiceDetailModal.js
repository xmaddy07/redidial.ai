import React, { useMemo } from 'react'
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Pressable, Linking, Platform } from 'react-native'
import { Alert } from '../../utils/alert'
import Icon from 'react-native-vector-icons/Feather'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts } from '../../constant'
import { useTheme } from '../../hooks/useTheme'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../theme/layout'

function DetailRow({ label, value, styles }) {
  if (!value) return null
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

export default function InvoiceDetailModal({ visible, invoice, onClose, onDownload }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => getStyles(colors, insets.bottom), [colors, insets.bottom])

  if (!invoice) return null

  const raw = invoice.raw || {}
  const lineItems = invoice.lineItems || []
  const isPaid = invoice.statusKey === 'paid'

  const handleDownload = async () => {
    if (onDownload) {
      onDownload(invoice)
      return
    }

    const pdfUrl = invoice.invoicePdf || raw.invoice_pdf
    const hostedUrl = invoice.hostedInvoiceUrl || raw.hosted_invoice_url
    const url = pdfUrl || hostedUrl

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

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Icon name="x" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Invoice #{invoice.invoiceNumber}</Text>
            <View style={{ width: 20 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${invoice.statusColor}18`, borderColor: `${invoice.statusColor}35` },
                ]}
              >
                <Text style={[styles.statusText, { color: invoice.statusColor }]}>
                  {invoice.status}
                </Text>
              </View>
              <Text style={styles.amountLarge}>{invoice.amountDisplay}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>From</Text>
              <Text style={styles.sectionBody}>{invoice.fromName || 'Redidial'}</Text>
              {!!invoice.fromEmail && <Text style={styles.sectionMuted}>{invoice.fromEmail}</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bill To</Text>
              <Text style={styles.sectionBody}>{invoice.customer}</Text>
              {!!invoice.customerEmail && (
                <Text style={styles.sectionMuted}>{invoice.customerEmail}</Text>
              )}
              {!!invoice.billToAddress && (
                <Text style={styles.sectionMuted}>{invoice.billToAddress}</Text>
              )}
            </View>

            <View style={styles.metaGrid}>
              <DetailRow label="Invoice date" value={invoice.date} styles={styles} />
              <DetailRow label="Due date" value={invoice.dueDate} styles={styles} />
              <DetailRow label="Invoice ID" value={invoice.id} styles={styles} />
            </View>

            {lineItems.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items</Text>
                {lineItems.map((item, index) => (
                  <View key={`${item.description}-${index}`} style={styles.lineItem}>
                    <View style={styles.lineItemTop}>
                      <Text style={styles.lineItemDesc}>{item.description}</Text>
                      <Text style={styles.lineItemAmount}>{item.amountDisplay}</Text>
                    </View>
                    {item.quantity != null ? (
                      <Text style={styles.lineItemMeta}>Qty: {item.quantity}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{invoice.subtotalDisplay || invoice.amountDisplay}</Text>
              </View>
              {invoice.taxDisplay ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax</Text>
                  <Text style={styles.totalValue}>{invoice.taxDisplay}</Text>
                </View>
              ) : null}
              <View style={[styles.totalRow, styles.totalRowFinal]}>
                <Text style={styles.totalLabelFinal}>Total</Text>
                <Text style={styles.totalValueFinal}>{invoice.amountDisplay}</Text>
              </View>
            </View>

            {isPaid && (invoice.paymentMethod || invoice.paidAt) ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment</Text>
                {!!invoice.paidAt && <DetailRow label="Paid on" value={invoice.paidAt} styles={styles} />}
                {!!invoice.paymentMethod && (
                  <DetailRow label="Method" value={invoice.paymentMethod} styles={styles} />
                )}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => Alert.alert('Send invoice', 'Sending invoices is not available in the mobile app yet.')}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Icon name="send" size={16} color={colors.appText || colors.text} />
              <Text style={styles.secondaryBtnText}>Send Invoice</Text>
            </Pressable>

            <Pressable
              onPress={handleDownload}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Icon name="download" size={16} color={colors.white} />
              <Text style={styles.primaryBtnText}>Download PDF</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function getStyles(colors, bottomInset) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      maxHeight: '92%',
      backgroundColor: colors.cardBg || colors.dark,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Math.max(hp(2), bottomInset + hp(1)),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp(4),
      paddingTop: hp(2),
      paddingBottom: hp(1.2),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder || colors.border,
    },
    title: {
      color: colors.appText || colors.text,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
    content: {
      paddingHorizontal: wp(4),
      paddingTop: hp(1.5),
      paddingBottom: hp(2),
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: hp(2),
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
    },
    statusText: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    amountLarge: {
      color: colors.appText || colors.text,
      fontFamily: fonts.bold,
      fontSize: 22,
    },
    section: {
      marginBottom: hp(1.8),
    },
    sectionTitle: {
      color: colors.gray,
      fontFamily: fonts.semibold,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: hp(0.6),
    },
    sectionBody: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    sectionMuted: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18,
    },
    metaGrid: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: wp(3.5),
      marginBottom: hp(1.8),
      gap: hp(0.8),
    },
    detailRow: {
      gap: 2,
    },
    detailLabel: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
    },
    detailValue: {
      color: colors.appText || colors.text,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    lineItem: {
      paddingVertical: hp(1),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder || colors.border,
    },
    lineItemTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    lineItemDesc: {
      flex: 1,
      color: colors.appText || colors.text,
      fontFamily: fonts.regular,
      fontSize: 13,
    },
    lineItemAmount: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 13,
    },
    lineItemMeta: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
      marginTop: 4,
    },
    totalsBox: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: wp(3.5),
      marginBottom: hp(1.5),
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: hp(0.6),
    },
    totalRowFinal: {
      marginTop: hp(0.4),
      paddingTop: hp(0.8),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.surfaceBorder || colors.border,
      marginBottom: 0,
    },
    totalLabel: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 13,
    },
    totalValue: {
      color: colors.appText || colors.text,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    totalLabelFinal: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    totalValueFinal: {
      color: colors.primary,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
    footer: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: wp(4),
      paddingTop: hp(1.2),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.surfaceBorder || colors.border,
    },
    primaryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: hp(1.5),
      gap: 8,
    },
    primaryBtnText: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: 13,
    },
    secondaryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: hp(1.5),
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.inputBg,
    },
    secondaryBtnText: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 13,
    },
  })
}
