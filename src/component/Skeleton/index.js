import React from 'react';
import CardSkeleton from './CardSkeleton';
import ListSkeleton from './ListSkeleton';
import DashboardSkeleton, {
  DashboardKpiSkeleton,
  DashboardChartSkeleton,
  DashboardRecentSkeleton,
} from './DashboardSkeleton';
import MessagesSkeleton from './MessagesSkeleton';
import SkeletonBone from './SkeletonBone';

const SKELETON_TYPES = {
  list: ListSkeleton,
  messages: MessagesSkeleton,
  dashboard: DashboardSkeleton,
  kpi: DashboardKpiSkeleton,
  chart: DashboardChartSkeleton,
  recent: DashboardRecentSkeleton,
  card: CardSkeleton,
};

export function SkeletonLayout({
  type = 'list',
  count = 8,
  style,
  flex,
  chartHeight,
  showBadge,
}) {
  const Component = SKELETON_TYPES[type] || ListSkeleton;

  if (type === 'dashboard') {
    return <DashboardSkeleton chartHeight={chartHeight} style={style} />;
  }

  if (type === 'chart') {
    return <DashboardChartSkeleton height={chartHeight} style={style} />;
  }

  return (
    <Component
      count={count}
      style={style}
      flex={flex}
      showBadge={showBadge}
      chartHeight={chartHeight}
    />
  );
}

export {
  SkeletonBone,
  ListSkeleton,
  CardSkeleton,
  MessagesSkeleton,
  DashboardSkeleton,
  DashboardKpiSkeleton,
  DashboardChartSkeleton,
  DashboardRecentSkeleton,
};

export default SkeletonLayout;
