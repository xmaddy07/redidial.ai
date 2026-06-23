import React, { useMemo, useState } from 'react'
import { View, Text, Image, ScrollView, Pressable, TouchableOpacity, Modal, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native'
import { Alert } from '../../../utils/alert'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import { images } from '../../../constant'
import SettingHeader from '../../../component/settingHeader'
import { useSelector } from 'react-redux'
import { useTheme } from '../../../hooks/useTheme'
import { BASE_URL } from '../../../config'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { wp } from '../../../theme/layout'
import getStyles, { getModalStyles } from './styles'

function ProfileField({ label, icon, value, styles, colors, isLast, iconSize }) {
  return (
    <View>
      <View style={styles.fieldRow}>
        <View style={styles.iconBox}>
          <Icon name={icon} size={iconSize} color={colors.primary} />
        </View>
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={styles.fieldValue} numberOfLines={1}>{value}</Text>
        </View>
      </View>
      {!isLast && <View style={styles.rowDivider} />}
    </View>
  )
}

function deriveProfileFields(user) {
  if (!user) {
    return {
      displayName: '—',
      fullName: '—',
      username: '—',
      email: '—',
      role: '—',
      status: 'Active',
      showUsername: false,
      showFullName: false,
    }
  }

  const first = user.first_name || user.firstName || ''
  const last = user.last_name || user.lastName || ''
  const fullName = [first, last].filter(Boolean).join(' ')
  const username =
    user.username ||
    (user.email ? String(user.email).split('@')[0] : '—')
  const email = user.email || user.contactEmail || '—'
  const role = user.role || user.userRole || user.type || '—'

  const hasFullName = Boolean(fullName)
  const displayName = hasFullName ? fullName : username
  const showFullName = hasFullName
  const showUsername =
    Boolean(username) &&
    username !== '—' &&
    username.toLowerCase() !== displayName.toLowerCase()

  return {
    displayName,
    fullName: hasFullName ? fullName : '—',
    username,
    email,
    role,
    status: 'Active',
    showUsername,
    showFullName,
  }
}

export default function UserProfile({ navigation }) {
  const { layout, styleOptions } = useScreenLayout({ tabBarAware: true })
  const { isCompact } = layout
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const styles = useMemo(
    () => getStyles(colors, isDark, styleOptions),
    [colors, isDark, styleOptions],
  )
  const iconSize = isCompact ? wp(4) : wp(4.5)
  const user = useSelector((state) => state.auth.user)
  const token = useSelector((state) => state.auth.token)

  const display = deriveProfileFields(user)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  const openEdit = () => {
    const first = user?.first_name || user?.firstName || ''
    const last = user?.last_name || user?.lastName || ''
    if (first || last) {
      setFirstName(first)
      setLastName(last)
    } else {
      const parts = String(display.displayName || '').trim().split(' ')
      setFirstName(parts[0] || '')
      setLastName(parts.slice(1).join(' ') || '')
    }
    setEmail(display.email || '')
    setIsEditOpen(true)
  }

  const userId = user?.id

  const formatRole = (role) => {
    if (!role || role === '—') return '—'
    return String(role).charAt(0).toUpperCase() + String(role).slice(1).toLowerCase()
  }

  const detailFields = [
    display.showUsername && { label: 'Username', icon: 'at-sign', value: display.username },
    { label: 'Role', icon: 'shield', value: formatRole(display.role) },
  ].filter(Boolean)

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title={'Personal Settings'} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentInner}>
          <View style={styles.mainCard}>
          <LinearGradient
            colors={isDark
              ? [`${colors.primary}20`, `${colors.primary}06`]
              : [`${colors.primary}10`, `${colors.primary}02`]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.profileHero}
          >
            <View style={styles.avatarBorder}>
              <Image source={images.img2} style={styles.avatar} />
            </View>

            <Text style={styles.nameText} numberOfLines={2}>{display.displayName}</Text>
            <Text style={styles.emailText} numberOfLines={1}>{display.email}</Text>
          </LinearGradient>

          <View style={styles.editSection}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openEdit}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              style={styles.editBtn}
            >
              <LinearGradient
                colors={[colors.primary, `${colors.primary}D9`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFillObject, styles.editBtnGradient]}
              />
              <View style={styles.editBtnContent}>
                <Icon name="edit-2" size={isCompact ? wp(3.8) : wp(4)} color={colors.white} />
                <Text style={styles.editTxt}>Edit Profile</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Account Details</Text>

            {detailFields.map((field, index) => (
              <ProfileField
                key={field.label}
                label={field.label}
                icon={field.icon}
                value={field.value}
                styles={styles}
                colors={colors}
                isLast={false}
                iconSize={iconSize}
              />
            ))}

            {detailFields.length > 0 && <View style={styles.rowDivider} />}

            <View style={styles.fieldRow}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.16)' : 'rgba(16,185,129,0.12)' }]}>
                <Icon name="check-circle" size={iconSize} color={colors.success || '#10B981'} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Account Status</Text>
                <View style={styles.statusPillActive}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{display.status}</Text>
                </View>
              </View>
            </View>
          </View>
          </View>
        </View>
      </ScrollView>

      <EditUserModal
        visible={isEditOpen}
        layout={layout}
        onClose={() => setIsEditOpen(false)}
        firstName={firstName}
        lastName={lastName}
        email={email}
        onChangeFirstName={setFirstName}
        onChangeLastName={setLastName}
        onChangeEmail={setEmail}
        token={token}
        userId={userId}
        onSaved={() => setIsEditOpen(false)}
      />
    </View>
  )
}

function EditUserModal({
  visible,
  layout,
  onClose,
  firstName,
  lastName,
  email,
  onChangeFirstName,
  onChangeLastName,
  onChangeEmail,
  token,
  userId,
  onSaved,
}) {
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const { isCompact, isWide } = layout
  const styles = useMemo(
    () => getModalStyles(colors, isDark, layout),
    [colors, isDark, layout],
  )
  const inputIconSize = isCompact ? wp(3.8) : wp(4)
  const closeIconSize = isCompact ? wp(4.8) : wp(5)
  const [submitting, setSubmitting] = useState(false)

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Update Failed', 'Missing user id')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = data?.message || 'Failed to update user'
        throw new Error(message)
      }
      onSaved && onSaved()
      Alert.alert('Success', 'Profile updated successfully')
    } catch (e) {
      Alert.alert('Update Failed', e?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            >
              <Icon name="x" size={closeIconSize} color={colors.text} />
            </Pressable>
          </View>

          <Text style={styles.headerSubtitle}>
            Update your personal information below.
          </Text>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputWrap}>
                <Icon name="user" size={inputIconSize} color={colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={onChangeFirstName}
                  placeholder="First name"
                  placeholderTextColor={colors.gray}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputWrap}>
                <Icon name="user" size={inputIconSize} color={colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={onChangeLastName}
                  placeholder="Last name"
                  placeholderTextColor={colors.gray}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Icon name="mail" size={inputIconSize} color={colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={onChangeEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.gray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              disabled={submitting}
              style={({ pressed }) => [styles.cta, styles.cancel, pressed && styles.ctaPressed]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={submitting}
              style={({ pressed }) => [
                styles.saveWrap,
                pressed && !submitting && styles.ctaPressed,
              ]}
            >
              <LinearGradient
                colors={[colors.primary, `${colors.primary}D9`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cta, styles.save]}
              >
                {submitting
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.saveText}>Save Changes</Text>}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}
