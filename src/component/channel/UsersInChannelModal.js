import React, { useEffect, useMemo, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import { fonts, images } from '../../constant'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from '../../theme/layout'
import api from '../../api'
import { useTheme } from '../../hooks/useTheme'

export default function UsersInChannelModal({
  visible,
  onClose,
  channelNumber,
  token,
  orgId,
  channelId,
  linkedUsers = [],
  onLinkChange,
}) {
  const { colors } = useTheme()
  const styles = getStyles(colors)

  const [allUsers, setAllUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoadingUserId, setActionLoadingUserId] = useState(null)
  const [error, setError] = useState('')

  const linkedIds = useMemo(() => new Set((linkedUsers || []).map(u => u.id)), [linkedUsers])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!visible) return
      setIsLoading(true)
      setError('')
      try {
        const data = await api.getOrgUsers(token)
        if (cancelled) return
        const list = Array.isArray(data)
          ? data.map(u => ({
              id: u?.id ?? u?.user_id ?? String(Math.random()),
              name: [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.name || u?.email || 'Unknown',
              email: u?.email || '',
            }))
          : []
        setAllUsers(list)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load users')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [visible, token])

  const handleToggle = async (user) => {
    if (!orgId || !channelId || !user?.id) return
    const willLink = !linkedIds.has(user.id)
    setActionLoadingUserId(user.id)
    try {
      const payload = {
        org_id: orgId,
        user_id: user.id,
        channel_id: channelId,
        status: willLink ? 'linked' : 'unlinked',
      }
      await api.linkChannelUser({ token, payload })
      if (typeof onLinkChange === 'function') {
        onLinkChange({ channelId, user, action: willLink ? 'linked' : 'unlinked' })
      }
    } catch (e) {
      // no-op
    } finally {
      setActionLoadingUserId(null)
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{`Users in Channel ${channelNumber}`}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeHit}>
              <Icon name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingTxt}>Loading users...</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingRow}>
              <Icon name="alert-triangle" size={16} color={colors.accent || colors.primary} />
              <Text style={styles.loadingTxt}>{error}</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: hp(40) }}>
              {Array.isArray(allUsers) && allUsers.length > 0 ? (
                allUsers.map((u) => {
                  const isLinked = linkedIds.has(u.id)
                  const isBusy = actionLoadingUserId === u.id
                  return (
                    <View key={String(u.id)} style={styles.userItem}>
                      <Image source={images.users} style={styles.avatar} resizeMode="contain" />
                      <View style={styles.userInfo}>
                        <Text style={styles.name}>{u.name || u.email || 'Unknown'}</Text>
                        {u.email ? <Text style={styles.email}>{u.email}</Text> : null}
                      </View>
                      <TouchableOpacity
                        disabled={isBusy}
                        style={[styles.linkBtn, isLinked ? styles.unlinkBtn : styles.doLinkBtn]}
                        onPress={() => handleToggle(u)}
                      >
                        {isBusy ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <Text style={styles.linkTxt}>{isLinked ? 'Unlink' : '+ Link'}</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )
                })
              ) : (
                <View style={styles.userItem}>
                  <View style={styles.userInfo}>
                    <Text style={styles.name}>No users found</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
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
  closeHit: {
    padding: wp(1.5),
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.2),
  },
  avatar: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    marginRight: wp(3),
  },
  userInfo: {
    flex: 1,
    marginLeft: wp(2),
  },
  name: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: wp(3.6),
  },
  email: {
    color: colors.gray,
    fontSize: wp(3),
    marginTop: hp(0.3),
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
  },
  loadingTxt: {
    color: colors.text,
    marginLeft: wp(2),
  },
  linkBtn: {
    paddingVertical: hp(0.9),
    paddingHorizontal: wp(3),
    borderRadius: wp(2.5),
  },
  doLinkBtn: {
    backgroundColor: colors.primary,
  },
  unlinkBtn: {
    backgroundColor: colors.element1 || colors.accent,
  },
  linkTxt: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontSize: wp(3.2),
  },
})
