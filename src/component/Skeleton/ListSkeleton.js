import React from 'react';
import { View, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../theme/layout';
import SkeletonBone from './SkeletonBone';
import { useTheme } from '../../hooks/useTheme';

function ListRowSkeleton({ showBadge = false }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <SkeletonBone width={wp(10)} height={wp(10)} borderRadius={wp(5)} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <SkeletonBone width="55%" height={14} />
          <SkeletonBone width={wp(12)} height={10} borderRadius={4} />
        </View>
        <SkeletonBone width="80%" height={11} style={styles.gap} />
        <SkeletonBone width="45%" height={11} />
        {showBadge ? (
          <SkeletonBone width={wp(18)} height={18} borderRadius={6} style={styles.gap} />
        ) : null}
      </View>
    </View>
  );
}

export default function ListSkeleton({ count = 8, showBadge = false, style, flex }) {
  return (
    <View style={[styles.container, flex && styles.flex, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <ListRowSkeleton key={`list-skeleton-${index}`} showBadge={showBadge} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: hp(1),
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.4),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
    marginLeft: wp(3),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  gap: {
    marginTop: hp(0.8),
  },
});
