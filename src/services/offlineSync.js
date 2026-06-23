import { getLeadById, getLeadsDataTable, sendChatMessage, sendChatMessageWithFile, uploadChatAttachment, createLeadNote } from '../api';
import { buildDefaultFileMessage, buildUploadNoteText, getFileKind } from '../utils/chatAttachments';
import { getDatabase } from '../database/db';
import {
  upsertLead,
  upsertLeads,
  getLeadById as getCachedLeadById,
  getAllLeads,
  clearLeads,
} from '../database/leadsCache';
import {
  upsertOutgoingMessage,
  updateMessageByLocalId,
  getPendingMessages,
  getMessagesForLead,
  replaceSyncedThreadMessages,
  upsertSocketMessage,
  countMessagesForLead,
  clearMessages,
} from '../database/messagesCache';
import { checkIsOnline, subscribeToNetwork } from '../utils/network';

let syncInProgress = false;
let unsubscribeNetwork = null;
let activeToken = null;
const pendingSyncedListeners = new Set();

export function onPendingMessageSynced(listener) {
  pendingSyncedListeners.add(listener);
  return () => pendingSyncedListeners.delete(listener);
}

function emitPendingMessageSynced(payload) {
  pendingSyncedListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      // ignore listener errors
    }
  });
}

export async function initOfflineDatabase() {
  await getDatabase();
}

export async function clearOfflineCache() {
  await clearMessages();
  await clearLeads();
}

export async function loadCachedLeads() {
  return getAllLeads();
}

export async function loadCachedLead(leadId) {
  return getCachedLeadById(leadId);
}

/** Load thread messages from SQLite immediately (offline-first display) */
export async function loadThreadMessages(leadId) {
  if (leadId == null) return [];

  const cachedLead = await getCachedLeadById(leadId);
  const existingCount = await countMessagesForLead(leadId);

  if (existingCount === 0 && cachedLead?.chats?.length) {
    await replaceSyncedThreadMessages(leadId, cachedLead.chats);
  }

  return getMessagesForLead(leadId);
}

/** Sync lead.chats from API into SQLite */
export async function syncThreadMessagesFromLead(leadId, chats = []) {
  if (leadId == null) return 0;
  return replaceSyncedThreadMessages(leadId, chats);
}

/** Persist socket message and return updated thread list */
export async function saveSocketMessageToCache(leadId, socketPayload) {
  if (leadId == null) return loadThreadMessages(leadId);
  await upsertSocketMessage(leadId, socketPayload);
  return getMessagesForLead(leadId);
}

export async function finalizeOutboundMessageStatus(localId, leadId) {
  await updateMessageByLocalId(localId, { status: '' });
  return getMessagesForLead(leadId);
}

/**
 * SQLite first, then refresh from API when online.
 * Returns { messages, lead, fromCache, syncing }
 */
export async function fetchThreadWithCache(token, leadId) {
  const messages = await loadThreadMessages(leadId);
  const cachedLead = await getCachedLeadById(leadId);

  const online = await checkIsOnline();
  if (!online || !token) {
    return {
      messages,
      lead: cachedLead,
      fromCache: true,
      online: false,
    };
  }

  try {
    const res = await getLeadById({ token, id: leadId });
    const lead = res?.data || res || {};
    if (lead && (lead.id || leadId)) {
      const normalizedLead = { ...lead, id: lead.id ?? leadId };
      await upsertLead(normalizedLead);
      if (Array.isArray(normalizedLead.chats)) {
        await syncThreadMessagesFromLead(leadId, normalizedLead.chats);
      }
      const freshMessages = await getMessagesForLead(leadId);
      return {
        messages: freshMessages,
        lead: normalizedLead,
        fromCache: false,
        online: true,
      };
    }
  } catch (error) {
    return {
      messages,
      lead: cachedLead,
      fromCache: true,
      online: false,
      error,
    };
  }

  return {
    messages,
    lead: cachedLead,
    fromCache: true,
    online: false,
  };
}

export async function fetchLeadsWithCache(token, options = {}) {
  const {
    pageIndex = 1,
    pageSize = 50,
    sort = { order: '', key: '' },
    query = '',
    filterData = { status: '' },
  } = options;

  const online = await checkIsOnline();

  if (online && token) {
    try {
      const response = await getLeadsDataTable({
        token,
        pageIndex,
        pageSize,
        sort,
        query,
        filterData,
      });
      const rows = response?.items || response?.data || response?.results || [];
      if (rows.length > 0) {
        await upsertLeads(rows);
        await Promise.all(
          rows
            .filter((row) => Array.isArray(row?.chats) && row.chats.length > 0)
            .map((row) => {
              const id = row.id ?? row._id;
              return syncThreadMessagesFromLead(id, row.chats).catch(() => 0);
            }),
        );
      }
      return { data: response, fromCache: false, online: true };
    } catch (error) {
      const cached = await getAllLeads();
      if (cached.length > 0) {
        return {
          data: { items: cached },
          fromCache: true,
          online: false,
          error,
        };
      }
      throw error;
    }
  }

  const cached = await getAllLeads();
  return {
    data: { items: cached },
    fromCache: true,
    online: false,
  };
}

export async function fetchLeadDetailWithCache(token, leadId) {
  if (leadId == null) return { lead: null, fromCache: false, messages: [] };

  const messages = await loadThreadMessages(leadId);
  const online = await checkIsOnline();

  if (online && token) {
    try {
      const res = await getLeadById({ token, id: leadId });
      const lead = res?.data || res || {};
      if (lead && (lead.id || leadId)) {
        const normalizedLead = { ...lead, id: lead.id ?? leadId };
        await upsertLead(normalizedLead);
        if (Array.isArray(normalizedLead.chats)) {
          await syncThreadMessagesFromLead(leadId, normalizedLead.chats);
        }
        return {
          lead: normalizedLead,
          messages: await getMessagesForLead(leadId),
          fromCache: false,
          online: true,
        };
      }
    } catch (error) {
      const cached = await getCachedLeadById(leadId);
      if (cached) {
        return { lead: cached, messages, fromCache: true, online: false, error };
      }
      throw error;
    }
  }

  const cached = await getCachedLeadById(leadId);
  return { lead: cached, messages, fromCache: true, online: false };
}

export async function sendChatMessageWithCache(token, { content, local_id, lead_id }) {
  const localId = local_id;
  const leadId = lead_id;

  await upsertOutgoingMessage({
    localId,
    leadId,
    content,
    status: 'sending',
    syncStatus: 'pending',
  });

  const online = await checkIsOnline();
  if (!online || !token) {
    await updateMessageByLocalId(localId, { status: 'sending', syncStatus: 'pending' });
    return { queued: true, offline: true, messages: await getMessagesForLead(leadId) };
  }

  try {
    const result = await sendChatMessage({ token, content, local_id: localId, lead_id: leadId });
    const serverId = result?.id ?? result?.data?.id ?? result?.message?.id ?? null;
    await updateMessageByLocalId(localId, {
      serverId,
      status: 'delivered',
      syncStatus: 'synced',
    });

    try {
      const refreshed = await getLeadById({ token, id: leadId });
      const lead = refreshed?.data || refreshed || {};
      if (lead && (lead.id || leadId)) {
        await upsertLead({ ...lead, id: lead.id ?? leadId });
      }
      if (Array.isArray(lead.chats) && lead.chats.length > 0) {
        await syncThreadMessagesFromLead(leadId, lead.chats);
      }
    } catch {
      // keep local sent message
    }

    return {
      queued: false,
      offline: false,
      result,
      messages: await getMessagesForLead(leadId),
    };
  } catch (error) {
    await updateMessageByLocalId(localId, { status: 'failed', syncStatus: 'pending' });
    throw error;
  }
}

export async function sendChatMessageWithFileWithCache(
  token,
  { content, local_id, lead_id, file, userName },
) {
  const localId = local_id;
  const leadId = lead_id;
  const messageContent = content?.trim() || buildDefaultFileMessage(file?.name);
  const optimisticFiles = file?.uri ? [{
    name: file.name,
    mime: file.type,
    size: file.size ?? null,
    url: file.uri,
    kind: getFileKind(file.type, file.name),
    local: true,
  }] : [];

  await upsertOutgoingMessage({
    localId,
    leadId,
    content: messageContent,
    files: optimisticFiles,
    status: 'sending',
    syncStatus: 'pending',
  });

  const online = await checkIsOnline();
  if (!online || !token) {
    await updateMessageByLocalId(localId, { status: 'sending', syncStatus: 'pending' });
    return { queued: true, offline: true, messages: await getMessagesForLead(leadId) };
  }

  try {
    const result = await sendChatMessageWithFile({
      token,
      content: messageContent,
      local_id: localId,
      lead_id: leadId,
      file,
    });
    const serverId = result?.id ?? result?.data?.id ?? result?.message?.id ?? null;
    await updateMessageByLocalId(localId, {
      serverId,
      status: 'delivered',
      syncStatus: 'synced',
    });

    if (serverId && file) {
      try {
        await uploadChatAttachment({ token, chatId: serverId, file });
      } catch (uploadError) {
        console.warn('[offlineSync] attachment upload failed:', uploadError?.message || uploadError);
      }

      try {
        const noteText = buildUploadNoteText({
          fileName: file.name,
          fileSize: file.size,
          userName,
        });
        await createLeadNote({
          token,
          payload: {
            leadId,
            content: noteText,
            note: noteText,
          },
        });
      } catch (noteError) {
        console.warn('[offlineSync] upload note failed:', noteError?.message || noteError);
      }
    }

    try {
      const refreshed = await getLeadById({ token, id: leadId });
      const lead = refreshed?.data || refreshed || {};
      if (lead && (lead.id || leadId)) {
        await upsertLead({ ...lead, id: lead.id ?? leadId });
      }
      if (Array.isArray(lead.chats) && lead.chats.length > 0) {
        await syncThreadMessagesFromLead(leadId, lead.chats);
      }
    } catch {
      // keep local sent message
    }

    return {
      queued: false,
      offline: false,
      result,
      messages: await getMessagesForLead(leadId),
    };
  } catch (error) {
    await updateMessageByLocalId(localId, { status: 'failed', syncStatus: 'pending' });
    throw error;
  }
}

export async function syncPendingMessages(token) {
  if (!token || syncInProgress) return { sent: 0, failed: 0 };

  const online = await checkIsOnline();
  if (!online) return { sent: 0, failed: 0, skipped: true };

  syncInProgress = true;
  let sent = 0;
  let failed = 0;

  try {
    const pending = await getPendingMessages();

    for (const message of pending) {
      const localId = message.localId;
      const leadId = message.leadId;
      if (!localId || leadId == null) continue;

      try {
        await updateMessageByLocalId(localId, { status: 'sending', syncStatus: 'pending' });
        const result = await sendChatMessage({
          token,
          content: message.text,
          local_id: localId,
          lead_id: leadId,
        });
        const serverId = result?.id ?? result?.data?.id ?? result?.message?.id ?? null;
        await updateMessageByLocalId(localId, {
          serverId,
          status: 'delivered',
          syncStatus: 'synced',
        });

        try {
          const refreshed = await getLeadById({ token, id: leadId });
          const lead = refreshed?.data || refreshed || {};
          if (lead && (lead.id || leadId)) {
            await upsertLead({ ...lead, id: lead.id ?? leadId });
          }
          if (Array.isArray(lead.chats) && lead.chats.length > 0) {
            await syncThreadMessagesFromLead(leadId, lead.chats);
          }
        } catch {
          // keep local state
        }

        sent += 1;
        emitPendingMessageSynced({ leadId, localId });
      } catch (error) {
        console.warn('[offlineSync] pending message send failed:', error?.message || error);
        await updateMessageByLocalId(localId, { status: 'failed', syncStatus: 'pending' });
        failed += 1;
      }
    }
  } finally {
    syncInProgress = false;
  }

  return { sent, failed };
}

export async function syncAll(token) {
  if (!token) return;

  const online = await checkIsOnline();
  if (!online) return;

  await syncPendingMessages(token);

  try {
    await fetchLeadsWithCache(token, { pageIndex: 1, pageSize: 50 });
  } catch {
    // keep cached leads
  }

  const pending = await getPendingMessages();
  const leadIds = [...new Set(pending.map((m) => m.leadId).filter(Boolean))];

  await Promise.all(
    leadIds.map((leadId) => fetchLeadDetailWithCache(token, leadId).catch(() => null)),
  );
}

export function startOfflineSync(token) {
  activeToken = token || null;

  if (unsubscribeNetwork) {
    unsubscribeNetwork();
    unsubscribeNetwork = null;
  }

  if (!token) return;

  unsubscribeNetwork = subscribeToNetwork(({ cameOnline }) => {
    if (cameOnline && activeToken) {
      syncAll(activeToken).catch(() => {});
      setTimeout(() => {
        if (activeToken) syncAll(activeToken).catch(() => {});
      }, 1500);
    }
  });

  checkIsOnline().then((online) => {
    if (online && activeToken) {
      syncAll(activeToken).catch(() => {});
    }
  });
}

export function stopOfflineSync() {
  activeToken = null;
  if (unsubscribeNetwork) {
    unsubscribeNetwork();
    unsubscribeNetwork = null;
  }
}
