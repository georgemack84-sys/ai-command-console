import path from "node:path";

export type StorageDriver = "json" | "sqlite";

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function getStorageDriver(): StorageDriver {
  const configured = readEnv("AI_COMMAND_CONSOLE_STORAGE_DRIVER").toLowerCase();
  if (configured === "json" || configured === "sqlite") {
    return configured;
  }

  return isProductionRuntime() ? "sqlite" : "json";
}

export function getWorkspaceDataRoot() {
  return readEnv("AI_COMMAND_CONSOLE_DATA_ROOT") || path.join(process.cwd(), "data");
}

export function getWorkspaceDataPath(...segments: string[]) {
  return path.join(getWorkspaceDataRoot(), ...segments);
}

export function getAgentsDataPath(...segments: string[]) {
  return path.join(getWorkspaceDataRoot(), "agents", ...segments);
}

export function getWorkspaceDatabasePath() {
  return readEnv("AI_COMMAND_CONSOLE_DATABASE_PATH") || getWorkspaceDataPath("workspace.sqlite");
}

export function getAgentsDatabasePath() {
  return readEnv("AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH") || getAgentsDataPath("console.sqlite");
}

export function areSecureCookiesEnabled() {
  const configured = readEnv("AI_COMMAND_CONSOLE_SECURE_COOKIES").toLowerCase();
  if (configured === "true" || configured === "1" || configured === "yes") {
    return true;
  }
  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }

  return isProductionRuntime();
}

export function getSessionMaxAgeSeconds() {
  const configured = Number(readEnv("AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS"));
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : 60 * 60 * 24 * 14;
}

export function getAuthSecret() {
  const configured = readEnv("AI_COMMAND_CONSOLE_AUTH_SECRET");
  if (configured) {
    return configured;
  }

  if (isProductionRuntime()) {
    throw new Error("AI_COMMAND_CONSOLE_AUTH_SECRET must be configured in production.");
  }

  return "ai-command-console-dev-only-secret";
}

export function getRuntimePosture() {
  return {
    environment: process.env.NODE_ENV || "development",
    storageDriver: getStorageDriver(),
    authSecretConfigured: Boolean(readEnv("AI_COMMAND_CONSOLE_AUTH_SECRET")),
    secureCookies: areSecureCookiesEnabled(),
    sessionMaxAgeSeconds: getSessionMaxAgeSeconds(),
  };
}
