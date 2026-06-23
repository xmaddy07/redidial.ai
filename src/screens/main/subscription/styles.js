import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../../theme/layout'
import { createSettingsScreenStyles, cardShadow } from '../shared/settingsScreenTheme'

export const getStyles = (colors, isDark = false, options = {}) =>
  StyleSheet.create({
    ...createSettingsScreenStyles(colors, isDark, options),
    planCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.primary}40`,
      overflow: 'hidden',
      marginBottom: hp(1.5),
      ...cardShadow(isDark),
    },
    popularBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(1.5),
      paddingVertical: hp(0.8),
      backgroundColor: isDark ? `${colors.primary}18` : `${colors.primary}10`,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: `${colors.primary}25`,
    },
    popularText: {
      color: colors.primary,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.3,
    },
    planBody: {
      padding: wp(4),
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2.5),
      marginBottom: hp(0.8),
    },
    planIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: `${colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    planTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.bold,
      fontSize: 17,
    },
    planDesc: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: hp(1.6),
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: wp(1),
      marginBottom: hp(1.6),
      paddingBottom: hp(1.6),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder || colors.border,
    },
    priceNum: {
      color: colors.primary,
      fontFamily: fonts.bold,
      fontSize: 32,
      lineHeight: 36,
    },
    priceUnit: {
      color: colors.gray,
      fontFamily: fonts.medium,
      fontSize: 14,
      marginBottom: hp(0.4),
    },
    features: {
      gap: hp(1),
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2.5),
    },
    featureCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: `${colors.success}18`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureText: {
      flex: 1,
      color: colors.appText || colors.text,
      fontFamily: fonts.regular,
      fontSize: 14,
    },
    planCardActive: {
      borderColor: `${colors.success}50`,
    },
    currentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(1.5),
      paddingVertical: hp(0.8),
      backgroundColor: isDark ? `${colors.success}18` : `${colors.success}10`,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: `${colors.success}25`,
    },
    currentBadgeText: {
      color: colors.success,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.3,
    },
    primaryBtnDisabled: {
      backgroundColor: colors.gray,
      opacity: 0.85,
    },
    cancelBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: hp(1.7),
      gap: 8,
      marginTop: hp(1),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.danger || '#DC2626'}35`,
      backgroundColor: isDark ? `${colors.danger || '#DC2626'}12` : `${colors.danger || '#DC2626'}08`,
    },
    cancelBtnText: {
      color: colors.danger || '#DC2626',
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    btnDisabled: {
      opacity: 0.65,
    },
  })

export default getStyles
