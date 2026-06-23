import React from 'react';
import RNLinearGradient from '../../node_modules/react-native-linear-gradient/index';
import { resolveGradientColors, DEFAULT_BRAND_COLOR } from './branding';

/**
 * Drop-in replacement for react-native-linear-gradient.
 * Android crashes when `colors` contains null/undefined entries.
 */
export default function SafeLinearGradient({ colors, locations, ...rest }) {
  const safeColors = resolveGradientColors(colors, DEFAULT_BRAND_COLOR);

  const props = { ...rest, colors: safeColors };

  if (Array.isArray(locations) && locations.length > 0) {
    props.locations = locations.map((loc, index, arr) => {
      if (typeof loc === 'number' && Number.isFinite(loc)) {
        return loc;
      }
      return index / Math.max(arr.length - 1, 1);
    });
  }

  return <RNLinearGradient {...props} />;
}
