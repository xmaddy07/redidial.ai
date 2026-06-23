import { Platform } from 'react-native'

const SHADOW_PRESETS = {
  card: { offset: 6, opacity: { dark: 0.28, light: 0.07 }, radius: 14, elevation: { dark: 6, light: 3 } },
  soft: { offset: 4, opacity: { dark: 0.14, light: 0.05 }, radius: 10, elevation: { dark: 2, light: 2 } },
  lift: { offset: 8, opacity: { dark: 0.22, light: 0.08 }, radius: 16, elevation: { dark: 4, light: 4 } },
}

export function cardShadow(isDark, preset = 'card') {
  const config = SHADOW_PRESETS[preset] || SHADOW_PRESETS.card
  const mode = isDark ? 'dark' : 'light'

  return Platform.select({
    ios: {
      shadowColor: isDark ? '#000000' : '#0F172A',
      shadowOffset: { width: 0, height: config.offset },
      shadowOpacity: config.opacity[mode],
      shadowRadius: config.radius,
    },
    android: {
      elevation: config.elevation[mode],
    },
  })
}
