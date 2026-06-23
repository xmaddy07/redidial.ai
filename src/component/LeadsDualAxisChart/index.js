import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import moment from 'moment';
import { fonts } from '../../constant';
import { widthPercentageToDP as wp } from '../../theme/layout';
import { computeAxisMax, computeAxisRange } from '../../utils/chartAxisUtils';

const NO_OF_SECTIONS = 5;

const formatAxisDate = (label) => {
  const str = String(label || '');
  const parsed = moment(str, [moment.ISO_8601, 'YYYY-MM-DD', 'MMM D', 'MMM DD'], true);
  if (parsed.isValid()) return parsed.format('MMM D');
  if (str.length >= 10) {
    const iso = moment(str.slice(0, 10));
    if (iso.isValid()) return iso.format('MMM D');
  }
  return str;
};

const buildSecondaryAxis = (values) => {
  const { axisMin, range } = computeAxisRange(values.length ? values : [0]);
  return {
    yAxisOffset: axisMin,
    maxValue: range,
    noOfSections: NO_OF_SECTIONS,
    formatYLabel: (label) => String(Math.round(axisMin + Number(label))),
  };
};

export default function LeadsDualAxisChart({
  categories = [],
  newLeads = [],
  totalLeads = [],
  width,
  height,
  colors,
  themeMode = 'light',
  newLeadsColor,
  totalLeadsColor,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < 380;
  const labelColor = colors?.gray || (themeMode === 'light' ? '#9CA3AF' : '#94A3B8');
  const gridColor = colors?.border || '#E5E7EB';
  const lineNewColor = newLeadsColor || colors?.accent || colors?.primary;
  const lineTotalColor = totalLeadsColor || (themeMode === 'dark' ? '#e2e8f0' : '#64748b');

  const layout = useMemo(() => {
    const sideLabelW = isCompact ? wp(3.8) : wp(4.2);
    const yAxisW = isCompact ? 22 : 26;
    const secondaryYAxisW = isCompact ? 24 : 28;
    const initialSpacing = isCompact ? 2 : 4;
    const endSpacing = isCompact ? 2 : 4;

    const rowWidth = Math.max(width, 0);
    const chartAreaW = Math.max(rowWidth - sideLabelW * 2, 100);
    const lineChartWidth = Math.max(chartAreaW - yAxisW - secondaryYAxisW, 60);
    const count = Math.max(categories.length, 1);
    const spacing =
      count > 1
        ? Math.max((lineChartWidth - initialSpacing - endSpacing) / (count - 1), 6)
        : lineChartWidth;

    return {
      sideLabelW,
      yAxisW,
      secondaryYAxisW,
      initialSpacing,
      endSpacing,
      chartAreaW,
      lineChartWidth,
      spacing,
      axisLabelSize: isCompact ? wp(2.1) : wp(2.3),
      xLabelWidth: Math.max(spacing - 2, isCompact ? 22 : 26),
    };
  }, [width, categories.length, isCompact]);

  const { primaryMax, secondaryAxis, primaryData, secondaryData } = useMemo(() => {
    const primaryPoints = categories.map((cat, index) => ({
      value: Number(newLeads[index]) || 0,
      label: formatAxisDate(cat),
    }));

    const totalPoints = categories.map((cat, index) => ({
      value: Number(totalLeads[index]) || 0,
      label: formatAxisDate(cat),
    }));

    return {
      primaryMax: computeAxisMax(newLeads),
      secondaryAxis: buildSecondaryAxis(totalLeads.length ? totalLeads : [0]),
      primaryData: primaryPoints,
      secondaryData: totalPoints,
    };
  }, [categories, newLeads, totalLeads]);

  const tooltipBg = themeMode === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipBorder = colors?.border || gridColor;
  const tooltipText = colors?.text || (themeMode === 'dark' ? '#f8fafc' : '#0f172a');

  const pointerConfig = useMemo(() => ({
    activatePointersInstantlyOnTouch: true,
    persistPointer: false,
    pointerVanishDelay: 3000,
    pointerStripColor: gridColor,
    pointerStripWidth: 2,
    pointerColor: lineNewColor,
    secondaryPointerColor: lineTotalColor,
    radius: 5,
    pointerLabelWidth: isCompact ? 128 : 148,
    pointerLabelHeight: 88,
    autoAdjustPointerLabelPosition: true,
    stripOverPointer: true,
    pointerLabelComponent: (items, secondaryItems) => {
      const primary = items?.[0];
      const secondary = secondaryItems?.[0];
      const dateLabel = primary?.label || secondary?.label || '—';
      const newVal = Number(primary?.value ?? 0);
      const totalVal = Number(secondary?.value ?? 0);

      return (
        <View
          style={[
            chartStyles.tooltip,
            {
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              width: isCompact ? 128 : 148,
            },
          ]}
        >
          <Text style={[chartStyles.tooltipDate, { color: tooltipText }]} numberOfLines={1}>
            {dateLabel}
          </Text>
          <View style={chartStyles.tooltipRow}>
            <View style={[chartStyles.tooltipDot, { backgroundColor: lineNewColor }]} />
            <Text style={[chartStyles.tooltipLabel, { color: colors?.gray || labelColor }]}>
              New Leads
            </Text>
            <Text style={[chartStyles.tooltipValue, { color: tooltipText }]}>{newVal}</Text>
          </View>
          <View style={chartStyles.tooltipRow}>
            <View style={[chartStyles.tooltipDot, { backgroundColor: lineTotalColor }]} />
            <Text style={[chartStyles.tooltipLabel, { color: colors?.gray || labelColor }]}>
              Total Leads
            </Text>
            <Text style={[chartStyles.tooltipValue, { color: tooltipText }]}>{totalVal}</Text>
          </View>
        </View>
      );
    },
  }), [
    gridColor,
    lineNewColor,
    lineTotalColor,
    tooltipBg,
    tooltipBorder,
    tooltipText,
    labelColor,
    colors?.gray,
    isCompact,
  ]);

  if (!width) return null;

  const axisTitleStyle = {
    color: labelColor,
    fontSize: layout.axisLabelSize,
    fontFamily: fonts.medium,
    width: wp(16),
    textAlign: 'center',
  };

  return (
    <View style={{ width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
        <View style={{ width: layout.sideLabelW, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[axisTitleStyle, { transform: [{ rotate: '-90deg' }] }]}>
            New Leads
          </Text>
        </View>

        <View style={{ width: layout.chartAreaW }}>
          <LineChart
            data={primaryData}
            secondaryData={secondaryData}
            width={layout.lineChartWidth}
            height={height}
            maxValue={primaryMax}
            noOfSections={NO_OF_SECTIONS}
            spacing={layout.spacing}
            initialSpacing={layout.initialSpacing}
            endSpacing={layout.endSpacing}
            adjustToWidth={false}
            yAxisLabelWidth={layout.yAxisW}
            yAxisColor="transparent"
            xAxisColor={gridColor}
            color={lineNewColor}
            thickness={2}
            curved={false}
            hideDataPoints={false}
            dataPointsColor={lineNewColor}
            dataPointsRadius={isCompact ? 3 : 4}
            hideRules
            showVerticalLines
            verticalLinesStrokeDashArray={[3, 4]}
            verticalLinesColor={gridColor}
            verticalLinesThickness={1}
            yAxisTextStyle={{ color: labelColor, fontSize: layout.axisLabelSize }}
            xAxisLabelTextStyle={{
              color: labelColor,
              fontSize: layout.axisLabelSize,
              fontFamily: fonts.regular,
              width: layout.xLabelWidth,
              marginLeft: -(layout.xLabelWidth / 2) + layout.spacing / 2,
              textAlign: 'center',
            }}
            secondaryYAxis={{
              ...secondaryAxis,
              yAxisColor: 'transparent',
              yAxisTextStyle: { color: labelColor, fontSize: layout.axisLabelSize },
              yAxisLabelWidth: layout.secondaryYAxisW,
            }}
            secondaryLineConfig={{
              color: lineTotalColor,
              curved: true,
              thickness: 2,
              hideDataPoints: false,
              dataPointsColor: lineTotalColor,
              dataPointsRadius: isCompact ? 3 : 4,
            }}
            pointerConfig={pointerConfig}
            nestedScrollEnabled
            backgroundColor={colors?.cardBg || '#FFFFFF'}
            disableScroll
            isAnimated={false}
          />
        </View>

        <View style={{ width: layout.sideLabelW, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[axisTitleStyle, { transform: [{ rotate: '90deg' }] }]}>
            Total Leads
          </Text>
        </View>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  tooltip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  tooltipDate: {
    fontFamily: fonts.semibold,
    fontSize: wp(2.8),
    marginBottom: 6,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  tooltipLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: wp(2.5),
  },
  tooltipValue: {
    fontFamily: fonts.bold,
    fontSize: wp(2.8),
  },
});
