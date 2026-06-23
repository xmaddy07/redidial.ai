import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../../theme/layout'
import { createSettingsScreenStyles } from '../shared/settingsScreenTheme'

export const getStyles = (colors, isDark = false, options = {}) =>
  StyleSheet.create({
    ...createSettingsScreenStyles(colors, isDark, options),
    enableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: wp(3),
    },
    enableTextWrap: {
      flex: 1,
    },
    enableTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 15,
      marginBottom: 3,
    },
    enableHint: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 17,
    },
    toggleTrack: {
      width: 48,
      height: 28,
      borderRadius: 14,
      padding: 3,
      justifyContent: 'center',
    },
    toggleTrackOn: {
      backgroundColor: colors.primary,
    },
    toggleTrackOff: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
    },
    toggleThumb: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.white,
    },
    toggleThumbOn: {
      alignSelf: 'flex-end',
    },
    toggleThumbOff: {
      alignSelf: 'flex-start',
    },
    fieldWrap: {
      gap: hp(0.7),
    },
    fieldLabel: {
      color: colors.appText || colors.text,
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    dropdown: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      paddingHorizontal: wp(3.5),
      height: hp(5.8),
    },
    dropdownText: {
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 13,
    },
    dropdownPlaceholder: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 13,
    },
    dropdownContainer: {
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginTop: 4,
    },
    dropdownItemText: {
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 13,
      flex: 1,
    },
    dropdownItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(1.3),
      gap: wp(2),
    },
    dropdownItemRowSelected: {
      backgroundColor: `${colors.primary}10`,
    },
    dropdownItemTextSelected: {
      color: colors.primary,
      fontFamily: fonts.medium,
    },
    timeInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      paddingHorizontal: wp(3.5),
      height: hp(5.8),
    },
    timeInput: {
      flex: 1,
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 13,
      paddingVertical: 0,
    },
    radioStack: {
      gap: hp(1),
    },
    radioCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2.5),
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(1.4),
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.inputBg,
    },
    radioCardSelected: {
      borderColor: `${colors.primary}55`,
      backgroundColor: isDark ? `${colors.primary}0C` : `${colors.primary}08`,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBg,
    },
    radioOuterActive: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    radioLabel: {
      flex: 1,
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 13,
    },
    radioLabelSelected: {
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    noteText: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
    },
    formCard: {
      gap: hp(1.6),
    },
    metaCard: {
      gap: hp(1.2),
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: wp(2.5),
    },
    metaTextWrap: {
      flex: 1,
    },
    metaLabel: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    metaValue: {
      color: colors.appText || colors.text,
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    recipientPanel: {
      gap: hp(1),
      marginTop: hp(0.5),
    },
    selectAllRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(2.5),
      paddingVertical: hp(0.4),
    },
    selectAllText: {
      color: colors.appText || colors.text,
      fontFamily: fonts.medium,
      fontSize: 12,
    },
    usersStack: {
      gap: hp(0.8),
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: wp(3),
      paddingVertical: hp(1.1),
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.inputBg,
    },
    userCardSelected: {
      borderColor: `${colors.primary}55`,
      backgroundColor: isDark ? `${colors.primary}0C` : `${colors.primary}08`,
    },
    checkboxOuter: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(2),
      backgroundColor: colors.cardBg,
    },
    checkboxOuterChecked: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(2.5),
    },
    avatarText: {
      color: colors.white,
      fontFamily: fonts.bold,
      fontSize: 11,
    },
    userInfo: {
      flex: 1,
      minWidth: 0,
    },
    userName: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 13,
    },
    userEmail: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
      marginTop: 2,
    },
    customEmailInput: {
      minHeight: hp(8),
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(1.2),
      color: colors.text,
      fontFamily: fonts.regular,
      fontSize: 13,
      textAlignVertical: 'top',
    },
    fieldHint: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
      lineHeight: 16,
    },
    primaryBtnDisabled: {
      opacity: 0.55,
    },
  })

export default getStyles
