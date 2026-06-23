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
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1.5),
    gap: 10,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: hp(1.4),
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  importButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    paddingVertical: hp(1.4),
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  importButtonText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.4,
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
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: hp(4),
    paddingTop: wp(4),
    paddingHorizontal: wp(1),
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    ...cardShadow(themeMode === 'dark'),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardMain: {
    flex: 1,
    paddingRight: 12,
  },
  cardRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  cardTitle: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 16,
    marginBottom: 4,
  },
  cardVin: {
    color: colors.gray,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  editText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardPrice: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 17,
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    color: colors.gray,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gray,
    marginHorizontal: 8,
  },
  emptyWrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(4),
  },
  illustration: {
    width: wp(70),
    height: hp(28),
    marginBottom: hp(2),
  },
  loadingText: {
    color: colors.gray,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: hp(1),
  },
  errorText: {
    color: colors.primary,
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  })
}

export default getStyles;
