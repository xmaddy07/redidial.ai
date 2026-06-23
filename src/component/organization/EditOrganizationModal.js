import React, { useMemo, useState } from 'react'
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  useWindowDimensions,
  StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import { widthPercentageToDP as wp } from '../../theme/layout'
import { useTheme } from '../../hooks/useTheme'
import { getEditOrgModalStyles, getModalLayout } from './editOrganizationModalStyles'

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

const PRESETS = ['Closed', '8AM-5PM', '9AM-6PM', '10AM-7PM']

const FIELD_SECTIONS = [
  {
    title: 'Basic Information',
    fields: [
      { key: 'name', label: 'Organization Name', icon: 'briefcase', placeholder: 'Company name' },
      { key: 'website', label: 'Website', icon: 'globe', placeholder: 'https://example.com', autoCapitalize: 'none' },
    ],
  },
  {
    title: 'Contact Details',
    fields: [
      { key: 'email', label: 'Email Address', icon: 'mail', placeholder: 'email@company.com', keyboardType: 'email-address', autoCapitalize: 'none' },
      { key: 'phone', label: 'Phone Number', icon: 'phone', placeholder: '+1 (555) 000-0000', keyboardType: 'phone-pad' },
      { key: 'pocName', label: 'Point of Contact', icon: 'user', placeholder: 'Contact name' },
      { key: 'pocPhone', label: 'POC Phone', icon: 'phone-call', placeholder: '+1 (555) 000-0000', keyboardType: 'phone-pad' },
      { key: 'address', label: 'Address', icon: 'map-pin', placeholder: 'Street, city, state', multiline: true },
    ],
  },
  {
    title: 'Integrations & Links',
    fields: [
      { key: 'carGurusWebsite', label: 'CarGurus Website', icon: 'link-2', placeholder: 'CarGurus URL', autoCapitalize: 'none' },
      { key: 'carGurusFinancingLink', label: 'CarGurus Financing', icon: 'link', placeholder: 'Financing link', autoCapitalize: 'none' },
      { key: 'carFaxFinancingLink', label: 'CarFax Financing', icon: 'link', placeholder: 'CarFax link', autoCapitalize: 'none' },
    ],
  },
]

function FormField({ field, value, onChange, styles, colors, inputIconSize }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{field.label}</Text>
      <View style={[styles.inputWrap, field.multiline && styles.inputWrapMultiline]}>
        <Icon
          name={field.icon}
          size={inputIconSize}
          color={colors.gray}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, field.multiline && styles.inputMultiline]}
          value={value}
          onChangeText={(text) => onChange({ [field.key]: text })}
          placeholder={field.placeholder}
          placeholderTextColor={colors.gray}
          keyboardType={field.keyboardType}
          autoCapitalize={field.autoCapitalize || 'sentences'}
          multiline={field.multiline}
        />
      </View>
    </View>
  )
}

function HoursPickerModal({
  visible,
  activeDay,
  selectedPreset,
  useCustom,
  customStart,
  customEnd,
  onClose,
  onSelectPreset,
  onToggleCustom,
  onChangeStart,
  onChangeEnd,
  onSave,
  styles,
  colors,
}) {
  const dayLabel = DAYS.find((d) => d.key === activeDay)?.label || 'Day'

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.pickerBackdrop}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', maxWidth: 420 }}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Business Hours</Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
              >
                <Icon name="x" size={18} color={colors.text} />
              </Pressable>
            </View>
            <Text style={styles.pickerSubtitle}>Set hours for {dayLabel}</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {PRESETS.map((opt) => {
                const isSelected = !useCustom && selectedPreset === opt
                return (
                  <Pressable
                    key={opt}
                    onPress={() => onSelectPreset(opt)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && { opacity: 0.92 },
                    ]}
                  >
                    <Text style={styles.optionText}>{opt}</Text>
                    <Text style={isSelected ? styles.optionRight : styles.optionRightMuted}>
                      {isSelected ? 'Selected' : 'Choose'}
                    </Text>
                  </Pressable>
                )
              })}

              <View style={styles.divider} />

              <Pressable
                onPress={onToggleCustom}
                style={({ pressed }) => [styles.customHeader, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.optionSection}>Custom time</Text>
                <View style={[styles.checkboxSquare, useCustom && styles.checkboxSquareChecked]}>
                  {useCustom ? <View style={styles.checkboxDot} /> : null}
                </View>
              </Pressable>

              {useCustom && (
                <View style={styles.fieldRow}>
                  <View style={styles.fieldCol}>
                    <Text style={styles.fieldLabel}>Start</Text>
                    <TextInput
                      value={customStart}
                      onChangeText={onChangeStart}
                      placeholder="9:00 AM"
                      placeholderTextColor={colors.gray}
                      style={styles.textField}
                    />
                  </View>
                  <View style={styles.fieldCol}>
                    <Text style={styles.fieldLabel}>End</Text>
                    <TextInput
                      value={customEnd}
                      onChangeText={onChangeEnd}
                      placeholder="6:00 PM"
                      placeholderTextColor={colors.gray}
                      style={styles.textField}
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.pickerFooter}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.cta, styles.cancel, pressed && styles.ctaPressed, { flex: 1 }]}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onSave}
                style={({ pressed }) => [styles.saveWrap, { flex: 1 }, pressed && styles.ctaPressed]}
              >
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}D9`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.cta, styles.save]}
                >
                  <Text style={styles.saveText}>Save Hours</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

export default function EditOrganizationModal({
  visible,
  onClose,
  form,
  onChange,
  onSubmit,
}) {
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const layout = useMemo(() => getModalLayout(screenWidth), [screenWidth])
  const { isCompact, isWide } = layout
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const styles = useMemo(
    () => getEditOrgModalStyles(colors, isDark, {
      ...layout,
      bottomInset: Platform.OS === 'ios' ? insets.bottom : 0,
    }),
    [colors, isDark, layout, insets.bottom],
  )
  const inputIconSize = isCompact ? wp(3.8) : wp(4)
  const closeIconSize = isCompact ? wp(4.8) : wp(5)

  const [pickerVisible, setPickerVisible] = useState(false)
  const [activeDay, setActiveDay] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const openPickerForDay = (dayKey) => {
    const currentVal = (form?.businessHours && form.businessHours[dayKey])
      || (dayKey === 'sunday' ? 'Closed' : '9AM–6PM')
    setActiveDay(dayKey)
    if (PRESETS.includes(currentVal)) {
      setSelectedPreset(currentVal)
      setUseCustom(false)
      setCustomStart('')
      setCustomEnd('')
    } else if (typeof currentVal === 'string') {
      const parts = currentVal.split('–')
      setUseCustom(true)
      setSelectedPreset('')
      setCustomStart(parts[0] || '')
      setCustomEnd(parts[1] || '')
    }
    setPickerVisible(true)
  }

  const savePicker = () => {
    if (!activeDay) return
    let value = selectedPreset
    if (useCustom) {
      if (customStart && customEnd) {
        value = `${customStart}–${customEnd}`
      } else {
        value = (form?.businessHours && form.businessHours[activeDay])
          || (activeDay === 'sunday' ? 'Closed' : '9AM–6PM')
      }
    }
    onChange({ businessHours: { ...(form?.businessHours || {}), [activeDay]: value } })
    setPickerVisible(false)
  }

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType={isWide ? 'fade' : 'slide'}
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.backdropTap} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetWrap}
          >
            <View style={styles.sheet}>
              <View style={styles.handle} />

              <View style={styles.header}>
                <Text style={styles.headerTitle}>Edit Organization</Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                >
                  <Icon name="x" size={closeIconSize} color={colors.text} />
                </Pressable>
              </View>

              <Text style={styles.headerSubtitle}>
                Update your company profile, contacts, and business hours.
              </Text>

              <ScrollView
                style={styles.bodyScroll}
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {FIELD_SECTIONS.map((section) => (
                  <View key={section.title}>
                    <Text style={styles.sectionLabel}>{section.title}</Text>
                    {section.fields.map((field) => (
                      <FormField
                        key={field.key}
                        field={field}
                        value={form[field.key] || ''}
                        onChange={onChange}
                        styles={styles}
                        colors={colors}
                        inputIconSize={inputIconSize}
                      />
                    ))}
                  </View>
                ))}

                <Text style={styles.sectionLabel}>Business Hours</Text>
                <View style={styles.hoursCard}>
                  {DAYS.map((d, idx) => {
                    const value = (form?.businessHours && (form.businessHours[d.key] || form.businessHours[d.label]))
                      || (d.key === 'sunday' ? 'Closed' : '9AM–6PM')
                    const isClosed = /closed/i.test(value)
                    const isLast = idx === DAYS.length - 1

                    return (
                      <View key={d.key}>
                        <View style={styles.bhRow}>
                          <Text style={styles.bhDay}>{d.label}</Text>
                          <View style={styles.bhValueWrap}>
                            <View style={styles.bhBox}>
                              <Text style={[styles.bhBoxText, isClosed && styles.bhBoxTextClosed]} numberOfLines={1}>
                                {value}
                              </Text>
                            </View>
                            <Pressable
                              onPress={() => openPickerForDay(d.key)}
                              style={({ pressed }) => [styles.selectBtn, pressed && { opacity: 0.85 }]}
                            >
                              <Text style={styles.selectTxt}>Edit</Text>
                            </Pressable>
                          </View>
                        </View>
                        {!isLast && <View style={styles.bhRowDivider} />}
                      </View>
                    )
                  })}
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.cta, styles.cancel, pressed && styles.ctaPressed]}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={onSubmit}
                  style={({ pressed }) => [styles.saveWrap, pressed && styles.ctaPressed]}
                >
                  <LinearGradient
                    colors={[colors.primary, `${colors.primary}D9`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.cta, styles.save]}
                  >
                    <Text style={styles.saveText}>Save Changes</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <HoursPickerModal
        visible={pickerVisible}
        activeDay={activeDay}
        selectedPreset={selectedPreset}
        useCustom={useCustom}
        customStart={customStart}
        customEnd={customEnd}
        onClose={() => setPickerVisible(false)}
        onSelectPreset={(opt) => { setUseCustom(false); setSelectedPreset(opt) }}
        onToggleCustom={() => { setUseCustom((p) => !p); if (!useCustom) setSelectedPreset('') }}
        onChangeStart={setCustomStart}
        onChangeEnd={setCustomEnd}
        onSave={savePicker}
        styles={styles}
        colors={colors}
      />
    </>
  )
}
