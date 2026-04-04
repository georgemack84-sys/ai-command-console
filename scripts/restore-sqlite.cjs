#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function getWorkspaceDatabasePath() {
  return readEnv("AI_COMMAND_CONSOLE_DATABASE_PATH") || path.join(process.cwd(), "data", "workspace.sqlite");
}

function getAgentsDatabasePath() {
  return readEnv("AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH") || path.join(process.cwd(), "data", "agents", "console.sqlite");
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

function ensureParent(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

function verifyBackupDatabase(filePath) {
  const database = new Database(filePath, { readonly: true, fileMustExist: true });
  try {
    const integrity = database.pragma("integrity_check", { simple: true });
    if (integrity !== "ok") {
      throw new Error(`Integrity check failed for ${filePath}: ${integrity}`);
    }
  } finally {
    database.close();
  }
}

const backupRoot = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : "";

if (!backupRoot) {
  console.error("Usage: node scripts/restore-sqlite.cjs <backup-directory>");
  process.exit(1);
}

const restorePlan = [
  {
    label: "workspace",
    source: path.join(backupRoot, "workspace.sqlite"),
    target: getWorkspaceDatabasePath(),
    required: getStorageDriver() === "sqlite",
  },
  {
    label: "agents",
    source: path.join(backupRoot, "agents-console.sqlite"),
    target: getAgentsDatabasePath(),
    required: true,
  },
];

for (const item of restorePlan) {
  if (!fs.existsSync(item.source)) {
    if (item.required) {
      console.error(`Missing backup file for ${item.label}: ${item.source}`);
      process.exit(1);
    }

    continue;
  }

  verifyBackupDatabase(item.source);
}

for (const item of restorePlan) {
  if (!fs.existsSync(item.source)) {
    continue;
  }

  ensureParent(item.target);
  fs.copyFileSync(item.source, item.target);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      restoredFrom: backupRoot,
      files: restorePlan,
    },
    null,
    2,
  ),
);
