import { StyleSheet, Platform } from 'react-native';
import { fonts } from '../../../constant';
import { wp, hp, getSettingLayout, getContentMaxWidth, getScrollBottomPadding } from '../../../theme/layout';
import { cardShadow } from '../../../theme/shadows';
import { createSettingsScreenStyles } from '../shared/settingsScreenTheme';

export { getSettingLayout };

export const getStyles = (colors, isDark = false, options = {}) => {
  const {
    isCompact = false,
    isNarrow = false,
    isWide = false,
    bottomInset = 0,
  } = options;

  const cardRadius = isWide ? wp(3.5) : wp(4.5);
  const heroRadius = isWide ? wp(4) : wp(4.8);
  const iconBoxSize = isCompact ? wp(9.5) : isWide ? wp(8.5) : wp(10.5);
  const iconRadius = isCompact ? wp(2.8) : wp(3.2);
  const heroIconSize = isCompact ? wp(10) : isWide ? wp(9) : wp(11);
  const chevronSize = isCompact ? wp(6.5) : wp(7.5);
  const contentMaxWidth = getContentMaxWidth(isWide, 520);
  const shared = createSettingsScreenStyles(colors, isDark, options);

  return StyleSheet.create({
    ...shared,
    screen: {
      flex: 1,
      backgroundColor: colors.appBg || colors.dark,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: isWide ? wp(6) : wp(4),
      paddingTop: hp(1),
      paddingBottom: Platform.OS === 'ios'
        ? getScrollBottomPadding(bottomInset, hp(10))
        : Math.max(hp(0), bottomInset + hp(1)),
      alignItems: isWide ? 'center' : 'stretch',
    },
    contentInner: {
      width: '100%',
      maxWidth: contentMaxWidth,
    },
    heroCard: {
      ...shared.heroCard,
      borderRadius: heroRadius,
      marginBottom: isCompact ? hp(1.2) : hp(1.6),
      width: '100%',
    },
    heroContent: {
      ...shared.heroContent,
      paddingHorizontal: isWide ? wp(5.5) : wp(5),
      paddingVertical: isCompact ? hp(2) : hp(2.4),
    },
    heroIconWrap: {
      marginBottom: isCompact ? hp(1) : hp(1.4),
    },
    heroIcon: {
      ...shared.heroIcon,
      width: heroIconSize,
      height: heroIconSize,
      borderRadius: isCompact ? wp(3.2) : wp(3.8),
    },
    heroTitle: {
      ...shared.heroTitle,
      fontSize: isCompact ? wp(4.6) : isWide ? wp(4) : wp(5.2),
      marginBottom: hp(0.7),
    },
    heroSubtitle: {
      ...shared.heroSubtitle,
      fontSize: isCompact ? wp(3.1) : wp(3.4),
      lineHeight: isCompact ? wp(4.4) : wp(4.8),
      maxWidth: isWide ? '100%' : '92%',
    },
    statsRow: {
      ...shared.statsRow,
      marginBottom: isCompact ? hp(1.8) : hp(2.2),
    },
    section: {
      marginBottom: isCompact ? hp(1.8) : hp(2.2),
      width: '100%',
    },
    sectionTitle: {
      color: colors.gray,
      fontSize: isCompact ? wp(2.6) : wp(2.8),
      fontFamily: fonts.semibold,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: isCompact ? hp(0.8) : hp(1),
      marginLeft: wp(1),
    },
    sectionCard: {
      borderRadius: cardRadius,
      backgroundColor: colors.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      overflow: 'hidden',
      width: '100%',
      ...cardShadow(isDark),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: isCompact ? hp(1.3) : hp(1.6),
      paddingHorizontal: isWide ? wp(4.5) : wp(4),
      minHeight: isCompact ? hp(7) : hp(7.8),
      backgroundColor: colors.cardBg,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder || colors.border,
    },
    rowPressed: {
      backgroundColor: isDark ? `${colors.primary}12` : `${colors.primary}08`,
    },
    iconBox: {
      width: iconBoxSize,
      height: iconBoxSize,
      borderRadius: iconRadius,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isNarrow ? wp(3) : wp(3.5),
      flexShrink: 0,
    },
    iconImage: {
      width: isCompact ? wp(4.6) : wp(5),
      height: isCompact ? wp(4.6) : wp(5),
      tintColor: colors.white,
    },
    textContainer: {
      flex: 1,
      marginRight: wp(2),
      minWidth: 0,
      justifyContent: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: wp(2),
    },
    buttonTitle: {
      flexShrink: 1,
      color: colors.appText || colors.text,
      fontSize: isCompact ? wp(3.6) : wp(3.9),
      fontFamily: fonts.semibold,
      letterSpacing: 0.1,
    },
    buttonSubtitle: {
      color: colors.gray,
      fontSize: isCompact ? wp(2.9) : wp(3.1),
      marginTop: hp(0.4),
      fontFamily: fonts.regular,
      lineHeight: isCompact ? wp(3.8) : wp(4.2),
    },
    soonBadge: {
      paddingHorizontal: isCompact ? wp(2) : wp(2.2),
      paddingVertical: hp(0.25),
      borderRadius: wp(5),
      backgroundColor: isDark ? `${colors.primary}22` : `${colors.primary}14`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.primary}30`,
      flexShrink: 0,
    },
    soonText: {
      color: colors.primary,
      fontSize: isCompact ? wp(2.4) : wp(2.6),
      fontFamily: fonts.semibold,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    chevronWrap: {
      width: chevronSize,
      height: chevronSize,
      borderRadius: chevronSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.inputBg,
      flexShrink: 0,
    },
  });
};

export default getStyles;
