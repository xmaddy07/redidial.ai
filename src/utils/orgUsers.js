import { isBotUser, getUserDisplayName } from './threadAssignment';

export function normalizeUsersList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.users)) return payload.users;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

export function mapOrgUserForAssign(u) {
  const name =
    [u?.first_name, u?.last_name].filter(Boolean).join(' ').trim()
    || u?.name
    || u?.email
    || 'Unknown';
  const isBot = isBotUser(u);

  return {
    id: u?.id ?? u?.user_id,
    name,
    shortName: getUserDisplayName(u, { shortenBot: true }) || name,
    isBot,
    type: isBot ? 'Bot' : u?.type || 'Human',
  };
}
