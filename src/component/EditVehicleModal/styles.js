import { StyleSheet } from 'react-native';
import { fonts } from '../../constant';
import { wp, hp } from '../../theme/layout';
import { cardShadow } from '../../theme/shadows';

export const getStyles = (colors, themeMode = 'light') => {
  const isDark = themeMode === 'dark';
  const shadow = cardShadow(isDark);
  const inputBg = colors.inputBg;
  const accent = colors.primary;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.appBg || colors.dark,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp(4),
      paddingTop: hp(6),
      paddingBottom: hp(1.5),
      backgroundColor: colors.cardBg,
    },
    headerTitle: {
      fontFamily: fonts.bold,
      fontSize: 17,
      color: accent,
    },
    headerBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingBottom: hp(4),
    },
    sectionCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: wp(4),
      marginTop: hp(1.5),
      ...shadow,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 14,
      gap: 8,
    },
    sectionHeaderText: {
      flex: 1,
    },
    sectionTitle: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors.text,
    },
    sectionSubtitle: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.gray,
      marginTop: 2,
    },
    fieldLabel: {
      fontFamily: fonts.medium,
      fontSize: 10,
      color: colors.gray,
      letterSpacing: 0.6,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    fieldInput: {
      backgroundColor: inputBg,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#E5E7EB' : colors.border,
    },
    fieldInputMultiline: {
      minHeight: hp(12),
      paddingTop: 12,
    },
    prefixInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: inputBg,
      borderRadius: 10,
      paddingHorizontal: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeMode === 'light' ? '#E5E7EB' : colors.border,
    },
    inputPrefix: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.gray,
      marginRight: 4,
    },
    prefixInput: {
      flex: 1,
      paddingVertical: 12,
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 14,
    },
    fieldInputPrice: {
      color: accent,
      fontFamily: fonts.semibold,
    },
    row2: {
      flexDirection: 'row',
      gap: 10,
    },
    row2Item: {
      flex: 1,
    },
    footer: {
      paddingHorizontal: wp(4),
      paddingTop: hp(2),
    },
    saveBtn: {
      backgroundColor: accent,
      borderRadius: 12,
      paddingVertical: hp(1.8),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontFamily: fonts.bold,
      fontSize: 15,
    },
    discardBtn: {
      alignItems: 'center',
      paddingVertical: hp(1.5),
      marginTop: hp(0.5),
    },
    discardText: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 13,
    },
  });
};

export default getStyles;
