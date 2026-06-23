import { StyleSheet, Platform } from 'react-native';
import { fonts } from '../../../constant';
import { wp, hp, getDashboardLayout, getScrollBottomPadding } from '../../../theme/layout';
import { cardShadow } from '../../../theme/shadows';

export { getDashboardLayout };

export const getChartHeight = (isCompact) => (isCompact ? hp(17) : hp(20));
export const RECENT_ITEM_HEIGHT = hp(13);

export const getStyles = (colors, themeMode = 'light', options = {}) => {
  const {
    isCompact = false,
    isNarrow = false,
    bottomInset = 0,
    palette = {},
  } = options;
  const chartHeight = getChartHeight(isCompact);
  const stackChartHeader = isCompact || isNarrow;
  const isDark = themeMode === 'dark';
  const shadow = cardShadow(isDark);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.appBg || colors.dark,
    },
    scrollBody: {
      flex: 1,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 44,
      marginHorizontal: wp(4),
      marginTop: hp(1),
      marginBottom: hp(0.5),
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: wp(3.4),
      paddingVertical: 0,
    },
    scrollContent: {
      paddingHorizontal: wp(4),
      paddingBottom: Platform.OS === 'ios'
        ? getScrollBottomPadding(bottomInset, hp(10))
        : Math.max(hp(0), bottomInset + hp(1)),
      width: '100%',
    },
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignContent: 'flex-start',
      width: '100%',
      marginTop: hp(1),
    },
    kpiCardWrap: {
      width: '48%',
      maxWidth: '48%',
      marginBottom: wp(3),
    },
    kpiCardGradient: {
      width: '100%',
      borderRadius: wp(4.5),
      overflow: 'hidden',
      ...shadow,
    },
    kpiCardInner: {
      padding: isCompact ? wp(3) : wp(3.5),
      paddingBottom: isCompact ? wp(3.5) : wp(4),
      justifyContent: 'space-between',
    },
    kpiCardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: wp(1.5),
    },
    kpiCardTitle: {
      flex: 1,
      flexShrink: 1,
      fontFamily: fonts.medium,
      color: palette.kpiText || colors.white,
      fontSize: isCompact ? wp(2.8) : wp(3),
      lineHeight: isCompact ? wp(3.6) : wp(3.9),
      opacity: 0.95,
      marginRight: wp(1),
    },
    kpiIconCircle: {
      width: isCompact ? wp(5.5) : wp(6.5),
      height: isCompact ? wp(5.5) : wp(6.5),
      borderRadius: isCompact ? wp(2.75) : wp(3.25),
      backgroundColor: palette.kpiIconBg || 'rgba(255,255,255,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    kpiCardBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: hp(1.2),
      gap: wp(1),
    },
    kpiValue: {
      flex: 1,
      flexShrink: 1,
      fontFamily: fonts.bold,
      color: palette.kpiText || colors.white,
      fontSize: isCompact ? wp(5.8) : wp(6.5),
      lineHeight: isCompact ? wp(6.8) : wp(7.5),
    },
    kpiChange: {
      fontFamily: fonts.semibold,
      color: palette.kpiText || colors.white,
      fontSize: isCompact ? wp(2.7) : wp(3),
      opacity: 0.9,
      flexShrink: 0,
      maxWidth: '42%',
      textAlign: 'right',
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: wp(4.5),
      padding: wp(4),
      marginTop: hp(0.5),
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'visible',
      ...shadow,
    },
    chartCardHeader: {
      flexDirection: stackChartHeader ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: hp(1.2),
      gap: stackChartHeader ? hp(0.8) : 0,
    },
    chartCardHeaderLeft: {
      flex: 1,
      paddingRight: stackChartHeader ? 0 : wp(2),
      minWidth: 0,
    },
    cardTitle: {
      fontFamily: fonts.bold,
      color: colors.text,
      fontSize: isCompact ? wp(3.8) : wp(4),
      marginBottom: 4,
    },
    cardSubtitle: {
      fontFamily: fonts.regular,
      color: colors.gray,
      fontSize: wp(3),
    },
    chartLegendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: stackChartHeader ? 'flex-start' : 'flex-end',
      gap: wp(2.5),
      alignSelf: stackChartHeader ? 'stretch' : 'auto',
    },
    chartLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendDot: {
      width: wp(2),
      height: wp(2),
      borderRadius: wp(1),
      marginRight: wp(1.5),
    },
    legendLabel: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: wp(2.8),
    },
    chartPlaceholder: {
      minHeight: chartHeight + hp(2),
      backgroundColor: colors.cardBg,
      borderRadius: wp(3),
      overflow: 'visible',
      width: '100%',
    },
    chartGrid: {
      ...StyleSheet.absoluteFillObject,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: wp(2),
    },
    recentSection: {
      marginTop: hp(2),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1.2),
    },
    sectionTitle: {
      fontSize: isCompact ? wp(3.8) : wp(4),
      fontFamily: fonts.bold,
      color: colors.text,
      flex: 1,
    },
    viewAllLink: {
      paddingVertical: 4,
      paddingLeft: wp(2),
    },
    viewAllText: {
      color: colors.primary,
      fontFamily: fonts.medium,
      fontSize: wp(3.2),
    },
    listItem: {
      backgroundColor: colors.cardBg,
      borderRadius: wp(4),
      padding: wp(3.5),
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1.2),
      minHeight: RECENT_ITEM_HEIGHT,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow,
    },
    avatarCircle: {
      width: wp(11),
      height: wp(11),
      borderRadius: wp(5.5),
      backgroundColor: `${colors.primary}18`,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarInitials: {
      color: colors.primary,
      fontFamily: fonts.semibold,
      fontSize: wp(3.4),
    },
    itemCenter: {
      flex: 1,
      marginLeft: wp(2.5),
      marginRight: wp(1.5),
      minWidth: 0,
    },
    itemName: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: wp(3.5),
      marginBottom: hp(0.6),
    },
    itemMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
    },
    metaIcon: {
      marginRight: 6,
    },
    metaIconImage: {
      width: wp(3.2),
      height: wp(3.2),
      tintColor: colors.gray,
      marginRight: 6,
    },
    itemMeta: {
      color: colors.gray,
      fontSize: wp(3),
      fontFamily: fonts.regular,
      flex: 1,
    },
    itemRight: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      maxWidth: isNarrow ? wp(24) : wp(28),
      flexShrink: 0,
    },
    statusBadge: {
      borderRadius: wp(2),
      paddingHorizontal: wp(2.5),
      paddingVertical: hp(0.6),
    },
    statusBadgeText: {
      fontFamily: fonts.semibold,
      fontSize: wp(2.7),
      textAlign: 'right',
    },
    loadingWrap: {
      width: '100%',
      paddingVertical: hp(3),
    },
    emptyText: {
      color: colors.gray,
      fontSize: wp(3.2),
      textAlign: 'center',
      paddingVertical: hp(2),
      fontFamily: fonts.regular,
    },
  });
};

export default getStyles;
