import { StyleSheet } from 'react-native'
import { createAuthScreenStyles } from '../shared/authScreenTheme'

import { fonts } from '../../../constant'

export const getStyles = (colors, options = {}) =>
  StyleSheet.create({
    ...createAuthScreenStyles(colors, options),
    create: {
      color: colors.gray,
      fontFamily: fonts.regular,
      fontSize: 14,
    },
  })

export default getStyles
