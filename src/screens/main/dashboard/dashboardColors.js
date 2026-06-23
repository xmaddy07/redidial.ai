/** Derive dashboard UI colors from theme / backend branding */
export function getDashboardPalette(colors, themeMode = 'light') {
  const primary = colors.primary || '#3B82F6';
  const accent = colors.accent || primary;
  const orange = colors.orange || '#F97316';
  const isDark = themeMode === 'dark';

  const gradientStart = primary;
  const gradientEnd = accent !== primary ? accent : orange;

  return {
    gradientStart,
    gradientEnd,
    chartNewColor: accent,
    chartTotalColor: isDark ? '#e2e8f0' : '#64748b',
    kpiText: colors.white || '#FFFFFF',
    kpiIconBg: 'rgba(255,255,255,0.22)',
  };
}
