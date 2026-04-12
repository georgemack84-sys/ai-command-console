#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { checkLegacyState } = require("./check-legacy-state.cjs");

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

function getAgentsDatabasePath() {
  return readEnv("AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH") || path.join(process.cwd(), "data", "agents", "console.sqlite");
}

function areSecureCookiesEnabled() {
  const configured = readEnv("AI_COMMAND_CONSOLE_SECURE_COOKIES").toLowerCase();
  if (configured === "true" || configured === "1" || configured === "yes") {
    return true;
  }
  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }
  return isProductionRuntime();
}

function canWriteDirectory(targetPath) {
  try {
    fs.mkdirSync(targetPath, { recursive: true });
    fs.accessSync(targetPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function checkWritableFilePath(targetPath) {
  const directory = path.dirname(targetPath);
  const writable = canWriteDirectory(directory);
  return {
    path: targetPath,
    directory,
    ok: writable,
  };
}

function runPreflight() {
  const problems = [];
  const warnings = [];
  const storageDriver = getStorageDriver();
  const authSecretConfigured = Boolean(readEnv("AI_COMMAND_CONSOLE_AUTH_SECRET"));
  const secureCookies = areSecureCookiesEnabled();
  const workspaceDatabase = checkWritableFilePath(getWorkspaceDatabasePath());
  const agentsDatabase = checkWritableFilePath(getAgentsDatabasePath());
  const logsDirectory = canWriteDirectory(path.join(process.cwd(), "logs"));
  const alertWebhookUrl = readEnv("AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL");
  const legacyState = checkLegacyState({ projectRoot: process.cwd() });
  const strictLegacyStateGuard = process.env.CI === "true";

  if (isProductionRuntime() && !authSecretConfigured) {
    problems.push("AI_COMMAND_CONSOLE_AUTH_SECRET must be configured in production.");
  }

  if (isProductionRuntime() && !secureCookies) {
    problems.push("AI_COMMAND_CONSOLE_SECURE_COOKIES must remain enabled in production.");
  }

  if (storageDriver === "sqlite" && !workspaceDatabase.ok) {
    problems.push(`Workspace database directory is not writable: ${workspaceDatabase.directory}`);
  }

  if (!agentsDatabase.ok) {
    problems.push(`Agents database directory is not writable: ${agentsDatabase.directory}`);
  }

  if (!logsDirectory) {
    problems.push(`Logs directory is not writable: ${path.join(process.cwd(), "logs")}`);
  }

  if (!legacyState.ok) {
    const details =
      legacyState.reason === "git_error"
        ? `Unable to inspect git status for legacy residue: ${legacyState.error}`
        : `Known runtime residue is dirty in tracked legacy paths: ${legacyState.offending
            .map((entry) => entry.relativePath)
            .join(", ")}`;

    if (strictLegacyStateGuard) {
      problems.push(details);
    } else {
      warnings.push(`${details} Run npm run dev:state-report for details.`);
    }
  }

  if (!isProductionRuntime() && !authSecretConfigured) {
    warnings.push("AI_COMMAND_CONSOLE_AUTH_SECRET is not configured; development fallback secret will be used.");
  }

  if (isProductionRuntime() && !alertWebhookUrl) {
    warnings.push("AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL is not configured; critical runtime alerts will remain in-app only.");
  }

  return {
    ok: problems.length === 0,
    checkedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    storageDriver,
    checks: {
      authSecretConfigured,
      secureCookies,
      workspaceDatabase,
      agentsDatabase,
      logsDirectory: {
        path: path.join(process.cwd(), "logs"),
        ok: logsDirectory,
      },
      legacyState: {
        ok: legacyState.ok,
        reason: legacyState.reason,
        offendingEntries: legacyState.offending.map((entry) => entry.relativePath),
        otherDirtyEntries: legacyState.other.map((entry) => entry.relativePath),
      },
      alertWebhookConfigured: Boolean(alertWebhookUrl),
    },
    warnings,
    problems,
  };
}

const report = runPreflight();
const output = JSON.stringify(report, null, 2);

if (!report.ok) {
  console.error(output);
  process.exit(1);
}

console.log(output);
