export function getCallUiPalette(colors, themeMode = 'light') {
  const isDark = themeMode === 'dark'
  const bg = colors.appBg || colors.dark
  const surface = colors.cardBg || colors.surfaceBg || colors.inputBg
  const primary = colors.primary || '#3B82F6'
  const accent = colors.accent || primary
  const callGreenLight = '#86EFAC'
  const callGreen = colors.success || '#4ADE80'
  const callGreenDeep = '#34D399'

  return {
    isDark,
    bg,
    surface,
    primary,
    accent,
    text: colors.text || colors.appText,
    textMuted: colors.gray,
    textOnPrimary: colors.white,
    keyBg: isDark ? (colors.inputBg || surface) : (colors.inputBg || colors.light),
    keyBorder: isDark ? `${primary}28` : (colors.border || colors.surfaceBorder),
    grid: `${primary}08`,
    danger: colors.danger || '#EF4444',
    dialText: isDark ? (colors.text || colors.appText) : (colors.black || '#111827'),
    keySurface: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
    bgGradient: isDark
      ? [bg, `${primary}20`, surface, `${accent}14`, bg]
      : [`${primary}18`, '#F0FDFA', '#FFFFFF', `${primary}10`, '#ECFEFF'],
    bgGradientLocations: [0, 0.3, 0.55, 0.78, 1],
    ambientGlow: isDark ? `${primary}30` : `${primary}22`,
    ambientGlowSoft: isDark ? `${primary}14` : `${primary}12`,
    glassSurface: isDark ? 'rgba(255,255,255,0.07)' : '#FFFFFF',
    glassBorder: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
    glassHighlight: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
    keyGradient: isDark
      ? ['rgba(255,255,255,0.11)', 'rgba(255,255,255,0.04)']
      : ['#FFFFFF', '#FFFFFF'],
    keyShadow: isDark ? '#000000' : 'rgba(15, 23, 42, 0.12)',
    callGradient: [callGreenLight, callGreen, callGreenDeep],
    callGlow: isDark ? 'rgba(134, 239, 172, 0.42)' : 'rgba(74, 222, 128, 0.38)',
    callRing: 'transparent',
    displayGradient: isDark
      ? ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.03)']
      : ['#FFFFFF', '#FFFFFF'],
    gradientColors: isDark
      ? [bg, surface, `${primary}45`, bg]
      : [bg, colors.white || '#FFFFFF', `${primary}20`, bg],
    gradientLocations: [0, 0.35, 0.7, 1],
    avatarGradient: isDark
      ? [`${primary}DD`, `${accent}AA`]
      : [primary, accent],
    ringBorder: `${primary}60`,
    ringBorderSoft: `${primary}22`,
    controlBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
    controlBorder: isDark ? 'rgba(255,255,255,0.14)' : `${primary}25`,
    controlActiveBorder: `${primary}AA`,
    controlIcon: isDark ? `${primary}EE` : primary,
    controlIconActive: colors.success || primary,
    statusText: primary,
    dtmfBg: isDark ? 'rgba(255,255,255,0.08)' : colors.inputBg,
    controlsPanelBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.65)',
    endCallGradient: ['#FB7185', colors.danger || '#EF4444'],
  }
}
