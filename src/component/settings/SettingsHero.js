import React from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Feather'

export default function SettingsHero({
  colors,
  isDark,
  styles,
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  actionLoading = false,
  actionIcon = 'plus',
}) {
  return (
    <View style={styles.heroCard}>
      <LinearGradient
        colors={
          isDark
            ? [`${colors.primary}22`, `${colors.primary}08`, 'transparent']
            : [`${colors.primary}14`, `${colors.primary}06`, 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
        pointerEvents="none"
      />
      <View style={styles.heroContent}>
        <View style={styles.heroIconWrap}>
          <LinearGradient
            colors={[colors.primary, `${colors.primary}D9`]}
            style={styles.heroIcon}
          >
            <Icon name={icon} size={22} color={colors.white} />
          </LinearGradient>
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            disabled={actionLoading}
            style={({ pressed }) => [
              styles.heroActionBtn,
              { backgroundColor: colors.primary },
              pressed && !actionLoading && { opacity: 0.92 },
              actionLoading && styles.btnDisabled,
            ]}
          >
            {actionLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Icon name={actionIcon} size={16} color={colors.white} />
                <Text style={styles.heroActionBtnText}>{actionLabel}</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

export function SettingsStatPills({ styles, items = [] }) {
  return (
    <View style={styles.statsRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.statPill}>
          <Text style={styles.statPillValue}>{item.value}</Text>
          <Text style={styles.statPillLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}
