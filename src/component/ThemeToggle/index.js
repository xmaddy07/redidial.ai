import React, { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated'
import LinearGradient from 'react-native-linear-gradient'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { widthPercentageToDP as wp } from '../../theme/layout'
import { useTheme } from '../../hooks/useTheme'

const TRACK_WIDTH = wp(16)
const TRACK_HEIGHT = wp(8.5)
const KNOB_SIZE = wp(6.8)
const H_INSET = wp(0.85)
const V_INSET = (TRACK_HEIGHT - KNOB_SIZE) / 2
const TRAVEL = TRACK_WIDTH - KNOB_SIZE - H_INSET * 2

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function ThemeToggle({ themeMode, onPress }) {
  const { colors } = useTheme()
  const isLight = themeMode === 'light'
  const progress = useSharedValue(isLight ? 0 : 1)
  const pressScale = useSharedValue(1)

  useEffect(() => {
    progress.value = withSpring(isLight ? 0 : 1, {
      damping: 22,
      stiffness: 260,
      mass: 0.7,
    })
  }, [isLight, progress])

  const handlePress = () => {
    pressScale.value = withSpring(0.94, { damping: 14, stiffness: 400 }, () => {
      pressScale.value = withSpring(1, { damping: 12, stiffness: 200 })
    })
    onPress()
  }

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }))

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: H_INSET + progress.value * TRAVEL },
      { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.05, 1]) },
    ],
    shadowOpacity: interpolate(progress.value, [0, 1], [0.14, 0.32]),
  }))

  const trackBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [`${colors.primary}35`, `${colors.primary}60`]
    ),
  }))

  const trackGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.4, 0.75]),
  }))

  const sunStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45, 1], [1, 0, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.5]) }],
  }))

  const moonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.55, 1], [0, 0, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.5, 1]) }],
  }))

  const trackTint = isLight
    ? [colors.inputBg, `${colors.primary}14`]
    : [`${colors.primary}28`, colors.surfaceBg]

  const knobGradient = isLight ? [colors.white, '#F1F5F9'] : ['#FFFFFF', '#E2E8F0']
  const ghostIconColor = isLight ? `${colors.primary}50` : `${colors.primary}75`

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.pressable, containerStyle]}
      accessibilityRole="switch"
      accessibilityState={{ checked: !isLight }}
      accessibilityLabel={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <Animated.View
        style={[
          styles.trackOuter,
          trackBorderStyle,
          { width: TRACK_WIDTH, height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2 },
        ]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, trackGlowStyle]}>
          <LinearGradient
            colors={trackTint}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[StyleSheet.absoluteFill, { borderRadius: TRACK_HEIGHT / 2 }]}
          />
        </Animated.View>

        <View style={styles.ghostIcons} pointerEvents="none">
          <Ionicons name="sunny-outline" size={wp(3.2)} color={ghostIconColor} />
          <Ionicons name="moon-outline" size={wp(3.2)} color={ghostIconColor} />
        </View>

        <Animated.View
          style={[
            styles.knobShadow,
            knobStyle,
            {
              top: V_INSET,
              width: KNOB_SIZE,
              height: KNOB_SIZE,
              borderRadius: KNOB_SIZE / 2,
              shadowColor: colors.primary,
            },
          ]}
        >
          <LinearGradient
            colors={knobGradient}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[styles.knob, { width: KNOB_SIZE, height: KNOB_SIZE, borderRadius: KNOB_SIZE / 2 }]}
          >
            <Animated.View style={[styles.iconLayer, sunStyle]}>
              <Ionicons name="sunny" size={wp(3.5)} color={colors.primary} />
            </Animated.View>
            <Animated.View style={[styles.iconLayer, moonStyle]}>
              <Ionicons name="moon" size={wp(3.5)} color={colors.primary} />
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackOuter: {
    overflow: 'hidden',
    borderWidth: 1,
    justifyContent: 'center',
  },
  ghostIcons: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_INSET + wp(1.2),
  },
  knobShadow: {
    position: 'absolute',
    left: 0,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
  },
  knob: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
