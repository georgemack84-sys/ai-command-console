import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getStorageDriver, getWorkspaceDatabasePath } from "@/src/lib/server/runtime";

type StatementResult = { value?: string; created_at?: string };

let database: Database | null = null;
const WORKSPACE_SCHEMA_VERSION = 1;

function ensureSchemaMetadata(databaseHandle: Database) {
  databaseHandle.exec(`
    CREATE TABLE IF NOT EXISTS schema_metadata (
      name TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  databaseHandle
    .prepare(
      `
        INSERT INTO schema_metadata (name, version, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET
          version = excluded.version,
          updated_at = excluded.updated_at
      `,
    )
    .run("workspace_documents", WORKSPACE_SCHEMA_VERSION, new Date().toISOString());
}

function ensureDatabase() {
  if (database) {
    return database;
  }

  const databasePath = getWorkspaceDatabasePath();
  mkdirSync(path.dirname(databasePath), { recursive: true });

  const next = new Database(databasePath);
  next.pragma("journal_mode = WAL");
  next.exec(`
    CREATE TABLE IF NOT EXISTS workspace_documents (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  ensureSchemaMetadata(next);
  database = next;
  return next;
}

export function readWorkspaceDocument<T>(key: string) {
  if (getStorageDriver() !== "sqlite") {
    return undefined;
  }

  const row = ensureDatabase()
    .prepare("SELECT value FROM workspace_documents WHERE key = ?")
    .get(String(key)) as StatementResult | undefined;

  if (!row?.value) {
    return undefined;
  }

  return JSON.parse(row.value) as T;
}

export function writeWorkspaceDocument<T>(key: string, value: T) {
  if (getStorageDriver() !== "sqlite") {
    return;
  }

  const databaseHandle = ensureDatabase();
  const now = new Date().toISOString();
  const existing = databaseHandle
    .prepare("SELECT created_at FROM workspace_documents WHERE key = ?")
    .get(String(key)) as StatementResult | undefined;

  databaseHandle
    .prepare(
      `
        INSERT INTO workspace_documents (key, value, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `,
    )
    .run(String(key), JSON.stringify(value), existing?.created_at || now, now);
}
