import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(__DEV__);
SQLite.enablePromise(true);

const DB_NAME = 'redidial.db';
const DB_VERSION = 1;

let dbPromise = null;

async function runMigrations(db) {
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      lead_id TEXT NOT NULL,
      local_id TEXT,
      server_id TEXT,
      side TEXT NOT NULL,
      msg_type TEXT NOT NULL DEFAULT 'chat',
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'seen',
      sync_status TEXT NOT NULL DEFAULT 'synced',
      created_at TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
  `);

  await db.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_messages_sync_status ON messages(sync_status);
  `);

  try {
    await db.executeSql('ALTER TABLE messages ADD COLUMN files TEXT;');
  } catch {
    // column already exists
  }

  await db.executeSql(
    'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?);',
    ['schema_version', String(DB_VERSION)],
  );
}

export async function getDatabase() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabase({
      name: DB_NAME,
      location: 'default',
    }).then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }
  return dbPromise;
}

export async function closeDatabase() {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.close();
  dbPromise = null;
}

export async function executeSql(sql, params = []) {
  const db = await getDatabase();
  const [result] = await db.executeSql(sql, params);
  return result;
}

export async function queryAll(sql, params = []) {
  const result = await executeSql(sql, params);
  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows[0] || null;
}
