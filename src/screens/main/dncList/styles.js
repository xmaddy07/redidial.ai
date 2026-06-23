import { StyleSheet } from 'react-native';
import { fonts } from '../../../constant';
import { wp, hp, screenPadding, normalizeStyleOptions } from '../../../theme/layout';
import { cardShadow } from '../../../theme/shadows';

export const getStyles = (colors, themeMode = 'light', options = {}) => {
  const { isCompact = false, isWide = false } = normalizeStyleOptions(options);
  const padH = screenPadding(isWide, isCompact);
  const isDark = themeMode === 'dark';
  const shadow = cardShadow(isDark);
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  summaryLeft: {
    flex: 1,
    paddingRight: 12,
  },
  summaryLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.gray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  summaryCount: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    marginRight: 6,
  },
  summaryContacts: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: hp(1.2),
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.semibold,
    fontSize: 12,
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
    paddingHorizontal: wp(1),
    paddingTop: wp(1),
  },
  flatListContent: {
    paddingBottom: hp(2),
  },
  dncCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...shadow,
  },
  iconBox: {
    width: wp(12),
    height: wp(12),
    borderRadius: 12,
    backgroundColor: `${colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  cardTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.danger || '#EF4444'}14`,
  },
  contactName: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  statusBadge: {
    backgroundColor: `${colors.primary}1A`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    color: colors.primary,
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  reasonText: {
    color: colors.gray,
    fontFamily: fonts.regular,
    fontSize: 11,
    marginBottom: 10,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: colors.gray,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  loadingMoreWrap: {
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(6),
    gap: hp(1.5),
  },
  emptyText: {
    color: colors.gray,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  modalCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: themeMode === 'light' ? '#F0F5FA' : colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  })
}

export default getStyles;
