import { StyleSheet, View, TextInput, TouchableOpacity, Text, Platform } from 'react-native'
import React, { useState } from 'react'
import { wp, hp } from '../../theme/layout'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated'
import Icon from 'react-native-vector-icons/Feather'
import { fonts } from '../../constant'
import { useTheme } from '../../hooks/useTheme'

const toHp = (value, fallback = 0) => {
  const num = parseFloat(String(value ?? '').replace('%', ''))
  return hp(Number.isFinite(num) ? num : fallback)
}

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

function Input({
  value,
  onChangeText,
  placeholder,
  marginTop = '0%',
  marginBottom = '0%',
  height = '6.5%',
  width = '90%',
  secureTextEntry = false,
  showPasswordToggle,
  heading,
  editable,
  autoCapitalize,
  borderColor,
  backgroundColor,
  headingColor,
  textColor,
  placeholderColor,
  maxLength,
  multiline = false,
  animatedFocus = false,
  // Legacy prop names
  val,
  onchan,
  plac,
  top,
  btm,
  hig,
  wid,
  isImg = 'no',
  brderclr,
  bgclr,
  headingclr,
  textclr,
  placeholderclr,
}) {
  const { colors } = useTheme()
  const [toggle, setToggle] = useState(false)
  const [focused, setFocused] = useState(false)
  const focusProgress = useSharedValue(0)
  const styles = getStyles(colors)

  const resolvedValue = value ?? val
  const resolvedOnChange = onChangeText ?? onchan
  const resolvedPlaceholder = placeholder ?? plac
  const resolvedTop = marginTop ?? top ?? '0%'
  const resolvedBottom = marginBottom ?? btm ?? '0%'
  const resolvedHeight = height ?? hig ?? '6.5%'
  const resolvedWidth = width ?? wid ?? '90%'
  const resolvedBorder = borderColor ?? brderclr ?? colors.border
  const resolvedBg = backgroundColor ?? bgclr ?? colors.inputBg
  const isPasswordField = showPasswordToggle ?? isImg === 'yes'
  const widthStyle = getWidthStyle(resolvedWidth)
  const inputHeight = toHp(resolvedHeight, 6.5)
  const containerSizeStyle = multiline
    ? { minHeight: inputHeight }
    : { height: inputHeight }

  const handleFocus = () => {
    setFocused(true)
    if (animatedFocus) {
      focusProgress.value = withTiming(1, { duration: 220 })
    }
  }

  const handleBlur = () => {
    setFocused(false)
    if (animatedFocus) {
      focusProgress.value = withTiming(0, { duration: 220 })
    }
  }

  const animatedContainerStyle = useAnimatedStyle(() => {
    if (!animatedFocus) {
      return {}
    }
    const style = {
      borderColor: interpolateColor(
        focusProgress.value,
        [0, 1],
        [resolvedBorder, colors.primary],
      ),
      borderWidth: 0.5 + focusProgress.value * 0.8,
      transform: [{ scale: 1 + focusProgress.value * 0.008 }],
    }
    if (Platform.OS === 'ios') {
      style.shadowColor = colors.primary
      style.shadowOffset = { width: 0, height: 4 }
      style.shadowOpacity = focusProgress.value * 0.22
      style.shadowRadius = 8
    }
    return style
  }, [animatedFocus, colors.primary, resolvedBorder])

  const InputWrapper = animatedFocus ? Animated.View : View

  return (
    <View style={[styles.root, widthStyle]} collapsable={false}>
      {heading ? (
        <Text
          style={[
            styles.text,
            { marginTop: toHp(resolvedTop), color: headingColor ?? headingclr ?? colors.text },
            focused && styles.textFocused,
          ]}
        >
          {heading}
        </Text>
      ) : null}
      <InputWrapper
        collapsable={false}
        style={[
          styles.main,
          {
            marginBottom: toHp(resolvedBottom),
            borderColor: resolvedBorder,
            backgroundColor: resolvedBg,
            width: '100%',
            ...containerSizeStyle,
          },
          animatedFocus && Platform.OS === 'android' ? styles.focusElevation : null,
          animatedFocus ? animatedContainerStyle : null,
        ]}
      >
        <TextInput
          value={resolvedValue}
          onChangeText={resolvedOnChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            multiline ? styles.inputMultiline : styles.inputSingle,
            {
              width: '100%',
              paddingLeft: wp('5%'),
              paddingRight: isPasswordField ? wp('12%') : wp('0%'),
              color: textColor ?? textclr ?? colors.text,
              ...(multiline
                ? { minHeight: Math.max(inputHeight - hp(1), hp(8)) }
                : { height: inputHeight }),
            },
          ]}
          placeholder={resolvedPlaceholder}
          autoCorrect
          placeholderTextColor={placeholderColor ?? placeholderclr ?? colors.gray}
          multiline={multiline}
          scrollEnabled={!multiline}
          blurOnSubmit={!multiline}
          underlineColorAndroid="transparent"
          secureTextEntry={isPasswordField ? !toggle : secureTextEntry}
          editable={editable}
          keyboardType={heading === 'Email' ? 'email-address' : 'default'}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />
        {isPasswordField ? (
          <TouchableOpacity onPress={() => setToggle(!toggle)} style={styles.icon}>
            <Icon name={toggle ? 'eye' : 'eye-off'} size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </InputWrapper>
    </View>
  )
}

export default Input

const getStyles = (colors) => StyleSheet.create({
  root: {
    alignSelf: 'stretch',
  },
  main: {
    borderRadius: wp(2),
    borderWidth: 0.5,
    ...(Platform.OS === 'ios' ? { overflow: 'hidden' } : {}),
  },
  focusElevation: {
    elevation: 4,
  },
  icon: {
    width: wp(6),
    height: wp(6),
    position: 'absolute',
    marginTop: hp(2),
    marginRight: wp(3.5),
    right: 0,
  },
  input: {
    fontFamily: fonts.regular,
    color: colors.text,
    fontSize: 12,
    ...(Platform.OS === 'ios' ? { top: hp(0.2) } : {}),
  },
  inputSingle: {
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: hp(1),
    paddingBottom: hp(1),
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.regular,
    alignSelf: 'flex-start',
    paddingBottom: hp(1),
    paddingTop: hp(2),
  },
  textFocused: {
    color: colors.primary,
    fontFamily: fonts.medium,
  },
})
