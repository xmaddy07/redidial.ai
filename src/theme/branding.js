import { DEFAULT_LOGO_URL } from '../config';

/** Default brand color when backend theme/branding colors are missing or invalid */
export const DEFAULT_BRAND_COLOR = '#3B82F6';

export function resolveBrandColor(value, fallback = DEFAULT_BRAND_COLOR) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed && trimmed.toLowerCase() !== 'null' && trimmed.toLowerCase() !== 'undefined') {
      return trimmed;
    }
  }
  return fallback ?? DEFAULT_BRAND_COLOR;
}

/** Ensure LinearGradient always receives a valid colors array (Android crashes on null entries). */
export function resolveGradientColors(colors, fallback = DEFAULT_BRAND_COLOR) {
  const base = resolveBrandColor(fallback);
  if (!Array.isArray(colors) || colors.length === 0) {
    return [base, base];
  }
  return colors.map((color) => resolveBrandColor(color, base));
}

export function resolveLogoPath(preferences) {
  if (!preferences) return DEFAULT_LOGO_URL;

  const path =
    preferences.logoPath ||
    preferences.logo_path ||
    preferences.brandingSettings?.logoPath ||
    preferences.brandingSettings?.logo_path ||
    preferences.branding_settings?.logoPath ||
    preferences.branding_settings?.logo_path ||
    null;

  return path || DEFAULT_LOGO_URL;
}
