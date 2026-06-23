import moment from 'moment'

export const VIEW_MODES = ['Month', 'Week', 'Day']
export const STATUS_FILTERS = ['All', 'Scheduled', 'Cancelled']
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatEventTime(isoString) {
  const m = moment(isoString)
  const minutes = m.minutes()
  const hours = m.hours()
  const period = hours >= 12 ? 'p' : 'a'
  const h12 = hours % 12 || 12
  if (minutes === 0) return `${h12}${period}`
  return `${h12}:${String(minutes).padStart(2, '0')}${period}`
}

export function formatEventLabel(invite) {
  const time = formatEventTime(invite.scheduled_start)
  const model = invite?.vehicle_model || invite?.lead?.vehicle_model || ''
  const initial = model.trim().charAt(0).toUpperCase()
  return initial ? `${time} ${initial}` : time
}

export function isEventUpcoming(invite, now = moment()) {
  return moment(invite.scheduled_start).isAfter(now)
}

export function getVisibleRange(cursor, viewMode) {
  const anchor = moment(cursor)

  if (viewMode === 'Week') {
    return {
      start: anchor.clone().startOf('week').startOf('day').toISOString(),
      end: anchor.clone().endOf('week').endOf('day').toISOString(),
    }
  }

  if (viewMode === 'Day') {
    return {
      start: anchor.clone().startOf('day').toISOString(),
      end: anchor.clone().endOf('day').toISOString(),
    }
  }

  return {
    start: anchor.clone().startOf('month').startOf('week').startOf('day').toISOString(),
    end: anchor.clone().endOf('month').endOf('week').endOf('day').toISOString(),
  }
}

export function getCalendarDays(cursor, viewMode) {
  const anchor = moment(cursor)

  if (viewMode === 'Week') {
    const start = anchor.clone().startOf('week')
    return Array.from({ length: 7 }, (_, index) => start.clone().add(index, 'day'))
  }

  if (viewMode === 'Day') {
    return [anchor.clone().startOf('day')]
  }

  const start = anchor.clone().startOf('month').startOf('week')
  const end = anchor.clone().endOf('month').endOf('week')
  const days = []
  const cursorDay = start.clone()

  while (cursorDay.isSameOrBefore(end, 'day')) {
    days.push(cursorDay.clone())
    cursorDay.add(1, 'day')
  }

  return days
}

export function groupInvitesByDay(invites) {
  const map = new Map()

  invites.forEach((invite) => {
    const key = moment(invite.scheduled_start).format('YYYY-MM-DD')
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(invite)
  })

  map.forEach((items) => {
    items.sort((a, b) => moment(a.scheduled_start).valueOf() - moment(b.scheduled_start).valueOf())
  })

  return map
}

export function filterInvites(invites, statusFilter) {
  if (statusFilter === 'All') return invites
  const target = statusFilter.toLowerCase()
  return invites.filter((invite) => String(invite.status || '').toLowerCase() === target)
}

export function formatDetailDateTime(isoString) {
  return moment(isoString).format('ddd, MMM D, YYYY h:mm A')
}

export function getInviteStatusLabel(invite, now = moment()) {
  const status = String(invite?.status || '').toLowerCase()
  if (status === 'cancelled') return 'CANCELLED'
  if (moment(invite.scheduled_start).isAfter(now)) return 'UPCOMING'
  return 'PAST'
}

export function buildLeadFromInvite(invite) {
  const lead = invite?.lead || {}
  return {
    ...lead,
    id: invite.lead_id || lead.id,
    customer_name: invite.customer_name || lead.customer_name,
    vehicle_model: invite.vehicle_model || lead.vehicle_model,
    vehicle_make: lead.vehicle_make,
    customer_telephone: lead.customer_telephone,
  }
}

export function getRangeTitle(cursor, viewMode) {
  const anchor = moment(cursor)

  if (viewMode === 'Day') {
    return anchor.format('MMMM D, YYYY')
  }

  if (viewMode === 'Week') {
    const start = anchor.clone().startOf('week')
    const end = anchor.clone().endOf('week')
    if (start.month() === end.month()) {
      return `${start.format('MMMM D')} – ${end.format('D, YYYY')}`
    }
    return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`
  }

  return anchor.format('MMMM YYYY')
}
