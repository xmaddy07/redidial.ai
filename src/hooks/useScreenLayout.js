import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { buildStyleOptions, buildTabBarStyleOptions, getScreenLayout } from '../theme/layout'

export function useScreenLayout({ tabBarAware = false } = {}) {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const layout = useMemo(() => getScreenLayout(width), [width])
  const styleOptions = useMemo(
    () => tabBarAware
      ? buildTabBarStyleOptions(layout, insets.bottom)
      : buildStyleOptions(layout, insets.bottom),
    [layout, insets.bottom, tabBarAware],
  )

  return {
    layout,
    styleOptions,
    screenWidth: width,
    screenHeight: height,
    insets,
  }
}
