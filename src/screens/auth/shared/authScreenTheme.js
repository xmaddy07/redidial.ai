import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import {
  wp,
  hp,
  screenPadding,
  normalizeStyleOptions,
  getContentMaxWidth,
} from '../../../theme/layout'
import { createAuthAmbientStyles } from './authAnimations'

export function createAuthScreenStyles(colors, options = {}) {
  const { isCompact = false, isWide = false } = normalizeStyleOptions(options)
  const padH = screenPadding(isWide, isCompact)
  const contentMaxWidth = getContentMaxWidth(isWide, 420)

  return {
    ...createAuthAmbientStyles(),
    background: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingHorizontal: padH,
      paddingTop: hp(4),
    },
    content: {
      flex: 1,
      paddingTop: isCompact ? hp(3) : hp(5),
      width: '100%',
      maxWidth: contentMaxWidth,
      alignSelf: isWide ? 'center' : 'stretch',
    },
    header: {
      alignItems: 'center',
      paddingTop: isCompact ? hp(6) : hp(8),
    },
    logo: {
      width: isCompact ? wp(36) : wp(40),
      height: hp(5),
    },
    title: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: isCompact ? wp(6.2) : wp(7),
    },
    subtitle: {
      color: colors.gray,
      marginTop: hp(1),
      fontFamily: fonts.regular,
      fontSize: isCompact ? wp(3.4) : wp(3.8),
    },
    fieldGroup: {
      marginTop: hp(2.2),
    },
    label: {
      color: colors.white,
      fontFamily: fonts.medium,
      marginBottom: hp(1),
    },
    required: {
      color: colors.primary,
    },
    input: {
      height: isCompact ? hp(6) : hp(6.5),
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: wp(2),
      paddingHorizontal: wp(4),
      color: colors.white,
      fontFamily: fonts.regular,
      backgroundColor: 'transparent',
    },
    rowBetween: {
      marginTop: hp(1.5),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    remember: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rememberText: {
      color: colors.white,
      fontFamily: fonts.regular,
      fontSize: 12,
    },
    link: {
      color: colors.primary,
      fontFamily: fonts.medium,
      fontSize: 12,
    },
    footerText: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 14,
    },
    scrollGrow: {
      flexGrow: 1,
    },
    keyboardView: {
      flex: 1,
    },
    errorText: {
      color: colors.danger,
      alignSelf: 'flex-start',
      fontFamily: fonts.regular,
      fontSize: wp(3.2),
      marginTop: hp(0.5),
    },
    footerCenter: {
      alignItems: 'center',
      marginTop: hp(2.5),
    },
    signInLink: {
      color: colors.primary,
      fontFamily: fonts.medium,
    },
    otpWrap: {
      marginTop: hp(2),
    },
    apiError: {
      color: colors.danger,
      alignSelf: 'flex-start',
      fontFamily: fonts.regular,
      fontSize: wp(3.4),
      marginTop: hp(1.5),
      marginBottom: hp(0.5),
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
      borderRadius: wp(2),
      backgroundColor: `${colors.danger}1F`,
      borderWidth: 1,
      borderColor: `${colors.danger}47`,
      overflow: 'hidden',
    },
    buttonWrap: {
      marginTop: hp(2),
      width: '100%',
      alignSelf: 'stretch',
    },
  }
}

export function getAuthStyles(colors, options = {}) {
  return StyleSheet.create(createAuthScreenStyles(colors, options))
}
