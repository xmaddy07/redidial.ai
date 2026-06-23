import React, { useMemo } from 'react'
import { Modal, View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { widthPercentageToDP as wp } from '../../theme/layout'
import { useTheme } from '../../hooks/useTheme'

const getStyles = (colors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  modalCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  closeHit: { padding: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    backgroundColor: colors.inputBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelTxt: { color: colors.text, fontFamily: 'Poppins-Medium' },
  createBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  createTxt: { color: colors.white, fontFamily: 'Poppins-SemiBold' },
})

export default function CreateUserModal({
  visible,
  onClose,
  firstName,
  lastName,
  email,
  password,
  onChangeFirstName,
  onChangeLastName,
  onChangeEmail,
  onChangePassword,
  onAdd,
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => getStyles(colors), [colors])

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="fade" transparent statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalTitleRow}>
            <Text style={styles.modalTitle}>Create a new user</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeHit}>
              <Icon name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={firstName}
              onChangeText={onChangeFirstName}
              placeholder="First name"
              placeholderTextColor={colors.gray}
              style={[styles.input, { flex: 1 }]}
            />
            <View style={{ width: wp(2) }} />
            <TextInput
              value={lastName}
              onChangeText={onChangeLastName}
              placeholder="Last name"
              placeholderTextColor={colors.gray}
              style={[styles.input, { flex: 1 }]}
            />
          </View>

          <TextInput
            value={email}
            onChangeText={onChangeEmail}
            placeholder="Email"
            placeholderTextColor={colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            value={password}
            onChangeText={onChangePassword}
            placeholder="Password"
            placeholderTextColor={colors.gray}
            secureTextEntry
            style={styles.input}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAdd} style={styles.createBtn}>
              <Text style={styles.createTxt}>Add User</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
