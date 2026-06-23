import { StyleSheet, Platform } from 'react-native'
import { fonts } from '../../../constant'
import { wp, hp, normalizeStyleOptions, screenPadding, getContentMaxWidth } from '../../../theme/layout'
import { cardShadow } from '../../../theme/shadows'
import { createAuthAmbientStyles } from '../shared/authAnimations'

export const loginBrand = (colors) => ({
  primary: colors.primary,
  accent: colors.accent,
  orange: colors.orange,
  white: colors.white,
  gray: colors.gray,
  danger: colors.danger,
})

export const loginDarkUi = {
  cardBg: 'rgba(22, 27, 38, 0.94)',
  cardBorder: 'rgba(59, 130, 246, 0.18)',
  inputBg: 'rgba(12, 16, 24, 0.92)',
  inputBorder: 'rgba(249, 115, 22, 0.45)',
  label: '#CBD5E1',
  inputText: '#F8FAFC',
  placeholder: '#64748B',
}

export function getLoginStyles(options = {}) {
  const { isCompact = false, isWide = false } = normalizeStyleOptions(options)
  const padH = screenPadding(isWide, isCompact)
  const contentMaxWidth = getContentMaxWidth(isWide, 440)

  return StyleSheet.create({
    ...createAuthAmbientStyles(),
    background: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingHorizontal: padH,
      paddingTop: hp(4),
    },
    header: {
      alignItems: 'center',
      paddingTop: isCompact ? hp(4) : hp(6),
      zIndex: 2,
    },
    logo: {
      width: isCompact ? wp(38) : wp(42),
      height: hp(5.5),
    },
    logoGlow: {
      position: 'absolute',
      width: wp(50),
      height: hp(8),
      borderRadius: wp(25),
      opacity: 0.35,
      top: -hp(1),
    },
    content: {
      flex: 1,
      paddingTop: hp(3),
      paddingHorizontal: wp(4),
      zIndex: 2,
      width: '100%',
      maxWidth: contentMaxWidth,
      alignSelf: isWide ? 'center' : 'stretch',
    },
    titleBlock: {
      marginBottom: hp(2.5),
    },
    title: {
      color: '#FFFFFF',
      fontFamily: fonts.semibold,
      fontSize: isCompact ? wp(6.4) : wp(7.2),
      letterSpacing: -0.5,
    },
    subtitle: {
      color: '#9CA3AF',
      marginTop: hp(0.8),
      fontFamily: fonts.regular,
      fontSize: isCompact ? wp(3.2) : wp(3.6),
      lineHeight: wp(5.2),
    },
    accentLine: {
      width: wp(10),
      height: 3,
      borderRadius: 2,
      marginTop: hp(1.5),
    },
    formCard: {
      borderRadius: wp(4),
      borderWidth: 1,
      borderColor: loginDarkUi.cardBorder,
      backgroundColor: loginDarkUi.cardBg,
      paddingHorizontal: wp(4),
      paddingTop: hp(2),
      paddingBottom: hp(2.5),
      width: '100%',
      alignSelf: 'stretch',
      ...cardShadow(true, 'lift'),
    },
    cardShine: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      borderRadius: 1,
      opacity: 0.5,
    },
    errorText: {
      color: '#EF4444',
      alignSelf: 'flex-start',
      fontFamily: fonts.regular,
      fontSize: wp(3.2),
      marginTop: hp(0.5),
    },
    apiError: {
      color: '#EF4444',
      alignSelf: 'flex-start',
      fontFamily: fonts.regular,
      fontSize: wp(3.4),
      marginTop: hp(1.5),
      marginBottom: hp(0.5),
      paddingHorizontal: wp(3),
      paddingVertical: hp(1),
      borderRadius: wp(2),
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.28)',
      overflow: 'hidden',
    },
    buttonWrap: {
      marginTop: hp(2),
      width: '100%',
      alignSelf: 'stretch',
    },
    formFields: {
      width: '100%',
      alignSelf: 'stretch',
      alignItems: 'stretch',
    },
    rememberRow: {
      marginTop: hp(1.5),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      alignSelf: 'stretch',
    },
    rememberTouchable: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkboxOuter: {
      width: wp(4.8),
      height: wp(4.8),
      borderRadius: wp(1.2),
      borderWidth: 1.5,
      borderColor: loginDarkUi.inputBorder,
      backgroundColor: loginDarkUi.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(2.5),
    },
    checkboxOuterChecked: {
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
    },
    checkboxInner: {
      width: wp(2.4),
      height: wp(2.4),
      borderRadius: wp(0.6),
      backgroundColor: '#FFFFFF',
    },
    rememberText: {
      color: '#FFFFFF',
      fontFamily: fonts.regular,
      fontSize: wp(3.4),
    },
    forgotLink: {
      color: '#3B82F6',
      fontFamily: fonts.medium,
      fontSize: wp(3.2),
    },
    scrollGrow: {
      flexGrow: 1,
      width: '100%',
      alignItems: 'stretch',
    },
    keyboardView: {
      flex: 1,
    },
    loadingCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
}

export default getLoginStyles
