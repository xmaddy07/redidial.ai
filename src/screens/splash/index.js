import React, { useMemo } from 'react'
import { View } from 'react-native'
import LottieView from 'lottie-react-native'
import { useScreenLayout } from '../../hooks/useScreenLayout'
import getSplashStyles from './styles'

export default function Splash() {
  const { styleOptions } = useScreenLayout()
  const styles = useMemo(() => getSplashStyles(styleOptions), [styleOptions])

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/lottie/lottie.json')}
        autoPlay
        loop={false}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  )
}
