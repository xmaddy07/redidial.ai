import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../../theme/layout'
import { createSettingsScreenStyles, cardShadow } from '../shared/settingsScreenTheme'
import { normalizeStyleOptions } from '../../../theme/layout'

export const getStyles = (colors, isDark = false, options = {}) => {
  const { bottomInset = 0 } = normalizeStyleOptions(options)

  return StyleSheet.create({
    ...createSettingsScreenStyles(colors, isDark, options),
    scrollContent: {
      paddingHorizontal: wp(4),
      paddingTop: hp(1),
      paddingBottom: Math.max(hp(16), bottomInset + hp(14)),
    },

    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: hp(1.2),
      paddingHorizontal: wp(3),
      backgroundColor: isDark ? `${colors.warning || '#F59E0B'}14` : `${colors.warning || '#F59E0B'}10`,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.warning || '#F59E0B'}40`,
      marginBottom: hp(2),
    },
    warningBody: {
      flex: 1,
    },
    warningTitle: {
      color: colors.warning || '#D97706',
      fontFamily: fonts.semibold,
      fontSize: 13,
      marginBottom: 4,
    },
    warningText: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 17,
    },
    warningMeta: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
      marginTop: 4,
    },
    reauthBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      marginTop: hp(1.2),
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(0.9),
      borderRadius: 10,
      backgroundColor: colors.warning || '#F59E0B',
    },
    reauthBtnPressed: {
      opacity: 0.88,
    },
    reauthBtnText: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: 12,
    },
    readOnlyHint: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 17,
    },

    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      padding: wp(4),
      marginBottom: hp(1.5),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      ...cardShadow(isDark),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: hp(1.4),
    },
    serviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
    },
    serviceIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3),
      flexShrink: 0,
    },
    serviceInfo: {
      flex: 1,
      minWidth: 0,
    },
    serviceLabel: {
      color: colors.gray,
      fontSize: 10,
      fontFamily: fonts.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      marginBottom: 2,
    },
    serviceText: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 15,
      letterSpacing: 0.2,
    },
    serviceSubtext: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
      marginLeft: wp(2),
    },
    activeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: isDark ? `${colors.success}22` : `${colors.success}14`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.success}35`,
    },
    activeBadgeText: {
      color: colors.success,
      fontFamily: fonts.semibold,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    inactiveBadge: {
      paddingHorizontal: 10,
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

    metaChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: hp(1.6),
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.inputBg,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    metaChipText: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
    },

    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.surfaceBorder || colors.border,
      marginBottom: hp(1.4),
    },

    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    footerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      flexWrap: 'wrap',
    },
    footerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    footerPillPressed: {
      backgroundColor: isDark ? `${colors.primary}14` : `${colors.primary}08`,
    },
    footerPillDanger: {
      borderColor: `${colors.danger || '#EF4444'}35`,
      backgroundColor: isDark ? `${colors.danger || '#EF4444'}14` : `${colors.danger || '#EF4444'}10`,
    },
    footerPillText: {
      color: colors.appText || colors.text,
      fontFamily: fonts.medium,
      fontSize: 11,
    },
    footerPillTextDanger: {
      color: colors.danger || '#EF4444',
      fontFamily: fonts.medium,
      fontSize: 11,
    },
    facebookConnectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      backgroundColor: '#1877F2',
      borderRadius: 12,
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(4),
    },
    facebookConnectBtnPressed: {
      opacity: 0.88,
    },
    facebookConnectIcon: {
      marginRight: 8,
    },
    facebookConnectText: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: 14,
      letterSpacing: 0.2,
    },
    disconnectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      borderRadius: 12,
      paddingVertical: hp(1.4),
      paddingHorizontal: wp(4),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.danger || '#EF4444'}35`,
      backgroundColor: isDark ? `${colors.danger || '#EF4444'}14` : `${colors.danger || '#EF4444'}10`,
      gap: 6,
    },
    disconnectBtnPressed: {
      opacity: 0.88,
    },
    disconnectBtnText: {
      color: colors.danger || '#EF4444',
      fontFamily: fonts.semibold,
      fontSize: 13,
    },

    connectOptions: {
      gap: 10,
      marginTop: hp(0.5),
    },
    connectOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: hp(1),
      paddingHorizontal: wp(3),
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.inputBg,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    connectOptionRowPressed: {
      backgroundColor: isDark ? `${colors.primary}14` : `${colors.primary}08`,
    },
    connectOptionIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    connectOptionBody: {
      flex: 1,
      minWidth: 0,
    },
    connectOptionTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 13,
    },
    connectOptionDesc: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
      marginTop: 2,
    },

    stateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: hp(1),
    },
    stateText: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 13,
    },

    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      paddingVertical: hp(4),
      paddingHorizontal: wp(8),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      borderStyle: 'dashed',
      marginBottom: hp(2),
    },
    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.inputBg,
      marginBottom: hp(1.4),
    },
    emptyTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 15,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptyHint: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: hp(2),
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      height: hp(4.6),
      borderRadius: 12,
      gap: 6,
    },
    primaryBtnText: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.2,
    },
    btnDisabled: {
      opacity: 0.65,
    },
  })
}

export default getStyles
