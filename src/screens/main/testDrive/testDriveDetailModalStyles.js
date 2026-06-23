import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import { wp, hp, normalizeStyleOptions } from '../../../theme/layout'
import { cardShadow } from '../../../theme/shadows'

export function getTestDriveDetailModalStyles(colors, isDark, options = {}) {
  const { isCompact = false } = normalizeStyleOptions(options)
  const borderColor = colors.surfaceBorder || colors.border
  const cardBg = isDark ? colors.cardBg : colors.white || colors.cardBg

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      paddingHorizontal: wp(5),
    },
    backdropTap: {
      ...StyleSheet.absoluteFillObject,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '88%',
      backgroundColor: cardBg,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      overflow: 'hidden',
      zIndex: 1,
      ...cardShadow(isDark, 'lift'),
    },
    headerShell: {
      position: 'relative',
      width: '100%',
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      overflow: 'hidden',
    },
    headerGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    headerContent: {
      paddingHorizontal: isCompact ? 14 : 16,
      paddingTop: hp(2.2),
      paddingBottom: hp(2),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      marginRight: 12,
      gap: 12,
    },
    headerTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    headerIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    title: {
      fontSize: isCompact ? 17 : 18,
      fontFamily: fonts.bold,
      color: colors.white,
    },
    headerSubtitle: {
      marginTop: 2,
      fontSize: isCompact ? 13 : 14,
      fontFamily: fonts.medium,
      color: 'rgba(255,255,255,0.85)',
    },
    closeBtn: {
      flexShrink: 0,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 8,
      marginTop: hp(1.6),
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 11,
      fontFamily: fonts.semibold,
      color: colors.white,
      letterSpacing: 0.8,
    },
    body: {
      flexGrow: 0,
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 22,
      overflow: 'hidden',
    },
    bodyContent: {
      paddingHorizontal: wp(5),
      paddingTop: hp(2),
      paddingBottom: hp(2.4),
    },
    detailsCard: {
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(0.8),
      marginBottom: hp(2),
    },
    detailFieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(1.2),
      gap: 12,
    },
    detailIconBox: {
      width: 36,
      height: 36,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailFieldContent: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 11,
      fontFamily: fonts.semibold,
      color: colors.gray,
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    detailValue: {
      fontSize: 15,
      fontFamily: fonts.medium,
      color: colors.text,
      lineHeight: 21,
    },
    detailDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: borderColor,
      marginLeft: 48,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      borderRadius: 14,
      paddingVertical: hp(1.8),
      paddingHorizontal: wp(4),
      marginBottom: hp(1.2),
      backgroundColor: colors.primary,
    },
    primaryBtnIcon: {
      marginRight: 8,
    },
    primaryBtnText: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.white,
      flexShrink: 1,
      textAlign: 'center',
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: hp(1.8),
      backgroundColor: `${colors.primary}10`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.primary}33`,
    },
    secondaryBtnText: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.primary,
    },
    btnPressed: {
      opacity: 0.88,
    },
  })
}
