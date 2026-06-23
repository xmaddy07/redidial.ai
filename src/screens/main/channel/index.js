import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ToastAndroid, ScrollView, ActivityIndicator } from 'react-native'
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import SettingHeader from '../../../component/settingHeader';
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero';
import UsersInChannelModal from '../../../component/channel/UsersInChannelModal';
import CreateChannelModal from '../../../component/channel/CreateChannelModal';
import { useScreenLayout } from '../../../hooks/useScreenLayout';
import getStyles from './styles';
import { useSelector } from 'react-redux';
import api from '../../../api';
import { useTheme } from '../../../hooks/useTheme';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function UserRow({ user, styles, colors, isDark }) {
  const displayName = user.name || user.email || 'Unknown';

  return (
    <View style={styles.userRow}>
      <LinearGradient
        colors={
          isDark
            ? [`${colors.primary}40`, `${colors.primary}22`]
            : [`${colors.primary}28`, `${colors.primary}14`]
        }
        style={styles.userAvatar}
      >
        <Text style={styles.userInitials}>{getInitials(displayName)}</Text>
      </LinearGradient>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
        {!!user.email && (
          <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
        )}
      </View>
    </View>
  );
}

function ChannelCard({
  channelData,
  users,
  isLoadingUsers,
  usersError,
  onAddUser,
  onConfigureIvr,
  styles,
  colors,
  isDark,
  showCreatedDate,
}) {
  const phoneNumber =
    channelData.phone_number || channelData.number || '—';
  const orgId = channelData.organization_id ?? '—';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.phoneRow}>
          <LinearGradient
            colors={[colors.primary, `${colors.primary}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.phoneIconWrap}
          >
            <Icon name="phone" size={18} color={colors.white} />
          </LinearGradient>
          <View style={styles.phoneInfo}>
            <Text style={styles.phoneLabel}>Phone number</Text>
            <Text style={styles.phoneText}>{phoneNumber}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
          <Pressable onPress={onAddUser}>
            <LinearGradient
              colors={[colors.primary, `${colors.primary}CC`]}
              style={styles.addUserBtn}
            >
              <Icon name="user-plus" size={15} color={colors.white} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <View style={styles.metaChips}>
        <View style={styles.metaChip}>
          <Icon name="briefcase" size={12} color={colors.gray} />
          <Text style={styles.metaChipText}>Org ID: {String(orgId)}</Text>
        </View>
        {showCreatedDate && (
          <View style={styles.metaChip}>
            <Icon name="calendar" size={12} color={colors.gray} />
            <Text style={styles.metaChipText}>Created: March 17, 2025</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.linkedHeader}>
        <Text style={styles.linkedUsers}>Linked users</Text>
        {!isLoadingUsers && !usersError && (
          <Text style={styles.userCount}>
            {users.length} {users.length === 1 ? 'member' : 'members'}
          </Text>
        )}
      </View>

      {isLoadingUsers ? (
        <View style={styles.stateRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.stateText}>Loading users…</Text>
        </View>
      ) : usersError ? (
        <View style={styles.stateRow}>
          <Icon name="alert-triangle" size={16} color={colors.danger} />
          <Text style={[styles.stateText, styles.stateTextError]}>{usersError}</Text>
        </View>
      ) : users.length > 0 ? (
        users.map(u => (
          <UserRow
            key={String(u.id)}
            user={u}
            styles={styles}
            colors={colors}
            isDark={isDark}
          />
        ))
      ) : (
        <View style={styles.emptyUsers}>
          <Icon name="users" size={16} color={colors.gray} />
          <Text style={styles.emptyUsersText}>
            No users linked yet. Tap + to add team members.
          </Text>
        </View>
      )}

      <View style={styles.footerRow}>
        <View style={styles.footerActions}>
          <Pressable
            style={({ pressed }) => [
              styles.footerPill,
              pressed && styles.footerPillPressed,
            ]}
          >
            <Icon name="bar-chart-2" size={13} color={colors.primary} />
            <Text style={styles.footerText}>Analytics</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.footerPill,
              pressed && styles.footerPillPressed,
            ]}
          >
            <Icon name="file-text" size={13} color={colors.primary} />
            <Text style={styles.footerText}>Logs</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={onConfigureIvr}
          style={({ pressed }) => [
            styles.ivrBtn,
            pressed && styles.ivrBtnPressed,
          ]}
        >
          <Icon name="settings" size={12} color={colors.white} />
          <Text style={styles.ivrBtnText}>Configure IVR</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Channel({ navigation }) {
  const { colors, themeMode } = useTheme();
  const { styleOptions } = useScreenLayout();
  const isDark = themeMode === 'dark';
  const styles = useMemo(() => getStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions]);

  const user = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newChannelNumber, setNewChannelNumber] = useState('');
  const [channel, setChannel] = useState({
    id: 'ch_1',
    number: '9823739238',
    users: [],
  });
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [channels, setChannels] = useState([]);
  const [channelUsersById, setChannelUsersById] = useState({});
  const [activeChannelForModal, setActiveChannelForModal] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      setUsersError('');
      try {
        const channelList = await api.getChatChannels(token);
        if (isCancelled) return;
        const safeList = Array.isArray(channelList) ? channelList : [];
        setChannels(safeList);

        const results = await Promise.all(
          safeList.map(async c => {
            try {
              const data = await api.getChannelUsersByChannel({
                token,
                channelId: c.id,
              });
              const mapped = Array.isArray(data)
                ? data.map(item => ({
                    id:
                      item?.user?.id ??
                      item?.user_id ??
                      String(Math.random()),
                    name:
                      [item?.user?.first_name, item?.user?.last_name]
                        .filter(Boolean)
                        .join(' ') || 'Unknown',
                    email: item?.user?.email || '',
                  }))
                : [];
              return [c.id, mapped];
            } catch (e) {
              return [c.id, []];
            }
          }),
        );
        if (isCancelled) return;
        const byId = results.reduce((acc, [id, list]) => {
          acc[id] = list;
          return acc;
        }, {});
        setChannelUsersById(byId);
      } catch (err) {
        if (!isCancelled) {
          setUsersError(err?.message || 'Failed to load channel users');
        }
      } finally {
        if (!isCancelled) setIsLoadingUsers(false);
      }
    };
    fetchUsers();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  const totalLinkedUsers = useMemo(
    () =>
      Object.values(channelUsersById).reduce(
        (sum, list) => sum + (list?.length || 0),
        0,
      ),
    [channelUsersById],
  );

  const openUserModal = channelItem => {
    setActiveChannelForModal(channelItem);
    setIsUserModalVisible(true);
  };

  const hasChannels = Array.isArray(channels) && channels.length > 0;

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title={'Channels'} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHero
          colors={colors}
          isDark={isDark}
          styles={styles}
          icon="hash"
          title="Channel Management"
          subtitle="Manage phone numbers, link team members, and configure call routing for each channel."
          actionLabel="New"
          onAction={() => setIsCreateModalVisible(true)}
        />

        <SettingsStatPills
          styles={styles}
          items={[
            { value: channels.length, label: 'Channels' },
            { value: totalLinkedUsers, label: 'Linked users' },
          ]}
        />

        {isLoadingUsers && !hasChannels ? (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.stateText}>Loading channels…</Text>
          </View>
        ) : hasChannels ? (
          <>
            <Text style={styles.sectionLabel}>Your channels</Text>
            {channels.map(c => (
              <ChannelCard
                key={String(c.id)}
                channelData={c}
                users={channelUsersById[c.id] || []}
                isLoadingUsers={isLoadingUsers}
                usersError={usersError}
                onAddUser={() => openUserModal(c)}
                onConfigureIvr={() => navigation.navigate('iVRSetup')}
                styles={styles}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="phone" size={24} color={colors.gray} />
            </View>
            <Text style={styles.emptyTitle}>No channels yet</Text>
            <Text style={styles.emptyHint}>
              Create your first channel to start receiving calls and linking
              team members.
            </Text>
            <Pressable
              onPress={() => setIsCreateModalVisible(true)}
              style={({ pressed }) => [
                styles.newChannelBtn,
                pressed && styles.newChannelBtnPressed,
              ]}
            >
              <Icon name="plus" size={14} color={colors.white} />
              <Text style={styles.newChannelBtnText}>Create Channel</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <UsersInChannelModal
        visible={isUserModalVisible}
        onClose={() => setIsUserModalVisible(false)}
        channelNumber={
          activeChannelForModal?.phone_number || channel.number
        }
        token={token}
        orgId={user?.orgId || activeChannelForModal?.organization_id}
        channelId={activeChannelForModal?.id}
        linkedUsers={
          activeChannelForModal
            ? channelUsersById[activeChannelForModal.id] || []
            : channel.users
        }
        onLinkChange={({ channelId, user: changedUser, action }) => {
          setChannelUsersById(prev => {
            const current = prev[channelId] || [];
            if (action === 'linked') {
              if (!current.find(u => u.id === changedUser.id)) {
                return {
                  ...prev,
                  [channelId]: [...current, changedUser],
                };
              }
              return prev;
            }
            return {
              ...prev,
              [channelId]: current.filter(u => u.id !== changedUser.id),
            };
          });
        }}
      />

      <CreateChannelModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        value={newChannelNumber}
        onChangeText={setNewChannelNumber}
        onCreate={async () => {
          if (!newChannelNumber?.trim()) return;
          try {
            const payload = {
              phone_number: newChannelNumber.trim(),
              organization_id: user?.orgId,
            };
            const created = await api.createChannel({ token, payload });
            const newId = created?.id ?? Date.now();

            setChannels(prev => [
              { ...(created || payload), id: newId },
              ...prev,
            ]);
            setChannelUsersById(prev => ({
              ...(prev || {}),
              [newId]: [],
            }));

            setNewChannelNumber('');
            ToastAndroid.show(
              'Channel created successfully',
              ToastAndroid.SHORT,
            );
            setTimeout(() => setIsCreateModalVisible(false), 1000);
          } catch (err) {
            ToastAndroid.show('Channel creation failed', ToastAndroid.SHORT);
            setTimeout(() => setIsCreateModalVisible(false), 1000);
          }
        }}
      />
    </View>
  );
}
