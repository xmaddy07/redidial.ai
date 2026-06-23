import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { Alert } from '../../utils/alert';
import Icon from 'react-native-vector-icons/Feather';
import { fonts } from '../../constant';
import { useTheme } from '../../hooks/useTheme';
import getStyles from './styles';

const EMPTY_FORM = {
  vin: '',
  vehicle: '',
  description: '',
  price: '',
  price_currency: '$',
  mileage: '',
  engine: '',
  transmission: '',
  drivetrain: '',
  exterior: '',
  interior: '',
  fuel_economy_city: '',
  fuel_economy_highway: '',
  fuel: '',
  rating: '',
  condition: '',
  stock: '',
  stock_description: '',
};

const getVehicleName = (vehicle = {}) => {
  const year = vehicle?.year || vehicle?.vehicle_year || '';
  const make = vehicle?.make || vehicle?.vehicle_make || '';
  const model = vehicle?.model || vehicle?.vehicle_model || '';
  const fromParts = [year, make, model].filter(Boolean).join(' ');
  return vehicle?.vehicle_name || vehicle?.name || fromParts || '';
};

const toNumericString = (val) => String(val ?? '').replace(/[^\d.]/g, '');

const vehicleToForm = (vehicle = {}) => {
  const rawPrice = vehicle?.price ?? vehicle?.vehicle_price ?? '';
  const rawMileage = vehicle?.mileage ?? vehicle?.odometer ?? '';

  return {
    vin: vehicle?.vin || vehicle?.VIN || vehicle?.vehicle_vin || '',
    vehicle: getVehicleName(vehicle),
    description: vehicle?.description || '',
    price: toNumericString(rawPrice),
    price_currency: vehicle?.price_currency || '$',
    mileage: toNumericString(rawMileage),
    engine: vehicle?.engine || '',
    transmission: vehicle?.transmission || '',
    drivetrain: vehicle?.drivetrain || vehicle?.drive_type || '',
    exterior: vehicle?.exterior_color || vehicle?.exterior || '',
    interior: vehicle?.interior_color || vehicle?.interior || '',
    fuel_economy_city: vehicle?.fuel_economy_city != null ? String(vehicle.fuel_economy_city) : '',
    fuel_economy_highway: vehicle?.fuel_economy_highway != null ? String(vehicle.fuel_economy_highway) : '',
    fuel: vehicle?.fuel || '',
    rating: vehicle?.cargurus_rating != null ? String(vehicle.cargurus_rating) : vehicle?.rating != null ? String(vehicle.rating) : '',
    condition: vehicle?.condition || '',
    stock: vehicle?.stock || vehicle?.stock_number || '',
    stock_description: vehicle?.description || '',
  };
};

function SectionCard({ icon, iconColor, title, subtitle, children, styles }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Icon name={icon} size={18} color={iconColor} />
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  styles,
  keyboardType,
  multiline,
  prefix,
  price,
  placeholder,
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      {prefix ? (
        <View style={styles.prefixInputRow}>
          <Text style={styles.inputPrefix}>{prefix}</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            style={[styles.prefixInput, price && styles.fieldInputPrice]}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboardType || 'default'}
            placeholder={placeholder}
          />
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholder={placeholder}
        />
      )}
    </View>
  );
}

export default function EditVehicleModal({ visible, vehicle, onClose, onSave, saving = false }) {
  const { colors, themeMode } = useTheme();
  const styles = getStyles(colors, themeMode);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (visible && vehicle) {
      setForm(vehicleToForm(vehicle));
    }
  }, [visible, vehicle]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.vin?.trim()) {
      Alert.alert('Required', 'VIN number is required.');
      return;
    }
    const description = form.stock_description.trim() || form.description.trim() || null;
    onSave?.({
      ...vehicle,
      vin: form.vin.trim(),
      vehicle_name: form.vehicle.trim() || vehicle?.vehicle_name,
      description,
      price: form.price,
      price_currency: form.price_currency || vehicle?.price_currency || '$',
      mileage: form.mileage,
      engine: form.engine.trim() || null,
      transmission: form.transmission.trim() || null,
      drivetrain: form.drivetrain.trim() || null,
      exterior_color: form.exterior.trim() || null,
      interior_color: form.interior.trim() || null,
      exterior: form.exterior.trim(),
      interior: form.interior.trim(),
      fuel_economy_city: form.fuel_economy_city.trim() || null,
      fuel_economy_highway: form.fuel_economy_highway.trim() || null,
      fuel: form.fuel.trim() || null,
      rating: form.rating.trim() || null,
      cargurus_rating: form.rating.trim() || null,
      condition: form.condition.trim() || null,
      stock: form.stock.trim(),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose} activeOpacity={0.7}>
            <Icon name="arrow-left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Vehicle</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <SectionCard
            icon="info"
            title="Basic Vehicle Identification"
            subtitle="Section to Add Basic Vehicle Identification"
            iconColor={colors.primary}
            styles={styles}
          >
            <FormField label="VIN" value={form.vin} onChangeText={(v) => update('vin', v)} styles={styles} />
            <FormField
              label="Vehicle"
              value={form.vehicle}
              onChangeText={(v) => update('vehicle', v)}
              styles={styles}
            />
            <FormField
              label="Description"
              value={form.description}
              onChangeText={(v) => update('description', v)}
              styles={styles}
              multiline
              placeholder="Description"
            />
          </SectionCard>

          <SectionCard
            icon="tag"
            title="Pricing"
            subtitle="Section to Add Vehicle Information"
            iconColor={colors.primary}
            styles={styles}
          >
            <View style={styles.row2}>
              <View style={styles.row2Item}>
                <FormField
                  label="Price"
                  value={form.price}
                  onChangeText={(v) => update('price', v)}
                  styles={styles}
                  keyboardType="numeric"
                  prefix="$"
                  price
                />
              </View>
              <View style={styles.row2Item}>
                <FormField
                  label="Price Currency"
                  value={form.price_currency}
                  onChangeText={(v) => update('price_currency', v)}
                  styles={styles}
                  prefix="$"
                />
              </View>
            </View>
          </SectionCard>

          <SectionCard
            icon="activity"
            title="Performance & Specification"
            subtitle="Section to add the vehicle performance & specification"
            iconColor={colors.primary}
            styles={styles}
          >
            <View style={styles.row2}>
              <View style={styles.row2Item}>
                <FormField
                  label="Mileage"
                  value={form.mileage}
                  onChangeText={(v) => update('mileage', v)}
                  styles={styles}
                  keyboardType="numeric"
                  prefix="KM "
                  placeholder="158000.00"
                />
              </View>
              <View style={styles.row2Item}>
                <FormField
                  label="Engine"
                  value={form.engine}
                  onChangeText={(v) => update('engine', v)}
                  styles={styles}
                  placeholder="Engine"
                />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={styles.row2Item}>
                <FormField
                  label="Transmission"
                  value={form.transmission}
                  onChangeText={(v) => update('transmission', v)}
                  styles={styles}
                  placeholder="Transmission"
                />
              </View>
              <View style={styles.row2Item}>
                <FormField
                  label="Drivetrain"
                  value={form.drivetrain}
                  onChangeText={(v) => update('drivetrain', v)}
                  styles={styles}
                  placeholder="Drivetrain"
                />
              </View>
            </View>
          </SectionCard>

          <SectionCard
            icon="droplet"
            title="Appearance"
            subtitle="Section to add the vehicle appearance"
            iconColor={colors.primary}
            styles={styles}
          >
            <View style={styles.row2}>
              <View style={styles.row2Item}>
                <FormField
                  label="Exterior Color"
                  value={form.exterior}
                  onChangeText={(v) => update('exterior', v)}
                  styles={styles}
                  placeholder="Exterior Color"
                />
              </View>
              <View style={styles.row2Item}>
                <FormField
                  label="Interior Color"
                  value={form.interior}
                  onChangeText={(v) => update('interior', v)}
                  styles={styles}
                  placeholder="Interior Color"
                />
              </View>
            </View>
          </SectionCard>

          <SectionCard
            icon="zap"
            title="Fuel Information"
            subtitle="Section to add the vehicle fuel information"
            iconColor={colors.primary}
            styles={styles}
          >
            <View style={styles.row2}>
              <View style={styles.row2Item}>
                <FormField
                  label="Fuel Economy City"
                  value={form.fuel_economy_city}
                  onChangeText={(v) => update('fuel_economy_city', v)}
                  styles={styles}
                  placeholder="Fuel Economy City"
                />
              </View>
              <View style={styles.row2Item}>
                <FormField
                  label="Fuel Economy Highway"
                  value={form.fuel_economy_highway}
                  onChangeText={(v) => update('fuel_economy_highway', v)}
                  styles={styles}
                  placeholder="Fuel Economy Highway"
                />
              </View>
            </View>
            <FormField
              label="Fuel Type"
              value={form.fuel}
              onChangeText={(v) => update('fuel', v)}
              styles={styles}
              placeholder="Fuel Type"
            />
          </SectionCard>

          <SectionCard
            icon="star"
            title="Ratings & Condition"
            subtitle="Section to add the vehicle ratings & Condition"
            iconColor={colors.primary}
            styles={styles}
          >
            <View style={styles.row2}>
              <View style={styles.row2Item}>
                <FormField
                  label="Rating"
                  value={form.rating}
                  onChangeText={(v) => update('rating', v)}
                  styles={styles}
                  keyboardType="numeric"
                  placeholder="Rating"
                />
              </View>
              <View style={styles.row2Item}>
                <FormField
                  label="Condition"
                  value={form.condition}
                  onChangeText={(v) => update('condition', v)}
                  styles={styles}
                  placeholder="Condition"
                />
              </View>
            </View>
          </SectionCard>

          <SectionCard
            icon="file-text"
            title="Stock & Description"
            subtitle="Section to Add Vehicle stock & description"
            iconColor={colors.primary}
            styles={styles}
          >
            <FormField
              label="Stock"
              value={form.stock}
              onChangeText={(v) => update('stock', v)}
              styles={styles}
              placeholder="Stock"
            />
            <FormField
              label="Description"
              value={form.stock_description}
              onChangeText={(v) => update('stock_description', v)}
              styles={styles}
              multiline
              placeholder="Description"
            />
          </SectionCard>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                  <Icon name="check-circle" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.discardBtn} onPress={onClose} activeOpacity={0.7} disabled={saving}>
              <Text style={[styles.discardText, { fontFamily: fonts.regular }]}>Discard Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
