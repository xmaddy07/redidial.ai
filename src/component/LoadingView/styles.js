import { StyleSheet } from 'react-native'
import { fonts } from '../../constant'

export function getLoadingViewStyles(colors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    wrapFlex: {
      flex: 1,
    },
    label: {
      marginTop: 12,
      color: colors.gray,
      fontSize: 14,
      fontFamily: fonts.regular,
    },
    loadMore: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
  })
}
