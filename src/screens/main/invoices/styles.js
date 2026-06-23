import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../../theme/layout'
import { createSettingsScreenStyles } from '../shared/settingsScreenTheme'

export const getStyles = (colors, isDark = false, options = {}) =>
  StyleSheet.create({
    ...createSettingsScreenStyles(colors, isDark, options),

    toolbar: {
      marginBottom: hp(1.8),
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      paddingHorizontal: wp(3.5),
      height: hp(5.2),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.appText || colors.text,
      fontFamily: fonts.regular,
      fontSize: 14,
      marginLeft: wp(2),
      paddingVertical: 0,
    },

    filterChips: {
      flexDirection: 'row',
      gap: 8,
      paddingBottom: hp(1.5),
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    filterChipActive: {
      backgroundColor: isDark ? `${colors.primary}28` : `${colors.primary}14`,
      borderColor: `${colors.primary}40`,
    },
    filterChipText: {
      color: colors.gray,
      fontFamily: fonts.medium,
      fontSize: 12,
      letterSpacing: 0.2,
    },
    filterChipTextActive: {
      color: colors.primary,
      fontFamily: fonts.semibold,
    },

    actionRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: hp(1.5),
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      paddingVertical: hp(1.3),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    actionBtnText: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 12,
    },

    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: hp(0.8),
      paddingHorizontal: wp(0.5),
    },
    selectAllRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    selectAllText: {
      color: colors.appText || colors.text,
      fontFamily: fonts.medium,
      fontSize: 12,
    },
    resultCount: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
    },

    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(2),
      backgroundColor: colors.cardBg,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    invoiceList: {
      gap: 10,
    },
    invoiceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      paddingVertical: hp(1.6),
      paddingHorizontal: wp(3.5),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    invoiceCardSelected: {
      borderColor: `${colors.primary}50`,
      backgroundColor: isDark ? `${colors.primary}10` : `${colors.primary}06`,
    },
    invoiceCardPressed: {
      opacity: 0.92,
    },
    clientAvatar: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(2.5),
    },
    clientInitials: {
      fontFamily: fonts.bold,
      fontSize: 13,
      letterSpacing: 0.5,
    },
    invoiceBody: {
      flex: 1,
      marginRight: wp(2),
    },
    invoiceTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
      flexWrap: 'wrap',
    },
    invoiceNumber: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 13,
      letterSpacing: 0.1,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
    },
    statusBadgeText: {
      fontSize: 10,
      fontFamily: fonts.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    invoiceClient: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      marginBottom: 2,
    },
    invoiceDate: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
    },
    invoiceRight: {
      alignItems: 'flex-end',
      gap: 6,
    },
    invoiceAmount: {
      color: colors.appText || colors.text,
      fontFamily: fonts.bold,
      fontSize: 14,
      letterSpacing: 0.2,
    },
    chevronWrap: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.inputBg,
    },

    pagination: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginTop: hp(2),
      marginBottom: hp(1),
    },
    pageBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    pageBtnDisabled: {
      opacity: 0.45,
    },
    pageLabel: {
      color: colors.appText || colors.text,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
  })

export default getStyles
