import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SkeletonLayout, SkeletonBone } from '../Skeleton';
import { getLoadingViewStyles } from './styles';

export default function LoadingView({
  text = 'Loading...',
  style,
  color,
  flex,
  skeleton,
  skeletonCount = 8,
  chartHeight,
  showBadge,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => getLoadingViewStyles(colors), [colors]);

  if (skeleton) {
    return (
      <SkeletonLayout
        type={skeleton}
        count={skeletonCount}
        style={style}
        flex={flex}
        chartHeight={chartHeight}
        showBadge={showBadge}
      />
    );
  }

  return (
    <View style={[styles.wrap, flex && styles.wrapFlex, style]}>
      <ActivityIndicator size="large" color={color || colors.primary} />
      {!!text && <Text style={styles.label}>{text}</Text>}
    </View>
  );
}

export function LoadMoreSkeleton({ style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getLoadingViewStyles(colors), [colors]);

  return (
    <View style={[styles.loadMore, style]}>
      <SkeletonBone width="40%" height={10} borderRadius={6} />
    </View>
  );
}
