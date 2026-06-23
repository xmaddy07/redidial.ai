import { StyleSheet } from 'react-native';
import { fonts } from '../../../constant';
import { wp, hp, screenPadding, normalizeStyleOptions } from '../../../theme/layout';
import { cardShadow } from '../../../theme/shadows';

export const getStyles = (colors, themeMode = 'light', options = {}) => {
  const { isCompact = false, isWide = false } = normalizeStyleOptions(options);
  const padH = screenPadding(isWide, isCompact);
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
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: hp(2),
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: hp(1.5),
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: `${colors.primary}14`,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  activeFilterText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primary,
  },
  customerCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    marginHorizontal: wp(1),
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...cardShadow(themeMode === 'dark'),
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: wp(14),
    height: wp(14),
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  customerInfo: {
    flex: 1,
    paddingRight: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  statusBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  customerName: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 15,
    marginBottom: 6,
  },
  customerNameUnknown: {
    color: colors.gray,
    fontStyle: 'italic',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    color: colors.gray,
    fontFamily: fonts.regular,
    fontSize: 11,
    flex: 1,
    marginLeft: 6,
  },
  contactTextEmpty: {
    fontStyle: 'italic',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.primary}26`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  searchBar: {
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  listStateWrap: {
    paddingVertical: 24,
  },
  listErrorText: {
    color: colors.orange || '#F97316',
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  listEmptyText: {
    color: colors.gray,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  })
}

export default getStyles;
