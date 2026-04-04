const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

let database = null;

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function getStorageDriver() {
  const configured = readEnv("AI_COMMAND_CONSOLE_STORAGE_DRIVER").toLowerCase();
  if (configured === "json" || configured === "sqlite") {
    return configured;
  }
  return isProductionRuntime() ? "sqlite" : "json";
}

function getWorkspaceDatabasePath() {
  return readEnv("AI_COMMAND_CONSOLE_DATABASE_PATH") || path.join(process.cwd(), "data", "workspace.sqlite");
}

function ensureDatabase() {
  if (database) {
    return database;
  }

  const databasePath = getWorkspaceDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS workspace_documents (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return database;
}

function readLegacyJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeLegacyJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function loadWorkspaceDocument(key, createDefault, options = {}) {
  const driver = getStorageDriver();
  if (driver === "sqlite") {
    const row = ensureDatabase()
      .prepare("SELECT value FROM workspace_documents WHERE key = ?")
      .get(String(key));

    if (row && row.value) {
      return JSON.parse(row.value);
    }
  }

  const fallback = typeof createDefault === "function" ? createDefault() : createDefault;
  const initial = options.legacyPath ? readLegacyJson(options.legacyPath, fallback) : fallback;

  if (driver === "sqlite") {
    saveWorkspaceDocument(key, initial, options);
  }

  return initial;
}

function saveWorkspaceDocument(key, value, options = {}) {
  const driver = getStorageDriver();
  if (driver === "sqlite") {
    const now = new Date().toISOString();
    const existing = ensureDatabase()
      .prepare("SELECT created_at FROM workspace_documents WHERE key = ?")
      .get(String(key));

    ensureDatabase()
      .prepare(`
        INSERT INTO workspace_documents (key, value, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `)
      .run(String(key), JSON.stringify(value), existing?.created_at || now, now);
  }

  if (options.legacyPath) {
    writeLegacyJson(options.legacyPath, value);
  }

  return value;
}

module.exports = {
  loadWorkspaceDocument,
  saveWorkspaceDocument,
  getWorkspaceDatabasePath,
  getStorageDriver,
};
