import { View, Text, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Header from '../../../component/header'
import Icon from 'react-native-vector-icons/Feather'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import getStyles from './styles'
import EditCustomerModal from '../../../component/modal'
import CustomerFilterModal from '../../../component/CustomerFilterModal'
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import { getCustomersDataTable } from '../../../api'
import LoadingView, { LoadMoreSkeleton } from '../../../component/LoadingView'
import { useTheme } from '../../../hooks/useTheme'

const getStatusStyles = (status, colors) => {
  const s = String(status || '').toUpperCase()
  if (s.includes('ACTIVE')) {
    return {
      avatarBg: colors.gray,
      badgeBg: `${colors.success}33`,
      badgeText: colors.success,
    }
  }
  if (s.includes('BLOCK')) {
    return {
      avatarBg: colors.gray,
      badgeBg: colors.inputBg,
      badgeText: colors.gray,
    }
  }
  return {
    avatarBg: colors.primary,
    badgeBg: `${colors.primary}1A`,
    badgeText: colors.primary,
  }
}

export default function Customers() {
  const navigation = useNavigation()
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const styles = useMemo(() => getStyles(colors, themeMode, styleOptions), [colors, themeMode, styleOptions])

  const [filterValue, setFilterValue] = useState('All')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const token = useSelector((state) => state?.auth?.token)

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Debounced search term
  const debouncedQueryRef = useRef('')
  useEffect(() => {
    const handle = setTimeout(() => {
      debouncedQueryRef.current = searchQuery
    }, 400)
    return () => clearTimeout(handle)
  }, [searchQuery])

  // Fetch when filter or token changes
  useEffect(() => {
    setPage(1)
    setCustomers([])
    fetchCustomers(1)
  }, [filterValue, token])

  const fetchCustomers = async (pageToLoad = 1, isRefresh = false) => {
    try {
      const isLoadMore = pageToLoad > 1
      if (isLoadMore) {
        setLoadingMore(true)
      } else if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError('')
      const query = debouncedQueryRef.current || searchQuery
      const filterData = { status: filterValue === 'All' ? '' : filterValue }
      const res = await getCustomersDataTable({ token, pageIndex: pageToLoad, pageSize: 10, sort: { order: '', key: '' }, query, filterData })
      const rows = res?.items || res?.data || res?.results || []
      const normalized = rows.map((r, idx) => ({
        id: r.id ?? r._id ?? idx + (pageToLoad - 1) * 10,
        name: r.customer_name || r.name || r.fullName || r.customerName || 'Unknown',
        email: r.customer_email || r.email || r.emailAddress || '-',
        phone: r.customer_telephone || r.phone || r.phoneNumber || '-',
        location: r.customer_zip_code || r.location || r.city || r.address || '-',
        initials: (r.customer_name || r.name || r.fullName || 'U')
          .split(' ')
          .map((p) => p?.[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        status: r.status || 'Active',
      }))

      setTotalPages(res?.meta?.totalPages || res?.meta?.total_pages || totalPages)
      setPage(res?.meta?.currentPage || res?.meta?.current_page || pageToLoad)

      setCustomers((prev) => (isLoadMore ? [...prev, ...normalized] : normalized))
    } catch (e) {
      setError(e?.message || 'Failed to load customers')
      if (pageToLoad === 1) setCustomers([])
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  const handleRefresh = () => {
    fetchCustomers(1, true)
  }

  const displayedCustomers = useMemo(() => {
    const query = (searchQuery || '').trim().toLowerCase()
    if (!query) return customers
    return customers.filter((c) => {
      const name = (c.name || '').toLowerCase()
      const email = (c.email || '').toLowerCase()
      const phone = (c.phone || '').toLowerCase()
      return name.includes(query) || email.includes(query) || phone.includes(query)
    })
  }, [customers, searchQuery])

  const handleEditCustomer = (customerId) => {
    const customer = customers.find((c) => c.id === customerId)
    setSelectedCustomer(customer || null)
    setIsEditOpen(true)
  }

  const handleSearch = () => {
    setIsSearchOpen((prev) => !prev)
    if (isSearchOpen) setSearchQuery('')
  }

  const handleBell = () => {
    navigation.navigate('notifications')
  }

  const onEndReached = () => {
    const hasMore = page < totalPages
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1
      fetchCustomers(nextPage)
    }
  }

  const ListFooter = () => {
    if (!loadingMore) return null
    return <LoadMoreSkeleton />
  }

  const CustomerCard = ({ customer }) => {
    const statusStyles = getStatusStyles(customer.status, colors)
    const isUnknown = String(customer.name).toLowerCase() === 'unknown'
    const hasEmail = customer.email && customer.email !== '-'
    const hasPhone = customer.phone && customer.phone !== '-'
    const hasLocation = customer.location && customer.location !== '-'

    return (
      <View style={styles.customerCard}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: statusStyles.avatarBg }]}>
            <Text style={styles.avatarText}>{customer.initials}</Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyles.badgeBg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyles.badgeText }]}>
              {String(customer.status || 'Active').toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.customerName, isUnknown && styles.customerNameUnknown]}>
            {customer.name}
          </Text>
          <View style={styles.contactRow}>
            <Icon name="mail" size={12} color={colors.gray} />
            <Text style={[styles.contactText, !hasEmail && styles.contactTextEmpty]} numberOfLines={1}>
              {hasEmail ? customer.email : 'No email provided'}
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Icon name="phone" size={12} color={colors.gray} />
            <Text style={[styles.contactText, !hasPhone && styles.contactTextEmpty]} numberOfLines={1}>
              {hasPhone ? customer.phone : 'No phone provided'}
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Icon name="map-pin" size={12} color={colors.gray} />
            <Text style={[styles.contactText, !hasLocation && styles.contactTextEmpty]} numberOfLines={1}>
              {hasLocation ? customer.location : 'No ZIP provided'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditCustomer(customer.id)}
          activeOpacity={0.7}
        >
          <Icon name="edit-2" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Header
        title="Customers"
        onPressSearch={handleSearch}
        onPressBell={handleBell}
        showFilter
        filterActive={filterValue !== 'All'}
        onPressFilter={() => setIsFilterOpen(true)}
      />

      <View style={styles.content}>
        {isSearchOpen && (
          <View style={styles.searchBar}>
            <Icon name="search" size={16} color={colors.text} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, email or phone"
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

        {loading && customers.length === 0 ? (
          <LoadingView skeleton="list" showBadge flex style={styles.flatList} />
        ) : error && displayedCustomers.length === 0 ? (
          <View style={styles.listStateWrap}>
            <Text style={styles.listErrorText}>{error}</Text>
          </View>
        ) : displayedCustomers.length === 0 ? (
          <View style={styles.listStateWrap}>
            <Text style={styles.listEmptyText}>No customers found</Text>
          </View>
        ) : (
          <FlatList
            data={displayedCustomers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <CustomerCard customer={item} />}
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
            ListFooterComponent={<ListFooter />}
          />
        )}
      </View>
      <CustomerFilterModal
        visible={isFilterOpen}
        value={filterValue}
        onClose={() => setIsFilterOpen(false)}
        onApply={setFilterValue}
      />
      <EditCustomerModal
        visible={isEditOpen}
        initialValues={selectedCustomer || {}}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedCustomer(null)
        }}
        onSave={(updated) => {
          if (!selectedCustomer?.id) return
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === selectedCustomer.id
                ? {
                    ...c,
                    name: updated.name,
                    email: updated.email || '-',
                    phone: updated.phone || '-',
                    location: updated.zip || '-',
                  }
                : c
            )
          )
          setIsEditOpen(false)
          setSelectedCustomer(null)
        }}
      />
    </KeyboardAvoidingView>
  )
}