import React from 'react';
import { View, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../theme/layout';
import SkeletonBone from './SkeletonBone';
import { useTheme } from '../../hooks/useTheme';

function CardItemSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <SkeletonBone width="100%" height={hp(12)} borderRadius={10} />
      <SkeletonBone width="65%" height={14} style={styles.gap} />
      <SkeletonBone width="40%" height={11} />
      <View style={styles.footerRow}>
        <SkeletonBone width="30%" height={22} borderRadius={8} />
        <SkeletonBone width={wp(10)} height={wp(10)} borderRadius={wp(5)} />
      </View>
    </View>
  );
}

export default function CardSkeleton({ count = 4, style, flex }) {
  return (
    <View style={[styles.container, flex && styles.flex, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <CardItemSkeleton key={`card-skeleton-${index}`} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  flex: {
    flex: 1,
  },
  card: {
    borderRadius: wp(4),
    padding: wp(3.5),
    marginBottom: hp(1.5),
    borderWidth: 1,
  },
  gap: {
    marginTop: hp(1.2),
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(1.2),
  },
});
