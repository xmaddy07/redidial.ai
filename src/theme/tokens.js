import { wp, hp } from './layout'

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  pill: 999,
}

export const hitSlop = {
  sm: { top: 8, right: 8, bottom: 8, left: 8 },
  md: { top: 12, right: 12, bottom: 12, left: 12 },
}

export function touchTarget(isCompact = false) {
  return isCompact ? wp(10) : wp(11)
}

export function bodyFontSize(isCompact = false) {
  return isCompact ? hp(1.7) : hp(1.8)
}

export function titleFontSize(isCompact = false) {
  return isCompact ? 18 : 20
}
