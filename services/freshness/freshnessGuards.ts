import type { FreshnessError } from "@/types/freshness";

const FORBIDDEN_METADATA_KEYS = [
  "schedulerId",
  "queueId",
  "workerId",
  "runtimeHandle",
  "dispatchId",
  "retryLoop",
  "autoRefresh",
  "autoRevalidate",
  "resumeToken",
  "pauseToken",
  "executionHandle",
];

const READ_ONLY_TOKENS = [
  "dispatch(",
  "setTimeout(",
  "setInterval(",
  "retryLoop",
  "autoRefresh",
  "autoRevalidate",
  "resume(",
  "pause(",
  "schedulerId",
  "workerId",
  "runtimeHandle",
];

export function createFreshnessError(code: FreshnessError["code"], message: string, path: string): FreshnessError {
  return Object.freeze({ code, message, path });
}

export function guardFreshnessMetadata(metadata?: Readonly<Record<string, unknown>>): readonly FreshnessError[] {
  const errors: FreshnessError[] = [];
  for (const key of Object.keys(metadata ?? {})) {
    if (FORBIDDEN_METADATA_KEYS.includes(key)) {
      errors.push(createFreshnessError(
        key === "schedulerId" ? "FRESHNESS_SCHEDULING_REJECTED"
        : key === "retryLoop" ? "FRESHNESS_RETRY_REJECTED"
        : key === "autoRefresh" || key === "autoRevalidate" ? "AUTO_REVALIDATION_FORBIDDEN"
        : key === "pauseToken" || key === "resumeToken" ? "FRESHNESS_PAUSE_RESUME_REJECTED"
        : key === "dispatchId" ? "FRESHNESS_ORCHESTRATION_LEAK_REJECTED"
        : "FRESHNESS_EXECUTION_LEAK_REJECTED",
        `Forbidden freshness metadata detected: ${key}.`,
        `metadata.${key}`,
      ));
    }
  }
  return Object.freeze(errors);
}

export function assertFreshnessSourcesAreReadOnly(source: string): readonly string[] {
  return Object.freeze(
    READ_ONLY_TOKENS.filter((token) => source.includes(token)).map((token) => `forbidden token detected: ${token}`),
  );
}
