import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

const SHIMMER_WIDTH = 120;

export default function SkeletonBone({
  width = '100%',
  height = 14,
  borderRadius = 8,
  style,
}) {
  const { colors, themeMode } = useTheme();
  const translateX = useSharedValue(-SHIMMER_WIDTH);

  const baseColor = themeMode === 'dark' ? colors.cardBg : colors.inputBg;
  const shimmerColor =
    themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)';

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SHIMMER_WIDTH * 3, {
        duration: 1300,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.bone,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerTrack, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', shimmerColor, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    overflow: 'hidden',
  },
  shimmerTrack: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerGradient: {
    width: SHIMMER_WIDTH,
    height: '100%',
  },
});
