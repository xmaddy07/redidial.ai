import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity, Linking, Platform } from 'react-native'
import { Alert } from '../../utils/alert'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {
  formatFileSize,
  getFileKind,
  normalizeChatFile,
  parseLegacyAttachmentLabel,
  resolveFileUrl,
} from '../../utils/chatAttachments'

export function getMessageFiles(item) {
  if (Array.isArray(item?.files) && item.files.length > 0) {
    return item.files
      .map((file) => normalizeChatFile(file) || file)
      .filter(Boolean)
  }
  const legacy = parseLegacyAttachmentLabel(item?.text)
  if (!legacy) return []
  return [{
    name: legacy.fileName,
    kind: legacy.kind,
    mime: '',
    size: null,
    url: null,
  }]
}

export function ChatMessageFiles({
  item,
  isRight,
  styles,
  colors,
  onPreviewImage,
}) {
  const files = getMessageFiles(item)
  const [brokenImages, setBrokenImages] = useState(() => new Set())

  if (!files.length) return null

  const markImageBroken = (key) => {
    setBrokenImages((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }

  const renderFileCard = (file, kind, key, iconName = null) => {
    const resolvedIcon = iconName || (kind === 'document' ? 'file-document-outline' : 'file-outline')
    const compact = isRight

    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.88}
        onPress={() => openFile(file)}
        style={[
          styles.messageFileCard,
          isRight ? styles.messageFileCardRight : styles.messageFileCardLeft,
          compact && styles.messageFileCardCompact,
        ]}
      >
        <View style={[
          styles.messageFileIconWrap,
          isRight && styles.messageFileIconWrapRight,
        ]}>
          <MaterialCommunityIcons
            name={resolvedIcon}
            size={24}
            color={isRight ? colors.white : colors.primary}
          />
        </View>
        {!compact ? (
          <View style={styles.messageFileMeta}>
            <Text
              style={[
                styles.messageFileName,
                isRight && styles.messageFileNameRight,
              ]}
              numberOfLines={2}
            >
              {file.name}
            </Text>
            <Text
              style={[
                styles.messageFileSubtext,
                isRight && styles.messageFileSubtextRight,
              ]}
            >
              {kind === 'document' ? 'Document' : kind === 'image' ? 'Image' : 'File'}
              {file.size ? ` · ${formatFileSize(file.size)}` : ''}
            </Text>
          </View>
        ) : (
          <View style={styles.messageFileMetaSpacer} />
        )}
        <MaterialCommunityIcons
          name="open-in-new"
          size={16}
          color={isRight ? colors.white : colors.gray}
          style={{ opacity: 0.8 }}
        />
      </TouchableOpacity>
    )
  }

  const openFile = (file) => {
    const url = resolveFileUrl(file)
    const fileKind = file.kind || getFileKind(file.mime, file.name)
    if (!url) {
      Alert.alert('Attachment', file?.name || 'No URL available')
      return
    }
    if (fileKind === 'image' && onPreviewImage) {
      onPreviewImage(url, file.name)
      return
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open attachment'))
  }

  return (
    <View style={styles.messageFilesWrap}>
      {files.map((file, index) => {
        const kind = file.kind || getFileKind(file.mime, file.name)
        const url = resolveFileUrl(file)
        const key = String(file.id || file.name || index)
        const showImage = kind === 'image' && url && !brokenImages.has(key)

        if (showImage) {
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.9}
              onPress={() => openFile(file)}
              style={styles.messageImageWrap}
            >
              <Image
                source={{ uri: url }}
                style={styles.messageImage}
                resizeMode="cover"
                resizeMethod={Platform.OS === 'android' ? 'resize' : 'auto'}
                onError={() => markImageBroken(key)}
              />
            </TouchableOpacity>
          )
        }

        if (kind === 'image' && (!url || brokenImages.has(key))) {
          return renderFileCard(file, 'image', key, 'image-outline')
        }

        if (kind === 'video') {
          return renderFileCard(file, 'video', key, 'play-circle-outline')
        }

        const iconName = kind === 'document' ? 'file-document-outline' : 'file-outline'
        return renderFileCard(file, kind, key, iconName)
      })}
    </View>
  )
}

export function PendingFilePreview({
  file,
  styles,
  colors,
  onRemove,
}) {
  if (!file) return null
  const kind = file.kind || getFileKind(file.type, file.name)

  return (
    <View style={styles.pendingFileWrap}>
      <View style={styles.pendingFileCard}>
        {kind === 'image' ? (
          <Image
            source={{ uri: resolveFileUrl(file) || file.uri }}
            style={styles.pendingFileThumb}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.pendingFileIconBox}>
            <MaterialCommunityIcons
              name={kind === 'video' ? 'video-outline' : 'file-document-outline'}
              size={22}
              color={colors.primary}
            />
          </View>
        )}
        <View style={styles.pendingFileMeta}>
          <Text style={styles.pendingFileName} numberOfLines={1}>{file.name}</Text>
          <Text style={styles.pendingFileHint}>
            {kind === 'image' ? 'Image' : kind === 'video' ? 'Video' : 'Document'}
            {file.size ? ` · ${formatFileSize(file.size)}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRemove}
          style={styles.pendingFileRemoveBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="close-circle" size={22} color={colors.gray} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
