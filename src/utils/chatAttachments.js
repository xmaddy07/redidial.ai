import { BASE_URL } from '../config'

const LOCAL_DEVICE_PATH = /^\/(storage|data|sdcard|var|private|Users|tmp)/i
const DOC_EXTENSIONS = /\.(pdf|doc|docx|txt)$/i
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|bmp|svg)$/i
const VIDEO_EXTENSIONS = /\.(mp4|mov|m4v|webm|avi|mkv)$/i

export function formatFileSize(bytes) {
  const size = Number(bytes)
  if (!size || Number.isNaN(size) || size < 0) return '—'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function buildDefaultFileMessage(fileName) {
  const name = String(fileName || 'file').trim() || 'file'
  return `Shared a file: ${name}`
}

export function buildUploadNoteText({ fileName, fileSize, userName }) {
  const name = String(fileName || 'file').trim() || 'file'
  const size = formatFileSize(fileSize)
  const by = String(userName || 'Unknown').trim() || 'Unknown'
  return `Uploaded file: ${name} (${size}) by ${by}`
}

export function isImageMime(mime, fileName) {
  const type = String(mime || '').toLowerCase()
  if (type.startsWith('image/')) return true
  return IMAGE_EXTENSIONS.test(String(fileName || ''))
}

export function isVideoMime(mime, fileName) {
  const type = String(mime || '').toLowerCase()
  if (type.startsWith('video/')) return true
  return VIDEO_EXTENSIONS.test(String(fileName || ''))
}

export function isDocumentMime(mime, fileName) {
  const type = String(mime || '').toLowerCase()
  if (
    type === 'application/pdf'
    || type.includes('msword')
    || type.includes('wordprocessingml')
    || type === 'text/plain'
  ) return true
  return DOC_EXTENSIONS.test(String(fileName || ''))
}

export function getFileKind(mime, fileName) {
  if (isImageMime(mime, fileName)) return 'image'
  if (isVideoMime(mime, fileName)) return 'video'
  if (isDocumentMime(mime, fileName)) return 'document'
  return 'other'
}

export function normalizeLocalFileUri(uri) {
  if (uri == null || uri === '') return null
  const value = String(uri).trim()
  if (
    /^https?:\/\//i.test(value)
    || value.startsWith('file://')
    || value.startsWith('content://')
  ) {
    return value
  }
  if (value.startsWith('/') && LOCAL_DEVICE_PATH.test(value)) {
    return `file://${value}`
  }
  return value
}

export function resolveFileUrl(file) {
  const raw = file?.url
    || file?.file_url
    || file?.download_url
    || file?.attachment_url
    || file?.public_url
    || file?.path
    || file?.uri
    || file?.src
    || file?.link
    || file?.href
    || file?.location
    || ''
  if (!raw) return null
  const value = String(raw).trim()
  if (/^https?:\/\//i.test(value) || value.startsWith('file://') || value.startsWith('content://')) {
    return value
  }
  if (file?.local || LOCAL_DEVICE_PATH.test(value)) {
    return value.startsWith('file://') ? value : `file://${value}`
  }
  const base = BASE_URL.replace(/\/$/, '')
  return value.startsWith('/') ? `${base}${value}` : `${base}/${value}`
}

export function normalizeChatFile(raw) {
  if (!raw || typeof raw !== 'object') return null
  const name = raw.name || raw.filename || raw.original_name || raw.file_name || 'Attachment'
  const mime = raw.mimetype || raw.mime_type || raw.type || raw.content_type || ''
  const size = raw.size ?? raw.file_size ?? raw.bytes ?? null
  const url = resolveFileUrl(raw)
  return {
    id: raw.id ?? raw._id ?? null,
    name: String(name),
    mime: String(mime),
    size: size != null ? Number(size) : null,
    url,
    kind: raw.kind || getFileKind(mime, name),
    local: raw.local === true,
    uploadedBy: raw.uploaded_by_name
      || raw.uploader_name
      || raw.user?.name
      || raw.uploaded_by?.name
      || null,
    createdAt: raw.created_at || raw.uploaded_at || null,
  }
}

export function normalizeChatFiles(raw) {
  if (!raw) return []
  const list = Array.isArray(raw) ? raw : [raw]
  return list.map(normalizeChatFile).filter(Boolean)
}

export function extractChatFilesForSide(chat, side) {
  if (!chat || typeof chat !== 'object') return []
  if (side === 'right') {
    return normalizeChatFiles(chat.prompt_files || chat.user_files || chat.files)
  }
  if (chat.response_files) {
    return normalizeChatFiles(chat.response_files)
  }
  return chat.response_text ? normalizeChatFiles(chat.files) : []
}

export function parseLegacyAttachmentLabel(text) {
  if (!text) return null
  const shared = String(text).match(/^Shared a file:\s*(.+)$/i)
  if (shared) {
    const fileName = shared[1].trim()
    return { fileName, kind: getFileKind('', fileName) }
  }
  const legacy = String(text).match(/^\[Attachment\](?:\s+(.+))?$/)
  if (!legacy) return null
  const fileName = legacy[1]?.trim() || 'Attachment'
  return { fileName, kind: getFileKind('', fileName) }
}

export function getLatestChatId(lead) {
  const chats = Array.isArray(lead?.chats) ? lead.chats : []
  if (!chats.length) return null
  const sorted = [...chats].sort((a, b) => {
    const aTime = new Date(a?.created_at || 0).getTime()
    const bTime = new Date(b?.created_at || 0).getTime()
    return bTime - aTime
  })
  const latest = sorted[0]
  return latest?.id ?? latest?._id ?? null
}
