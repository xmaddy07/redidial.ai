import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../theme/layout';
import { fonts } from '../../constant';
import { useTheme } from '../../hooks/useTheme';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';

function HeaderIconButton({ onPress, children, badge, styles, hitSlop = 4 }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.iconButtonPressed,
      ]}
    >
      {children}
      {badge}
    </Pressable>
  );
}

export default function SettingHeader({
  navigation,
  title,
  showNotificationBadge,
  onPressBell,
}) {
  const { colors, themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const styles = getStyles(colors, isDark);
  const unreadNotificationCount = useUnreadNotificationCount();
  const hasNotificationBadge =
    showNotificationBadge === false
      ? false
      : showNotificationBadge === true || unreadNotificationCount > 0;

  const handleBellPress =
    onPressBell || (() => navigation.navigate('notifications'));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.sideGroup}>
          <HeaderIconButton
            onPress={() => navigation.goBack()}
            styles={styles}
          >
            <Icon name="arrow-left" size={20} color={colors.headerText} />
          </HeaderIconButton>
        </View>

        <View style={styles.sideGroup}>
          <HeaderIconButton
            onPress={handleBellPress}
            styles={styles}
            badge={
              hasNotificationBadge ? <View style={styles.badge} /> : null
            }
          >
            <Icon name="bell" size={18} color={colors.headerText} />
          </HeaderIconButton>
        </View>

        <View style={styles.titleOverlay} pointerEvents="none">
          <Text style={styles.headerText} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
      <View style={styles.bottomAccent} />
    </View>
  );
}

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.headerBg,
      paddingHorizontal: wp(4),
      paddingTop: hp(6),
      paddingBottom: hp(1.2),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder || colors.border,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000000' : '#0F172A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.18 : 0.04,
          shadowRadius: 8,
        },
        android: {
          elevation: isDark ? 4 : 2,
        },
      }),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      minHeight: 40,
    },
    sideGroup: {
      zIndex: 1,
    },
    titleOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: wp(22),
    },
    headerText: {
      color: colors.headerText,
      fontFamily: fonts.bold,
      fontSize: 17,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
    },
    iconButtonPressed: {
      backgroundColor: isDark ? `${colors.primary}18` : `${colors.primary}10`,
      opacity: 0.92,
    },
    badge: {
      position: 'absolute',
      top: 7,
      right: 7,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger || colors.primary,
      borderWidth: 1.5,
      borderColor: colors.headerBg,
    },
    bottomAccent: {
      position: 'absolute',
      bottom: 0,
      left: wp(20),
      right: wp(20),
      height: 2,
      borderRadius: 1,
      backgroundColor: `${colors.primary}30`,
    },
  });
