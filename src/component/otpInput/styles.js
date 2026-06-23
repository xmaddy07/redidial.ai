import { StyleSheet } from 'react-native'
import { fonts } from '../../constant'
import { wp, normalizeStyleOptions } from '../../theme/layout'

export function getOtpInputStyles(colors, options = {}) {
  const { isCompact = false } = normalizeStyleOptions(options)
  const cellSize = isCompact ? wp(11) : wp(12)

  return StyleSheet.create({
    root: {
      justifyContent: 'space-between',
    },
    cell: {
      width: cellSize,
      height: cellSize,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    cellText: {
      color: colors.text,
      fontFamily: fonts.medium,
      fontSize: isCompact ? 16 : 18,
    },
    errorText: {
      color: colors.danger,
      marginTop: 8,
      fontFamily: fonts.regular,
      fontSize: 12,
    },
  })
}
