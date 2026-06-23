import { Platform } from 'react-native'
import {
  widthPercentageToDP,
  heightPercentageToDP,
} from 'react-native-responsive-screen'

const wp = widthPercentageToDP
const hp = heightPercentageToDP

export {
  wp,
  hp,
  widthPercentageToDP,
  heightPercentageToDP,
}

export const BREAKPOINTS = {
  compact: 380,
  narrow: 414,
  wide: 600,
  tablet: 768,
}

export function getScreenLayout(screenWidth) {
  return {
    screenWidth,
    isCompact: screenWidth < BREAKPOINTS.compact,
    isNarrow: screenWidth < BREAKPOINTS.narrow,
    isWide: screenWidth >= BREAKPOINTS.wide,
    isTablet: screenWidth >= BREAKPOINTS.tablet,
  }
}

export function getContentMaxWidth(isWide, cap = 560) {
  return isWide ? Math.min(wp(85), cap) : undefined
}

export function getScrollBottomPadding(bottomInset, floor = null) {
  const minimum = floor ?? hp(12)
  return Math.max(minimum, bottomInset + hp(1))
}

export function screenPadding(isWide = false, isCompact = false) {
  if (isWide) return wp(6)
  if (isCompact) return wp(3.5)
  return wp(4)
}

export function normalizeStyleOptions(thirdArg = {}) {
  if (typeof thirdArg === 'number') {
    return { bottomInset: thirdArg }
  }
  if (!thirdArg || typeof thirdArg !== 'object') {
    return {}
  }
  return thirdArg
}

export function buildStyleOptions(layout, bottomInset = 0) {
  return {
    ...layout,
    bottomInset,
  }
}

export function getDrawerMetrics(screenWidth) {
  const { isCompact, isTablet } = getScreenLayout(screenWidth)
  const drawerWidth = isTablet
    ? Math.min(320, Math.round(screenWidth * 0.36))
    : Math.min(320, Math.max(260, Math.round(screenWidth * (isCompact ? 0.84 : 0.78))))

  return { drawerWidth, isCompact, isTablet }
}

export function getTabBarBottomInset(bottomInset) {
  return Platform.OS === 'ios' ? bottomInset : 0
}

export function buildTabBarStyleOptions(layout, bottomInset = 0) {
  return buildStyleOptions(layout, getTabBarBottomInset(bottomInset))
}

// Aliases kept for gradual migration
export const getChatLayout = getScreenLayout
export const getSettingLayout = getScreenLayout
export const getDashboardLayout = getScreenLayout
export const getProfileLayout = getScreenLayout

export function getModalLayout(screenWidth) {
  const { isCompact, isWide, screenWidth: width } = getScreenLayout(screenWidth)
  return { isCompact, isWide, screenWidth: width }
}
