import type { SamRuntimeLimits } from "./samScalingTypes";

export const SAM_RUNTIME_LIMITS: SamRuntimeLimits = {
  MAX_CONCURRENT_SAM_PROPOSALS: 4,
  MAX_CONCURRENT_DRY_RUNS: 2,
  MAX_RECOVERY_PARALLELISM: 2,
  MAX_QUEUE_DEPTH: 8,
  MAX_RETRY_ATTEMPTS: 3,
  MAX_AUDIT_APPEND_LATENCY_MS: 250,
  MAX_IDEMPOTENCY_STORE_LATENCY_MS: 150,
  MAX_CHAOS_SCENARIO_DURATION_MS: 2_000,
  LOCK_TIMEOUT_MS: 500,
  MAX_PENDING_RETRIES: 4,
  MAX_MEMORY_PRESSURE_THRESHOLD: 0.85,
};

export function loadSamRuntimeLimits(overrides: Partial<SamRuntimeLimits> = {}): SamRuntimeLimits {
  return {
    ...SAM_RUNTIME_LIMITS,
    ...overrides,
  };
}
