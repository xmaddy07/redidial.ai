import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../../theme/layout'
import { createSettingsScreenStyles } from '../shared/settingsScreenTheme'

export const getStyles = (colors, isDark = false, options = {}) =>
  StyleSheet.create({
    ...createSettingsScreenStyles(colors, isDark, options),
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
      paddingVertical: hp(0.6),
    },
    featureIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${colors.primary}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTextWrap: {
      flex: 1,
    },
    featureTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
      marginBottom: 2,
    },
    featureDesc: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 17,
    },
    enabledBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2.5),
      padding: wp(3.5),
      borderRadius: 12,
      backgroundColor: isDark ? `${colors.success}12` : `${colors.success}10`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.success}30`,
      marginBottom: hp(2),
    },
    enabledBannerText: {
      flex: 1,
      color: colors.success,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    reenableBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2.5),
      padding: wp(3.5),
      borderRadius: 12,
      backgroundColor: isDark ? `${colors.primary}12` : `${colors.primary}08`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.primary}30`,
      marginBottom: hp(2),
    },
    reenableBannerText: {
      flex: 1,
      color: colors.primary,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    actionGroup: {
      gap: 10,
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: hp(1.7),
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      backgroundColor: colors.cardBg,
    },
    secondaryBtnText: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    dangerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: hp(1.7),
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.danger || '#DC2626'}35`,
      backgroundColor: isDark ? `${colors.danger || '#DC2626'}12` : `${colors.danger || '#DC2626'}08`,
    },
    dangerBtnText: {
      color: colors.danger || '#DC2626',
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    btnDisabled: {
      opacity: 0.65,
    },
    successBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.success,
      borderRadius: 12,
      paddingVertical: hp(1.7),
      gap: 8,
    },
    successBtnText: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
  })

export default getStyles
