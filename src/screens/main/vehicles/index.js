import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native'
import { Alert } from '../../../utils/alert'
import LoadingView from '../../../component/LoadingView'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import Header from '../../../component/header'
import { images } from '../../../constant'
import { heightPercentageToDP as hp } from '../../../theme/layout'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import getStyles from './styles'
import api from '../../../api'
import Icon from 'react-native-vector-icons/Feather'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useTheme } from '../../../hooks/useTheme'
import EditVehicleModal from '../../../component/EditVehicleModal'

const formatVin = (vin) => {
  if (!vin || vin === '-') return 'VIN: —'
  const v = String(vin)
  if (v.length <= 14) return `VIN: ${v}`
  return `VIN: ${v.slice(0, 7)}...${v.slice(-4)}`
}

const formatPrice = (price, currency) => {
  const raw = String(price ?? '').replace(/[^\d.]/g, '')
  const num = Number(raw)
  if (!Number.isFinite(num) || num === 0) {
    return price ? String(price) : '—'
  }
  const sym = currency || '$'
  return `${sym}${num.toLocaleString('en-US')}`
}

const formatMileage = (mileage) => {
  const raw = String(mileage ?? '').replace(/[^\d.]/g, '')
  const num = Number(raw)
  if (!Number.isFinite(num)) return mileage ? String(mileage) : '—'
  return `${num.toLocaleString('en-US')} mi`
}

const getVehicleTitle = (vehicle) => {
  const year = vehicle?.year || vehicle?.vehicle_year || ''
  const make = vehicle?.make || vehicle?.vehicle_make || ''
  const model = vehicle?.model || vehicle?.vehicle_model || ''
  const fromParts = [year, make, model].filter(Boolean).join(' ')
  return vehicle?.vehicle_name || vehicle?.name || fromParts || '—'
}

const getVehicleSpec = (vehicle) => {
  return vehicle?.transmission || vehicle?.drivetrain || vehicle?.drive_type || '—'
}

export default function Vehicles() {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const styles = useMemo(() => getStyles(colors, themeMode, styleOptions), [colors, themeMode, styleOptions])
  const navigation = useNavigation()
  const token = useSelector((state) => state.auth.token)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const loadVehicles = useCallback(async (isRefresh = false) => {
    if (!token) return
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError('')
    try {
      const res = await api.getVehiclesDataTable({ token, pageIndex: 1, pageSize: 50 })
      const rows = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : []
      setVehicles(rows)
    } catch (e) {
      setError(e?.message || 'Failed to load vehicles')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [token])

  const handleRefresh = useCallback(() => {
    loadVehicles(true)
  }, [loadVehicles])

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={colors.primary}
    />
  )

  useFocusEffect(
    useCallback(() => {
      loadVehicles()
    }, [loadVehicles]),
  )

  const displayedVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return vehicles
    return vehicles.filter((v) => {
      const searchable = [
        getVehicleTitle(v),
        v?.model,
        v?.vehicle_model,
        v?.make,
        v?.vehicle_make,
        v?.year,
        v?.vehicle_year,
        v?.vin,
        v?.VIN,
        v?.vehicle_vin,
        v?.transmission,
        v?.drivetrain,
        v?.drive_type,
        v?.price,
        v?.vehicle_price,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return searchable.includes(query)
    })
  }, [vehicles, searchQuery])

  const handleAddVehicle = () => {
    navigation.navigate('addVehicles')
  }

  const handleImport = () => {
    navigation.navigate('ImportSession', { screen: 'ImportSessionWizard' })
  }

  const handleHeaderSearch = () => {
    setIsSearchOpen((prev) => {
      if (prev) setSearchQuery('')
      return !prev
    })
  }

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle)
    setIsEditOpen(true)
  }

  const handleCloseEdit = () => {
    setIsEditOpen(false)
    setSelectedVehicle(null)
  }

  const handleSaveVehicle = async (updatedVehicle) => {
    const vehicleId = updatedVehicle?.id || updatedVehicle?._id
    setIsSaving(true)
    try {
      if (vehicleId && token) {
        const payload = api.buildVehiclePatchPayload(selectedVehicle, updatedVehicle)
        const result = await api.updateVehicle({
          token,
          id: vehicleId,
          data: payload,
        })
        setVehicles((prev) =>
          prev.map((v) => {
            const id = v?.id || v?._id
            return id === vehicleId ? { ...v, ...updatedVehicle, ...result } : v
          })
        )
        handleCloseEdit()
        return
      }
    } catch (e) {
      Alert.alert('Update failed', e?.message || 'Could not save vehicle. Please try again.')
      return
    } finally {
      setIsSaving(false)
    }

    setVehicles((prev) =>
      prev.map((v) => {
        const id = v?.id || v?._id
        const updatedId = updatedVehicle?.id || updatedVehicle?._id
        return id === updatedId ? { ...v, ...updatedVehicle } : v
      })
    )
    handleCloseEdit()
  }

  const renderVehicleCard = (v, idx) => {
    const vin = v?.vin || v?.VIN || v?.vehicle_vin || '-'
    const title = getVehicleTitle(v)
    const priceCurrency = v?.price_currency || (typeof v?.price === 'number' ? '$' : '$')
    const priceRaw = v?.price ?? v?.vehicle_price
    const price = formatPrice(priceRaw, priceCurrency)
    const mileage = formatMileage(v?.mileage ?? v?.odometer)
    const spec = getVehicleSpec(v)

    return (
      <View key={v?.id || v?._id || vin || String(idx)} style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardMain}>
            <Text numberOfLines={2} style={styles.cardTitle}>{title}</Text>
            <Text numberOfLines={1} style={styles.cardVin}>{formatVin(vin)}</Text>
          </View>
          <View style={styles.cardRightCol}>
            <TouchableOpacity activeOpacity={0.7} style={styles.editBtn} onPress={() => handleEditVehicle(v)}>
              <Text style={styles.editText}>EDIT</Text>
              <Icon name="edit-2" size={13} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.cardPrice}>{price}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="speedometer" size={13} color={colors.gray} />
            <Text style={styles.footerText}>{mileage}</Text>
          </View>
          <View style={styles.footerDot} />
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="car-shift-pattern" size={13} color={colors.gray} />
            <Text style={styles.footerText}>{spec}</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header
        title="Vehicle"
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
              placeholder="Search by name, model, make, or VIN"
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

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddVehicle} activeOpacity={0.85}>
            <Icon name="plus-circle" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>+ ADD VEHICLE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.importButton} onPress={handleImport} activeOpacity={0.85}>
            <Icon name="upload" size={16} color={colors.primary} />
            <Text style={styles.importButtonText}>IMPORT</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <LoadingView skeleton="card" skeletonCount={4} flex />
        ) : error ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : displayedVehicles.length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={refreshControl}
          >
            {displayedVehicles.map(renderVehicleCard)}
          </ScrollView>
        ) : vehicles.length > 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.loadingText}>No vehicles match your search</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.emptyWrap} refreshControl={refreshControl}>
            <Image source={images.empty} style={styles.illustration} resizeMode="contain" />
            <Text style={styles.loadingText}>No vehicles found</Text>
          </ScrollView>
        )}
      </View>

      <EditVehicleModal
        visible={isEditOpen}
        vehicle={selectedVehicle}
        onClose={handleCloseEdit}
        onSave={handleSaveVehicle}
        saving={isSaving}
      />
    </View>
  )
}
