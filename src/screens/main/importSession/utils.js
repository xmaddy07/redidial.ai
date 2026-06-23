import moment from 'moment'

export const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  partial: 'Partial',
}

export function unwrapPayload(payload) {
  if (payload == null) return null
  return payload?.data ?? payload?.result ?? payload
}

export function normalizeSessionsList(payload) {
  const root = unwrapPayload(payload)
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.sessions)) return root.sessions
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data
  return []
}

export function normalizeSession(raw) {
  if (!raw || typeof raw !== 'object') return null

  const totalRows = Number(raw.total_rows ?? raw.totalRows ?? 0)
  const successfulRows = Number(raw.successful_rows ?? raw.successfulRows ?? 0)
  const failedRows = Number(raw.failed_rows ?? raw.failedRows ?? 0)

  return {
    id: String(raw.id ?? raw.session_id ?? raw.sessionId ?? ''),
    filename: raw.filename || raw.file_name || '—',
    status: String(raw.status || 'pending').toLowerCase(),
    totalRows,
    successfulRows,
    failedRows,
    startedAt: raw.started_at ?? raw.startedAt ?? raw.created_at ?? raw.createdAt ?? null,
    completedAt: raw.completed_at ?? raw.completedAt ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    errorMessage: raw.error_message ?? raw.errorMessage ?? null,
  }
}

export function getStatusColor(status, colors) {
  switch (String(status).toLowerCase()) {
    case 'completed':
      return colors.success
    case 'processing':
      return colors.primary
    case 'failed':
      return colors.danger || '#DC2626'
    case 'partial':
      return colors.orange || colors.warning || '#F59E0B'
    default:
      return colors.gray
  }
}

export function getDetailTitle(status) {
  switch (String(status).toLowerCase()) {
    case 'processing':
      return 'Processing Import'
    case 'completed':
      return 'Import Completed'
    case 'failed':
      return 'Import Failed'
    case 'partial':
      return 'Import Partially Completed'
    default:
      return 'Import Session'
  }
}

export function formatDateTime(value) {
  if (!value) return '—'
  const parsed = moment(value)
  return parsed.isValid() ? parsed.format('MMM D, YYYY h:mm A') : String(value)
}

export function formatDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return '—'
  const start = moment(startedAt)
  const end = moment(completedAt)
  if (!start.isValid() || !end.isValid()) return '—'

  const seconds = Math.max(0, end.diff(start, 'seconds'))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remSeconds = seconds % 60
  if (minutes < 60) return remSeconds ? `${minutes}m ${remSeconds}s` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  return remMinutes ? `${hours}h ${remMinutes}m` : `${hours}h`
}

export function getSuccessRate(session) {
  if (!session?.totalRows) return 0
  return Math.round((session.successfulRows / session.totalRows) * 100)
}

export function getProcessedRows(session) {
  return (session?.successfulRows || 0) + (session?.failedRows || 0)
}

export function getRemainingRows(session) {
  return Math.max(0, (session?.totalRows || 0) - getProcessedRows(session))
}

export function isValidSessionId(id) {
  if (id == null || id === '' || id === 'undefined' || id === 'null') return false
  const numeric = Number(id)
  return Number.isFinite(numeric) && numeric > 0
}
