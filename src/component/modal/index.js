import React, { useEffect, useState } from 'react'
import { Modal, View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { Alert } from '../../utils/alert'
import Icon from 'react-native-vector-icons/Feather'
import { useTheme } from '../../hooks/useTheme'
import getStyles from '../EditLeadModal/styles'

const EMPTY_FORM = { name: '', email: '', phone: '', zip: '' }

const toForm = (customer = {}) => {
  const empty = (v) => (!v || v === '-' ? '' : v)
  return {
    name: empty(customer.name),
    email: empty(customer.email),
    phone: empty(customer.phone),
    zip: empty(customer.location || customer.zip),
  }
}

function FormField({ label, icon, iconColor, placeholderColor, value, onChangeText, styles, keyboardType, autoCapitalize }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Icon name={icon} size={18} color={iconColor} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
          placeholderTextColor={placeholderColor}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
        />
      </View>
    </View>
  )
}

export default function EditCustomerModal({ visible, onClose, onSave, initialValues, saving = false }) {
  const { colors, themeMode } = useTheme()
  const styles = getStyles(colors, themeMode)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (visible && initialValues) {
      setForm(toForm(initialValues))
    }
  }, [visible, initialValues])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = () => {
    if (!form.name?.trim()) {
      Alert.alert('Required', 'Name is required.')
      return
    }
    onSave?.({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      zip: form.zip.trim(),
      location: form.zip.trim(),
    })
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose} activeOpacity={0.7}>
            <Icon name="arrow-left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Customer</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            <FormField
              label="Name"
              icon="user"
              iconColor={colors.primary}
              placeholderColor={colors.gray}
              value={form.name}
              onChangeText={(v) => update('name', v)}
              styles={styles}
            />
            <FormField
              label="Email"
              icon="mail"
              iconColor={colors.primary}
              placeholderColor={colors.gray}
              value={form.email}
              onChangeText={(v) => update('email', v)}
              styles={styles}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormField
              label="Phone"
              icon="phone"
              iconColor={colors.primary}
              placeholderColor={colors.gray}
              value={form.phone}
              onChangeText={(v) => update('phone', v)}
              styles={styles}
              keyboardType="phone-pad"
            />
            <FormField
              label="ZIP Code"
              icon="map-pin"
              iconColor={colors.primary}
              placeholderColor={colors.gray}
              value={form.zip}
              onChangeText={(v) => update('zip', v)}
              styles={styles}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.85} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.saveBtnText}>Save</Text>
                  <Icon name="check-circle" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
