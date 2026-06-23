import {
  incrementConversationUnread,
  getConversationUnread,
  shouldAlertForNotify,
  clearConversationUnread,
} from '../../../utils/teamChatNotify';
import { markInternalConversationRead } from '../../../api';
import { emitSocket } from '../../../services';

export function getUserDisplayName(user) {
  if (!user) return 'Unknown';
  const fromParts = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return user.name || fromParts || user.email || 'Unknown';
}

export function getUserInitials(user) {
  const name = getUserDisplayName(user);
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

export function normalizeOrgUser(raw) {
  if (!raw) return null;
  return {
    id: raw.id ?? raw.user_id ?? raw.userId,
    first_name: raw.first_name || raw.firstName || '',
    last_name: raw.last_name || raw.lastName || '',
    email: raw.email || '',
    user_type: raw.user_type || raw.userType || 'HUMAN',
    is_active: raw.is_active ?? raw.isActive ?? true,
    name: getUserDisplayName(raw),
    initials: getUserInitials(raw),
  };
}

export function filterTeammates(users, currentUserId) {
  return (Array.isArray(users) ? users : [])
    .map(normalizeOrgUser)
    .filter(
      (user) =>
        user?.id &&
        Number(user.id) !== Number(currentUserId) &&
        user.user_type === 'HUMAN' &&
        user.is_active !== false,
    );
}

export function normalizeTeamChat(raw, currentUserId) {
  if (!raw) return null;

  const conversationId =
    raw.id ??
    raw.conversation_id ??
    raw.conversationId;

  const peer =
    raw.peer ??
    raw.peer_user ??
    raw.peerUser ??
    raw.user ??
    raw.recipient ??
    raw.sender ??
    raw.other_user ??
    raw.otherUser;

  const peerId =
    raw.peer_user_id ??
    raw.peerUserId ??
    raw.user_id ??
    raw.userId ??
    raw.peer_id ??
    raw.peerId ??
    (peer?.id !== currentUserId ? peer?.id : null);

  const user = normalizeOrgUser(peer);
  if (user && peerId) user.id = peerId;

  const lastMsg = raw.last_message ?? raw.lastMessage ?? raw.message;
  const lastMessage =
    typeof lastMsg === 'string'
      ? lastMsg
      : (lastMsg?.body ?? lastMsg?.content ?? lastMsg?.text ?? raw.preview ?? '');

  const lastMessageAt =
    raw.last_message_at ??
    raw.lastMessageAt ??
    lastMsg?.created_at ??
    lastMsg?.createdAt ??
    raw.updated_at ??
    raw.updatedAt ??
    raw.created_at ??
    raw.createdAt ??
    null;

  const unreadCount = raw.unread_count ?? raw.unreadCount ?? 0;

  return {
    id: String(conversationId || peerId || user?.id || ''),
    conversationId: conversationId != null ? String(conversationId) : null,
    user,
    lastMessage,
    lastMessageAt,
    unreadCount: Number(unreadCount) || 0,
  };
}

export function sortChatsByActivity(chats) {
  return [...chats].sort((a, b) => {
    const aTime = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

export function hasTeamChatHistory(chat) {
  return Boolean(String(chat?.lastMessage || '').trim());
}

export function getChattedTeamList(chats) {
  return sortChatsByActivity(
    (Array.isArray(chats) ? chats : []).filter((chat) => chat?.conversationId && hasTeamChatHistory(chat)),
  );
}

export function getNewTeamUsers(users, chats) {
  const chattedUserIds = new Set();

  (Array.isArray(chats) ? chats : []).forEach((chat) => {
    if (hasTeamChatHistory(chat) && chat?.user?.id != null) {
      chattedUserIds.add(Number(chat.user.id));
    }
  });

  return (Array.isArray(users) ? users : [])
    .filter((user) => user?.id && !chattedUserIds.has(Number(user.id)))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

export function normalizeTeamMessage(raw, currentUserId) {
  if (!raw) return null;

  const senderId =
    raw.sender_id ??
    raw.senderId ??
    raw.from_user_id ??
    raw.fromUserId ??
    raw.user_id ??
    raw.userId ??
    raw.sender?.id;

  const content = raw.body ?? raw.content ?? raw.text ?? raw.message ?? '';
  const createdAt = raw.created_at ?? raw.createdAt ?? raw.timestamp ?? null;

  return {
    id: String(raw.id ?? raw.message_id ?? `${createdAt}-${senderId}`),
    content: String(content),
    senderId: senderId != null ? Number(senderId) : null,
    side: Number(senderId) === Number(currentUserId) ? 'right' : 'left',
    createdAt,
    status: raw.status || 'seen',
  };
}

export function mergeMessages(...lists) {
  const map = new Map();
  lists.flat().forEach((raw) => {
    const message = raw?.id != null ? raw : null;
    if (!message) return;
    map.set(String(message.id), message);
  });
  return Array.from(map.values()).sort((a, b) => Number(a.id) - Number(b.id));
}

export function formatChatListDate(dateValue) {
  return formatThreadTime(dateValue)
}

export function formatThreadTime(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  if (dateOnly.getTime() === today.getTime()) return time
  if (dateOnly.getTime() === yesterday.getTime()) return 'Yesterday'
  if (date.getTime() > weekAgo.getTime()) {
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

export function formatMessageTimestamp(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function extractInternalChatMessage(data) {
  const message = data?.message ?? data;
  if (!message) return null;

  return {
    id: message.id ?? message.message_id ?? Date.now(),
    conversationId:
      message.conversation_id ??
      message.conversationId ??
      data?.conversationId ??
      data?.conversation_id,
    content: message.body ?? message.content ?? message.text ?? message.message ?? '',
    senderId:
      message.sender_id ??
      message.senderId ??
      message.from_user_id ??
      message.user_id ??
      message.sender?.id,
    createdAt: message.created_at ?? message.createdAt ?? new Date().toISOString(),
  };
}

const seenIncomingMessageIds = new Set();
const SEEN_MESSAGE_CAP = 500;

function rememberIncomingMessageId(messageId) {
  if (messageId == null) return true;
  const key = String(messageId);
  if (seenIncomingMessageIds.has(key)) return true;
  seenIncomingMessageIds.add(key);
  if (seenIncomingMessageIds.size > SEEN_MESSAGE_CAP) {
    const oldest = seenIncomingMessageIds.values().next().value;
    seenIncomingMessageIds.delete(oldest);
  }
  return false;
}

export function registerIncomingTeamMessage(data, currentUserId) {
  const incoming = extractInternalChatMessage(data);
  if (!incoming?.conversationId) return null;

  const conversationId = String(incoming.conversationId);
  const isFromPeer =
    currentUserId == null ||
    Number(incoming.senderId) !== Number(currentUserId);
  const alreadySeen = rememberIncomingMessageId(incoming.id);
  const canCountUnread = isFromPeer && shouldAlertForNotify(conversationId);

  if (!alreadySeen && canCountUnread) {
    incrementConversationUnread(conversationId);
  }

  return {
    incoming,
    conversationId,
    isFromPeer,
    unreadCount: getConversationUnread(conversationId),
    shouldNotify: !alreadySeen && canCountUnread,
    isDuplicate: alreadySeen,
  };
}

export function markTeamConversationRead({ token, conversationId }) {
  if (!conversationId) return;

  clearConversationUnread(conversationId);

  if (token) {
    markInternalConversationRead({ token, conversationId }).catch(() => {});
  }

  emitSocket('internalChatRead', {
    conversationId: Number(conversationId) || conversationId,
  });
}

export function parseMessagesPage(data, limit = 80) {
  const items = Array.isArray(data) ? data : data?.items || data?.messages || [];
  const nextCursor =
    data?.nextCursor ??
    data?.next_cursor ??
    data?.cursor ??
    (items.length > 0 ? items[0]?.id : null);
  const hasMore =
    data?.hasMore ??
    data?.has_more ??
    (items.length >= limit && nextCursor != null);

  return {
    items,
    hasMore: Boolean(hasMore),
    nextCursor,
  };
}

export function parsePresenceChange(data) {
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  const email = (parsed?.email || parsed?.userEmail || '').toLowerCase();
  if (!email) return null;
  return {
    email,
    online: !!(parsed?.online ?? parsed?.isOnline),
  };
}

export function applyOnlineStatusMap(status) {
  const nextMap = {};
  if (Array.isArray(status)) {
    status.forEach((entry) => {
      const email = entry?.email || entry?.userEmail;
      if (email) nextMap[email.toLowerCase()] = !!(entry?.online ?? entry?.isOnline);
    });
  } else if (status && typeof status === 'object') {
    Object.entries(status).forEach(([email, value]) => {
      nextMap[String(email).toLowerCase()] = !!(value?.online ?? value);
    });
  }
  return nextMap;
}

/** @deprecated Use extractInternalChatMessage */
export function extractSocketTeamMessage(data) {
  return extractInternalChatMessage(data);
}
