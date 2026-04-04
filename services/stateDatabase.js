const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { getAgentsDataPath } = require("./runtimePaths");

const DATA_DIR = getAgentsDataPath();
const DB_PATH = getAgentsDataPath("console.sqlite");

let database = null;
let bootstrappedLegacyDocuments = null;
const DOCUMENT_SCHEMA_VERSION = 1;

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function extractLegacyDocuments() {
  if (!fs.existsSync(DB_PATH)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const documents = parsed && typeof parsed === "object" && parsed.documents && typeof parsed.documents === "object"
      ? parsed.documents
      : null;

    if (!documents) {
      return null;
    }

    fs.unlinkSync(DB_PATH);
    return documents;
  } catch {
    return null;
  }
}

function openDatabase() {
  if (database) {
    return database;
  }

  ensureDataDir();
  bootstrappedLegacyDocuments = extractLegacyDocuments();
  database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS schema_metadata (
      name TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS documents (
      key TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  ensureSchemaMetadata(database);
  migrateLegacyJsonDatabase(database);
  return database;
}

function ensureSchemaMetadata(db) {
  db.prepare(`
    INSERT INTO schema_metadata (name, version, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      version = excluded.version,
      updated_at = excluded.updated_at
  `).run("documents", DOCUMENT_SCHEMA_VERSION, new Date().toISOString());
}

function migrateLegacyJsonDatabase(db) {
  const documents = bootstrappedLegacyDocuments;
  bootstrappedLegacyDocuments = null;

  if (!documents) {
    return;
  }

  try {
    const insert = db.prepare(`
      INSERT INTO documents (key, payload, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        payload = excluded.payload,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
    `);

    for (const [key, record] of Object.entries(documents)) {
      if (!record || typeof record !== "object" || !record.payload) {
        continue;
      }

      insert.run(
        String(key),
        String(record.payload),
        record.created_at || new Date().toISOString(),
        record.updated_at || new Date().toISOString(),
      );
    }
  } catch {
    return;
  }
}

function readRecord(key) {
  const row = openDatabase()
    .prepare("SELECT payload, created_at, updated_at FROM documents WHERE key = ?")
    .get(String(key));

  if (!row || !row.payload) {
    return null;
  }

  return row;
}

function writeRecord(key, payload, createdAt, updatedAt) {
  openDatabase()
    .prepare(`
      INSERT INTO documents (key, payload, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        payload = excluded.payload,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
    `)
    .run(String(key), String(payload), createdAt, updatedAt);
}

function writeLegacyJson(filePath, value) {
  if (!filePath) {
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function readLegacyJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadDocument(key, createDefault, options = {}) {
  const record = readRecord(key);

  if (record && record.payload) {
    return JSON.parse(record.payload);
  }

  let initial = null;
  try {
    initial = readLegacyJson(options.legacyPath);
  } catch {}

  if (!initial) {
    initial = typeof createDefault === "function" ? createDefault() : createDefault;
  }

  return saveDocument(key, initial, options);
}

function saveDocument(key, value, options = {}) {
  const existing = readRecord(key);

  const now = new Date().toISOString();
  const normalized = {
    ...(value || {}),
    createdAt: value?.createdAt || existing?.created_at || now,
    updatedAt: now,
  };

  writeRecord(key, JSON.stringify(normalized), normalized.createdAt, normalized.updatedAt);
  writeLegacyJson(options.legacyPath, normalized);
  return normalized;
}

function getDatabasePath() {
  return DB_PATH;
}

function closeDatabase() {
  if (database) {
    database.close();
    database = null;
  }
  bootstrappedLegacyDocuments = null;
}

module.exports = {
  loadDocument,
  saveDocument,
  getDatabasePath,
  closeDatabase,
};
