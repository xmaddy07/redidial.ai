const ADMIN_AUTHORITIES = new Set([
  'ADMIN',
  'ORG_ADMIN',
  'ORGANIZATION_ADMIN',
  'SUPER_ADMIN',
  'OWNER',
])

const ADMIN_ROLE_TOKENS = new Set([
  'admin',
  'administrator',
  'org_admin',
  'organization_admin',
  'owner',
  'super_admin',
])

function normalizeRoleToken(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_')
}

function isAdminRoleToken(value) {
  const token = normalizeRoleToken(value)
  if (!token) return false
  if (ADMIN_ROLE_TOKENS.has(token)) return true
  return token.includes('admin') || token === 'owner'
}

export function isOrgAdmin(user, role) {
  if (!user && !role) return false

  const authority = user?.authority ?? user?.Authority ?? user?.user_authority
  if (authority != null && authority !== '') {
    const normalized = String(authority).toUpperCase().replace(/\s+/g, '_')
    if (ADMIN_AUTHORITIES.has(normalized)) return true
    if (normalized.includes('ADMIN') || normalized.includes('OWNER')) return true
  }

  if (
    user?.is_admin === true ||
    user?.isAdmin === true ||
    user?.is_org_admin === true ||
    user?.isOrgAdmin === true
  ) {
    return true
  }

  const roleCandidates = [
    user?.role,
    user?.userRole,
    user?.user_role,
    role,
  ]

  return roleCandidates.some(isAdminRoleToken)
}
