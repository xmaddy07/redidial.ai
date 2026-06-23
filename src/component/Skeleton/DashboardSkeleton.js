import React from 'react';
import { View, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../theme/layout';
import SkeletonBone from './SkeletonBone';
import { useTheme } from '../../hooks/useTheme';

function KpiCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.kpiWrap}>
      <View style={[styles.kpiCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <SkeletonBone width="60%" height={12} />
        <SkeletonBone width="45%" height={28} style={styles.kpiValue} />
        <SkeletonBone width="35%" height={10} />
      </View>
    </View>
  );
}

function RecentRowSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.recentRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <SkeletonBone width={wp(11)} height={wp(11)} borderRadius={wp(5.5)} />
      <View style={styles.recentBody}>
        <SkeletonBone width="50%" height={14} />
        <SkeletonBone width="70%" height={11} style={styles.gap} />
        <SkeletonBone width="55%" height={11} />
      </View>
      <SkeletonBone width={wp(16)} height={24} borderRadius={8} />
    </View>
  );
}

export function DashboardKpiSkeleton() {
  return (
    <View style={styles.kpiGrid}>
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
    </View>
  );
}

export function DashboardChartSkeleton({ height = hp(20) }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <SkeletonBone width="55%" height={16} />
      <SkeletonBone width="40%" height={11} style={styles.gap} />
      <SkeletonBone width="100%" height={height} borderRadius={12} style={styles.chartArea} />
    </View>
  );
}

export function DashboardRecentSkeleton({ count = 4 }) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <SkeletonBone width="45%" height={16} />
        <SkeletonBone width={wp(16)} height={12} />
      </View>
      {Array.from({ length: count }).map((_, index) => (
        <RecentRowSkeleton key={`recent-skeleton-${index}`} />
      ))}
    </View>
  );
}

export default function DashboardSkeleton({ chartHeight = hp(20) }) {
  return (
    <View style={styles.container}>
      <DashboardKpiSkeleton />
      <DashboardChartSkeleton height={chartHeight} />
      <DashboardRecentSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: hp(1),
  },
  kpiWrap: {
    width: '48%',
    marginBottom: wp(3),
  },
  kpiCard: {
    borderRadius: wp(4.5),
    padding: wp(3.5),
    minHeight: hp(12),
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  kpiValue: {
    marginVertical: hp(1),
  },
  chartCard: {
    borderRadius: wp(4.5),
    padding: wp(4),
    marginTop: hp(0.5),
    borderWidth: 1,
  },
  chartArea: {
    marginTop: hp(1.5),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(2),
    marginBottom: hp(1.2),
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(4),
    padding: wp(3.5),
    marginBottom: hp(1.2),
    borderWidth: 1,
  },
  recentBody: {
    flex: 1,
    marginHorizontal: wp(2.5),
  },
  gap: {
    marginTop: hp(0.7),
  },
});
