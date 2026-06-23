import React from 'react'
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { fonts } from '../../constant'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../theme/layout'
import { useTheme } from '../../hooks/useTheme'

export default function CreateChannelModal({ visible, onClose, value, onChangeText, onCreate }) {
  const { colors } = useTheme()
  const styles = getStyles(colors)

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Create a new channel</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeHit}>
              <Icon name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Enter number"
            placeholderTextColor={colors.gray}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createBtn} onPress={onCreate}>
              <Text style={styles.createTxt}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const getStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: wp(3),
    padding: wp(3.5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  title: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: wp(4.2),
  },
  closeHit: { padding: wp(1.5) },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    color: colors.text,
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    backgroundColor: colors.inputBg,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: wp(2.5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelTxt: { color: colors.text, fontFamily: fonts.medium },
  createBtn: {
    backgroundColor: colors.primary,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(5),
    borderRadius: wp(2.5),
  },
  createTxt: { color: colors.white, fontFamily: fonts.semibold },
})
