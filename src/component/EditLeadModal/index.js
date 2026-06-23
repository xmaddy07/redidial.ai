import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { Alert } from '../../utils/alert';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import getStyles from './styles';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  zip: '',
};

const leadToForm = (lead = {}) => ({
  name: lead?.name || lead?.customer_name || '',
  email: lead?.email || lead?.customer_email || '',
  phone: lead?.phone || lead?.customer_telephone || '',
  zip: lead?.zip || lead?.customer_zip_code || lead?.location || '',
});

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
  );
}

export default function EditLeadModal({ visible, lead, onClose, onSave, saving = false }) {
  const { colors, themeMode } = useTheme();
  const styles = getStyles(colors, themeMode);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (visible && lead) {
      setForm(leadToForm(lead));
    }
  }, [visible, lead]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name?.trim()) {
      Alert.alert('Required', 'Name is required.');
      return;
    }
    onSave?.({
      ...lead,
      name: form.name.trim(),
      customer_name: form.name.trim(),
      email: form.email.trim(),
      customer_email: form.email.trim(),
      phone: form.phone.trim(),
      customer_telephone: form.phone.trim(),
      zip: form.zip.trim(),
      customer_zip_code: form.zip.trim(),
    });
  };

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
          <Text style={styles.headerTitle}>Update Lead</Text>
       <View/>
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

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={22} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Automatic Source Assignment</Text>
                <Text style={styles.infoText}>
                  Lead source will be tagged as &apos;Manual CRM Entry&apos; and assigned to the active
                  user&apos;s sales pipeline.
                </Text>
              </View>
            </View>
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
  );
}
