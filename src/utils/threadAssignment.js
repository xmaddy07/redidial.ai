export function getAssignmentUser(assignment) {
  return assignment?.user || assignment?.assigned_user || assignment?.assignedUser || null
}

export function isBotUser(user) {
  if (!user) return false
  const name = [
    user.name,
    user.first_name,
    user.firstName,
    user.last_name,
    user.lastName,
    user.email,
  ]
    .filter(Boolean)
    .join(' ')
  return user.type === 'Bot' || /bot/i.test(name)
}

export function getUserDisplayName(user, { shortenBot = true } = {}) {
  if (!user) return null
  if (shortenBot && isBotUser(user)) return 'Bot'

  const first = user.first_name || user.firstName || ''
  const last = user.last_name || user.lastName || ''
  return [first, last].filter(Boolean).join(' ').trim() || user.name || user.email || null
}

export function getLatestThreadAssignment(lead) {
  const list = lead?.threadAssignments
  if (!Array.isArray(list) || list.length === 0) return null

  return [...list].sort((a, b) => {
    const ta = new Date(a?.assigned_at || 0).getTime()
    const tb = new Date(b?.assigned_at || 0).getTime()
    return tb - ta
  })[0]
}

export function getCurrentAssigneeFromLead(lead) {
  const latest = getLatestThreadAssignment(lead)
  if (!latest) return null

  const user = getAssignmentUser(latest)
  const name = getUserDisplayName(user)
  if (!name) return null

  return {
    user,
    name,
    isBot: isBotUser(user),
    assignedAt: latest.assigned_at || null,
  }
}

export function getCurrentAssigneeFromMessages(messages = []) {
  let latest = null

  for (const msg of messages) {
    if (msg?.type !== 'system') continue
    const text = String(msg?.text || '')
    if (!/^Assigned to:/i.test(text)) continue

    const assignedAtMs = msg.createdAt ? new Date(msg.createdAt).getTime() : 0
    if (latest && assignedAtMs < latest.assignedAtMs) continue

    const rawName = text.replace(/^Assigned to:\s*/i, '').trim()
    const isBot = /bot/i.test(rawName)
    latest = {
      name: isBot ? 'Bot' : rawName,
      isBot,
      assignedAt: msg.createdAt || null,
      assignedAtMs,
    }
  }

  return latest
}

export function resolveCurrentAssignee(lead, messages = []) {
  const fromLead = getCurrentAssigneeFromLead(lead)
  const fromMessages = getCurrentAssigneeFromMessages(messages)

  if (fromLead && fromMessages) {
    const leadAt = fromLead.assignedAt ? new Date(fromLead.assignedAt).getTime() : 0
    const msgAt = fromMessages.assignedAtMs || 0
    return msgAt > leadAt ? fromMessages : fromLead
  }

  return fromLead || fromMessages
}

export function isAssignmentSystemText(text) {
  return /^Assigned to:/i.test(String(text || ''))
}
