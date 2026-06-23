import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/Feather'
import Input from '../../../component/input'
import SettingHeader from '../../../component/settingHeader'
import SettingsHero, { SettingsStatPills } from '../../../component/settings/SettingsHero'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useTheme } from '../../../hooks/useTheme'
import { Alert } from '../../../utils/alert'
import api from '../../../api'
import getStyles from './styles'

const SECTION_COUNT = 7
const FIELD_COUNT = 18

function FormField({
  heading,
  val,
  onchan,
  plac,
  multiline,
  maxLength,
  hig,
  isLast,
  colors,
}) {
  return (
    <Input
      heading={heading}
      val={val}
      onchan={onchan}
      plac={plac}
      wid="100%"
      hig={hig || '6'}
      btm={isLast ? '0' : '0.4'}
      top="0"
      brderclr={colors.border}
      bgclr={colors.inputBg}
      multiline={multiline}
      maxLength={maxLength}
      animatedFocus
    />
  )
}

function FormSection({ icon, title, subtitle, children, styles, colors }) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.formCard}>
        <View style={styles.formCardHeader}>
          <View style={styles.formCardIcon}>
            <Icon name={icon} size={16} color={colors.primary} />
          </View>
          <View style={styles.formCardHeaderText}>
            <Text style={styles.formCardTitle}>{title}</Text>
            <Text style={styles.formCardSubtitle}>{subtitle}</Text>
          </View>
        </View>
        {children}
      </View>
    </View>
  )
}

function showSuccess(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
  } else {
    Alert.alert('Success', message)
  }
}

export default function AddVehicles({ navigation }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const token = useSelector((state) => state.auth.token)
  const isDark = themeMode === 'dark'
  const styles = useMemo(
    () => getStyles(colors, isDark, styleOptions),
    [colors, isDark, styleOptions],
  )

  const [isSaving, setIsSaving] = useState(false)
  const [vin, setVin] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('')
  const [drivetrain, setDrivetrain] = useState('')
  const [engine, setEngine] = useState('')
  const [mileage, setMileage] = useState('')
  const [transmission, setTransmission] = useState('')
  const [interior, setInterior] = useState('')
  const [exterior, setExterior] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [fuelCity, setFuelCity] = useState('')
  const [fuelHighway, setfuelHighway] = useState('')
  const [rating, setRating] = useState('')
  const [condition, setCondition] = useState('')
  const [stock, setStock] = useState('')
  const [stockDescrip, setStockDescrip] = useState('')

  const buildFormPayload = () => ({
    vin: vin.trim(),
    vehicle_name: vehicle.trim(),
    description: stockDescrip.trim() || description.trim() || null,
    price,
    price_currency: currency.trim() || '$',
    mileage,
    engine: engine.trim() || null,
    transmission: transmission.trim() || null,
    drivetrain: drivetrain.trim() || null,
    exterior_color: exterior.trim() || null,
    interior_color: interior.trim() || null,
    fuel: fuelType.trim() || null,
    fuel_economy_city: fuelCity.trim() || null,
    fuel_economy_highway: fuelHighway.trim() || null,
    rating: rating.trim() || null,
    condition: condition.trim() || null,
    stock: stock.trim(),
  })

  const handleSave = async () => {
    if (!vin.trim()) {
      Alert.alert('Required', 'VIN is required.')
      return
    }
    if (!vehicle.trim()) {
      Alert.alert('Required', 'Vehicle name is required.')
      return
    }
    if (!token) {
      Alert.alert('Error', 'You must be signed in to add a vehicle.')
      return
    }

    setIsSaving(true)
    try {
      const payload = api.buildVehicleCreatePayload(buildFormPayload())
      await api.createVehicle({ token, data: payload })
      showSuccess('Vehicle created successfully')
      navigation.goBack()
    } catch (e) {
      Alert.alert('Create failed', e?.message || 'Could not save vehicle. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title="Add Vehicle" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SettingsHero
            colors={colors}
            isDark={isDark}
            styles={styles}
            icon="truck"
            title="New Vehicle Listing"
            subtitle="Add vehicle details to your inventory. Complete each section to build a rich, searchable listing."
          />

          <SettingsStatPills
            styles={styles}
            items={[
              { value: SECTION_COUNT, label: 'Sections' },
              { value: FIELD_COUNT, label: 'Fields' },
            ]}
          />

          <FormSection
            icon="hash"
            title="Identification"
            subtitle="VIN, name, and listing description"
            styles={styles}
            colors={colors}
          >
            <FormField
              heading="VIN"
              val={vin}
              onchan={setVin}
              plac="Enter 17-character VIN"
              colors={colors}
            />
            <FormField
              heading="Vehicle"
              val={vehicle}
              onchan={setVehicle}
              plac="Year, make, and model"
              colors={colors}
            />
            <FormField
              heading="Description"
              val={description}
              onchan={setDescription}
              plac="Describe the vehicle for buyers"
              hig="12"
              multiline
              maxLength={250}
              colors={colors}
            />
            {description.length > 0 ? (
              <Text style={styles.charCount}>{description.length}/250</Text>
            ) : null}
          </FormSection>

          <FormSection
            icon="dollar-sign"
            title="Pricing"
            subtitle="Set list price and currency"
            styles={styles}
            colors={colors}
          >
            <View style={styles.inputRow}>
              <View style={styles.inputRowItemWide}>
                <FormField
                  heading="Price"
                  val={price}
                  onchan={setPrice}
                  plac="0.00"
                  colors={colors}
                />
              </View>
              <View style={styles.inputRowItemNarrow}>
                <FormField
                  heading="Currency"
                  val={currency}
                  onchan={setCurrency}
                  plac="USD"
                  colors={colors}
                />
              </View>
            </View>
          </FormSection>

          <FormSection
            icon="settings"
            title="Performance"
            subtitle="Engine, mileage, and drivetrain specs"
            styles={styles}
            colors={colors}
          >
            <FormField
              heading="Mileage"
              val={mileage}
              onchan={setMileage}
              plac="Miles or kilometers"
              colors={colors}
            />
            <FormField
              heading="Engine"
              val={engine}
              onchan={setEngine}
              plac="e.g. 2.0L Turbo I4"
              colors={colors}
            />
            <FormField
              heading="Transmission"
              val={transmission}
              onchan={setTransmission}
              plac="Automatic, manual, CVT"
              colors={colors}
            />
            <FormField
              heading="Drivetrain"
              val={drivetrain}
              onchan={setDrivetrain}
              plac="FWD, RWD, AWD, 4WD"
              isLast
              colors={colors}
            />
          </FormSection>

          <FormSection
            icon="droplet"
            title="Appearance"
            subtitle="Exterior and interior colors"
            styles={styles}
            colors={colors}
          >
            <FormField
              heading="Exterior Color"
              val={exterior}
              onchan={setExterior}
              plac="e.g. Pearl White"
              colors={colors}
            />
            <FormField
              heading="Interior Color"
              val={interior}
              onchan={setInterior}
              plac="e.g. Black leather"
              isLast
              colors={colors}
            />
          </FormSection>

          <FormSection
            icon="zap"
            title="Fuel Economy"
            subtitle="Fuel type and EPA estimates"
            styles={styles}
            colors={colors}
          >
            <FormField
              heading="Fuel Type"
              val={fuelType}
              onchan={setFuelType}
              plac="Gasoline, diesel, hybrid, electric"
              colors={colors}
            />
            <View style={styles.inputRow}>
              <View style={styles.inputRowItem}>
                <FormField
                  heading="City MPG"
                  val={fuelCity}
                  onchan={setFuelCity}
                  plac="City"
                  colors={colors}
                />
              </View>
              <View style={styles.inputRowItem}>
                <FormField
                  heading="Highway MPG"
                  val={fuelHighway}
                  onchan={setfuelHighway}
                  plac="Highway"
                  colors={colors}
                />
              </View>
            </View>
          </FormSection>

          <FormSection
            icon="star"
            title="Condition"
            subtitle="Rating and overall vehicle condition"
            styles={styles}
            colors={colors}
          >
            <FormField
              heading="Rating"
              val={rating}
              onchan={setRating}
              plac="e.g. 4.5"
              colors={colors}
            />
            <FormField
              heading="Condition"
              val={condition}
              onchan={setCondition}
              plac="Excellent, good, fair"
              isLast
              colors={colors}
            />
          </FormSection>

          <FormSection
            icon="package"
            title="Inventory"
            subtitle="Stock number and internal notes"
            styles={styles}
            colors={colors}
          >
            <FormField
              heading="Stock Number"
              val={stock}
              onchan={setStock}
              plac="Dealer stock ID"
              colors={colors}
            />
            <FormField
              heading="Stock Notes"
              val={stockDescrip}
              onchan={setStockDescrip}
              plac="Internal description or remarks"
              hig="12"
              multiline
              maxLength={250}
              isLast
              colors={colors}
            />
            {stockDescrip.length > 0 ? (
              <Text style={styles.charCount}>{stockDescrip.length}/250</Text>
            ) : null}
          </FormSection>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && !isSaving && { opacity: 0.88 },
                isSaving && { opacity: 0.6 },
              ]}
            >
              <Icon name="x" size={16} color={colors.appText || colors.text} />
              <Text style={styles.secondaryBtnText}>Discard</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && !isSaving && { opacity: 0.92 },
                isSaving && { opacity: 0.85 },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Icon name="check" size={16} color={colors.white} />
              )}
              <Text style={styles.primaryBtnText}>
                {isSaving ? 'Saving...' : 'Save Vehicle'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
