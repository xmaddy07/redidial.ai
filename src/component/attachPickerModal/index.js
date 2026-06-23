import React, { useMemo } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { wp, hp } from '../../theme/layout'
import { fonts } from '../../constant'

export default function AttachPickerModal({
  visible,
  onClose,
  onPickImage,
  onPickDocument,
  onPickVideo,
  colors,
  isDark = false,
  bottomInset = 0,
}) {
  const styles = useMemo(() => getStyles(colors, isDark, bottomInset), [colors, isDark, bottomInset])

  const options = [
    { id: 'image', label: 'IMAGE', icon: 'image-outline', onPress: onPickImage },
    { id: 'document', label: 'DOCUMENT', icon: 'file-document-outline', onPress: onPickDocument },
    { id: 'video', label: 'VIDEO', icon: 'video-outline', onPress: onPickVideo },
  ]

  const handleOptionPress = (handler) => {
    onClose()
    requestAnimationFrame(() => {
      handler?.()
    })
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.panelTitle}>Attach file</Text>
          <View style={styles.grid}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.option}
                activeOpacity={0.82}
                onPress={() => handleOptionPress(option.onPress)}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function getStyles(colors, isDark, bottomInset) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.28)',
      justifyContent: 'flex-end',
      paddingHorizontal: wp(1),
      paddingBottom: bottomInset + hp(6),
    },
    panel: {
      alignSelf: 'flex-start',
      borderRadius: 18,
      backgroundColor: colors.cardBg || colors.white,
      paddingHorizontal: wp(3.5),
      paddingTop: hp(1.6),
      paddingBottom: hp(1.8),
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.28 : 0.12,
          shadowRadius: 18,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    panelTitle: {
      color: colors.text,
      fontFamily: fonts.semibold,
      fontSize: 13,
      marginBottom: hp(1.4),
      paddingHorizontal: wp(1),
    },
    grid: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      width: wp(68),
    },
    option: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: wp(1),
    },
    iconCircle: {
      width: wp(14),
      height: wp(14),
      borderRadius: wp(7),
      backgroundColor: `${colors.primary}14`,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
      marginBottom: hp(0.7),
    },
    optionLabel: {
      color: colors.gray,
      fontFamily: fonts.medium,
      fontSize: 9,
      letterSpacing: 0.8,
      textAlign: 'center',
    },
  })
}
