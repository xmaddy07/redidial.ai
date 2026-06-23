import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import { wp, hp } from '../../../theme/layout'
import { cardShadow } from '../../../theme/shadows'
import { createSettingsScreenStyles } from '../shared/settingsScreenTheme'

export const getStyles = (colors, isDark = false, options = {}) =>
  StyleSheet.create({
    ...createSettingsScreenStyles(colors, isDark, options),

    keyboardView: {
      flex: 1,
    },

    sectionBlock: {
      marginBottom: hp(2),
    },

    formCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      paddingHorizontal: wp(4),
      paddingTop: hp(1.8),
      paddingBottom: hp(1.4),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      ...cardShadow(isDark),
    },

    formCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: hp(0.6),
      paddingBottom: hp(1.2),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder || colors.border,
    },

    formCardIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: wp(2.8),
      backgroundColor: isDark ? `${colors.primary}22` : `${colors.primary}12`,
    },

    formCardHeaderText: {
      flex: 1,
      paddingTop: 2,
    },

    formCardTitle: {
      color: colors.appText || colors.text,
      fontFamily: fonts.semibold,
      fontSize: 15,
      letterSpacing: 0.1,
      marginBottom: 3,
    },

    formCardSubtitle: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 17,
    },

    inputRow: {
      flexDirection: 'row',
      gap: wp(2.5),
    },

    inputRowItem: {
      flex: 1,
    },

    inputRowItemWide: {
      flex: 1.6,
    },

    inputRowItemNarrow: {
      flex: 1,
    },

    charCount: {
      alignSelf: 'flex-end',
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 11,
      marginTop: -hp(0.4),
      marginBottom: hp(0.8),
    },
  })

export default getStyles
