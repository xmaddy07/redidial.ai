import React, { useEffect, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { fonts } from '../../constant'
import { useTheme } from '../../hooks/useTheme'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../theme/layout'

export const CUSTOMER_STATUS_FILTERS = ['All', 'Active', 'Blocked']
export const LEAD_STATUS_FILTERS = ['All', 'Active', 'In Progress']
export const CHAT_STATUS_FILTERS = ['All', 'In Progress', 'Completed']

export default function CustomerFilterModal({
  visible,
  value,
  onClose,
  onApply,
  title = 'Filter Customers',
  options = CUSTOMER_STATUS_FILTERS,
}) {
  const { colors, themeMode } = useTheme()
  const styles = getStyles(colors, themeMode)
  const [selected, setSelected] = useState(value || 'All')

  useEffect(() => {
    if (visible) {
      setSelected(value || 'All')
    }
  }, [visible, value])

  const handleApply = () => {
    onApply?.(selected)
    onClose?.()
  }

  const handleReset = () => {
    setSelected('All')
    onApply?.('All')
    onClose?.()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Icon name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Status</Text>
          {options.map((option) => {
            const isSelected = selected === option
            return (
              <TouchableOpacity
                key={option}
                style={[styles.optionRow, isSelected && styles.optionRowActive]}
                onPress={() => setSelected(option)}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{option}</Text>
                {isSelected ? <Icon name="check" size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            )
          })}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.85}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const getStyles = (colors, themeMode = 'light') =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: wp(5),
      paddingBottom: hp(4),
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
        android: { elevation: 12 },
      }),
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: themeMode === 'light' ? '#D1D5DB' : colors.border,
      marginTop: hp(1.2),
      marginBottom: hp(1.5),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: hp(2),
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 17,
      color: colors.text,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionLabel: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      color: colors.gray,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: hp(1.6),
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: colors.inputBg,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    optionRowActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}12`,
    },
    optionText: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    optionTextActive: {
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: hp(2),
    },
    resetBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: hp(1.8),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBg,
    },
    resetText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.text,
    },
    applyBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: hp(1.8),
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyText: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: '#FFFFFF',
    },
  })
