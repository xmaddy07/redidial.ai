import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, Linking, Platform, ToastAndroid, ActivityIndicator } from 'react-native'
import { Alert } from '../../../utils/alert'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/Feather'
import moment from 'moment'
import getStyles from './styles'
import SettingHeader from '../../../component/settingHeader'
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero'
import LoadingView from '../../../component/LoadingView'
import { useTheme } from '../../../hooks/useTheme'
import { APP_URL } from '../../../config'
import { resolveOrgIdFromUser } from '../../../utils/dnc'
import {
  getOrganizationDetails,
  getOrganizationStats,
  createStripeCheckoutSession,
  verifyStripeCheckoutSession,
  cancelStripeSubscription,
  getActiveStripeSubscription,
  getActiveStripeSubscriptionByUser,
} from '../../../api'

const PENDING_CHECKOUT_KEY = '@redidial/pending_checkout_session'
const PREMIUM_PLAN = {
  id: 'premium',
  name: 'Premium Plan',
  price: 500,
  interval: 'month',
  description:
    'Ideal for growing businesses with advanced needs and high-volume operations.',
}

const FEATURES = [
  '5000 RediCredits',
  '2000 Vehicles',
  '1000 Messages',
  'Priority Support',
  'Advanced Analytics',
  'SMS Integration',
  'Custom Workflows',
]

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due'])

function showToast(title, message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
    return
  }
  Alert.alert(title, message)
}

function unwrapPayload(payload) {
  if (payload == null) return null
  return payload?.data ?? payload?.result ?? payload
}

function normalizeSubscriptions(payload) {
  const root = unwrapPayload(payload)
  const raw =
    root?.subscriptions ??
    root?.subscription ??
    root?.activeSubscription ??
    root?.active_subscription

  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') return [raw]
  return []
}

function pickActiveSubscription(...sources) {
  for (const source of sources) {
    const list = normalizeSubscriptions(source)
    const active = list.find((item) =>
      ACTIVE_STATUSES.has(String(item?.status || item?.subscription_status || '').toLowerCase()),
    )
    if (active) return active
    if (list[0]) return list[0]
  }
  return null
}

function pickCheckoutUrl(payload) {
  const root = unwrapPayload(payload)
  return (
    root?.url ||
    root?.checkoutUrl ||
    root?.checkout_url ||
    root?.sessionUrl ||
    root?.session_url ||
    payload?.url ||
    null
  )
}

function pickSessionId(payload) {
  const root = unwrapPayload(payload)
  return root?.sessionId || root?.session_id || root?.id || null
}

function pickSubscriptionId(subscription) {
  if (!subscription) return null
  return (
    subscription?.subscriptionId ||
    subscription?.subscription_id ||
    subscription?.id ||
    subscription?.stripe_subscription_id ||
    null
  )
}

function formatMoney(amount, currency = 'USD') {
  if (amount == null || amount === '') return null
  const numeric = Number(amount)
  if (!Number.isFinite(numeric)) return null
  const value = numeric >= 100 ? numeric / 100 : numeric
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || 'USD').toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatInterval(subscription) {
  const interval =
    subscription?.interval ||
    subscription?.billing_interval ||
    subscription?.plan?.interval ||
    PREMIUM_PLAN.interval

  const count = Number(subscription?.interval_count || subscription?.plan?.interval_count || 1)
  if (count === 1) return `/${interval}`
  return `/${count} ${interval}s`
}

function formatStatus(status) {
  const value = String(status || 'inactive').replace(/_/g, ' ')
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatBillingDate(subscription) {
  const raw =
    subscription?.next_billing_date ||
    subscription?.nextBillingDate ||
    subscription?.current_period_end ||
    subscription?.currentPeriodEnd ||
    subscription?.billing_cycle_anchor

  if (!raw) return null
  const parsed = moment(raw)
  return parsed.isValid() ? parsed.format('MMM D, YYYY') : null
}

function resolveUserEmail(user) {
  return (user?.email || user?.contactEmail || '').trim()
}

function resolveUserId(user) {
  return user?.id ?? user?.userId ?? user?.user_id ?? null
}

function buildSubscriptionSummary(subscription, orgStats) {
  const statsRoot = unwrapPayload(orgStats) || {}
  const planName =
    subscription?.plan_name ||
    subscription?.planName ||
    subscription?.plan?.name ||
    subscription?.plan?.nickname ||
    PREMIUM_PLAN.name

  const status = subscription?.status || subscription?.subscription_status || 'inactive'
  const amount =
    subscription?.amount ??
    subscription?.plan_amount ??
    subscription?.plan?.amount ??
    PREMIUM_PLAN.price * 100

  const currency = subscription?.currency || subscription?.plan?.currency || 'USD'
  const rediCredits =
    statsRoot?.rediCredits ??
    statsRoot?.redi_credits ??
    statsRoot?.credits ??
    subscription?.rediCredits ??
    subscription?.redi_credits

  const subscribedUser =
    subscription?.subscribed_user ||
    subscription?.subscribedUser ||
    subscription?.customer_email ||
    subscription?.customerEmail ||
    subscription?.user_email ||
    subscription?.userEmail

  return {
    planName,
    status,
    amountDisplay: formatMoney(amount, currency) || `$${PREMIUM_PLAN.price}`,
    intervalDisplay: formatInterval(subscription),
    rediCredits: rediCredits != null ? String(rediCredits) : null,
    subscribedUser: subscribedUser || null,
    nextBillingDate: formatBillingDate(subscription),
    isActive: ACTIVE_STATUSES.has(String(status).toLowerCase()),
  }
}

export default function Subscription({ navigation, route }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])

  const token = useSelector((state) => state.auth.token)
  const user = useSelector((state) => state.auth.user)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [orgStats, setOrgStats] = useState(null)
  const [activeSubscription, setActiveSubscription] = useState(null)

  const summary = useMemo(
    () => buildSubscriptionSummary(activeSubscription, orgStats),
    [activeSubscription, orgStats],
  )

  const isCurrentPlan = summary.isActive

  const loadSubscriptionData = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) return

      if (!silent) setLoading(true)
      else setRefreshing(true)

      try {
        let orgId = resolveOrgIdFromUser(user)
        let stats = null

        if (!orgId) {
          const orgRes = await getOrganizationDetails(token)
          const orgData = unwrapPayload(orgRes)
          orgId = resolveOrgIdFromUser(user, orgData)
        }

        if (orgId) {
          try {
            stats = await getOrganizationStats({ token, orgId })
            setOrgStats(stats)
          } catch (error) {
            console.warn('Organization stats:', error?.message || error)
          }
        }

        let subscription = pickActiveSubscription(stats)

        if (!subscription) {
          const email = resolveUserEmail(user)
          if (email) {
            try {
              const byEmail = await getActiveStripeSubscription({ token, email })
              subscription = pickActiveSubscription(byEmail)
            } catch (error) {
              console.warn('Active subscription by email:', error?.message || error)
            }
          }
        }

        if (!subscription) {
          const userId = resolveUserId(user)
          if (userId != null) {
            try {
              const byUser = await getActiveStripeSubscriptionByUser({ token, userId })
              subscription = pickActiveSubscription(byUser)
            } catch (error) {
              console.warn('Active subscription by user:', error?.message || error)
            }
          }
        }

        setActiveSubscription(subscription)
      } catch (error) {
        console.error('Subscription load failed:', error?.message || error)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [token, user],
  )

  const verifyPendingCheckout = useCallback(async () => {
    if (!token) return

    const pendingSessionId = await AsyncStorage.getItem(PENDING_CHECKOUT_KEY)
    if (!pendingSessionId) return

    try {
      await verifyStripeCheckoutSession({ token, sessionId: pendingSessionId })
      await AsyncStorage.removeItem(PENDING_CHECKOUT_KEY)
      showToast('Subscription', 'Payment verified successfully.')
      await loadSubscriptionData({ silent: true })
    } catch (error) {
      console.warn('Checkout verification:', error?.message || error)
    }
  }, [token, loadSubscriptionData])

  const handleReturnParams = useCallback(
    async (params = {}) => {
      if (params?.canceled === true || params?.canceled === 'true') {
        await AsyncStorage.removeItem(PENDING_CHECKOUT_KEY)
        showToast('Subscription', 'Checkout was canceled.')
        navigation.setParams?.({ canceled: undefined, success: undefined, session_id: undefined })
        return
      }

      const sessionId = params?.session_id || params?.sessionId
      if (params?.success === true || params?.success === 'true' || sessionId) {
        if (sessionId) {
          try {
            await verifyStripeCheckoutSession({ token, sessionId })
            await AsyncStorage.removeItem(PENDING_CHECKOUT_KEY)
            showToast('Subscription', 'Payment verified successfully.')
            await loadSubscriptionData({ silent: true })
          } catch (error) {
            Alert.alert('Verification failed', error?.message || 'Could not verify payment.')
          }
        } else {
          await verifyPendingCheckout()
        }
        navigation.setParams?.({ canceled: undefined, success: undefined, session_id: undefined })
      }
    },
    [token, navigation, loadSubscriptionData, verifyPendingCheckout],
  )

  useEffect(() => {
    loadSubscriptionData()
  }, [loadSubscriptionData])

  useFocusEffect(
    useCallback(() => {
      verifyPendingCheckout()
    }, [verifyPendingCheckout]),
  )

  useEffect(() => {
    if (route?.params) {
      handleReturnParams(route.params)
    }
  }, [route?.params, handleReturnParams])

  const promptForEmail = () => {
    Alert.alert(
      'Email required',
      'Add your email address before starting checkout.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open profile',
          onPress: () => navigation.navigate('userProfile'),
        },
      ],
    )
  }

  const handleUpgrade = async () => {
    const email = resolveUserEmail(user)
    if (!email) {
      promptForEmail()
      return
    }

    try {
      setCheckoutLoading(true)

      const payload = {
        email,
        planType: PREMIUM_PLAN.id,
        plan: PREMIUM_PLAN.id,
        successUrl: `${APP_URL}/app/crm/settings/subscription/success?success=true`,
        cancelUrl: `${APP_URL}/app/crm/settings/subscription/cancel?canceled=true`,
      }

      const response = await createStripeCheckoutSession({ token, payload })
      const checkoutUrl = pickCheckoutUrl(response)
      const sessionId = pickSessionId(response)

      if (!checkoutUrl) {
        Alert.alert('Checkout unavailable', 'No checkout URL was returned by the server.')
        return
      }

      if (sessionId) {
        await AsyncStorage.setItem(PENDING_CHECKOUT_KEY, String(sessionId))
      }

      const supported = await Linking.canOpenURL(checkoutUrl)
      if (!supported) {
        Alert.alert('Cannot open checkout', 'No application can handle the checkout URL.')
        return
      }

      await Linking.openURL(checkoutUrl)
    } catch (error) {
      Alert.alert('Checkout failed', error?.message || 'Could not start Stripe checkout.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleCancel = () => {
    const subscriptionId = pickSubscriptionId(activeSubscription)
    if (!subscriptionId) {
      Alert.alert('Cancel unavailable', 'No active subscription was found to cancel.')
      return
    }

    Alert.alert(
      'Cancel subscription',
      'Are you sure you want to cancel your active subscription? You may retain access until the end of the current billing period.',
      [
        { text: 'Keep plan', style: 'cancel' },
        {
          text: 'Cancel subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelLoading(true)
              await cancelStripeSubscription({ token, subscriptionId })
              showToast('Subscription', 'Subscription canceled successfully.')
              await loadSubscriptionData({ silent: true })
            } catch (error) {
              Alert.alert('Cancel failed', error?.message || 'Could not cancel subscription.')
            } finally {
              setCancelLoading(false)
            }
          },
        },
      ],
    )
  }

  const statPills = [
    {
      value: isCurrentPlan ? summary.planName : 'None',
      label: 'Current plan',
    },
    {
      value: isCurrentPlan ? summary.amountDisplay : `$${PREMIUM_PLAN.price}`,
      label: isCurrentPlan ? `Per ${summary.intervalDisplay.replace('/', '')}` : 'Per month',
    },
  ]

  if (loading) {
    return (
      <View style={styles.container}>
        <SettingHeader navigation={navigation} title="Subscriptions" />
        <LoadingView text="Loading subscription..." flex />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title="Subscriptions" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHero
          colors={colors}
          isDark={isDark}
          styles={styles}
          icon="credit-card"
          title="Subscription Management"
          subtitle="Manage your plan, billing cycle, and premium features for your organization."
        />

        <SettingsStatPills styles={styles} items={statPills} />

        {isCurrentPlan ? (
          <>
            <Text style={styles.sectionLabel}>Active subscription</Text>
            <View style={styles.card}>
              <View style={styles.metaChips}>
                <View style={styles.metaChip}>
                  <Icon name="layers" size={12} color={colors.gray} />
                  <Text style={styles.metaChipText}>{summary.planName}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Icon name="activity" size={12} color={colors.gray} />
                  <Text style={styles.metaChipText}>{formatStatus(summary.status)}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Icon name="dollar-sign" size={12} color={colors.gray} />
                  <Text style={styles.metaChipText}>
                    {summary.amountDisplay}
                    {summary.intervalDisplay}
                  </Text>
                </View>
                {summary.rediCredits ? (
                  <View style={styles.metaChip}>
                    <Icon name="zap" size={12} color={colors.gray} />
                    <Text style={styles.metaChipText}>{summary.rediCredits} RediCredits</Text>
                  </View>
                ) : null}
                {summary.subscribedUser ? (
                  <View style={styles.metaChip}>
                    <Icon name="user" size={12} color={colors.gray} />
                    <Text style={styles.metaChipText}>{summary.subscribedUser}</Text>
                  </View>
                ) : null}
                {summary.nextBillingDate ? (
                  <View style={styles.metaChip}>
                    <Icon name="calendar" size={12} color={colors.gray} />
                    <Text style={styles.metaChipText}>Next billing {summary.nextBillingDate}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>{isCurrentPlan ? 'Your plan' : 'Available plan'}</Text>

        <View style={[styles.planCard, isCurrentPlan && styles.planCardActive]}>
          {isCurrentPlan ? (
            <View style={styles.currentBadge}>
              <Icon name="check-circle" size={13} color={colors.success} />
              <Text style={styles.currentBadgeText}>Current Plan</Text>
            </View>
          ) : (
            <View style={styles.popularBadge}>
              <Icon name="star" size={13} color={colors.primary} />
              <Text style={styles.popularText}>Most Popular</Text>
            </View>
          )}

          <View style={styles.planBody}>
            <View style={styles.planHeader}>
              <View style={styles.planIconWrap}>
                <Icon name="zap" size={18} color={colors.primary} />
              </View>
              <Text style={styles.planTitle}>{PREMIUM_PLAN.name}</Text>
            </View>

            <Text style={styles.planDesc}>{PREMIUM_PLAN.description}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceNum}>${PREMIUM_PLAN.price}</Text>
              <Text style={styles.priceUnit}>/month</Text>
            </View>

            <View style={styles.features}>
              {FEATURES.map((item) => (
                <View key={item} style={styles.featureRow}>
                  <View style={styles.featureCheck}>
                    <Icon name="check" size={13} color={colors.success} />
                  </View>
                  <Text style={styles.featureText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <Icon name="info" size={16} color={colors.primary} />
            <Text style={styles.infoTitle}>Billing information</Text>
          </View>
          <Text style={styles.infoText}>
            {isCurrentPlan
              ? 'Your Premium plan renews automatically. Cancel anytime before the next billing date. Contact support for enterprise pricing.'
              : 'Upgrading applies immediately. Your next invoice will reflect the new plan. Contact support for downgrades or custom enterprise pricing.'}
          </Text>
        </View>

        <Pressable
          onPress={isCurrentPlan ? undefined : handleUpgrade}
          disabled={isCurrentPlan || checkoutLoading}
          style={({ pressed }) => [
            styles.primaryBtn,
            isCurrentPlan && styles.primaryBtnDisabled,
            pressed && !isCurrentPlan && { opacity: 0.9 },
          ]}
        >
          {checkoutLoading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Icon
                name={isCurrentPlan ? 'check-circle' : 'arrow-up-circle'}
                size={18}
                color={colors.white}
              />
              <Text style={styles.primaryBtnText}>
                {isCurrentPlan ? 'Current Plan' : 'Upgrade Plan'}
              </Text>
            </>
          )}
        </Pressable>

        {isCurrentPlan ? (
          <Pressable
            onPress={handleCancel}
            disabled={cancelLoading}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && { opacity: 0.9 },
              cancelLoading && styles.btnDisabled,
            ]}
          >
            {cancelLoading ? (
              <ActivityIndicator color={colors.danger || '#DC2626'} size="small" />
            ) : (
              <>
                <Icon name="x-circle" size={18} color={colors.danger || '#DC2626'} />
                <Text style={styles.cancelBtnText}>Cancel subscription</Text>
              </>
            )}
          </Pressable>
        ) : null}

        {refreshing ? (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.stateText}>Refreshing subscription...</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}
