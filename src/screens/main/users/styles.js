import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../../theme/layout'
import { createSettingsScreenStyles, cardShadow } from '../shared/settingsScreenTheme'

export const getStyles = (colors, isDark = false, options = {}) =>
  StyleSheet.create({
    ...createSettingsScreenStyles(colors, isDark, options),
    userCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      padding: wp(4),
      marginBottom: hp(1.2),
      ...cardShadow(isDark),
    },
    userCardBot: {
      borderColor: `${colors.primary}35`,
    },
    userCardInactive: {
      opacity: 0.72,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    inactiveBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    inactiveBadgeText: {
      color: colors.gray,
      fontFamily: fonts.semibold,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1),
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3),
    },
    avatarText: {
      color: colors.white,
      fontFamily: fonts.bold,
      fontSize: 12,
    },
    userInfo: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: wp(2),
      marginBottom: 4,
    },
    name: {
      flex: 1,
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 15,
    },
    typeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    typeBadgeBot: {
      backgroundColor: isDark ? `${colors.primary}22` : `${colors.primary}14`,
      borderColor: `${colors.primary}35`,
    },
    typeBadgeText: {
      color: colors.gray,
      fontFamily: fonts.semibold,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    typeBadgeTextBot: {
      color: colors.primary,
    },
    emailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    emailText: {
      flex: 1,
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
    },
    idRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: hp(1.2),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.surfaceBorder || colors.border,
    },
    idText: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2.5),
      marginTop: hp(1.2),
      paddingTop: hp(1.2),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.surfaceBorder || colors.border,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: hp(1.1),
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    actionBtnDanger: {
      backgroundColor: isDark ? `${colors.danger || '#EF4444'}14` : `${colors.danger || '#EF4444'}10`,
      borderColor: `${colors.danger || '#EF4444'}35`,
    },
    actionBtnTextPrimary: {
      color: colors.primary,
      fontFamily: fonts.semibold,
      fontSize: 12,
    },
    actionBtnTextDanger: {
      color: colors.danger || '#EF4444',
      fontFamily: fonts.semibold,
      fontSize: 12,
    },
  })

export default getStyles
