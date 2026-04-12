import path from "node:path";
import {
  aiSummaryEvaluationsEnabled,
  aiSummaryAllowsMockFallback,
  env,
  getAiSummaryDailyBudgetUsd,
  getAiSummaryEstimatedCostPerRunUsd,
  getAiSummaryMaxAttempts,
  getAiSummaryTimeoutMs,
  getJobQueueMaxPending,
  getJobQueueMaxRunning,
  getJobWorkerPollIntervalMs,
  getSessionMaxAgeSeconds,
  isProduction,
  secureCookiesEnabled,
  writeLegacyJsonMirrorsEnabled,
} from "@/src/config/env";

export type StorageDriver = "json" | "sqlite";

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function isProductionRuntime() {
  return isProduction();
}

export function getStorageDriver(): StorageDriver {
  const configured = readEnv("AI_COMMAND_CONSOLE_STORAGE_DRIVER").toLowerCase();
  if (configured === "json" || configured === "sqlite") {
    return configured;
  }
  return isProduction() ? "sqlite" : "json";
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

export function getRuntimeLogPath(...segments: string[]) {
  return path.join(getWorkspaceDataRoot(), "logs", ...segments);
}

export function getRuntimeMemoryPath(...segments: string[]) {
  return path.join(getWorkspaceDataRoot(), "memory", ...segments);
}

export function getWorkspaceDatabasePath() {
  return readEnv("AI_COMMAND_CONSOLE_DATABASE_PATH") || getWorkspaceDataPath("workspace.sqlite");
}

export function getAgentsDatabasePath() {
  return readEnv("AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH") || getAgentsDataPath("console.sqlite");
}

export function shouldWriteLegacyJsonMirrors() {
  return writeLegacyJsonMirrorsEnabled();
}

export function areSecureCookiesEnabled() {
  return secureCookiesEnabled();
}

export { getSessionMaxAgeSeconds };

export function getAuthSecret() {
  return env.AI_COMMAND_CONSOLE_AUTH_SECRET;
}

export function getRuntimePosture() {
  const memoryUsage = process.memoryUsage();

  return {
    environment: env.NODE_ENV,
    storageDriver: getStorageDriver(),
    writeLegacyJsonMirrors: shouldWriteLegacyJsonMirrors(),
    authSecretConfigured: Boolean(env.AI_COMMAND_CONSOLE_AUTH_SECRET),
    secureCookies: secureCookiesEnabled(),
    sessionMaxAgeSeconds: getSessionMaxAgeSeconds(),
    databaseUrlConfigured: Boolean(env.DATABASE_URL),
    aiSummary: {
      providerMode: env.AI_SUMMARY_PROVIDER_MODE,
      model: env.AI_SUMMARY_MODEL,
      timeoutMs: getAiSummaryTimeoutMs(),
      maxAttempts: getAiSummaryMaxAttempts(),
      allowMockFallback: aiSummaryAllowsMockFallback(),
      openAiConfigured: Boolean(env.OPENAI_API_KEY),
      dailyBudgetUsd: getAiSummaryDailyBudgetUsd(),
      estimatedCostPerRunUsd: getAiSummaryEstimatedCostPerRunUsd(),
      evaluationsEnabled: aiSummaryEvaluationsEnabled(),
    },
    jobs: {
      executionMode: env.JOB_QUEUE_EXECUTION_MODE,
      workerPollIntervalMs: getJobWorkerPollIntervalMs(),
      maxPendingJobs: getJobQueueMaxPending(),
      maxRunningJobs: getJobQueueMaxRunning(),
      externalWorkerRecommended: env.JOB_QUEUE_EXECUTION_MODE !== "external",
    },
    process: {
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        externalMb: Math.round(memoryUsage.external / 1024 / 1024),
      },
    },
  };
}
