import React, { createContext, useMemo } from 'react';
import { StatusBar } from 'react-native';
import { useSelector } from 'react-redux';
import { lightTheme, darkTheme } from '../theme/theme';
import { resolveLogoPath } from '../theme/branding';

export const ThemeContext = createContext({
  colors: lightTheme,
  logoPath: null,
  themeMode: 'light',
});

/** Brand accent only — keeps light/dark structural tokens from baseColors */
function applyBrandAccent(baseColors, brandingSettings, themeColor) {
  const bs = brandingSettings || {};
  const primary = themeColor || bs.accent || baseColors.primary;
  const accent = bs.accent || baseColors.accent;
  return { ...baseColors, primary, accent };
}

/** Full org palette — intended for dark mode when branding defines a custom dark theme */
function applyFullBranding(baseColors, brandingSettings, themeColor) {
  const bs = brandingSettings;
  const primary = themeColor || bs.accent || baseColors.primary;
  const accent = bs.accent || baseColors.accent;
  const appBg = bs.appBg || baseColors.appBg;
  const appText = bs.appText || baseColors.appText;
  const surfaceBg = bs.surfaceBg || baseColors.surfaceBg;
  const surfaceBorder = bs.surfaceBorder || baseColors.surfaceBorder;

  return {
    ...baseColors,
    primary,
    accent,
    dark: appBg || baseColors.dark,
    appBg,
    appText,
    text: appText || baseColors.text,
    headerBg: bs.headerBg || baseColors.headerBg,
    headerText: bs.headerText || baseColors.headerText,
    sidebarBg: bs.sidebarBg || baseColors.sidebarBg,
    sidebarText: bs.sidebarText || baseColors.sidebarText,
    sidebarActiveBg: bs.sidebarActiveBg || baseColors.sidebarActiveBg,
    surfaceBg,
    surfaceBorder,
    cardBg: surfaceBg || baseColors.cardBg,
    border: surfaceBorder || baseColors.border,
  };
}

export function ThemeProvider({ children }) {
  const preferences = useSelector((state) => state.theme.preferences);
  const themeMode = useSelector((state) => state.theme.themeMode) || 'light';

  const themeValue = useMemo(() => {
    const baseColors = themeMode === 'dark' ? { ...darkTheme } : { ...lightTheme };

    const logoPath = resolveLogoPath(preferences);

    if (!preferences) {
      return {
        colors: baseColors,
        logoPath,
        themeMode,
      };
    }

    if (!preferences.brandingSettings) {
      return {
        colors: preferences.themeColor
          ? { ...baseColors, primary: preferences.themeColor }
          : baseColors,
        logoPath,
        themeMode,
      };
    }

    const applyBranding = themeMode === 'dark' ? applyFullBranding : applyBrandAccent;
    return {
      colors: applyBranding(
        baseColors,
        preferences.brandingSettings,
        preferences.themeColor,
      ),
      logoPath,
      themeMode,
    };
  }, [preferences, themeMode]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'}
      />
      {children}
    </ThemeContext.Provider>
  );
}
