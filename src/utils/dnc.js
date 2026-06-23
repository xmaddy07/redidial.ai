import { getDncDataCheck, getOrganizationDetails } from '../api'

export function normalizePhoneForDnc(phone) {
  const raw = String(phone || '').trim()
  if (!raw) return ''

  const digits = raw.replace(/\D/g, '')
  if (!digits) return raw

  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (raw.startsWith('+')) return `+${digits}`

  return digits
}

export function parseIsDncFromCheckResponse(payload) {
  if (payload == null) return false

  const candidates = [
    payload,
    payload?.data,
    payload?.result,
    payload?.data?.data,
  ].filter((item) => item != null)

  for (const item of candidates) {
    if (typeof item === 'boolean') return item
    if (typeof item?.isDnc === 'boolean') return item.isDnc
    if (typeof item?.is_dnc === 'boolean') return item.is_dnc
    if (typeof item?.onDncList === 'boolean') return item.onDncList
    if (typeof item?.on_dnc_list === 'boolean') return item.on_dnc_list
    if (typeof item?.isOnDncList === 'boolean') return item.isOnDncList
    if (typeof item?.inDnc === 'boolean') return item.inDnc
    if (typeof item?.in_dnc === 'boolean') return item.in_dnc
    if (typeof item?.exists === 'boolean') return item.exists
    if (typeof item?.onList === 'boolean') return item.onList
    if (item?.status === 'dnc' || item?.status === 'on_dnc') return true
  }

  return false
}

export function resolveOrgIdFromUser(user, organization) {
  return (
    user?.orgId
    ?? user?.organization_id
    ?? user?.organizationId
    ?? organization?.id
    ?? organization?.orgId
    ?? null
  )
}

export async function fetchLeadDncStatus({ token, phone, user, organization }) {
  const normalizedPhone = normalizePhoneForDnc(phone)
  if (!token || !normalizedPhone) {
    return { isDnc: false, orgId: null, phone: normalizedPhone }
  }

  let orgId = resolveOrgIdFromUser(user, organization)
  let orgData = organization

  if (!orgId) {
    try {
      const orgRes = await getOrganizationDetails(token)
      orgData = orgRes?.data || orgRes || {}
      orgId = resolveOrgIdFromUser(user, orgData)
    } catch {
      // keep trying with user org only
    }
  }

  if (!orgId) {
    return { isDnc: false, orgId: null, phone: normalizedPhone, orgData }
  }

  const phonesToTry = [...new Set([normalizedPhone, String(phone || '').trim()].filter(Boolean))]

  for (const number of phonesToTry) {
    try {
      const dncRes = await getDncDataCheck({ token, number, orgId })
      const isDnc = parseIsDncFromCheckResponse(dncRes)
      return { isDnc, orgId, phone: number, orgData }
    } catch {
      // try alternate phone formatting
    }
  }

  return { isDnc: false, orgId, phone: normalizedPhone, orgData }
}
