#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

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

function copyIfPresent(sourcePath, destinationPath) {
  if (!fs.existsSync(sourcePath)) {
    return { copied: false, sourcePath, destinationPath };
  }

  ensureParent(destinationPath);
  fs.copyFileSync(sourcePath, destinationPath);
  return { copied: true, sourcePath, destinationPath };
}

const backupRoot = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(process.cwd(), "backups", new Date().toISOString().replaceAll(":", "-"));

fs.mkdirSync(backupRoot, { recursive: true });

const files = [
  {
    label: "workspace",
    source: getWorkspaceDatabasePath(),
    target: path.join(backupRoot, "workspace.sqlite"),
    required: getStorageDriver() === "sqlite",
  },
  {
    label: "agents",
    source: getAgentsDatabasePath(),
    target: path.join(backupRoot, "agents-console.sqlite"),
    required: true,
  },
];

const results = files.map((file) => ({
  label: file.label,
  required: file.required,
  ...copyIfPresent(file.source, file.target),
}));
const ok = results.every((item) => item.copied || !item.required);

fs.writeFileSync(
  path.join(backupRoot, "backup-manifest.json"),
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || "development",
      storageDriver: getStorageDriver(),
      files: results.map((item) => ({
        label: item.label,
        required: item.required,
        sourcePath: item.sourcePath,
        destinationPath: item.destinationPath,
        copied: item.copied,
      })),
    },
    null,
    2,
  ),
);

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
