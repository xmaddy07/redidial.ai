import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { fonts } from '../../constant'
import LinearGradient from 'react-native-linear-gradient'
import { useTheme } from '../../hooks/useTheme'
import { wp, hp } from '../../theme/layout'
import Icon from 'react-native-vector-icons/Feather'
import Icon2 from 'react-native-vector-icons/Entypo'

const getWidthStyle = (widthValue) => {
  const raw = String(widthValue).trim()
  if (raw.endsWith('%')) {
    const pct = parseFloat(raw)
    if (pct >= 100) {
      return { width: '100%', alignSelf: 'stretch' }
    }
    return { width: raw, alignSelf: 'stretch' }
  }
  const num = parseFloat(raw)
  if (num >= 100) {
    return { width: '100%', alignSelf: 'stretch' }
  }
  return { width: wp(num), alignSelf: 'center' }
}

export default function Button({
  text,
  onPress,
  backgroundColor,
  borderRadius,
  width = '90%',
  height = '6%',
  marginTop = '0%',
  marginBottom = '0%',
  loading = false,
  textColor,
  leftIconName,
  leftIconSize = 16,
  leftIconColor,
  fontSize,
  borderColor,
  borderWidth,
  gradientColors,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 0 },
  gradientLocations,
  iconLibrary = 'Feather',
  // Legacy prop names kept for existing screens
  bgclr,
  bor = '2',
  mov,
  wid,
  higt,
  top,
  btom,
  textclr,
  txtSize,
  bordclr,
  bordwt,
}) {
  const { colors } = useTheme()
  const resolvedWidth = width ?? wid ?? '90%'
  const resolvedHeight = height ?? higt ?? '6%'
  const resolvedRadius = borderRadius ?? bor ?? '2'
  const resolvedBackground = backgroundColor ?? bgclr ?? colors.primary
  const resolvedBorderColor = borderColor ?? (bordclr === colors.primary ? colors.primary : bordclr)
  const resolvedBorderWidth = borderWidth ?? (typeof bordwt === 'string' ? parseFloat(bordwt) : bordwt)
  const resolvedTextColor = textColor ?? textclr ?? colors.white
  const resolvedFontSize = fontSize ?? txtSize
  const resolvedMarginTop = marginTop ?? top ?? '0%'
  const resolvedMarginBottom = marginBottom ?? btom ?? '0%'
  const resolvedIconColor = leftIconColor ?? colors.white
  const handlePress = onPress ?? mov
  const widthStyle = getWidthStyle(resolvedWidth)

  return (
    <TouchableOpacity
      style={[
        styles.box,
        {
          borderRadius: wp(resolvedRadius),
          height: hp(resolvedHeight),
          marginTop: hp(resolvedMarginTop),
          marginBottom: hp(resolvedMarginBottom),
          backgroundColor: gradientColors ? undefined : resolvedBackground,
          borderColor: resolvedBorderColor,
          borderWidth: resolvedBorderWidth,
        },
        widthStyle,
      ]}
      onPress={loading ? undefined : handlePress}
      disabled={loading}
    >
      {gradientColors ? (
        <LinearGradient
          colors={gradientColors}
          start={gradientStart}
          end={gradientEnd}
          locations={gradientLocations}
          style={[StyleSheet.absoluteFillObject, { borderRadius: wp(resolvedRadius) }]}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <View style={styles.contentRow}>
          {leftIconName ? (
            iconLibrary === 'Entypo' ? (
              <Icon2
                name={leftIconName}
                size={leftIconSize}
                color={resolvedIconColor}
                style={styles.iconLeft}
              />
            ) : (
              <Icon
                name={leftIconName}
                size={leftIconSize}
                color={resolvedIconColor}
                style={styles.iconLeft}
              />
            )
          ) : null}
          <Text style={[styles.boxText, { color: resolvedTextColor, fontSize: resolvedFontSize }]}>
            {text}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.5),
  },
  boxText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  iconLeft: {
    marginRight: wp(0.5),
  },
})
