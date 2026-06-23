import { StyleSheet, Platform } from 'react-native'
import { fonts } from '../../../constant'
import { wp, hp, getProfileLayout, getContentMaxWidth } from '../../../theme/layout'
import { cardShadow } from '../../../theme/shadows'

export { getProfileLayout }

export const getStyles = (colors, isDark = false, options = {}) => {
  const {
    isCompact = false,
    isNarrow = false,
    isWide = false,
    bottomInset = 0,
  } = options

  const avatarInner = isCompact ? wp(14) : isWide ? wp(10) : wp(17)
  const avatarBorder = avatarInner + (isCompact ? 6 : 8)
  const iconBoxSize = isCompact ? wp(9.5) : wp(10.5)
  const iconRadius = isCompact ? wp(2.8) : wp(3)
  const cardRadius = isWide ? wp(4) : wp(5)
  const contentMaxWidth = isWide ? Math.min(wp(85), 520) : undefined

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.appBg || colors.dark,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: isWide ? wp(6) : wp(4),
      paddingTop: hp(1.5),
      paddingBottom: Math.max(hp(4), bottomInset + hp(2)),
      alignItems: isWide ? 'center' : 'stretch',
    },
    contentInner: {
      width: '100%',
      maxWidth: contentMaxWidth,
    },

    mainCard: {
      borderRadius: cardRadius,
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      width: '100%',
      ...cardShadow(isDark),
    },

    profileHero: {
      paddingHorizontal: isWide ? wp(6) : wp(5),
      paddingTop: isCompact ? hp(2) : hp(2.6),
      paddingBottom: isCompact ? hp(1.6) : hp(2),
      alignItems: 'center',
      borderTopLeftRadius: cardRadius,
      borderTopRightRadius: cardRadius,
      overflow: 'hidden',
    },
    avatarBorder: {
      width: avatarBorder,
      height: avatarBorder,
      borderRadius: avatarBorder / 2,
      borderWidth: isCompact ? 2 : 2.5,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isCompact ? hp(1) : hp(1.4),
      backgroundColor: colors.cardBg,
    },
    avatar: {
      width: avatarInner,
      height: avatarInner,
      borderRadius: avatarInner / 2,
      backgroundColor: colors.inputBg,
    },
    nameText: {
      color: colors.appText || colors.text,
      fontFamily: fonts.bold,
      fontSize: isCompact ? wp(4.2) : isWide ? wp(3.6) : wp(4.5),
      letterSpacing: 0.2,
      textAlign: 'center',
      paddingHorizontal: wp(2),
    },
    emailText: {
      color: colors.gray,
      fontSize: isCompact ? wp(3.1) : wp(3.3),
      fontFamily: fonts.regular,
      marginTop: hp(0.5),
      textAlign: 'center',
      paddingHorizontal: wp(4),
    },
    editSection: {
      paddingHorizontal: isWide ? wp(6) : wp(5),
      paddingTop: isCompact ? hp(1.2) : hp(1.6),
      paddingBottom: isCompact ? hp(1.6) : hp(2),
      backgroundColor: colors.cardBg,
    },
    editBtn: {
      width: '100%',
      height: isCompact ? hp(5.5) : hp(6),
      borderRadius: isCompact ? wp(2.8) : wp(3),
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    editBtnGradient: {
      borderRadius: isCompact ? wp(2.8) : wp(3),
    },
    editBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(2),
    },
    editTxt: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: isCompact ? wp(3.3) : wp(3.5),
      letterSpacing: 0.2,
    },

    cardDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.surfaceBorder || colors.border,
    },

    detailsSection: {
      paddingHorizontal: isWide ? wp(5) : wp(4),
      paddingTop: isCompact ? hp(1.6) : hp(2),
      paddingBottom: isCompact ? hp(1.2) : hp(1.6),
    },
    sectionTitle: {
      color: colors.gray,
      fontSize: isCompact ? wp(2.6) : wp(2.8),
      fontFamily: fonts.semibold,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: isCompact ? hp(1) : hp(1.4),
    },

    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isCompact ? hp(1.2) : hp(1.5),
      minHeight: isCompact ? hp(6.5) : hp(7),
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.surfaceBorder || colors.border,
    },
    iconBox: {
      width: iconBoxSize,
      height: iconBoxSize,
      borderRadius: iconRadius,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isNarrow ? wp(3) : wp(3.5),
      flexShrink: 0,
      backgroundColor: isDark ? `${colors.primary}18` : `${colors.primary}10`,
    },
    fieldContent: {
      flex: 1,
      justifyContent: 'center',
      minWidth: 0,
    },
    fieldLabel: {
      color: colors.gray,
      fontSize: isCompact ? wp(2.6) : wp(2.8),
      fontFamily: fonts.medium,
      letterSpacing: 0.4,
      marginBottom: hp(0.5),
      textTransform: 'uppercase',
    },
    fieldValue: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: isCompact ? wp(3.6) : wp(3.8),
      letterSpacing: 0.1,
    },

    statusDot: {
      width: isCompact ? wp(1.6) : wp(1.8),
      height: isCompact ? wp(1.6) : wp(1.8),
      borderRadius: wp(1),
      backgroundColor: colors.success || '#10B981',
    },
    statusPillActive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.12)',
      borderRadius: wp(5),
      paddingHorizontal: isCompact ? wp(2.8) : wp(3),
      paddingVertical: isCompact ? hp(0.6) : hp(0.75),
      alignSelf: 'flex-start',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.28)',
    },
    statusText: {
      color: colors.success || '#10B981',
      fontFamily: fonts.semibold,
      fontSize: isCompact ? wp(2.8) : wp(3),
      letterSpacing: 0.2,
    },
  })
}

export const getModalStyles = (colors, isDark = false, options = {}) => {
  const { isCompact = false, isWide = false } = options
  const sheetMaxWidth = isWide ? Math.min(wp(70), 440) : undefined

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: isWide ? 'center' : 'flex-end',
      alignItems: isWide ? 'center' : 'stretch',
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      paddingHorizontal: isWide ? wp(4) : 0,
    },
    backdropTap: {
      ...StyleSheet.absoluteFillObject,
    },
    sheetWrap: {
      width: isWide ? sheetMaxWidth : '100%',
      maxWidth: sheetMaxWidth,
      zIndex: 1,
    },
    sheet: {
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: isWide ? wp(4) : wp(6),
      borderTopRightRadius: isWide ? wp(4) : wp(6),
      borderBottomLeftRadius: isWide ? wp(4) : 0,
      borderBottomRightRadius: isWide ? wp(4) : 0,
      paddingBottom: Platform.OS === 'ios' ? (isCompact ? hp(3) : hp(3.5)) : hp(2.5),
      borderWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: isWide ? StyleSheet.hairlineWidth : 0,
      borderColor: colors.surfaceBorder || colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: isWide ? 8 : -4 },
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: isWide ? 24 : 16,
        },
        android: {
          elevation: 12,
        },
      }),
    },
    handle: {
      alignSelf: 'center',
      width: isCompact ? wp(9) : wp(10),
      height: hp(0.5),
      borderRadius: hp(0.25),
      backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
      marginTop: hp(1.2),
      marginBottom: hp(0.75),
      display: isWide ? 'none' : 'flex',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isWide ? wp(5) : wp(5),
      paddingTop: isWide ? hp(2) : hp(1),
      paddingBottom: hp(0.5),
    },
    headerTitle: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: isCompact ? wp(4.5) : wp(5),
      letterSpacing: 0.2,
    },
    headerSubtitle: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: isCompact ? wp(3.1) : wp(3.3),
      lineHeight: isCompact ? hp(2.2) : hp(2.4),
      paddingHorizontal: isWide ? wp(5) : wp(5),
      marginBottom: isCompact ? hp(2) : hp(2.5),
    },
    closeBtn: {
      height: isCompact ? wp(8.5) : wp(9),
      width: isCompact ? wp(8.5) : wp(9),
      borderRadius: isCompact ? wp(4.25) : wp(4.5),
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtnPressed: {
      opacity: 0.7,
    },
    bodyScroll: {
      maxHeight: isWide ? hp(45) : hp(38),
    },
    body: {
      paddingHorizontal: isWide ? wp(5) : wp(5),
      paddingBottom: hp(0.5),
    },
    inputGroup: {
      marginBottom: isCompact ? hp(1.4) : hp(2),
    },
    label: {
      color: colors.text,
      fontFamily: fonts.medium,
      fontSize: isCompact ? wp(3.1) : wp(3.3),
      marginBottom: hp(1),
      opacity: 0.85,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.inputBg,
      borderRadius: isCompact ? wp(3.2) : wp(3.5),
      height: isCompact ? hp(6) : hp(6.5),
      paddingHorizontal: isCompact ? wp(3.2) : wp(3.5),
    },
    inputIcon: {
      marginRight: wp(2.5),
    },
    input: {
      flex: 1,
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: isCompact ? wp(3.6) : wp(3.8),
      height: '100%',
      paddingVertical: 0,
    },
    footer: {
      flexDirection: isCompact ? 'column' : 'row',
      gap: isCompact ? hp(1.2) : wp(3),
      paddingHorizontal: isWide ? wp(5) : wp(5),
      paddingTop: hp(1),
      marginTop: hp(1),
    },
    cta: {
      flex: isCompact ? undefined : 1,
      width: isCompact ? '100%' : undefined,
      height: isCompact ? hp(5.8) : hp(6.2),
      borderRadius: isCompact ? wp(3.2) : wp(3.5),
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaPressed: {
      opacity: 0.88,
    },
    cancel: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.cardBg,
    },
    saveWrap: {
      flex: isCompact ? undefined : 1,
      width: isCompact ? '100%' : undefined,
      borderRadius: isCompact ? wp(3.2) : wp(3.5),
      overflow: 'hidden',
    },
    save: {
      width: '100%',
    },
    cancelText: {
      color: colors.text,
      fontFamily: fonts.semibold,
      fontSize: isCompact ? wp(3.6) : wp(3.8),
    },
    saveText: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: isCompact ? wp(3.6) : wp(3.8),
      letterSpacing: 0.2,
    },
  })
}

export default getStyles
