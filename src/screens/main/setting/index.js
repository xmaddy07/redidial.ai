import React, { useMemo } from 'react'
import { View, Text, ScrollView, Pressable, Image } from 'react-native'
import { Alert } from '../../../utils/alert'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'
import Header from '../../../component/header'
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero'
import { images } from '../../../constant'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useTheme } from '../../../hooks/useTheme'
import { wp } from '../../../theme/layout'
import getStyles from './styles'

const SETTING_SECTIONS = [
  {
    title: 'Workspace',
    items: [
      { label: 'Channels', subtitle: 'Manage communication channels', route: 'channel', icon: images.channel },
      { label: 'Users', subtitle: 'Team members & permissions', route: 'users', icon: images.users },
      { label: 'Organization Details', subtitle: 'Company profile & contacts', route: 'organization', icon: images.orga },
      { label: 'IVR Setup', subtitle: 'Call flows & voice menus', route: 'iVRSetup', icon: images.ivr },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { label: 'Linked Accounts', subtitle: 'Connected apps & services', route: 'linkedAccount', icon: images.user },
    ],
  },
  {
    title: 'Billing',
    items: [
      { label: 'Subscriptions', subtitle: 'Plans & renewals', route: 'subscriptions', icon: images.subs },
      { label: 'Invoices', subtitle: 'Payment history & receipts', route: 'invoices', icon: images.invo },
    ],
  },
  {
    title: 'Security & Alerts',
    items: [
      { label: '2FA', subtitle: 'Two-factor authentication', route: 'twoFA', icon: images.fa },
      { label: 'Intimation', subtitle: 'Notification preferences', route: 'intimation', icon: images.bell },
      { label: 'Lead Reports', subtitle: 'Scheduled lead summaries', route: 'leadReports', icon: images.analytics },
    ],
  },
]

function SettingRow({ item, onPress, styles, colors, isLast, chevronSize, isCompact }) {
  const comingSoon = !item.route

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
      android_ripple={{
        color: isCompact ? `${colors.primary}14` : `${colors.primary}18`,
        borderless: false,
      }}
    >
      <LinearGradient
        colors={[colors.primary, `${colors.primary}CC`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconBox}
      >
        {!!item.icon && (
          <Image source={item.icon} style={styles.iconImage} resizeMode="contain" />
        )}
      </LinearGradient>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.buttonTitle} numberOfLines={1}>{item.label}</Text>
          {comingSoon && (
            <View style={styles.soonBadge}>
              <Text style={styles.soonText}>Soon</Text>
            </View>
          )}
        </View>
        {!!item.subtitle && (
          <Text style={styles.buttonSubtitle} numberOfLines={2}>{item.subtitle}</Text>
        )}
      </View>

      <View style={styles.chevronWrap}>
        <Icon name="chevron-right" size={chevronSize} color={colors.gray} />
      </View>
    </Pressable>
  )
}

function SettingSection({ section, onPress, styles, colors, chevronSize, isCompact }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionCard}>
        {section.items.map((item, index) => (
          <SettingRow
            key={item.label}
            item={item}
            onPress={() => onPress(item)}
            styles={styles}
            colors={colors}
            isLast={index === section.items.length - 1}
            chevronSize={chevronSize}
            isCompact={isCompact}
          />
        ))}
      </View>
    </View>
  )
}

export default function Settings({ navigation }) {
  const { layout, styleOptions } = useScreenLayout({ tabBarAware: true })
  const { isCompact } = layout
  const { colors, themeMode } = useTheme()
  const isDark = themeMode === 'dark'
  const styles = useMemo(
    () => getStyles(colors, isDark, styleOptions),
    [colors, isDark, styleOptions],
  )
  const chevronSize = isCompact ? wp(4) : wp(4.5)

  const settingStats = useMemo(() => {
    const totalItems = SETTING_SECTIONS.reduce((sum, s) => sum + s.items.length, 0)
    return [
      { value: SETTING_SECTIONS.length, label: 'Categories' },
      { value: totalItems, label: 'Settings' },
    ]
  }, [])

  const handlePress = (item) => {
    if (item.route) {
      navigation.navigate(item.route)
      return
    }
    Alert.alert('Coming soon', `${item.label} is not available yet.`)
  }

  return (
    <View style={styles.screen}>
      <Header title={'Settings'} search={false} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentInner}>
          <SettingsHero
            colors={colors}
            isDark={isDark}
            styles={styles}
            icon="sliders"
            title="Control Center"
            subtitle="Manage your organization, billing, and security in one place."
          />

          <SettingsStatPills styles={styles} items={settingStats} />

          {SETTING_SECTIONS.map((section) => (
            <SettingSection
              key={section.title}
              section={section}
              onPress={handlePress}
              styles={styles}
              colors={colors}
              chevronSize={chevronSize}
              isCompact={isCompact}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
