import { executeSql, queryAll, queryOne } from './db';

function leadIdOf(lead) {
  const id = lead?.id ?? lead?._id;
  return id != null ? String(id) : null;
}

export async function upsertLead(lead) {
  const id = leadIdOf(lead);
  if (!id) return null;

  const now = Date.now();
  await executeSql(
    `INSERT OR REPLACE INTO leads (id, data, updated_at) VALUES (?, ?, ?);`,
    [id, JSON.stringify(lead), now],
  );
  return id;
}

export async function upsertLeads(leads = []) {
  if (!Array.isArray(leads) || leads.length === 0) return 0;

  for (const lead of leads) {
    await upsertLead(lead);
  }

  return leads.length;
}

export async function getLeadById(id) {
  if (id == null) return null;
  const row = await queryOne('SELECT data FROM leads WHERE id = ? LIMIT 1;', [String(id)]);
  if (!row?.data) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

export async function getAllLeads() {
  const rows = await queryAll('SELECT data FROM leads ORDER BY updated_at DESC;');
  return rows
    .map((row) => {
      try {
        return JSON.parse(row.data);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export async function clearLeads() {
  await executeSql('DELETE FROM leads;');
}
