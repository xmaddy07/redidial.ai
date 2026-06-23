import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../../theme/layout'
import { createSettingsScreenStyles, cardShadow } from '../shared/settingsScreenTheme'

export const getStyles = (colors, isDark = false, options = {}) =>
  StyleSheet.create({
    ...createSettingsScreenStyles(colors, isDark, options),
    selectAllCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.5),
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1.2),
      ...cardShadow(isDark),
    },
    selectAllCardPressed: {
      backgroundColor: isDark ? `${colors.primary}14` : `${colors.primary}08`,
    },
    selectAllTextWrap: {
      flex: 1,
      marginLeft: wp(3),
    },
    selectAllTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 15,
    },
    selectAllHint: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      marginTop: 2,
    },
    usersStack: {
      gap: hp(1.2),
      marginBottom: hp(2),
    },
    userCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.4),
      flexDirection: 'row',
      alignItems: 'center',
      ...cardShadow(isDark),
    },
    userCardSelected: {
      borderColor: `${colors.primary}55`,
      backgroundColor: isDark ? `${colors.primary}0C` : `${colors.primary}0`,
    },
    userCardPressed: {
      opacity: 0.92,
    },
    checkboxOuter: {
      width: 22,
      height: 22,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBg,
    },
    checkboxOuterChecked: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: wp(3),
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
    userName: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
      marginBottom: 4,
    },
    emailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    userEmail: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      flex: 1,
    },
    primaryBtnDisabled: {
      opacity: 0.55,
    },
  })

export default getStyles
