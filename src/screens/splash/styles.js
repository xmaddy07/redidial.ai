import { StyleSheet } from 'react-native'
import { wp, hp, normalizeStyleOptions } from '../../theme/layout'

export function getSplashStyles(options = {}) {
  const { isCompact = false } = normalizeStyleOptions(options)

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1A1D23',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: isCompact ? wp(82) : wp(90),
      height: isCompact ? hp(42) : hp(50),
    },
  })
}

export default getSplashStyles
