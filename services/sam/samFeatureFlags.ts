import type { SamFeatureFlags } from "./samTypes";

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value === "") {
    return defaultValue;
  }
  return String(value).trim().toLowerCase() === "true";
}

export function loadSamFeatureFlags(overrides: Partial<SamFeatureFlags> = {}): SamFeatureFlags {
  return {
    enabled: overrides.enabled ?? parseBoolean(process.env.SAM_ENABLED, false),
    dryRun: overrides.dryRun ?? parseBoolean(process.env.SAM_DRY_RUN, true),
    requireApproval: overrides.requireApproval ?? parseBoolean(process.env.SAM_REQUIRE_APPROVAL, true),
    interceptLegacyExecution:
      overrides.interceptLegacyExecution ?? parseBoolean(process.env.SAM_INTERCEPT_LEGACY_EXECUTION, false),
    enableAutoApproval: overrides.enableAutoApproval ?? parseBoolean(process.env.SAM_ENABLE_AUTO_APPROVAL, false),
    realExecutionEnabled: false,
    safeMode: true,
    samIdempotencyEnabled: overrides.samIdempotencyEnabled ?? parseBoolean(process.env.SAM_IDEMPOTENCY_ENABLED, true),
    samRetrySafetyEnabled: overrides.samRetrySafetyEnabled ?? parseBoolean(process.env.SAM_RETRY_SAFETY_ENABLED, true),
    samAuditDeduplicationEnabled:
      overrides.samAuditDeduplicationEnabled ?? parseBoolean(process.env.SAM_AUDIT_DEDUPLICATION_ENABLED, true),
    samDurableIdempotencyEnabled:
      overrides.samDurableIdempotencyEnabled ?? parseBoolean(process.env.SAM_DURABLE_IDEMPOTENCY_ENABLED, false),
  };
}
