#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

function getBackupRoot() {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: node scripts/verify-sqlite-backup.cjs <backup-directory>");
    process.exit(1);
  }

  return path.resolve(process.cwd(), target);
}

function checkDatabase(filePath, expectedSchemaName) {
  if (!fs.existsSync(filePath)) {
    return {
      ok: false,
      filePath,
      error: "missing backup file",
    };
  }

  let database;
  try {
    database = new Database(filePath, { readonly: true, fileMustExist: true });
    const integrity = database.pragma("integrity_check", { simple: true });
    const schemaMetadataTable = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_metadata'")
      .get();
    const expectedTableName = expectedSchemaName === "workspace_documents" ? "workspace_documents" : "documents";
    const expectedTable = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(expectedTableName);

    let schemaRow = null;
    if (schemaMetadataTable) {
      schemaRow =
        database
          .prepare("SELECT version, updated_at FROM schema_metadata WHERE name = ?")
          .get(expectedSchemaName) || null;
    }

    return {
      ok: integrity === "ok" && Boolean(expectedTable),
      filePath,
      integrity,
      schema: schemaRow,
      schemaMetadataPresent: Boolean(schemaMetadataTable),
      expectedTablePresent: Boolean(expectedTable),
    };
  } catch (error) {
    return {
      ok: false,
      filePath,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (database) {
      database.close();
    }
  }
}

const backupRoot = getBackupRoot();
const checks = [
  {
    label: "workspace",
    filePath: path.join(backupRoot, "workspace.sqlite"),
    expectedSchemaName: "workspace_documents",
    optional: true,
  },
  {
    label: "agents",
    filePath: path.join(backupRoot, "agents-console.sqlite"),
    expectedSchemaName: "documents",
    optional: false,
  },
];

const results = checks.map((check) => {
  const result = checkDatabase(check.filePath, check.expectedSchemaName);
  if (check.optional && result.error === "missing backup file") {
    return {
      label: check.label,
      optional: true,
      skipped: true,
      ...result,
      ok: true,
    };
  }

  return {
    label: check.label,
    optional: check.optional,
    skipped: false,
    ...result,
  };
});

const ok = results.every((result) => result.ok);

console.log(
  JSON.stringify(
    {
      ok,
      backupRoot,
      files: results,
    },
    null,
    2,
  ),
);

if (!ok) {
  process.exit(1);
}
