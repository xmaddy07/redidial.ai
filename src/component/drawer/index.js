import React from 'react'
import { View, Text, StyleSheet, Image, Platform, Pressable, useWindowDimensions } from 'react-native'
import { Alert } from '../../utils/alert'
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer'
import { wp, hp, getDrawerMetrics } from '../../theme/layout'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'
import ThemeToggle from '../ThemeToggle'
import { fonts, images } from '../../constant'
import Vehicles from '../../screens/main/vehicles'
import Customers from '../../screens/main/customers'
import DncList from '../../screens/main/dncList'
import OrganizationUsers from '../../screens/main/organizationUsers'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/authSlice'
import { clearPreferences, toggleThemeMode } from '../../redux/themeSlice'
import { disconnectSocket } from '../../services'
import { clearTeamChatUnreadStore } from '../../utils/teamChatNotify'
import { clearOfflineCache, stopOfflineSync } from '../../services/offlineSync'
import { clearCachedFcmToken } from '../../services/pushNotifications'
import ImportSession from '../../screens/main/importSession'
import TestDrive from '../../screens/main/testDrive'
import { useTheme } from '../../hooks/useTheme'
import { useDebouncedOrgPreferencesRefetch } from '../../hooks/useOrgPreferencesSync'
import MainTabs from '../bottomTabs'

const TAB_MENU = [
  { label: 'Dashboard', icon: 'home-outline', iconActive: 'home', route: 'Dashboard', isTab: true },
  { label: 'Leads', icon: 'stats-chart-outline', iconActive: 'stats-chart', route: 'Leads', isTab: true },
  { label: 'Chat', icon: 'chatbubble-outline', iconActive: 'chatbubble', route: 'Chat', showBadge: true, isTab: true },
  { label: 'Team Messages', icon: 'people-circle-outline', iconActive: 'people-circle', route: 'TeamMessages', isTab: true },
  { label: 'Settings', icon: 'settings-outline', iconActive: 'settings', route: 'Settings', isTab: true },
]

const DRAWER_MENU = [
  { label: 'Customers', icon: 'people-outline', iconActive: 'people', route: 'Customers' },
  { label: 'Organization Users', icon: 'business-outline', iconActive: 'business', route: 'OrganizationUsers' },
  { label: 'Vehicles', icon: 'car-outline', iconActive: 'car', route: 'Vehicles' },
  { label: 'Test Drive', icon: 'calendar-outline', iconActive: 'calendar', route: 'TestDrive' },
  { label: 'Import Session', icon: 'cloud-upload-outline', iconActive: 'cloud-upload', route: 'ImportSession' },
  { label: 'DNC List', icon: 'ban-outline', iconActive: 'ban', route: 'DncList' },
]

const TAB_ROUTE_NAMES = new Set(TAB_MENU.filter((item) => item.isTab).map((item) => item.route))
const SPRING = { damping: 18, stiffness: 260, mass: 0.75 }

function getDrawerLayout(screenWidth) {
  return getDrawerMetrics(screenWidth)
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function deriveUserDisplay(user) {
  if (!user) return { name: 'Welcome back', email: '', initials: '?' }
  const name =
    user.name || user.fullName || user.username ||
    (user.email ? String(user.email).split('@')[0] : 'User')
  const email = user.email || user.contactEmail || ''
  const initials = String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U'
  return { name, email, initials }
}

function DrawerMenuItem({ item, isActive, onPress, colors, styles, iconSize }) {
  const scale = useSharedValue(1)

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const iconName = isActive ? item.iconActive : item.icon

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98, SPRING) }}
      onPressOut={() => { scale.value = withSpring(1, SPRING) }}
      style={[styles.menuItemTouchable, pressStyle]}
    >
      <View style={[styles.menuItemRow, isActive && styles.menuItemRowActive]}>
        {isActive ? (
          <LinearGradient
            colors={[`${colors.primary}20`, `${colors.primary}0A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.menuItemActiveBg}
          />
        ) : null}
        {isActive ? (
          <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        ) : null}
        <View style={[styles.iconBubble, isActive && styles.iconBubbleActive]}>
          <Icon
            name={iconName}
            size={iconSize}
            color={isActive ? colors.primary : colors.gray}
          />
          {item.showBadge ? <View style={styles.chatBadge} /> : null}
        </View>
        <Text style={isActive ? styles.menuTextActive : styles.menuText}>{item.label}</Text>
      </View>
    </AnimatedPressable>
  )
}

function getActiveRouteName(state) {
  const route = state.routes[state.index]
  if (route?.state) {
    const nested = route.state.routes[route.state.index]
    return nested?.name ?? route.name
  }
  return route?.name
}

function CustomDrawerContent(props) {
  const { state, navigation } = props
  const dispatch = useDispatch()
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const layout = getDrawerLayout(screenWidth)
  const themeMode = useSelector((s) => s.theme.themeMode) || 'light'
  const user = useSelector((s) => s.auth.user)
  const { colors, logoPath, themeMode: mode } = useTheme()
  const isDark = mode === 'dark'
  const styles = getStyles(colors, isDark, layout)
  const iconSize = layout.isCompact ? 18 : 20
  const userDisplay = deriveUserDisplay(user)

  const activeRouteName = getActiveRouteName(state)

  const handleLogout = () => {
    navigation.closeDrawer()
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            stopOfflineSync()
            clearOfflineCache().catch(() => {})
            clearTeamChatUnreadStore().catch(() => {})
            dispatch(clearPreferences())
            disconnectSocket()
            clearCachedFcmToken()
            dispatch(logout())
          },
        },
      ],
      { cancelable: true }
    )
  }

  const handleToggleTheme = () => {
    dispatch(toggleThemeMode())
  }

  const handleNavigate = (route) => {
    if (TAB_ROUTE_NAMES.has(route)) {
      navigation.navigate('MainTabs', { screen: route })
    } else {
      navigation.navigate(route)
    }
    navigation.closeDrawer()
  }

  const handleOpenProfile = () => {
    navigation.navigate('userProfile')
    navigation.closeDrawer()
  }

  const drawerLogo = logoPath ? { uri: logoPath } : images.logo

  const renderMenuGroup = (items, sectionLabel) => (
    <View style={styles.menuGroup}>
      {sectionLabel ? <Text style={styles.sectionLabel}>{sectionLabel}</Text> : null}
      {items.map((item) => (
        <DrawerMenuItem
          key={item.route}
          item={item}
          isActive={activeRouteName === item.route}
          onPress={() => handleNavigate(item.route)}
          colors={colors}
          styles={styles}
          iconSize={iconSize}
        />
      ))}
    </View>
  )

  return (
    <View style={styles.drawerContainer}>
      <LinearGradient
        colors={
          isDark
            ? [`${colors.primary}18`, colors.sidebarBg, colors.sidebarBg]
            : [`${colors.primary}0C`, colors.sidebarBg, colors.sidebarBg]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.35 }}
        style={styles.topAccent}
        pointerEvents="none"
      />

      <View style={[styles.header, { paddingTop: insets.top + hp(1.5) }]}>
        <View style={styles.brandRow}>
          <View style={styles.logoBlock}>
            <Image source={drawerLogo} resizeMode="contain" style={styles.logo} />
          </View>
          <ThemeToggle themeMode={themeMode} onPress={handleToggleTheme} />
        </View>

        <Pressable
          onPress={handleOpenProfile}
          style={({ pressed }) => [styles.profileCard, pressed && styles.profileCardPressed]}
        >
          <LinearGradient
            colors={
              isDark
                ? [`${colors.primary}28`, `${colors.primary}0C`]
                : [`${colors.primary}18`, `${colors.primary}08`]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCardGradient}
          />
          <View style={styles.avatarRing}>
            <LinearGradient
              colors={[colors.primary, `${colors.primary}BF`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{userDisplay.initials}</Text>
            </LinearGradient>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName} numberOfLines={1}>{userDisplay.name}</Text>
            {userDisplay.email ? (
              <Text style={styles.profileEmail} numberOfLines={1}>{userDisplay.email}</Text>
            ) : (
              <Text style={styles.profileHint}>View profile</Text>
            )}
          </View>
          <View style={styles.profileChevronWrap}>
            <Icon name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </Pressable>
      </View>

      <DrawerContentScrollView
        {...props}
        style={styles.menuScroll}
        contentContainerStyle={styles.menuScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          {renderMenuGroup(TAB_MENU, 'Main')}
          <View style={styles.sectionDivider} />
          {renderMenuGroup(DRAWER_MENU, 'More')}
        </View>
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, hp(2)) }]}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
        >
          <View style={styles.logoutIconWrap}>
            <Icon name="log-out-outline" size={20} color={colors.danger} />
          </View>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        <View style={styles.poweredByWrap}>
          <Text style={styles.poweredByLabel}>POWERED BY</Text>
          <Image source={images.logo} resizeMode="contain" style={styles.poweredByLogo} />
        </View>
      </View>
    </View>
  )
}

export default function Drawer() {
  const DrawerNav = createDrawerNavigator()
  const { width: screenWidth } = useWindowDimensions()
  const { drawerWidth } = getDrawerLayout(screenWidth)
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const token = useSelector((state) => state.auth.token)
  const refetchOnScreenFocus = useDebouncedOrgPreferencesRefetch(token)
  const screenListeners = { focus: refetchOnScreenFocus }

  return (
    <DrawerNav.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.sidebarBg,
          width: drawerWidth,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 4, height: 0 },
              shadowOpacity: isDark ? 0.35 : 0.12,
              shadowRadius: 16,
            },
            android: {
              elevation: 12,
            },
          }),
        },
        overlayColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(15,23,42,0.25)',
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.sidebarText,
      }}
    >
      <DrawerNav.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <DrawerNav.Screen name="Customers" component={Customers} listeners={screenListeners} />
      <DrawerNav.Screen name="OrganizationUsers" component={OrganizationUsers} listeners={screenListeners} />
      <DrawerNav.Screen name="Vehicles" component={Vehicles} listeners={screenListeners} />
      <DrawerNav.Screen name="TestDrive" component={TestDrive} listeners={screenListeners} />
      <DrawerNav.Screen name="ImportSession" component={ImportSession} listeners={screenListeners} />
      <DrawerNav.Screen name="DncList" component={DncList} listeners={screenListeners} />
    </DrawerNav.Navigator>
  )
}

const getStyles = (colors, isDark, layout = {}) => {
  const { drawerWidth = 300, isCompact = false } = layout
  const logoWidth = Math.min(drawerWidth * 0.62, isCompact ? 118 : 138)
  const logoHeight = isCompact ? hp(4.2) : hp(5)
  const menuRowMinHeight = isCompact ? 48 : 52
  const menuRowPaddingV = isCompact ? hp(1.1) : hp(1.3)
  const iconBubbleSize = isCompact ? 32 : 34
  const menuFontSize = isCompact ? 14 : 15

  return StyleSheet.create({
    drawerContainer: {
      flex: 1,
      backgroundColor: colors.sidebarBg,
    },
    topAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: hp(22),
      pointerEvents: 'none',
    },
    menuScroll: {
      flex: 1,
    },
    menuScrollContent: {
      paddingTop: 0,
      paddingBottom: hp(1),
      paddingStart: 0,
      paddingEnd: 0,
    },
    header: {
      paddingHorizontal: wp(5),
      paddingBottom: hp(1.2),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.surfaceBorder,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: hp(2),
    },
    logoBlock: {
      flex: 1,
      paddingRight: wp(3),
    },
    logo: {
      width: logoWidth,
      height: logoHeight,
      maxWidth: '100%',
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      paddingHorizontal: wp(3.5),
      paddingVertical: hp(1.5),
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? `${colors.primary}35` : `${colors.primary}22`,
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.22 : 0.14,
          shadowRadius: 10,
        },
        android: {
          // elevation: 3,
        },
      }),
    },
    profileCardGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    profileCardPressed: {
      opacity: 0.9,
    },
    avatarRing: {
      padding: 2.5,
      borderRadius: wp(6.2),
      backgroundColor: isDark ? `${colors.primary}35` : `${colors.primary}20`,
    },
    avatar: {
      width: wp(10),
      height: wp(10),
      borderRadius: wp(5),
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.white,
    },
    profileMeta: {
      flex: 1,
      marginLeft: wp(3),
      marginRight: wp(2),
    },
    profileName: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.sidebarText,
    },
    profileEmail: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.gray,
      marginTop: 2,
    },
    profileHint: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.primary,
      marginTop: 2,
    },
    profileChevronWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? `${colors.primary}28` : `${colors.primary}16`,
    },
    menuContainer: {
      width: '100%',
      paddingHorizontal: wp(4),
      paddingTop: hp(0.4),
    },
    menuGroup: {
      gap: hp(0.3),
    },
    sectionLabel: {
      fontSize: 11,
      fontFamily: fonts.semibold,
      color: colors.gray,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: hp(0.5),
      marginLeft: wp(1),
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.surfaceBorder,
      marginVertical: hp(1.5),
    },
    menuItemTouchable: {
      width: '100%',
    },
    menuItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: menuRowMinHeight,
      paddingVertical: menuRowPaddingV,
      paddingHorizontal: wp(3),
      borderRadius: 12,
      overflow: 'hidden',
    },
    menuItemRowActive: {
      paddingLeft: wp(3.5),
    },
    menuItemActiveBg: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 12,
    },
    activeIndicator: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderTopRightRadius: 3,
      borderBottomRightRadius: 3,
    },
    iconBubble: {
      width: iconBubbleSize,
      height: iconBubbleSize,
      borderRadius: isCompact ? 9 : 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.inputBg,
    },
    iconBubbleActive: {
      backgroundColor: isDark ? `${colors.primary}30` : `${colors.primary}18`,
    },
    chatBadge: {
      position: 'absolute',
      top: 3,
      right: 3,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.danger,
      borderWidth: 1.5,
      borderColor: colors.sidebarBg,
    },
    menuText: {
      flex: 1,
      fontSize: menuFontSize,
      fontFamily: fonts.medium,
      color: colors.sidebarText,
      marginLeft: wp(2.5),
    },
    menuTextActive: {
      flex: 1,
      fontSize: menuFontSize,
      fontFamily: fonts.semibold,
      color: colors.primary,
      marginLeft: wp(2.5),
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.surfaceBorder,
      paddingHorizontal: wp(5),
      paddingTop: hp(1.5),
      backgroundColor: colors.sidebarBg,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(1),
      paddingHorizontal: wp(2),
      borderRadius: 12,
    },
    logoutButtonPressed: {
      opacity: 0.85,
    },
    logoutIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.danger}12`,
      marginRight: wp(2.5),
    },
    logoutText: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.danger,
    },
    poweredByWrap: {
      alignItems: 'center',
      marginTop: hp(1.2),
      paddingTop: hp(1.2),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.surfaceBorder,
    },
    poweredByLabel: {
      fontSize: 10,
      fontFamily: fonts.medium,
      color: colors.gray,
      letterSpacing: 1.6,
      marginBottom: hp(0.5),
    },
    poweredByLogo: {
      width: Math.min(drawerWidth * 0.48, isCompact ? 108 : 124),
      height: isCompact ? hp(2.8) : hp(3.2),
    },
  })
}
