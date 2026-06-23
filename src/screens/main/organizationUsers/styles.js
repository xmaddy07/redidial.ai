import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import { wp, hp, screenPadding, normalizeStyleOptions } from '../../../theme/layout'
import { cardShadow } from '../../../theme/shadows'

export const getStyles = (colors, isDark = false, options = {}) => {
  const { isCompact = false, isWide = false } = normalizeStyleOptions(options)
  const padH = screenPadding(isWide, isCompact)
  const shadow = cardShadow(isDark)

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.appBg || colors.dark,
    },
    content: {
      flex: 1,
      paddingHorizontal: padH,
      paddingTop: hp(1),
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      paddingHorizontal: 12,
      height: 44,
      marginBottom: hp(1.5),
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 14,
      paddingVertical: 0,
    },
    flatList: {
      flex: 1,
    },
    flatListContent: {
      paddingBottom: hp(2),
    },
    errorBox: {
      backgroundColor: `${colors.danger}14`,
      borderWidth: 1,
      borderColor: `${colors.danger}40`,
      borderRadius: 12,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.4),
      marginBottom: hp(1.5),
    },
    errorText: {
      color: colors.danger,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    userCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      padding: wp(4),
      marginBottom: hp(1.2),
      ...shadow,
    },
    userCardBot: {
      borderColor: `${colors.primary}35`,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarWrap: {
      position: 'relative',
      marginRight: wp(3),
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: colors.white,
      fontFamily: fonts.bold,
      fontSize: 13,
    },
    onlineDot: {
      position: 'absolute',
      bottom: -1,
      right: -1,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.cardBg,
    },
    userInfo: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: wp(2),
      marginBottom: 4,
    },
    name: {
      flex: 1,
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 15,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    typeBadgeBot: {
      backgroundColor: isDark ? `${colors.primary}22` : `${colors.primary}14`,
      borderColor: `${colors.primary}35`,
    },
    typeBadgeText: {
      color: colors.gray,
      fontFamily: fonts.semibold,
      fontSize: 10,
      letterSpacing: 0.4,
    },
    typeBadgeTextBot: {
      color: colors.primary,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
      backgroundColor: `${colors.success}22`,
    },
    statusBadgeOffline: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
    },
    statusBadgeText: {
      color: colors.success || '#10B981',
      fontFamily: fonts.semibold,
      fontSize: 10,
    },
    statusBadgeTextOffline: {
      color: colors.gray,
    },
    emailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    emailText: {
      flex: 1,
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hp(6),
      paddingHorizontal: wp(8),
    },
    emptyTitle: {
      color: colors.text,
      fontFamily: fonts.semibold,
      fontSize: 16,
      marginTop: hp(1.5),
    },
    emptyHint: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 13,
      textAlign: 'center',
      marginTop: hp(0.8),
    },
  })
}

export default getStyles
