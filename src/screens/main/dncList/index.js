import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, RefreshControl } from 'react-native'
import { Alert } from '../../../utils/alert';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { useScreenLayout } from '../../../hooks/useScreenLayout';
import getStyles from './styles';
import Header from '../../../component/header';
import LoadingView from '../../../component/LoadingView';
import { getDncDataAdd, getDncDataTable, getDncDataRemove } from '../../../api';
import moment from 'moment';
import { useTheme } from '../../../hooks/useTheme';
import { resolveOrgIdFromUser } from '../../../utils/dnc';

const getStatusMeta = (reason = '', source = '') => {
  const text = `${reason} ${source}`.toLowerCase();
  if (text.includes('stop')) return { label: 'STOP MSG', icon: 'slash' };
  if (text.includes('verbal')) return { label: 'VERBAL', icon: 'minus-circle' };
  if (text.includes('unsub')) return { label: 'UNSUBSCRIBE', icon: 'mail' };
  if (text.includes('federal')) return { label: 'FEDERAL', icon: 'alert-circle' };
  if (text.includes('manual')) return { label: 'MANUAL', icon: 'user-x' };
  return { label: 'RESTRICTED', icon: 'slash' };
};

const normalizeEntry = (row, idx) => {
  const reason = row?.reason || row?.description || 'Restricted contact';
  const source = row?.source || '';
  const status = getStatusMeta(reason, source);
  return {
    id: row?.id ?? row?._id ?? idx,
    name: row?.name || row?.customer_name || 'Unknown',
    number: row?.number || row?.phone || row?.customer_telephone || '',
    email: row?.email || row?.customer_email || '',
    reason,
    created_at: row?.created_at || row?.createdAt || row?.updated_at,
    statusLabel: status.label,
    statusIcon: status.icon,
  };
};

export default function DNCList() {
  const { colors, themeMode } = useTheme();
  const { styleOptions } = useScreenLayout();
  const styles = useMemo(() => getStyles(colors, themeMode, styleOptions), [colors, themeMode, styleOptions]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dncEntries, setDncEntries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addReason, setAddReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const token = useSelector((state) => state?.auth?.token);
  const user = useSelector((state) => state?.auth?.user);
  const orgId = resolveOrgIdFromUser(user);
  const debouncedQueryRef = useRef('');
  const skipSearchFetchRef = useRef(true);

  const fetchDncData = async (pageToLoad = 1, append = false, queryOverride, isRefresh = false) => {
    if (!token) return;
    const query = (queryOverride !== undefined ? queryOverride : searchQuery).trim();
    try {
      if (append) setLoadingMore(true);
      else if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await getDncDataTable({
        token,
        pageIndex: pageToLoad,
        pageSize: 10,
        sort: { order: '', key: '' },
        query,
      });

      const rows = response?.items || response?.data || response?.results || [];
      const normalized = rows.map(normalizeEntry);

      setTotalCount(response?.meta?.total || response?.meta?.totalItems || normalized.length);
      setTotalPages(response?.meta?.totalPages || response?.meta?.total_pages || 1);
      setPage(response?.meta?.currentPage || response?.meta?.current_page || pageToLoad);
      setDncEntries((prev) => (append ? [...prev, ...normalized] : normalized));
    } catch (error) {
      console.error('Error fetching DNC data:', error);
      if (!append) setDncEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    fetchDncData(1, false, debouncedQueryRef.current || searchQuery, true);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDncData(1, false, searchQuery);
    }, [token])
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      debouncedQueryRef.current = searchQuery;
    }, 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    if (!token) return;
    if (skipSearchFetchRef.current) {
      skipSearchFetchRef.current = false;
      return;
    }
    const handle = setTimeout(() => {
      fetchDncData(1, false, searchQuery);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchQuery, token]);

  const displayedEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return dncEntries;
    return dncEntries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.number.toLowerCase().includes(q) ||
        entry.reason.toLowerCase().includes(q) ||
        (entry.email || '').toLowerCase().includes(q) ||
        entry.statusLabel.toLowerCase().includes(q)
    );
  }, [dncEntries, searchQuery]);

  const formattedTotal = useMemo(
    () => Number(totalCount || dncEntries.length).toLocaleString('en-US'),
    [totalCount, dncEntries.length]
  );

  const handleHeaderSearch = () => {
    setIsSearchOpen((prev) => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  };

  const onEndReached = () => {
    const hasMore = page < totalPages;
    if (!loading && !loadingMore && hasMore) {
      fetchDncData(page + 1, true, debouncedQueryRef.current || searchQuery);
    }
  };

  const handleRemoveDNC = (entry) => {
    if (!entry?.number) {
      Alert.alert('Error', 'Phone number is required to remove from DNC list.');
      return;
    }
    if (!orgId) {
      Alert.alert('Error', 'Organization ID is missing.');
      return;
    }

    Alert.alert(
      'Remove from DNC',
      'Are you sure you want to remove this contact from DNC list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingId(entry.id);
              await getDncDataRemove({ token, number: entry.number, orgId });
              Alert.alert('Success', 'Contact removed from DNC list successfully');
              fetchDncData(1, false, debouncedQueryRef.current || searchQuery);
            } catch (error) {
              console.error('Error removing from DNC:', error);
              Alert.alert('Error', error?.message || 'Failed to remove contact from DNC list');
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  const handleAddManual = async () => {
    if (!addPhone.trim()) {
      Alert.alert('Required', 'Phone number is required.');
      return;
    }
    try {
      setAdding(true);
      await getDncDataAdd({
        token,
        payload: {
          number: addPhone.trim(),
          name: addName.trim() || 'Manual Entry',
          email: '',
          orgId,
          reason: addReason.trim() || 'Added manually',
        },
      });
      setAddModalOpen(false);
      setAddName('');
      setAddPhone('');
      setAddReason('');
      fetchDncData(1, false);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to add contact to DNC list.');
    } finally {
      setAdding(false);
    }
  };

  const DNCCard = ({ entry }) => {
    const isRemoving = removingId === entry.id;

    return (
      <View style={styles.dncCard}>
        <View style={styles.iconBox}>
          <Icon name={entry.statusIcon} size={20} color={colors.primary} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.contactName} numberOfLines={1}>
              {entry.name}
            </Text>
            <View style={styles.cardTopActions}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{entry.statusLabel}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveDNC(entry)}
                disabled={isRemoving}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color={colors.danger || '#EF4444'} />
                ) : (
                  <Icon name="trash-2" size={16} color={colors.danger || '#EF4444'} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.reasonText} numberOfLines={2}>
            {entry.reason}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="phone" size={12} color={colors.gray} />
              <Text style={styles.metaText}>{entry.number || '—'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="calendar" size={12} color={colors.gray} />
              <Text style={styles.metaText}>
                {entry.created_at && moment(entry.created_at).isValid()
                  ? moment(entry.created_at).format('MMM DD, YYYY')
                  : '—'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreWrap}>
        <ActivityIndicator size="small" color={colors.gray} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="DNC List"
        onPressSearch={handleHeaderSearch}
        showProfile={false}
        searchOnRight
      />

      <View style={styles.content}>
        {isSearchOpen && (
          <View style={styles.searchBar}>
            <Icon name="search" size={16} color={colors.gray} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or phone..."
              placeholderTextColor={colors.gray}
              style={styles.searchInput}
              autoFocus
              returnKeyType="search"
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x" size={16} color={colors.gray} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.summaryRow}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>Total Restricted</Text>
            <View style={styles.summaryCountRow}>
              <Text style={styles.summaryCount}>{formattedTotal}</Text>
              <Text style={styles.summaryContacts}>Contacts</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setAddModalOpen(true)} activeOpacity={0.85}>
            <Icon name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Manual</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingView skeleton="list" flex />
        ) : displayedEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="phone-off" size={48} color={colors.gray} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No entries found matching your search' : 'No DNC entries found'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayedEntries}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => <DNCCard entry={item} />}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListFooterComponent={renderFooter}
          />
        )}
      </View>

      <Modal visible={addModalOpen} transparent animationType="fade" onRequestClose={() => setAddModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Manual Contact</Text>
            <TextInput
              value={addName}
              onChangeText={setAddName}
              placeholder="Name"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
            />
            <TextInput
              value={addPhone}
              onChangeText={setAddPhone}
              placeholder="Phone number *"
              placeholderTextColor={colors.gray}
              keyboardType="phone-pad"
              style={styles.modalInput}
            />
            <TextInput
              value={addReason}
              onChangeText={setAddReason}
              placeholder="Reason (optional)"
              placeholderTextColor={colors.gray}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.inputBg }]}
                onPress={() => setAddModalOpen(false)}
                disabled={adding}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddManual}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
