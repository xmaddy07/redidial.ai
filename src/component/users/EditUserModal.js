import React, { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { widthPercentageToDP as wp } from '../../theme/layout'
import { useTheme } from '../../hooks/useTheme'
import { Alert } from '../../utils/alert'
import api from '../../api'

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
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
  },
  saveTxt: { color: colors.white, fontFamily: 'Poppins-SemiBold' },
})

function buildDisplayName(firstName, lastName, email) {
  return [firstName, lastName].filter(Boolean).join(' ') || email || 'Unknown'
}

export default function EditUserModal({
  visible,
  onClose,
  user,
  token,
  onSaved,
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => getStyles(colors), [colors])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!visible || !user) return

    if (user.first_name || user.last_name) {
      setFirstName(user.first_name || '')
      setLastName(user.last_name || '')
    } else {
      const parts = String(user.name || '').trim().split(' ')
      setFirstName(parts[0] || '')
      setLastName(parts.slice(1).join(' ') || '')
    }
    setEmail(user.email || '')
  }, [visible, user])

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Update Failed', 'Missing user id')
      return
    }
    if (!token) {
      Alert.alert('Update Failed', 'You are not signed in. Please log in again.')
      return
    }
    if (!firstName.trim() || !email.trim()) {
      Alert.alert('Required', 'First name and email are required.')
      return
    }

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedEmail = email.trim()

    setSaving(true)
    try {
      await api.updateUser({
        token,
        userId: user.id,
        payload: {
          first_name: trimmedFirst,
          last_name: trimmedLast,
          email: trimmedEmail,
        },
      })

      await onSaved?.({
        id: user.id,
        first_name: trimmedFirst,
        last_name: trimmedLast,
        email: trimmedEmail,
        name: buildDisplayName(trimmedFirst, trimmedLast, trimmedEmail),
      })
    } catch (e) {
      Alert.alert('Update Failed', e?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="fade" transparent statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalTitleRow}>
            <Text style={styles.modalTitle}>Edit user</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeHit} disabled={saving}>
              <Icon name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={colors.gray}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              editable={!saving}
            />
            <View style={{ width: wp(2) }} />
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={colors.gray}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              editable={!saving}
            />
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            editable={!saving}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} disabled={saving}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.saveTxt}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
