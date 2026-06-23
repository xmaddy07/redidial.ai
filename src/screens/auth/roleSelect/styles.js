import { StyleSheet } from 'react-native'
import { createAuthScreenStyles } from '../shared/authScreenTheme'
import { fonts } from '../../../constant'

export const getStyles = (colors, options = {}) =>
  StyleSheet.create({
    ...createAuthScreenStyles(colors, options),
    background: {
      flex: 1,
    },
    titleBlock: {
      alignSelf: 'flex-start',
      paddingLeft: '5%',
      width: '100%',
    },
    title2: {
      color: colors.gray,
      fontFamily: fonts.regular,
      marginTop: 4,
    },
  })

export default getStyles
