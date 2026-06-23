import { StyleSheet } from 'react-native'
import { fonts } from '../../../constant'
import { wp, hp } from '../../../theme/layout'
import getLoginStyles from '../login/styles'

export { loginBrand, loginDarkUi } from '../login/styles'

export default function getForgotStyles(options = {}) {
  const base = getLoginStyles(options)
  return StyleSheet.create({
    ...base,
    formCard: {
      ...base.formCard,
      width: '100%',
      alignSelf: 'stretch',
    },
    formFields: {
      ...base.formFields,
      alignItems: 'stretch',
    },
    footerCenter: {
      alignItems: 'center',
      marginTop: hp(2),
      paddingTop: hp(0.5),
    },
    signInLink: {
      color: '#3B82F6',
      fontFamily: fonts.medium,
      fontSize: wp(3.4),
      
    },
    successBadge: {
      alignSelf: 'center',
      width: wp(14),
      height: wp(14),
      borderRadius: wp(7),
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(34, 197, 94, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: hp(2),

    },
    sentEmail: {
      color: '#F8FAFC',
      fontFamily: fonts.semibold,
    },
  })
}
