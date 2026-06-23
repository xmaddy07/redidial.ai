import { StyleSheet } from 'react-native';
import { fonts } from '../../constant';
import { wp, hp } from '../../theme/layout';
import { cardShadow } from '../../theme/shadows';

export const getStyles = (colors, themeMode = 'light') => {
  const isDark = themeMode === 'dark';
  const shadow = cardShadow(isDark);
  const accent = colors.primary;
  const labelColor = colors.gray;
  const inputBg = colors.inputBg;
  const pageBg = colors.appBg || colors.dark;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: pageBg,
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
      paddingHorizontal: wp(4),
      paddingTop: hp(1.5),
      paddingBottom: hp(4),
    },
    formCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      padding: 18,
      ...shadow,
    },
    fieldWrap: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      color: labelColor,
      letterSpacing: 0.4,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: inputBg,
      borderRadius: 10,
      paddingHorizontal: 14,
      minHeight: 48,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 14,
      paddingVertical: 12,
      marginLeft: 10,
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: themeMode === 'light' ? '#EEF2F7' : colors.inputBg,
      borderRadius: 12,
      padding: 14,
      marginTop: 4,
      gap: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoTitle: {
      fontFamily: fonts.bold,
      fontSize: 13,
      color: colors.text,
      marginBottom: 4,
    },
    infoText: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.gray,
      lineHeight: 18,
    },
    footer: {
      flexDirection: 'row',
      paddingTop: hp(3),
      gap: 12,
    },
    cancelBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: accent,
      borderRadius: 12,
      paddingVertical: hp(1.8),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBg,
    },
    cancelText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: accent,
    },
    saveBtn: {
      flex: 1,
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
  });
};

export default getStyles;
