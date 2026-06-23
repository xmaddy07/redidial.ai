import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInRight,
} from 'react-native-reanimated'
import { hp, wp } from '../../../theme/layout'

export const authEntering = {
  header: FadeIn.duration(700),
  title: FadeInRight.delay(120).duration(550).springify().damping(18),
  card: FadeInRight.delay(260).duration(600).springify().damping(20),
  button: FadeInRight.delay(400).duration(500).springify(),
  footer: FadeInRight.delay(480).duration(500).springify(),
  fade: FadeIn.duration(300),
}

export function createAuthAmbientStyles() {
  return {
    ambientLayer: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    orbRightTop: {
      top: hp(8),
      right: -wp(18),
    },
    orbRightMid: {
      top: hp(40),
      right: -wp(10),
    },
    orbRightLow: {
      bottom: hp(14),
      right: -wp(16),
    },
    orbLeftLow: {
      bottom: hp(12),
      left: -wp(12),
    },
    orbLeftMid: {
      top: hp(38),
      left: wp(8),
    },
  }
}

const FloatingOrb = ({ size, color, style, duration = 4000, delay = 0 }) => {
  const translateY = useSharedValue(0)
  const translateX = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    const easing = Easing.inOut(Easing.sin)
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-hp(2.2), { duration, easing }),
          withTiming(hp(2.2), { duration, easing }),
        ),
        -1,
        true,
      ),
    )
    translateX.value = withDelay(
      delay + 400,
      withRepeat(
        withSequence(
          withTiming(wp(3), { duration: duration * 1.2, easing }),
          withTiming(-wp(3), { duration: duration * 1.2, easing }),
        ),
        -1,
        true,
      ),
    )
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: duration * 0.9, easing }),
          withTiming(0.92, { duration: duration * 0.9, easing }),
        ),
        -1,
        true,
      ),
    )
  }, [delay, duration, scale, translateX, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
        animatedStyle,
      ]}
    />
  )
}

export function AuthAmbientLayer({ brand, styles, variant = 'full' }) {
  const showLeft = variant === 'full'

  return (
    <View style={styles.ambientLayer} pointerEvents="none">
      <FloatingOrb
        size={wp(55)}
        color={`${brand.primary}14`}
        style={styles.orbRightTop}
        duration={5200}
      />
      <FloatingOrb
        size={wp(34)}
        color="rgba(249, 115, 22, 0.08)"
        style={styles.orbRightMid}
        duration={4600}
        delay={500}
      />
      <FloatingOrb
        size={wp(20)}
        color={`${brand.accent}59`}
        style={styles.orbRightLow}
        duration={3800}
        delay={900}
      />
      {showLeft ? (
        <>
          <FloatingOrb
            size={wp(38)}
            color="rgba(249, 115, 22, 0.07)"
            style={styles.orbLeftLow}
            duration={4600}
            delay={600}
          />
          <FloatingOrb
            size={wp(22)}
            color={`${brand.accent}40`}
            style={styles.orbLeftMid}
            duration={3800}
            delay={300}
          />
        </>
      ) : null}
    </View>
  )
}
