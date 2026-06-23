import { StyleSheet, Platform } from 'react-native'
import { wp, hp, getChatLayout, getContentMaxWidth } from '../../../theme/layout'
import { fonts } from '../../../constant'

export { getChatLayout }

const searchShadow = (isDark) => Platform.select({
  ios: {
    shadowColor: isDark ? '#000000' : '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8,
  },
  android: {
    elevation: isDark ? 2 : 1,
  },
})

export const getStyles = (colors, isDark = false, options = {}) => {
  const {
    isCompact = false,
    isNarrow = false,
    isWide = false,
    bottomInset = 0,
  } = options

  const contentMaxWidth = getContentMaxWidth(isWide)
  const searchRadius = isCompact ? wp(3) : wp(3.5)
  const avatarSize = isCompact ? wp(12) : isWide ? wp(11) : wp(13)
  const searchHeight = isCompact ? hp(5.2) : hp(5.8)
  const rowPaddingH = isWide ? wp(5) : isCompact ? wp(4) : wp(4.5)
  const rowPaddingV = isCompact ? hp(1.3) : hp(1.6)

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.appBg || colors.dark,
    },
    content: {
      flex: 1,
    },
    topSection: {
      paddingHorizontal: isWide ? wp(6) : wp(4),
      paddingTop: hp(1),
      alignItems: isWide ? 'center' : 'stretch',
    },
    topSectionInner: {
      width: '100%',
      maxWidth: contentMaxWidth,
    },
    listPanel: {
      flex: 1,
      marginTop: hp(1),
      backgroundColor: colors.cardBg || colors.surfaceBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.surfaceBorder || colors.border,
      width: '100%',
      maxWidth: contentMaxWidth,
      alignSelf: isWide ? 'center' : 'stretch',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: hp(1.2),
    },
    activeFilterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: isCompact ? 10 : 12,
      paddingVertical: isCompact ? 6 : 8,
      borderRadius: 20,
      backgroundColor: `${colors.primary}14`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.primary}33`,
    },
    activeFilterText: {
      fontFamily: fonts.medium,
      fontSize: isCompact ? 11 : 12,
      color: colors.primary,
      letterSpacing: 0.2,
    },
    searchWrap: {
      backgroundColor: colors.inputBg,
      borderRadius: searchRadius,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isCompact ? wp(3) : wp(3.5),
      height: searchHeight,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      ...searchShadow(isDark),
    },
    searchWrapGrow: {
      flex: 1,
      minWidth: 0,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isCompact ? 8 : 10,
    },
    newUserBtn: {
      width: searchHeight,
      height: searchHeight,
      borderRadius: searchRadius,
      backgroundColor: colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...searchShadow(isDark),
    },
    newUserBtnActive: {
      backgroundColor: `${colors.primary}18`,
      borderColor: `${colors.primary}44`,
    },
    newUserBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 1.5,
      borderColor: colors.cardBg || colors.white,
    },
    newUserBadgeText: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: 9,
      lineHeight: 12,
    },
    searchIcon: {
      width: isCompact ? wp(4) : wp(4.5),
      height: isCompact ? wp(4) : wp(4.5),
      tintColor: colors.primary,
    },
    searchInput: {
      color: colors.appText || colors.text,
      fontFamily: fonts.regular,
      fontSize: isCompact ? 13 : 14,
      paddingLeft: wp(2.5),
      flex: 1,
      minWidth: 0,
      height: searchHeight,
      paddingVertical: 0,
    },
    listContent: {
      flexGrow: 1,
      paddingBottom: Math.max(hp(2), bottomInset + hp(1)),
    },
    threadItem: {
      overflow: 'hidden',
    },
    threadItemInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: rowPaddingH,
      paddingRight: rowPaddingH,
      paddingVertical: rowPaddingV,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder || colors.border,
    },
    threadItemPressed: {
      backgroundColor: isDark ? `${colors.primary}18` : `${colors.primary}0D`,
    },
    avatarContainer: {
      marginRight: isCompact ? 10 : 12,
    },
    avatarGradient: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: fonts.bold,
      fontSize: isCompact ? 12 : 14,
      color: colors.white,
      letterSpacing: 0.5,
    },
    avatarWrap: {
      position: 'relative',
    },
    avatarOnlineDot: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.cardBg || colors.white,
    },
    listFooter: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    threadCenter: {
      flex: 1,
      minWidth: 0,
    },
    threadTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
    },
    threadNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      marginRight: 8,
      gap: 6,
    },
    threadName: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: isCompact ? 13 : isNarrow ? 14 : 15,
      flexShrink: 1,
      letterSpacing: 0.1,
    },
    threadNameUnread: {
      fontFamily: fonts.bold,
    },
    incomingCallBadge: {
      backgroundColor: isDark ? `${colors.primary}25` : `${colors.primary}14`,
      borderRadius: 6,
      paddingHorizontal: isCompact ? 5 : 6,
      paddingVertical: 2,
    },
    incomingCallBadgeText: {
      color: colors.primary,
      fontFamily: fonts.semibold,
      fontSize: isCompact ? 8 : 9,
      letterSpacing: 0.3,
    },
    threadPreview: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: isCompact ? 12 : 13,
      lineHeight: isCompact ? 16 : 18,
    },
    threadPreviewUnread: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
    },
    unreadCountBadge: {
      backgroundColor: colors.primary,
      minWidth: 18,
      paddingHorizontal: isCompact ? 5 : 6,
    },
    unreadCountBadgeText: {
      color: colors.white,
      fontFamily: fonts.bold,
    },
    threadPreviewMuted: {
      color: colors.gray,
      fontStyle: 'italic',
    },
    threadTime: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: isCompact ? 9 : 10,
      letterSpacing: 0.2,
    },
    noPhoneBadge: {
      backgroundColor: isDark ? '#7F1D1D40' : '#FEE2E2',
      borderRadius: 6,
      paddingHorizontal: isCompact ? 5 : 6,
      paddingVertical: 2,
    },
    noPhoneBadgeText: {
      color: isDark ? '#FCA5A5' : '#B91C1C',
      fontFamily: fonts.semibold,
      fontSize: isCompact ? 8 : 9,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    emptyWrap: {
      paddingTop: hp(8),
      paddingHorizontal: wp(8),
      alignItems: 'center',
    },
    emptyIconWrap: {
      width: isCompact ? wp(16) : wp(18),
      height: isCompact ? wp(16) : wp(18),
      borderRadius: isCompact ? wp(8) : wp(9),
      backgroundColor: `${colors.primary}14`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(2),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.primary}25`,
    },
    emptyTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: isCompact ? 15 : 16,
      marginBottom: hp(0.8),
      textAlign: 'center',
    },
    emptyText: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: isCompact ? 12 : 13,
      textAlign: 'center',
      lineHeight: isCompact ? 18 : 20,
    },
    retryBtn: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignSelf: 'center',
    },
    retryBtnText: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
  })
}

export default getStyles
