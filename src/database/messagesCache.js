import { executeSql, queryAll, queryOne } from './db';
import {
  chatsToMessageRecords,
  dbRowToThreadListItem,
  socketPayloadToMessageRecord,
} from '../utils/chatMessageParser';

function serializeFiles(files) {
  if (!files) return null;
  try {
    return JSON.stringify(files);
  } catch {
    return null;
  }
}

function deserializeFiles(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildLocalMessageId(localId) {
  return `m-${localId}`;
}

export function toUiMessage(row) {
  return dbRowToThreadListItem(row);
}

export async function countMessagesForLead(leadId) {
  if (leadId == null) return 0;
  const row = await queryOne(
    'SELECT COUNT(*) AS total FROM messages WHERE lead_id = ?;',
    [String(leadId)],
  );
  return Number(row?.total || 0);
}

export async function upsertMessage({
  id,
  leadId,
  localId = null,
  serverId = null,
  side = 'right',
  msgType = 'chat',
  content,
  files = null,
  status = 'seen',
  syncStatus = 'synced',
  createdAt = new Date().toISOString(),
}) {
  if (!id || !leadId || content == null) return null;

  const now = Date.now();
  const filesJson = serializeFiles(files);
  await executeSql(
    `INSERT OR REPLACE INTO messages
      (id, lead_id, local_id, server_id, side, msg_type, content, files, status, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      String(id),
      String(leadId),
      localId != null ? String(localId) : null,
      serverId != null ? String(serverId) : null,
      side,
      msgType,
      String(content),
      filesJson,
      status,
      syncStatus,
      createdAt,
      now,
    ],
  );
  return id;
}

export async function upsertOutgoingMessage({
  localId,
  leadId,
  content,
  files = null,
  status = 'sending',
  syncStatus = 'pending',
}) {
  return upsertMessage({
    id: buildLocalMessageId(localId),
    leadId,
    localId,
    side: 'right',
    msgType: 'chat',
    content,
    files,
    status,
    syncStatus,
    createdAt: new Date().toISOString(),
  });
}

export async function upsertSocketMessage(leadId, socketPayload) {
  const record = socketPayloadToMessageRecord(leadId, socketPayload);
  if (!record) return null;

  if (record.localId) {
    const localRowId = buildLocalMessageId(record.localId);
    const existing = await queryOne('SELECT id FROM messages WHERE id = ? LIMIT 1;', [localRowId]);
    if (existing) {
      await executeSql(
        `UPDATE messages
         SET server_id = ?, status = ?, sync_status = 'synced', content = ?, files = ?, updated_at = ?, created_at = ?
         WHERE id = ?;`,
        [
          record.serverId,
          '',
          record.content,
          serializeFiles(record.files),
          Date.now(),
          record.createdAt,
          localRowId,
        ],
      );
      return localRowId;
    }
  }

  return upsertMessage(record);
}

/** Remove local outbox rows once the same chat exists on the server */
async function pruneMergedLocalOutbox(leadId, chats = []) {
  const leadKey = String(leadId);
  const serverChatIds = new Set(
    chats.map((chat) => String(chat?.id ?? chat?._id)).filter(Boolean),
  );
  if (serverChatIds.size === 0) return;

  const localRows = await queryAll(
    `SELECT id, server_id FROM messages WHERE lead_id = ? AND id LIKE 'm-%';`,
    [leadKey],
  );

  for (const row of localRows) {
    if (row.server_id && serverChatIds.has(String(row.server_id))) {
      await executeSql('DELETE FROM messages WHERE id = ?;', [row.id]);
    }
  }
}

/** Replace server-synced messages from API while keeping pending outbound queue */
export async function replaceSyncedThreadMessages(leadId, chats = []) {
  if (leadId == null) return 0;

  const leadKey = String(leadId);

  await executeSql(
    `DELETE FROM messages
     WHERE lead_id = ?
       AND sync_status = 'synced'
       AND (id LIKE 'c-%' OR id LIKE 'srv-%');`,
    [leadKey],
  );

  const records = chatsToMessageRecords(leadId, chats);
  for (const record of records) {
    await upsertMessage(record);
  }

  await pruneMergedLocalOutbox(leadId, chats);

  return records.length;
}

export async function updateMessageByLocalId(localId, patch = {}) {
  const id = buildLocalMessageId(localId);
  const row = await queryOne('SELECT * FROM messages WHERE id = ? LIMIT 1;', [id]);
  if (!row) return null;

  const next = {
    serverId: patch.serverId ?? row.server_id,
    status: patch.status ?? row.status,
    syncStatus: patch.syncStatus ?? row.sync_status,
    content: patch.content ?? row.content,
  };

  await executeSql(
    `UPDATE messages
     SET server_id = ?, status = ?, sync_status = ?, content = ?, updated_at = ?
     WHERE id = ?;`,
    [
      next.serverId != null ? String(next.serverId) : null,
      next.status,
      next.syncStatus,
      next.content,
      Date.now(),
      id,
    ],
  );
  return id;
}

export async function getMessagesForLead(leadId) {
  if (leadId == null) return [];
  const rows = await queryAll(
    `SELECT * FROM messages WHERE lead_id = ? ORDER BY datetime(created_at) ASC, updated_at ASC;`,
    [String(leadId)],
  );
  return rows.map(toUiMessage);
}

export async function getPendingMessages() {
  const rows = await queryAll(
    `SELECT * FROM messages WHERE sync_status = 'pending' ORDER BY datetime(created_at) ASC;`,
  );
  return rows.map(toUiMessage);
}

export async function getPendingMessagesForLead(leadId) {
  const rows = await queryAll(
    `SELECT * FROM messages WHERE lead_id = ? AND sync_status = 'pending' ORDER BY datetime(created_at) ASC;`,
    [String(leadId)],
  );
  return rows.map(toUiMessage);
}

export async function clearMessages() {
  await executeSql('DELETE FROM messages;');
}

export async function clearMessagesForLead(leadId) {
  if (leadId == null) return;
  await executeSql('DELETE FROM messages WHERE lead_id = ?;', [String(leadId)]);
}
