export function buildTwilioIdentity(user, orgId) {
  const userId = user?.id ?? user?.user_id
  if (userId == null || orgId == null) return null
  return `${userId}__${orgId}`
}

export function buildAgentName(user) {
  const first = user?.first_name || user?.firstName || ''
  const last = user?.last_name || user?.lastName || ''
  const fullName = `${first} ${last}`.trim()
  return fullName || user?.name || user?.email || 'Unknown User'
}

export function normalizeE164(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''

  if (value.startsWith('+')) {
    return `+${value.slice(1).replace(/[^\d]/g, '')}`
  }

  const digits = value.replace(/[^\d]/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length > 0) return `+${digits}`

  return value
}

export function extractTwilioAccessToken(payload) {
  return (
    payload?.token
    || payload?.accessToken
    || payload?.data?.token
    || payload?.data?.accessToken
    || null
  )
}

export function extractCallerIdFromChannelConfig(payload) {
  const data = payload?.data || payload || {}
  const channels = Array.isArray(data?.channels) ? data.channels : []
  const activeChannel = channels.find((item) => item?.phone_number || item?.number) || channels[0]

  return (
    data?.callerId
    || data?.caller_id
    || data?.twilioNumber
    || data?.twilio_number
    || data?.phoneNumber
    || data?.phone_number
    || activeChannel?.phone_number
    || activeChannel?.number
    || data?.channel?.callerId
    || data?.channel?.phoneNumber
    || data?.channel?.phone_number
    || ''
  )
}
