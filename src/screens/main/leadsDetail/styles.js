import { StyleSheet, Platform } from 'react-native'
import { fonts } from '../../../constant'
import {
  wp,
  hp,
  normalizeStyleOptions,
  getContentMaxWidth,
  screenPadding,
} from '../../../theme/layout'
import { cardShadow } from '../../../theme/shadows'

export const getStyles = (colors, isDark = false, options = {}) => {
  const { isCompact = false, isWide = false } = normalizeStyleOptions(options)
  const padH = screenPadding(isWide, isCompact)
  const contentMaxWidth = getContentMaxWidth(isWide)
  const accent = colors.primary
  const panelBg = isDark ? colors.cardBg : '#FFFFFF'
  const pageBg = isDark ? (colors.appBg || colors.dark) : '#F1F5F9'
  const fieldBg = isDark ? colors.inputBg : '#F8FAFC'
  const fieldBorder = isDark ? colors.border : '#E2E8F0'
  const labelColor = isDark ? colors.gray : '#94A3B8'
  const titleColor = isDark ? colors.text : '#0F172A'
  const mutedText = isDark ? colors.gray : '#64748B'

  const panelShadow = cardShadow(isDark)
  const softShadow = cardShadow(isDark, 'soft')

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: pageBg,
    },
    headerGradient: {
      paddingBottom: hp(1),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: padH,
      paddingBottom: hp(0.8),
    },
    backBtn: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      ...softShadow,
    },
    headerTitle: {
      color: titleColor,
      fontFamily: fonts.bold,
      fontSize: isCompact ? 18 : 20,
      letterSpacing: -0.3,
    },
    headerSpacer: {
      width: wp(10),
    },
    heroCard: {
      marginHorizontal: padH,
      marginBottom: hp(1.4),
      borderRadius: 20,
      overflow: 'hidden',
      ...panelShadow,
    },
    heroInner: {
      paddingHorizontal: wp(4.5),
      paddingVertical: hp(2.2),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    heroAvatar: {
      width: wp(15),
      height: wp(15),
      borderRadius: wp(7.5),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.38)',
    },
    heroAvatarText: {
      color: '#FFFFFF',
      fontFamily: fonts.bold,
      fontSize: 22,
      letterSpacing: 0.5,
    },
    heroContent: {
      flex: 1,
      minWidth: 0,
    },
    heroName: {
      color: '#FFFFFF',
      fontFamily: fonts.bold,
      fontSize: isCompact ? 17 : 18,
      letterSpacing: -0.2,
      marginBottom: 4,
    },
    heroSub: {
      color: 'rgba(255,255,255,0.82)',
      fontFamily: fonts.regular,
      fontSize: 13,
      marginBottom: 8,
    },
    heroChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    heroChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
    },
    heroChipText: {
      color: '#FFFFFF',
      fontFamily: fonts.medium,
      fontSize: 11,
    },
    scrollContent: {
      paddingHorizontal: padH,
      paddingTop: hp(0.3),
      paddingBottom: hp(4),
      width: '100%',
      maxWidth: contentMaxWidth,
      alignSelf: isWide ? 'center' : 'stretch',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: wp(2.5),
      marginBottom: hp(1.6),
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: hp(1.5),
      overflow: 'hidden',
      ...softShadow,
    },
    actionBtnPrimary: {
      ...Platform.select({
        ios: {
          shadowColor: accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    actionBtnSecondary: {
      backgroundColor: panelBg,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)',
    },
    actionBtnText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      letterSpacing: 0.1,
    },
    actionBtnTextPrimary: {
      color: '#FFFFFF',
    },
    actionBtnTextSecondary: {
      color: accent,
    },
    card: {
      backgroundColor: panelBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)',
      marginBottom: hp(1.6),
      overflow: 'hidden',
      ...panelShadow,
    },
    cardAccent: {
      height: 3,
      width: '100%',
    },
    cardBody: {
      paddingHorizontal: padH,
      paddingTop: hp(1.6),
      paddingBottom: hp(2),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1.5),
      gap: 12,
    },
    cardIconWrap: {
      width: wp(9),
      height: wp(9),
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    cardTitle: {
      color: titleColor,
      fontFamily: fonts.bold,
      fontSize: 15,
      letterSpacing: -0.2,
      flex: 1,
    },
    fieldWrap: {
      marginBottom: hp(1.3),
    },
    fieldLabel: {
      color: labelColor,
      fontFamily: fonts.semibold,
      fontSize: 10,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      marginBottom: hp(0.55),
      marginLeft: 2,
    },
    fieldValue: {
      backgroundColor: fieldBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: fieldBorder,
      paddingHorizontal: wp(3.8),
      paddingVertical: hp(1.35),
      minHeight: hp(5.4),
      justifyContent: 'center',
    },
    fieldValueMultiline: {
      minHeight: hp(8),
      paddingVertical: hp(1.2),
    },
    fieldValueText: {
      color: titleColor,
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 21,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      paddingVertical: hp(6),
    },
    loadingText: {
      color: mutedText,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    ratingStar: {
      marginRight: 2,
    },
  })
}

export default getStyles
