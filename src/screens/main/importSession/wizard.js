import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, PermissionsAndroid, Platform, ToastAndroid, Pressable, ActivityIndicator } from 'react-native'
import { Alert } from '../../../utils/alert'
import { useScreenLayout } from '../../../hooks/useScreenLayout'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/Feather'
import SettingHeader from '../../../component/settingHeader'
import SettingsHero from '../../../component/settings/SettingsHero'
import getWizardStyles from './wizardStyles'
import { useTheme } from '../../../hooks/useTheme'
import RNFS from 'react-native-fs'
import { pick, types } from '@react-native-documents/picker'
import { Dropdown } from 'react-native-element-dropdown'
import { importVehiclesWithMapping } from '../../../api'

const MAX_FILE_BYTES = 10 * 1024 * 1024

const STEPS = [
  { number: 1, title: 'Upload' },
  { number: 2, title: 'Map' },
  { number: 3, title: 'Import' },
]

const FIELD_OPTIONS = [
  { label: 'VIN (required)', value: 'vin' },
  { label: 'Name', value: 'name' },
  { label: 'Price', value: 'price' },
  { label: 'Mileage', value: 'mileage' },
  { label: 'Stock number', value: 'stock' },
  { label: 'Exterior color', value: 'exterior_color' },
  { label: 'Interior color', value: 'interior_color' },
  { label: 'Engine', value: 'engine' },
  { label: 'Transmission', value: 'transmission' },
  { label: 'Fuel type', value: 'fuel' },
  { label: 'Description', value: 'description' },
  { label: 'Ignore', value: 'ignore' },
]

function showToast(title, message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
    return
  }
  Alert.alert(title, message)
}

function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function StepIndicator({ currentStep, styles, colors }) {
  return (
    <View style={styles.stepIndicatorContainer}>
      {STEPS.map((step, index) => {
        const isComplete = currentStep > step.number
        const isCurrent = currentStep === step.number
        const isActive = currentStep >= step.number

        return (
          <View key={step.number} style={styles.stepWrapper}>
            <View style={styles.stepConnectorContainer}>
              {index > 0 ? (
                <View
                  style={[
                    styles.stepConnector,
                    isActive && styles.stepConnectorActive,
                  ]}
                />
              ) : (
                <View style={styles.stepConnector} />
              )}
              <View
                style={[
                  styles.stepCircle,
                  isComplete && styles.stepCircleActive,
                  isCurrent && !isComplete && styles.stepCircleCurrent,
                ]}
              >
                {isComplete ? (
                  <Icon name="check" size={14} color={colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isComplete && styles.stepNumberActive,
                      isCurrent && styles.stepNumberCurrent,
                    ]}
                  >
                    {step.number}
                  </Text>
                )}
              </View>
              {index < STEPS.length - 1 ? (
                <View
                  style={[
                    styles.stepConnector,
                    currentStep > step.number && styles.stepConnectorActive,
                  ]}
                />
              ) : (
                <View style={styles.stepConnector} />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                (isCurrent || isComplete) && styles.stepLabelActive,
              ]}
            >
              {step.title}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function WizardFooter({
  onBack,
  onContinue,
  continueText,
  continueDisabled,
  loading,
  styles,
  colors,
}) {
  return (
    <View style={styles.wizardFooter}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
      >
        <Icon name="arrow-left" size={16} color={colors.appText || colors.text} />
        <Text style={styles.secondaryBtnText}>Back</Text>
      </Pressable>
      <Pressable
        onPress={onContinue}
        disabled={continueDisabled || loading}
        style={({ pressed }) => [
          styles.primaryBtn,
          (continueDisabled || loading) && styles.btnDisabled,
          pressed && !continueDisabled && !loading && { opacity: 0.92 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>{continueText}</Text>
            <Icon name="arrow-right" size={16} color={colors.white} />
          </>
        )}
      </Pressable>
    </View>
  )
}

export default function ImportSessionWizard({ navigation }) {
  const { colors, themeMode } = useTheme()
  const { styleOptions } = useScreenLayout()
  const isDark = themeMode === 'dark'
  const styles = useMemo(() => getWizardStyles(colors, isDark, styleOptions), [colors, isDark, styleOptions])
  const token = useSelector((state) => state.auth.token)

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFile, setSelectedFile] = useState(null)
  const [csvData, setCsvData] = useState(null)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [columnMappings, setColumnMappings] = useState({})
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [createdSessionId, setCreatedSessionId] = useState(null)

  const heroCopy = {
    1: {
      title: 'Upload CSV',
      subtitle: 'Select a vehicle inventory file up to 10MB. Only CSV format is supported.',
    },
    2: {
      title: 'Map columns',
      subtitle: 'Match each CSV column to a vehicle field. VIN is required for every row.',
    },
    3: {
      title: 'Review & import',
      subtitle: 'Confirm your mapping and start the import session on the server.',
    },
  }

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'This app needs access to your storage to select CSV files.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      )
      return granted === PermissionsAndroid.RESULTS.GRANTED
    } catch {
      return false
    }
  }

  const parseCSV = async (filePath) => {
    try {
      const fileContent = await RNFS.readFile(filePath, 'utf8')
      const lines = fileContent.split('\n').filter((line) => line.trim())
      if (!lines.length) return null

      const headers = lines[0]
        .split(',')
        .map((header) => header.trim().replace(/['"]/g, ''))

      const data = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/['"]/g, ''))
        const row = {}
        headers.forEach((h, i) => {
          row[h] = values[i] || ''
        })
        return row
      })

      return { headers, data }
    } catch {
      return null
    }
  }

  const handleFileSelection = async () => {
    try {
      const hasPermission = await requestStoragePermission()
      if (!hasPermission) return

      const results = await pick({ type: [types.csv, types.plainText] })
      const file = results[0]

      if (!file?.name?.toLowerCase().endsWith('.csv')) {
        Alert.alert('Invalid file', 'Please select a CSV file (.csv).')
        return
      }

      if ((file.size || 0) > MAX_FILE_BYTES) {
        Alert.alert('File too large', 'CSV files must be 10MB or smaller.')
        return
      }

      setSelectedFile({
        name: file.name,
        size: file.size || 0,
        uri: file.uri,
        fileCopyUri: file.fileCopyUri || file.uri,
      })
    } catch (err) {
      if (err?.name !== 'Cancel' && err?.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('Error', err?.message || 'Failed to pick file.')
      }
    }
  }

  const handleNextStep = async () => {
    if (currentStep === 1 && selectedFile) {
      const parsed = await parseCSV(selectedFile.fileCopyUri || selectedFile.uri)
      if (!parsed) {
        Alert.alert('Parse failed', 'Could not read the CSV file.')
        return
      }
      setCsvHeaders(parsed.headers)
      setCsvData(parsed.data)
      const initialMap = {}
      parsed.headers.forEach((h) => {
        initialMap[h] = 'ignore'
      })
      setColumnMappings(initialMap)
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      if (!Object.values(columnMappings).includes('vin')) {
        Alert.alert('VIN required', 'Map at least one column to VIN before continuing.')
        return
      }
      const unmapped = csvHeaders.filter((header) => !columnMappings[header])
      if (unmapped.length > 0) {
        Alert.alert('Mapping required', 'Map every CSV column or set it to Ignore.')
        return
      }
      setCurrentStep(3)
    }
  }

  const handleStartImport = async () => {
    if (!token || !selectedFile) return

    const mapping = {}
    Object.entries(columnMappings).forEach(([header, field]) => {
      if (field && field !== 'ignore') mapping[header] = field
    })

    setIsImporting(true)
    setImportProgress(10)

    const progressTimer = setInterval(() => {
      setImportProgress((value) => Math.min(value + 8, 90))
    }, 250)

    try {
      const response = await importVehiclesWithMapping({
        token,
        file: {
          uri: selectedFile.fileCopyUri || selectedFile.uri,
          name: selectedFile.name || 'vehicles.csv',
          type: 'text/csv',
        },
        mapping,
      })

      const sessionId =
        response?.sessionId ??
        response?.session_id ??
        response?.data?.sessionId ??
        response?.data?.session_id ??
        null

      setCreatedSessionId(sessionId != null ? String(sessionId) : null)
      setImportProgress(100)
      setCurrentStep(4)
      showToast('Import Started', 'Your vehicle import session has been created.')
    } catch (error) {
      Alert.alert('Import failed', error?.message || 'Could not start the import.')
    } finally {
      clearInterval(progressTimer)
      setIsImporting(false)
    }
  }

  const resetWizard = () => {
    setCurrentStep(1)
    setSelectedFile(null)
    setCsvData(null)
    setCsvHeaders([])
    setColumnMappings({})
    setImportProgress(0)
    setCreatedSessionId(null)
  }

  const handleBack = () => {
    if (currentStep === 1) navigation.goBack()
    else if (currentStep === 2) setCurrentStep(1)
    else if (currentStep === 3) setCurrentStep(2)
    else navigation.goBack()
  }

  const handleContinue = () => {
    if (currentStep === 3) handleStartImport()
    else handleNextStep()
  }

  const continueText =
    currentStep === 3 ? (isImporting ? 'Importing…' : 'Start Import') : 'Continue'
  const continueDisabled = currentStep === 1 ? !selectedFile : currentStep === 3 && isImporting

  if (currentStep === 4) {
    return (
      <View style={styles.container}>
        <SettingHeader navigation={navigation} title="Import Vehicles" />
        <View style={styles.successWrap}>
          <View style={styles.successIconWrap}>
            <Icon name="check" size={32} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Import started</Text>
          <Text style={styles.successSubtitle}>
            Your import session is being processed on the server. You can track progress from
            Import Sessions.
          </Text>

          <Pressable
            onPress={() => navigation.navigate('ImportSessionList')}
            style={({ pressed }) => [styles.successBtn, pressed && { opacity: 0.9 }]}
          >
            <Icon name="list" size={16} color={colors.white} />
            <Text style={styles.successBtnText}>View Import Sessions</Text>
          </Pressable>

          {createdSessionId ? (
            <Pressable
              onPress={() =>
                navigation.navigate('ImportSessionDetail', { sessionId: createdSessionId })
              }
              style={({ pressed }) => [styles.successBtnSecondary, pressed && { opacity: 0.9 }]}
            >
              <Icon name="eye" size={16} color={colors.primary} />
              <Text style={styles.successBtnSecondaryText}>View This Session</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={resetWizard} style={styles.successLink}>
            <Text style={styles.successLinkText}>Import another file</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const hero = heroCopy[currentStep]

  return (
    <View style={styles.container}>
      <SettingHeader navigation={navigation} title="New Import" />

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
          icon="upload-cloud"
          title={hero.title}
          subtitle={hero.subtitle}
        />

        <StepIndicator currentStep={currentStep} styles={styles} colors={colors} />

        {currentStep === 1 ? (
          <>
            <Pressable
              onPress={handleFileSelection}
              style={({ pressed }) => [styles.uploadCard, pressed && { opacity: 0.95 }]}
            >
              <View style={styles.uploadIconWrap}>
                <Icon name="upload" size={26} color={colors.primary} />
              </View>
              <Text style={styles.uploadTitle}>
                {selectedFile ? 'Change CSV file' : 'Choose CSV file'}
              </Text>
              <Text style={styles.uploadHint}>
                Tap to browse your device. Maximum file size is 10MB.
              </Text>
              <View style={styles.chooseFileBtn}>
                <Icon name="file-plus" size={16} color={colors.white} />
                <Text style={styles.chooseFileBtnText}>Browse files</Text>
              </View>
              {selectedFile ? (
                <View style={styles.selectedFileCard}>
                  <Icon name="file-text" size={18} color={colors.success} />
                  <View style={styles.selectedFileContent}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.selectedFileSize}>
                      {formatFileSize(selectedFile.size)}
                    </Text>
                  </View>
                  <Icon name="check-circle" size={18} color={colors.success} />
                </View>
              ) : null}
            </Pressable>

            <View style={styles.infoBox}>
              <View style={styles.infoTitleRow}>
                <Icon name="info" size={16} color={colors.primary} />
                <Text style={styles.infoTitle}>Before you upload</Text>
              </View>
              <Text style={styles.infoText}>
                Use a CSV export from your inventory system. You will map columns to vehicle
                fields in the next step.
              </Text>
            </View>
          </>
        ) : null}

        {currentStep === 2 ? (
          <>
            <Text style={styles.sectionLabel}>Column mapping</Text>
            <View style={styles.mappingList}>
              {csvHeaders.map((header) => {
                const mapped = columnMappings[header]
                const isVin = mapped === 'vin'
                const isIgnored = mapped === 'ignore'
                return (
                  <View key={header} style={styles.mappingRow}>
                    <View style={styles.mappingRowTitleRow}>
                      <Text style={styles.mappingRowHeader}>{header}</Text>
                      {isVin ? (
                        <View style={[styles.statusBadge, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
                          <Text style={[styles.statusBadgeText, { color: colors.primary }]}>VIN</Text>
                        </View>
                      ) : null}
                      {isIgnored ? (
                        <View style={[styles.statusBadge, { backgroundColor: `${colors.gray}15`, borderColor: `${colors.gray}30` }]}>
                          <Text style={[styles.statusBadgeText, { color: colors.gray }]}>Ignore</Text>
                        </View>
                      ) : null}
                    </View>
                    <Dropdown
                      style={styles.dropdown}
                      data={FIELD_OPTIONS}
                      labelField="label"
                      valueField="value"
                      placeholder="Select field"
                      value={mapped}
                      onChange={(item) =>
                        setColumnMappings((prev) => ({ ...prev, [header]: item.value }))
                      }
                      placeholderStyle={styles.dropdownPlaceholder}
                      selectedTextStyle={styles.dropdownText}
                      itemTextStyle={styles.dropdownItemText}
                      containerStyle={styles.dropdownContainer}
                      activeColor={`${colors.primary}12`}
                    />
                  </View>
                )
              })}
            </View>

            <Text style={styles.sectionLabel}>Preview</Text>
            <View style={styles.previewTableCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>
                  <View style={styles.previewTableHeader}>
                    {csvHeaders.map((header) => (
                      <View key={header} style={styles.previewTableHeaderCell}>
                        <Text style={styles.previewTableHeaderText} numberOfLines={1}>
                          {header}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {csvData?.slice(0, 10).map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.previewTableRow}>
                      {csvHeaders.map((header) => (
                        <View key={`${rowIndex}-${header}`} style={styles.previewTableCell}>
                          <Text style={styles.previewTableCellText} numberOfLines={1}>
                            {row[header] || '—'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.previewFooter}>
                <Text style={styles.previewFooterText}>
                  Showing {Math.min(csvData?.length || 0, 10)} of {csvData?.length || 0} rows
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoTitleRow}>
                <Icon name="info" size={16} color={colors.primary} />
                <Text style={styles.infoTitle}>Mapping tips</Text>
              </View>
              <Text style={styles.infoText}>
                VIN is required. Set unused columns to Ignore. Every column must be mapped before
                you continue.
              </Text>
            </View>
          </>
        ) : null}

        {currentStep === 3 ? (
          <>
            <Text style={styles.sectionLabel}>File summary</Text>
            <View style={styles.card}>
              {[
                ['File', selectedFile?.name],
                ['Size', formatFileSize(selectedFile?.size || 0)],
                ['Rows', String(csvData?.length || 0)],
              ].map(([label, value], index, arr) => (
                <View
                  key={label}
                  style={[styles.summaryRow, index === arr.length - 1 && styles.summaryRowLast]}
                >
                  <Text style={styles.summaryKey}>{label}</Text>
                  <Text style={styles.summaryValue} numberOfLines={1}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Mappings</Text>
            <View style={styles.card}>
              {Object.entries(columnMappings).map(([header, field], index, arr) => (
                <View
                  key={header}
                  style={[styles.summaryRow, index === arr.length - 1 && styles.summaryRowLast]}
                >
                  <Text style={styles.summaryKey} numberOfLines={1}>
                    {header}
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      field === 'ignore' && styles.summaryValueIgnored,
                    ]}
                    numberOfLines={1}
                  >
                    {FIELD_OPTIONS.find((opt) => opt.value === field)?.label || field}
                  </Text>
                </View>
              ))}
            </View>

            {isImporting ? (
              <View style={styles.importProgressWrap}>
                <View style={styles.importProgressTrack}>
                  <View style={[styles.importProgressFill, { width: `${importProgress}%` }]} />
                </View>
                <Text style={styles.importProgressText}>Starting import… {importProgress}%</Text>
              </View>
            ) : null}

            <View style={styles.infoBox}>
              <View style={styles.infoTitleRow}>
                <Icon name="alert-circle" size={16} color={colors.primary} />
                <Text style={styles.infoTitle}>Import notice</Text>
              </View>
              <Text style={styles.infoText}>
                {csvData?.length || 0} vehicles will be imported. Existing VINs will be updated.
                Progress is tracked in Import Sessions after the job starts.
              </Text>
            </View>
          </>
        ) : null}

        <WizardFooter
          onBack={handleBack}
          onContinue={handleContinue}
          continueText={continueText}
          continueDisabled={continueDisabled}
          loading={isImporting}
          styles={styles}
          colors={colors}
        />
      </ScrollView>
    </View>
  )
}
