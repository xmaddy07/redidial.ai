import { extractChatFilesForSide, normalizeChatFiles } from './chatAttachments';

const HTML_ENTITY_MAP = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

function decodeHtmlEntities(text) {
  return String(text || '').replace(
    /&(?:nbsp|amp|lt|gt|quot|#39);/gi,
    (entity) => HTML_ENTITY_MAP[entity.toLowerCase()] || entity,
  );
}

function normalizePlainText(text) {
  if (!text) return '';
  return decodeHtmlEntities(String(text))
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const stripHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
    .replace(/<\/li>\s*<li[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/li>/gi, '')
    .replace(/<[^>]*>/g, '');
  return normalizePlainText(withBreaks);
};

/** Bot/automated messages with paragraphs, bullet slots, or opt-out footers */
export function isStructuredChatMessage(text) {
  if (!text || typeof text !== 'string') return false;
  const value = text.trim();
  if (!value) return false;

  const hasBulletList = /(?:^|\n)\s*[-•]\s+\S/.test(value);
  const hasOptOut = /reply\s+stop\s+to\s+unsubscribe/i.test(value);
  const hasParagraphBreaks = /\n\s*\n/.test(value);
  const lineCount = value.split('\n').filter((line) => line.trim()).length;

  if (hasBulletList) return true;
  if (hasOptOut && (hasParagraphBreaks || lineCount >= 3)) return true;
  if (hasParagraphBreaks && lineCount >= 3) return true;

  return false;
}

export function splitStructuredMessageBlocks(text) {
  const normalized = normalizePlainText(text);
  if (!normalized) return [];
  return normalized.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
}

export function isBulletListBlock(block) {
  const lines = String(block || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return false;
  return lines.every((line) => /^[-•]\s+/.test(line));
}

export function formatOutboundMessageStatus(status) {
  const value = String(status || '').toLowerCase().trim();
  if (value === 'sending') return 'Sending';
  if (value === 'delivered') return 'Delivered';
  if (value === 'failed') return 'Failed';
  return null;
}

export const formatMessageTime = (ts) => {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export const formatMessageDateTime = (ts) => {
  if (!ts) return '';
  try {
    const date = new Date(ts);
    const datePart = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const timePart = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${datePart} · ${timePart}`;
  } catch {
    return '';
  }
};

export function shouldShowSystemMessageDateTime(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  return /^Assigned to:/i.test(value) || /^Outgoing call/i.test(value);
}

export function isOutgoingCallSystemText(text) {
  return /^Outgoing call/i.test(String(text || '').trim());
}

export function parseStructuredText(raw, fallbackStrip = true) {
  if (raw == null) return '';
  const value = typeof raw === 'string' ? raw : String(raw);
  try {
    const obj = JSON.parse(value);
    if (obj && typeof obj === 'object') {
      const base = obj.msg || obj.message || '';
      const first = obj?.user?.first_name || obj?.user?.firstName || '';
      const last = obj?.user?.last_name || obj?.user?.lastName || '';
      const name =
        [first, last].filter(Boolean).join(' ').trim() ||
        obj?.user?.name ||
        obj?.user?.email ||
        '';
      const composed = `${base || ''}${name || ''}`.trim();
      if (composed) return composed;
    }
  } catch {
    // not JSON
  }
  const hasHtml = /<[^>]+>/.test(value);
  if (!hasHtml) {
    return normalizePlainText(value);
  }
  return fallbackStrip ? stripHtml(value) : normalizePlainText(value);
}

export function maybeSystemText(raw) {
  if (!raw) return null;
  try {
    const obj = JSON.parse(String(raw));
    if (obj && typeof obj === 'object' && (obj.msg || obj.message) && obj.user) {
      const first = obj?.user?.first_name || obj?.user?.firstName || '';
      const last = obj?.user?.last_name || obj?.user?.lastName || '';
      const name =
        [first, last].filter(Boolean).join(' ').trim() ||
        obj?.user?.name ||
        obj?.user?.email ||
        '';
      const base = obj.msg || obj.message || '';
      const text = `${base}${name}`.trim();
      if (text) return text;
    }
  } catch {
    // not system JSON
  }
  return null;
}

function shouldHideHtmlBlob(html) {
  if (!html || typeof html !== 'string') return false;
  return /^\s*<html/i.test(html);
}

export function isSystemPayload(raw) {
  try {
    const obj = JSON.parse(String(raw));
    return !!(obj && typeof obj === 'object' && (obj.msg || obj.message) && obj.user);
  } catch {
    return false;
  }
}

/** Convert lead.chats API rows into normalized SQLite message records */
export function chatsToMessageRecords(leadId, chats = []) {
  if (!leadId || !Array.isArray(chats)) return [];

  const records = [];

  chats.forEach((chat) => {
    const createdAt = chat?.created_at || new Date().toISOString();
    const chatId = chat?.id ?? chat?._id;
    const candidateUser = chat?.prompt_text || chat?.content;
    const sysText = maybeSystemText(candidateUser);

    if (sysText) {
      records.push({
        id: `c-${chatId}-s`,
        leadId: String(leadId),
        serverId: chatId != null ? String(chatId) : null,
        side: 'center',
        msgType: 'system',
        content: sysText,
        status: 'seen',
        syncStatus: 'synced',
        createdAt,
      });
      return;
    }

    const rawUser =
      (chat?.prompt_text && String(chat.prompt_text)) ||
      (chat?.content && String(chat.content)) ||
      '';
    const promptFiles = extractChatFilesForSide(chat, 'right');

    if ((rawUser && !shouldHideHtmlBlob(rawUser)) || promptFiles.length > 0) {
      const userText = rawUser ? parseStructuredText(rawUser) : '';
      if (userText || promptFiles.length > 0) {
        records.push({
          id: `c-${chatId}-p`,
          leadId: String(leadId),
          serverId: chatId != null ? String(chatId) : null,
          side: 'right',
          msgType: 'chat',
          content: userText || '',
          files: promptFiles,
          status: '',
          syncStatus: 'synced',
          createdAt,
        });
      }
    }

    const responseSysText = maybeSystemText(chat?.response_text);
    if (responseSysText) {
      records.push({
        id: `c-${chatId}-rs`,
        leadId: String(leadId),
        serverId: chatId != null ? String(chatId) : null,
        side: 'center',
        msgType: 'system',
        content: responseSysText,
        status: 'seen',
        syncStatus: 'synced',
        createdAt,
      });
    } else {
      const responseText = parseStructuredText(chat?.response_text);
      const responseFiles = extractChatFilesForSide(chat, 'left');
      if (responseText || responseFiles.length > 0) {
        records.push({
          id: `c-${chatId}-r`,
          leadId: String(leadId),
          serverId: chatId != null ? String(chatId) : null,
          side: 'left',
          msgType: 'chat',
          content: responseText || '',
          files: responseFiles,
          status: 'seen',
          syncStatus: 'synced',
          createdAt,
        });
      }
    }
  });

  return records;
}

export function socketPayloadToMessageRecord(leadId, message) {
  if (!message || leadId == null) return null;

  const raw = typeof message.text === 'string' ? message.text : message.content || '';
  const text = parseStructuredText(raw, false) || parseStructuredText(raw, true);
  const files = normalizeChatFiles(message.files);
  if (!text && files.length === 0) return null;

  const createdAt = message.created_at || new Date().toISOString();
  const serverId = message.id != null ? String(message.id) : null;
  const isSystem = isSystemPayload(raw);

  return {
    id: serverId ? `srv-${serverId}` : `srv-${Date.now()}`,
    leadId: String(leadId),
    localId: message.local_id != null ? String(message.local_id) : null,
    serverId,
    side: isSystem ? 'center' : 'left',
    msgType: isSystem ? 'system' : 'chat',
    content: text || '',
    files,
    status: message.local_id ? 'delivered' : '',
    syncStatus: 'synced',
    createdAt,
  };
}

/** Map SQLite row to thread FlatList item */
export function toThreadListItem(row) {
  return {
    id: row.id,
    leadId: row.lead_id ?? row.leadId,
    side: row.side === 'center' ? undefined : row.side,
    type: row.msg_type === 'system' || row.side === 'center' ? 'system' : undefined,
    text: row.content ?? row.text,
    files: Array.isArray(row.files) ? row.files : [],
    time: formatMessageTime(row.created_at ?? row.createdAt),
    status: row.status,
    syncStatus: row.sync_status ?? row.syncStatus,
    localId: row.local_id ?? row.localId,
    createdAt: row.created_at ?? row.createdAt,
  };
}

export function dbRowToThreadListItem(row) {
  let files = [];
  if (row.files) {
    try {
      const parsed = JSON.parse(String(row.files));
      files = Array.isArray(parsed) ? parsed : [];
    } catch {
      files = [];
    }
  }

  return toThreadListItem({
    id: row.id,
    lead_id: row.lead_id,
    side: row.side,
    msg_type: row.msg_type,
    content: row.content,
    files,
    created_at: row.created_at,
    status: row.status,
    sync_status: row.sync_status,
    local_id: row.local_id,
  });
}
