import React, { useMemo } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Platform,
  Share,
  StyleSheet,
} from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import RNFS from 'react-native-fs'
import { fonts } from '../../constant'
import { useTheme } from '../../hooks/useTheme'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../theme/layout'

async function shareBackupCodes(codes) {
  const text = [
    'Redidial — Two-Factor Authentication Backup Codes',
    '',
    ...codes,
    '',
    'Keep these codes in a safe place. Each code can only be used once.',
  ].join('\n')

  try {
    const path = `${RNFS.DocumentDirectoryPath}/redidial-2fa-backup-codes.txt`
    await RNFS.writeFile(path, text, 'utf8')

    await Share.share({
      title: '2FA Backup Codes',
      message: Platform.OS === 'android' ? text : undefined,
      url: Platform.OS === 'ios' ? `file://${path}` : undefined,
    })
  } catch (error) {
    await Share.share({ message: text, title: '2FA Backup Codes' })
  }
}

export default function BackupCodesModal({ visible, codes = [], onClose }) {
  const { colors } = useTheme()
  const styles = useMemo(() => getStyles(colors), [colors])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Text style={styles.eyebrow}>Backup codes</Text>
              <Text style={styles.title}>New backup codes</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.warningBox}>
              <Icon name="alert-triangle" size={16} color={colors.orange || colors.warning} />
              <Text style={styles.warningText}>
                Your previous backup codes are no longer valid. Save these new codes in a safe
                place.
              </Text>
            </View>

            <View style={styles.codesBox}>
              {codes.map((code) => (
                <Text key={code} selectable style={styles.codeLine}>
                  {code}
                </Text>
              ))}
            </View>

            <Pressable
              onPress={() => shareBackupCodes(codes)}
              style={({ pressed }) => [styles.downloadBtn, pressed && { opacity: 0.9 }]}
            >
              <Icon name="download" size={16} color={colors.primary} />
              <Text style={styles.downloadBtnText}>Download backup codes</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={[styles.doneBtn, { flex: 1 }]} onPress={onClose}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      paddingHorizontal: wp(4),
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder || colors.border,
      overflow: 'hidden',
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: wp(4.5),
      paddingTop: hp(2),
      paddingBottom: hp(1.5),
    },
    titleWrap: {
      flex: 1,
      paddingRight: wp(2),
    },
    eyebrow: {
      color: colors.primary,
      fontFamily: fonts.semibold,
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    title: {
      color: colors.text,
      fontFamily: fonts.bold,
      fontSize: 17,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    body: {
      paddingHorizontal: wp(4.5),
      paddingBottom: hp(2),
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: `${colors.orange || colors.warning || '#F59E0B'}12`,
      borderRadius: 12,
      padding: wp(3.5),
      marginBottom: hp(1.5),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.orange || colors.warning || '#F59E0B'}30`,
    },
    warningText: {
      flex: 1,
      color: colors.appText || colors.text,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
    },
    codesBox: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: wp(3.5),
      gap: 8,
      marginBottom: hp(1.5),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    codeLine: {
      color: colors.text,
      fontFamily: fonts.semibold,
      fontSize: 14,
      letterSpacing: 1,
    },
    downloadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: hp(1.4),
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.primary}35`,
      backgroundColor: `${colors.primary}08`,
    },
    downloadBtnText: {
      color: colors.primary,
      fontFamily: fonts.semibold,
      fontSize: 13,
    },
    footer: {
      paddingHorizontal: wp(4.5),
      paddingVertical: hp(2),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.cardBg,
    },
    doneBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: hp(1.5),
    },
    doneBtnText: {
      color: colors.white,
      fontFamily: fonts.bold,
      fontSize: 14,
    },
  })
}
