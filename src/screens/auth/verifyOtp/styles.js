import { StyleSheet } from 'react-native'
import { createAuthScreenStyles } from '../shared/authScreenTheme'

export const getStyles = (colors, options = {}) =>
  StyleSheet.create(createAuthScreenStyles(colors, options))

export default getStyles
