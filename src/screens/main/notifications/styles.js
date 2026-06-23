import { StyleSheet, Platform } from 'react-native'
import { wp, hp, normalizeStyleOptions, screenPadding, getContentMaxWidth } from '../../../theme/layout'
import { fonts } from '../../../constant'

export const getStyles = (colors, isDark, options = {}) => {
  const { isCompact = false, isWide = false } = normalizeStyleOptions(options)
  const padH = screenPadding(isWide, isCompact)
  const contentMaxWidth = getContentMaxWidth(isWide)

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.appBg || colors.dark,
    },
    header: {
      backgroundColor: colors.headerBg,
      paddingHorizontal: padH,
      paddingTop: hp(6),
      paddingBottom: hp(1.2),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder || colors.border,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000000' : '#0F172A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.18 : 0.04,
          shadowRadius: 8,
        },
        android: {
          elevation: isDark ? 4 : 2,
        },
      }),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      minHeight: 40,
    },
    titleOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: wp(22),
    },
    headerTitle: {
      color: colors.headerText,
      fontFamily: fonts.bold,
      fontSize: 17,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
    },
    iconButtonPressed: {
      backgroundColor: isDark ? `${colors.primary}18` : `${colors.primary}10`,
      opacity: 0.92,
    },
    iconButtonDisabled: {
      opacity: 0.6,
    },
    headerSpacer: {
      width: 38,
    },
    bottomAccent: {
      position: 'absolute',
      bottom: 0,
      left: wp(20),
      right: wp(20),
      height: 2,
      borderRadius: 1,
      backgroundColor: `${colors.primary}30`,
    },
    listContent: {
      paddingHorizontal: padH,
      width: '100%',
      maxWidth: contentMaxWidth,
      alignSelf: isWide ? 'center' : 'stretch',
      paddingTop: hp(1.4),
      paddingBottom: hp(3),
      flexGrow: 1,
    },
    summaryCard: {
      borderRadius: 18,
      padding: wp(4),
      marginBottom: hp(1.8),
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000000' : '#0F172A',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.18 : 0.05,
          shadowRadius: 10,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    summaryTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    summaryIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3.5),
    },
    summaryTextWrap: {
      flex: 1,
    },
    summaryTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.bold,
      fontSize: 16,
      letterSpacing: 0.2,
      marginBottom: 2,
    },
    summarySubtitle: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 17,
    },
    summaryStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: hp(1.6),
      paddingTop: hp(1.4),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.surfaceBorder || colors.border,
    },
    tabBar: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: hp(1.4),
    },
    tabChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    tabChipActive: {
      backgroundColor: isDark ? `${colors.primary}28` : `${colors.primary}14`,
      borderColor: `${colors.primary}40`,
    },
    tabChipText: {
      color: colors.gray,
      fontFamily: fonts.medium,
      fontSize: 12,
      letterSpacing: 0.2,
    },
    tabChipTextActive: {
      color: colors.primary,
      fontFamily: fonts.semibold,
    },
    filteredEmptyWrap: {
      flex: 1,
      paddingHorizontal: padH,
      paddingTop: hp(1.4),
    },
    filteredEmptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: hp(10),
      gap: hp(1),
    },
    filteredEmptyTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 16,
      marginTop: hp(0.5),
    },
    filteredEmptySubtitle: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 14,
    },
    statChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: hp(0.8),
      borderRadius: 12,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: colors.surfaceBorder || colors.border,
      marginHorizontal: wp(2),
    },
    statValue: {
      color: colors.appText || colors.text,
      fontFamily: fonts.bold,
      fontSize: 18,
      lineHeight: 22,
      marginBottom: 2,
    },
    statLabel: {
      color: colors.gray,
      fontFamily: fonts.medium,
      fontSize: 11,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(0.9),
      marginTop: hp(0.4),
      paddingHorizontal: wp(0.5),
    },
    sectionLabel: {
      color: colors.gray,
      fontFamily: fonts.semibold,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 1.1,
    },
    sectionLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.surfaceBorder || colors.border,
      marginLeft: wp(2.5),
    },
    cardPressable: {
      marginBottom: hp(1),
      borderRadius: 16,
    },
    cardRead: {
      opacity: 0.62,
    },
    cardPressed: {
      opacity: 0.94,
      transform: [{ scale: 0.996 }],
    },
    card: {
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000000' : '#0F172A',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.14 : 0.04,
          shadowRadius: 6,
        },
        android: {
          // elevation: 1,
        },
      }),
    },
    cardUnread: {
      borderColor: `${colors.primary}35`,
    },
    accentStripe: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingLeft: wp(3.8),
      paddingRight: wp(3.5),
      paddingVertical: hp(1.3),
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(2.8),
      marginTop: 1,
    },
    textContainer: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(0.5),
      gap: wp(1.5),
    },
    title: {
      flex: 1,
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 19,
      letterSpacing: 0.1,
    },
    titleUnread: {
      fontFamily: fonts.bold,
    },
    unreadDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      flexShrink: 0,
    },
    messageBox: {
      borderRadius: 10,
      paddingHorizontal: wp(2.8),
      paddingVertical: hp(0.7),
      marginBottom: hp(0.7),
    },
    message: {
      color: isDark ? '#CBD5E1' : '#64748B',
      fontFamily: fonts.regular,
      fontSize: 12.5,
      lineHeight: 18,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    footerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(1.5),
    },
    chevronWrap: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typePill: {
      paddingHorizontal: wp(2.4),
      paddingVertical: hp(0.3),
      borderRadius: 20,
    },
    typePillText: {
      fontFamily: fonts.semibold,
      fontSize: 10,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    time: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
      lineHeight: 14,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: wp(10),
      paddingTop: hp(6),
    },
    emptyCard: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 20,
      paddingVertical: hp(4.5),
      paddingHorizontal: wp(8),
      width: '100%',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      borderStyle: 'dashed',
    },
    emptyIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(2),
    },
    emptyTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 17,
      marginBottom: hp(0.8),
      letterSpacing: 0.2,
    },
    emptySubtitle: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 21,
    },
    footerLoader: {
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerSpacer: {
      height: 8,
    },
  })
}

export default getStyles
