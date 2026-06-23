import { StyleSheet } from 'react-native';
import { fonts } from '../../../constant';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../../theme/layout';
import { createSettingsScreenStyles } from '../shared/settingsScreenTheme';

export const getStyles = (colors, isDark = false, options = {}) =>
  StyleSheet.create({
    ...createSettingsScreenStyles(colors, isDark, options),

    sectionBlock: {
      marginBottom: hp(2),
    },
    sectionQuestion: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 15,
      marginBottom: hp(1.2),
      marginLeft: wp(1),
      letterSpacing: 0.1,
    },

    phoneCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      paddingVertical: hp(1.6),
      paddingHorizontal: wp(4),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      marginBottom: hp(2.2),
    },
    phoneIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3.5),
      backgroundColor: colors.primary,
    },
    phoneInfo: {
      flex: 1,
    },
    phoneLabel: {
      color: colors.gray,
      fontSize: 11,
      fontFamily: fonts.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 3,
    },
    phoneNumber: {
      color: colors.appText || colors.text,
      fontSize: 16,
      fontFamily: fonts.semibold,
      letterSpacing: 0.3,
    },
    activeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: isDark ? `${colors.success}22` : `${colors.success}14`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.success}35`,
    },
    activeBadgeText: {
      color: colors.success,
      fontSize: 10,
      fontFamily: fonts.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },

    optionsCard: {
      borderRadius: 16,
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      overflow: 'hidden',
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(1.6),
      paddingHorizontal: wp(4),
      backgroundColor: colors.cardBg,
    },
    optionRowSelected: {
      backgroundColor: isDark ? `${colors.primary}14` : `${colors.primary}08`,
    },
    optionRowPressed: {
      backgroundColor: isDark ? `${colors.primary}10` : `${colors.primary}06`,
    },
    optionDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder || colors.border,
    },
    optionIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(3),
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
    },
    optionIconWrapSelected: {
      backgroundColor: isDark ? `${colors.primary}30` : `${colors.primary}18`,
    },
    optionTexts: {
      flex: 1,
      marginRight: wp(2),
    },
    optionLabel: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    optionSubtitle: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      marginTop: 3,
      lineHeight: 17,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterActive: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },

    configCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      paddingHorizontal: wp(4),
      paddingVertical: hp(1.8),
      marginTop: hp(1.5),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    configCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(1.2),
    },
    configCardIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(2.5),
      backgroundColor: isDark ? `${colors.primary}22` : `${colors.primary}12`,
    },
    configCardTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },

    keyboardView: {
      flex: 1,
    },
    ivrFieldGroup: {
      width: '100%',
    },
    ivrFieldLabel: {
      color: colors.appText || colors.text,
      fontSize: 16,
      fontFamily: fonts.regular,
      alignSelf: 'flex-start',
      paddingBottom: hp(1),
      paddingTop: hp(0.5),
    },
    ivrMessageInput: {
      width: '100%',
      minHeight: hp(10),
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      backgroundColor: colors.inputBg,
      color: colors.appText || colors.text,
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      paddingHorizontal: wp(4),
      paddingTop: hp(1.2),
      paddingBottom: hp(1.2),
      textAlignVertical: 'top',
    },

    switchRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: hp(1.5),
      paddingTop: hp(1.5),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.surfaceBorder || colors.border,
    },
    switchTexts: {
      flex: 1,
      marginLeft: wp(3),
    },
    switchLabel: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 13,
      lineHeight: 19,
    },
    switchHint: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
    },

    rulesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: hp(2),
      marginBottom: hp(1),
      paddingHorizontal: wp(1),
    },
    rulesTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 15,
      letterSpacing: 0.1,
    },
    addBtnPressable: {
      borderRadius: 10,
      overflow: 'hidden',
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      height: hp(4.2),
      borderRadius: 10,
      gap: 6,
      backgroundColor: colors.primary,
    },
    addBtnText: {
      color: colors.white,
      fontFamily: fonts.semibold,
      fontSize: 12,
      letterSpacing: 0.2,
    },

    emptyRules: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      paddingVertical: hp(3.5),
      paddingHorizontal: wp(6),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      borderStyle: 'dashed',
      marginTop: hp(0.5),
    },
    emptyRulesIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.inputBg,
      marginBottom: hp(1.2),
    },
    emptyRulesTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
      marginBottom: 4,
    },
    emptyRulesHint: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
    },

    ruleCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      paddingVertical: hp(1.6),
      paddingHorizontal: wp(4),
      marginTop: hp(1.2),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
    },
    ruleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: hp(1.2),
    },
    ruleTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    digitBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    digitBadgeText: {
      color: colors.white,
      fontFamily: fonts.bold,
      fontSize: 15,
    },
    ruleTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
    },
    removeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
    },

    saveWrap: {
      marginTop: hp(2.5),
    },
  });

export default getStyles;
