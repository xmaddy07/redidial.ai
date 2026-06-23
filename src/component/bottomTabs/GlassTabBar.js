import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

let BlurView = null
if (Platform.OS === 'ios') {
  BlurView = require('@react-native-community/blur').BlurView
}
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'
import { widthPercentageToDP as wp } from '../../theme/layout'
import { fonts } from '../../constant'
import { useTheme } from '../../hooks/useTheme'
import { useTeamChatTabBadge } from '../../hooks/useTeamChatGlobalNotify'

const TAB_CONFIG = {
  Dashboard: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  Leads: { label: 'Leads', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  Chat: { label: 'Chat', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  TeamMessages: { label: 'Team', icon: 'people-circle-outline', iconActive: 'people-circle' },
  Settings: { label: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
}

const SPRING = { damping: 20, stiffness: 260, mass: 0.75 }
const TAB_ROW_PADDING = 6
const INDICATOR_INSET = Platform.OS === 'android' ? 8 : 4
const INDICATOR_TOP = Platform.OS === 'android' ? 8 : 7
const INDICATOR_HEIGHT = Platform.OS === 'android' ? 36 : 42
const INDICATOR_RADIUS = INDICATOR_HEIGHT / 2

function TabItem({
  route,
  isFocused,
  config,
  colors,
  styles,
  options,
  navigation,
  tabWidth,
  onPress,
  isDark,
  badgeCount = 0,
}) {
  const progress = useSharedValue(isFocused ? 1 : 0)

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, SPRING)
  }, [isFocused, progress])

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }))

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + progress.value * 0.5,
    transform: [{ translateY: (1 - progress.value) * 1 }],
  }))

  const inactiveColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.38)'

  const labelColor = useDerivedValue(() =>
    interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, colors.primary],
    ),
  )

  const animatedLabelColor = useAnimatedStyle(() => ({
    color: labelColor.value,
  }))

  const onLongPress = () => {
    navigation.emit({ type: 'tabLongPress', target: route.key })
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tabItem, { width: tabWidth }]}
    >
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <Icon
          name={isFocused ? config.iconActive : config.icon}
          size={22}
          color={isFocused ? colors.primary : inactiveColor}
        />
        {badgeCount > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>
              {badgeCount > 9 ? '9+' : badgeCount}
            </Text>
          </View>
        )}
      </Animated.View>
      <Animated.Text
        style={[
          styles.tabLabel,
          isFocused && styles.tabLabelActive,
          labelStyle,
          animatedLabelColor,
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Animated.Text>
    </Pressable>
  )
}

export default function GlassTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets()
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const styles = getStyles(colors, isDark)
  const [teamUnread, setTeamUnread] = useState(0)

  useTeamChatTabBadge(setTeamUnread)

  const [barWidth, setBarWidth] = useState(0)
  const tabCount = state.routes.length
  const contentWidth = Math.max(barWidth - TAB_ROW_PADDING * 2, 0)
  const tabWidth = contentWidth > 0 ? contentWidth / tabCount : 0
  const indicatorWidth = tabWidth > 0 ? tabWidth - INDICATOR_INSET * 2 : 0

  const indicatorX = useSharedValue(0)

  useEffect(() => {
    if (tabWidth > 0) {
      indicatorX.value = withSpring(
        state.index * tabWidth + INDICATOR_INSET,
        SPRING,
      )
    }
  }, [state.index, tabWidth, indicatorX])

  const onBarLayout = useCallback((e) => {
    setBarWidth(e.nativeEvent.layout.width)
  }, [])

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth,
  }))

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 14)

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset }]}>
      <View style={styles.outerShadow}>
        <View style={styles.glassShell}>
          {BlurView ? (
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType={isDark ? 'dark' : 'xlight'}
              blurAmount={40}
              reducedTransparencyFallbackColor={
                isDark ? 'rgba(18, 20, 28, 0.88)' : 'rgba(255, 255, 255, 0.82)'
              }
            />
          ) : null}

          <LinearGradient
            colors={
              isDark
                ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']
                : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.25)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.glassBorder} />
          <View style={styles.glassHighlight} />

          <View style={styles.tabRow} onLayout={onBarLayout}>
            {tabWidth > 0 ? (
              <Animated.View style={[styles.liquidIndicator, indicatorStyle]}>
                <LinearGradient
                  colors={
                    isDark
                      ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.04)']
                      : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.02)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.liquidIndicatorFill}
                />
              </Animated.View>
            ) : null}

            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key]
              const config = TAB_CONFIG[route.name] || {
                label: route.name,
                icon: 'ellipse-outline',
                iconActive: 'ellipse',
              }
              const isFocused = state.index === index

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                })
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name)
                }
              }

              return (
                <TabItem
                  key={route.key}
                  route={route}
                  isFocused={isFocused}
                  config={config}
                  colors={colors}
                  styles={styles}
                  options={options}
                  navigation={navigation}
                  tabWidth={tabWidth}
                  onPress={onPress}
                  isDark={isDark}
                  badgeCount={route.name === 'TeamMessages' ? teamUnread : 0}
                />
              )
            })}
          </View>
        </View>
      </View>
    </View>
  )
}

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: wp(4.5),
      paddingTop: 8,
    },
    outerShadow: {
      borderRadius: 28,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000' : 'rgba(0, 0, 0, 0.25)',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 20,
        },
        android: {
          elevation: 12,
        },
      }),
    },
    glassShell: {
      borderRadius: 28,
      overflow: 'hidden',
      minHeight: 72,
      backgroundColor: isDark ? 'rgba(18, 20, 28, 0.92)' : 'rgba(255, 255, 255, 0.92)',
    },
    glassBorder: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 28,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: isDark
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(255, 255, 255, 0.9)',
    },
    glassHighlight: {
      position: 'absolute',
      top: 0,
      left: 16,
      right: 16,
      height: 1,
      backgroundColor: isDark
        ? 'rgba(255, 255, 255, 0.15)'
        : 'rgba(255, 255, 255, 0.95)',
      borderRadius: 1,
    },
    tabRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: TAB_ROW_PADDING,
      paddingTop: 8,
      paddingBottom: 7,
      position: 'relative',
    },
    liquidIndicator: {
      position: 'absolute',
      top: INDICATOR_TOP,
      left: TAB_ROW_PADDING,
      height: INDICATOR_HEIGHT,
    },
    liquidIndicatorFill: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: INDICATOR_RADIUS,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.7)',
    },
    tabItem: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 2,
      zIndex: 1,
    },
    iconWrap: {
      width: 40,
      height: Platform.OS === 'android' ? 30 : 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Platform.OS === 'android' ? 4 : 2,
    },
    tabBadge: {
      position: 'absolute',
      top: -2,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(18, 20, 28, 0.92)' : 'rgba(255, 255, 255, 0.92)',
    },
    tabBadgeText: {
      fontSize: 9,
      fontFamily: fonts.bold,
      color: colors.white,
      lineHeight: 12,
    },
    tabLabel: {
      fontSize: Platform.OS === 'android' ? 9.5 : 10,
      fontFamily: fonts.medium,
      textAlign: 'center',
      letterSpacing: 0.35,
    },
    tabLabelActive: {
      fontFamily: fonts.semibold,
      letterSpacing: 0.4,
    },
  })
