import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '../../../component/header';
import Icon from 'react-native-vector-icons/Feather';
import { useScreenLayout } from '../../../hooks/useScreenLayout';
import getStyles from './styles';
import EditLeadModal from '../../../component/EditLeadModal';
import CustomerFilterModal, { LEAD_STATUS_FILTERS } from '../../../component/CustomerFilterModal';
import { useSelector } from 'react-redux';
import { fetchLeadsWithCache } from '../../../services/offlineSync';
import { updateLead } from '../../../api';
import moment from 'moment';
import LoadingView, { LoadMoreSkeleton } from '../../../component/LoadingView';
import { useTheme } from '../../../hooks/useTheme';
import { Alert } from '../../../utils/alert';

const getStatusStyles = (status, colors) => {
  const s = String(status || '').toUpperCase();
  if (s.includes('ACTIVE')) {
    return {
      avatarBg: colors.gray,
      badgeBg: `${colors.success}33`,
      badgeText: colors.success,
    };
  }
  if (s.includes('BLOCK')) {
    return {
      avatarBg: colors.gray,
      badgeBg: colors.inputBg,
      badgeText: colors.gray,
    };
  }
  return {
    avatarBg: colors.primary,
    badgeBg: `${colors.primary}1A`,
    badgeText: colors.primary,
  };
};

const formatDateTime = (value) => {
  if (!value || value === '-') return '—';
  const m = moment(value);
  return m.isValid() ? m.format('MMM DD, YYYY • hh:mm A') : '—';
};

const TAB_API_STATUS = {
  All: '',
  Active: 'Active',
  'In Progress': 'In Progress',
};

const matchesFilterStatus = (leadStatus, tab) => {
  const status = String(leadStatus || '').toLowerCase();
  if (tab === 'Active') return status.includes('active');
  if (tab === 'In Progress') return status.includes('progress');
  return true;
};

const PAGE_SIZE = 50;

function LeadsCard({ leades, styles, onEdit, onPress }) {
  const { colors } = useTheme();
  const statusStyles = getStatusStyles(leades.status, colors);
  const isUnknown = String(leades.name).toLowerCase() === 'unknown';
  const hasEmail = leades.email && leades.email !== '-';

  return (
    <TouchableOpacity
      style={styles.customerCard}
      activeOpacity={0.85}
      onPress={() => onPress(leades)}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: statusStyles.avatarBg }]}>
          <Text style={styles.avatarText}>{leades.initials}</Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyles.badgeBg }]}>
          <Text style={[styles.statusBadgeText, { color: statusStyles.badgeText }]}>
            {String(leades.status || 'In Progress').toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.customerName, isUnknown && styles.customerNameUnknown]}>
          {leades.name}
        </Text>
        <View style={styles.contactRow}>
          <Icon name="mail" size={12} color={colors.gray} />
          <Text style={[styles.contactText, !hasEmail && styles.contactTextEmpty]} numberOfLines={1}>
            {hasEmail ? leades.email : 'No email provided'}
          </Text>
        </View>
        <View style={styles.contactRow}>
          <Icon name="clock" size={12} color={colors.gray} />
          <Text style={styles.contactText}>{formatDateTime(leades.datetime)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => onEdit(leades.id)}
        activeOpacity={0.7}
      >
        <Icon name="edit-2" size={16} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function Leads({ navigation }) {
  const { colors, themeMode } = useTheme();
  const { styleOptions } = useScreenLayout();
  const styles = useMemo(() => getStyles(colors, themeMode, styleOptions), [colors, themeMode, styleOptions]);
  const [filterValue, setFilterValue] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLeades, setSelectedLeades] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const token = useSelector(state => state?.auth?.token);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fromCache, setFromCache] = useState(false);
  const [savingLead, setSavingLead] = useState(false);

  const debouncedQueryRef = useRef('');
  const endReachedReadyRef = useRef(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      debouncedQueryRef.current = searchQuery;
    }, 400);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    setLeads([]);
    fetchLeads(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValue, token]);

  const fetchLeads = async (pageToLoad = 1, isRefresh = false) => {
    try {
      const isLoadMore = pageToLoad > 1;
      if (isLoadMore) {
        setLoadingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      const query = debouncedQueryRef.current || searchQuery;
      const filterData = { status: TAB_API_STATUS[filterValue] ?? '' };
      const { data: res, fromCache: cached } = await fetchLeadsWithCache(token, {
        pageIndex: pageToLoad,
        pageSize: PAGE_SIZE,
        sort: { order: '', key: '' },
        query,
        filterData,
      });
      setFromCache(cached);
      const rows = res?.items || res?.data || res?.results || [];
      const normalized = rows.map((r, idx) => ({
        id: r.id ?? r._id ?? idx + (pageToLoad - 1) * PAGE_SIZE,
        name: r.customer_name || r.name || 'Unknown',
        email: r.customer_email || r.email || '',
        phone: r.customer_telephone || r.phone || '',
        zip: r.customer_zip_code || r.zip || '',
        datetime: r.created_at || r.updated_at || '',
        status: r.status || 'In Progress',
        initials: (r.customer_name || r.name || 'U')
          .split(' ')
          .map(p => p?.[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase(),
      }));

      setTotalPages(res?.meta?.totalPages || res?.meta?.total_pages || totalPages);
      setPage(res?.meta?.currentPage || res?.meta?.current_page || pageToLoad);

      setLeads(prev => (isLoadMore ? [...prev, ...normalized] : normalized));
    } catch (e) {
      if (pageToLoad === 1) {
        const { loadCachedLeads } = await import('../../../services/offlineSync');
        const cachedRows = await loadCachedLeads();
        if (cachedRows.length > 0) {
          const filteredRows = cachedRows.filter((row) =>
            matchesFilterStatus(row.status, filterValue),
          );
          const normalized = filteredRows.map((r, idx) => ({
            id: r.id ?? r._id ?? idx,
            name: r.customer_name || r.name || 'Unknown',
            email: r.customer_email || r.email || '',
            phone: r.customer_telephone || r.phone || '',
            zip: r.customer_zip_code || r.zip || '',
            datetime: r.created_at || r.updated_at || '',
            status: r.status || 'In Progress',
            initials: (r.customer_name || r.name || 'U')
              .split(' ')
              .map((p) => p?.[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase(),
          }));
          setLeads(normalized);
          setFromCache(true);
          setError('');
        } else {
          setError(e?.message || 'Failed to load leads');
          setLeads([]);
        }
      } else {
        setError(e?.message || 'Failed to load leads');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    fetchLeads(1, true);
  };

  const handleEditLeades = useCallback((leadesId) => {
    const leades = leads.find(c => c.id === leadesId);
    setSelectedLeades(leades || null);
    setIsEditOpen(true);
  }, [leads]);

  const handleLeadPress = useCallback((leades) => {
    const leadCopy = JSON.parse(JSON.stringify(leades));
    navigation.navigate('leadsDetail', { lead: leadCopy });
  }, [navigation]);

  const renderLeadItem = useCallback(({ item }) => (
    <LeadsCard
      leades={item}
      styles={styles}
      onEdit={handleEditLeades}
      onPress={handleLeadPress}
    />
  ), [styles, handleEditLeades, handleLeadPress]);

  const handleSaveLead = async (updated) => {
    const leadId = selectedLeades?.id;
    if (!token || !leadId || savingLead) return;

    setSavingLead(true);
    try {
      await updateLead({
        token,
        id: leadId,
        payload: {
          customer_name: updated.customer_name,
          customer_email: updated.customer_email,
          customer_telephone: updated.customer_telephone,
          customer_zip_code: updated.customer_zip_code,
        },
      });

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                name: updated.name,
                email: updated.email,
                phone: updated.phone,
                zip: updated.zip,
                initials: (updated.name || 'U')
                  .split(' ')
                  .map((p) => p?.[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase(),
              }
            : lead,
        ),
      );
      setIsEditOpen(false);
      setSelectedLeades(null);
      Alert.alert('Success', 'Lead updated successfully');
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to update lead');
    } finally {
      setSavingLead(false);
    }
  };

  const handleSearch = () => {
    setIsSearchOpen(prev => !prev);
    if (isSearchOpen) setSearchQuery('');
  };

  const displayedLeads = useMemo(() => {
    let list = filterValue === 'All'
      ? leads
      : leads.filter(l => matchesFilterStatus(l.status, filterValue));

    const query = (searchQuery || '').trim().toLowerCase();
    if (!query) return list;
    return list.filter(l => {
      const name = (l.name || '').toLowerCase();
      const email = (l.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [leads, searchQuery, filterValue]);

  const listInitialRenderCount = Math.max(displayedLeads.length, 15);

  useEffect(() => {
    endReachedReadyRef.current = false;
    if (displayedLeads.length === 0) return undefined;

    const timer = setTimeout(() => {
      endReachedReadyRef.current = true;
    }, 400);

    return () => clearTimeout(timer);
  }, [displayedLeads.length, filterValue, searchQuery]);

  const onEndReached = () => {
    if (!endReachedReadyRef.current) return;

    const hasMore = page < totalPages;
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      fetchLeads(nextPage);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Leads"
        onPressSearch={handleSearch}
        showProfile={false}
        showFilter
        filterActive={filterValue !== 'All'}
        onPressFilter={() => setIsFilterOpen(true)}
      />

      <View style={styles.content}>
        {isSearchOpen && (
          <View style={styles.searchBar}>
            <Icon name="search" size={16} color={colors.gray} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or email"
              placeholderTextColor={colors.gray}
              style={styles.searchInput}
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="x" size={16} color={colors.gray} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {filterValue !== 'All' ? (
          <View style={styles.activeFilterChip}>
            <Icon name="filter" size={12} color={colors.primary} />
            <Text style={styles.activeFilterText}>Status: {filterValue}</Text>
            <TouchableOpacity onPress={() => setFilterValue('All')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="x" size={14} color={colors.gray} />
            </TouchableOpacity>
          </View>
        ) : null}

        {loading && leads.length === 0 ? (
          <LoadingView skeleton="list" showBadge flex style={styles.flatList} />
        ) : error && displayedLeads.length === 0 ? (
          <View style={styles.listStateWrap}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : displayedLeads.length === 0 ? (
          <View style={styles.listStateWrap}>
            <Text style={styles.emptyStateText}>No leads found</Text>
          </View>
        ) : (
          <FlatList
            data={displayedLeads}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderLeadItem}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            initialNumToRender={listInitialRenderCount}
            maxToRenderPerBatch={listInitialRenderCount}
            windowSize={Math.max(listInitialRenderCount, 10)}
            removeClippedSubviews={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListFooterComponent={
              loadingMore ? <LoadMoreSkeleton /> : null
            }
          />
        )}
      </View>

      <CustomerFilterModal
        visible={isFilterOpen}
        value={filterValue}
        onClose={() => setIsFilterOpen(false)}
        onApply={setFilterValue}
        title="Filter Leads"
        options={LEAD_STATUS_FILTERS}
      />
      <EditLeadModal
        visible={isEditOpen}
        lead={selectedLeades}
        onClose={() => {
          if (savingLead) return;
          setIsEditOpen(false);
          setSelectedLeades(null);
        }}
        onSave={handleSaveLead}
        saving={savingLead}
      />
    </View>
  );
}
