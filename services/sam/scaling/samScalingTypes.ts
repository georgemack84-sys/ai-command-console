export type SamDegradedMode = "NORMAL" | "ELEVATED" | "THROTTLED" | "DEGRADED" | "RESTRICTED" | "FROZEN";

export type SamWorkPriority =
  | "recovery"
  | "approved"
  | "audit"
  | "idempotency"
  | "retry"
  | "advisory"
  | "chaos";

export type SamRuntimeLimits = {
  MAX_CONCURRENT_SAM_PROPOSALS: number;
  MAX_CONCURRENT_DRY_RUNS: number;
  MAX_RECOVERY_PARALLELISM: number;
  MAX_QUEUE_DEPTH: number;
  MAX_RETRY_ATTEMPTS: number;
  MAX_AUDIT_APPEND_LATENCY_MS: number;
  MAX_IDEMPOTENCY_STORE_LATENCY_MS: number;
  MAX_CHAOS_SCENARIO_DURATION_MS: number;
  LOCK_TIMEOUT_MS: number;
  MAX_PENDING_RETRIES: number;
  MAX_MEMORY_PRESSURE_THRESHOLD: number;
};

export type SamBackpressureInput = {
  queueDepth: number;
  concurrentProposals: number;
  concurrentDryRuns: number;
  retryCount: number;
  pendingRetries: number;
  auditAppendLatencyMs: number;
  idempotencyStoreLatencyMs: number;
  memoryPressure: number;
  limits: SamRuntimeLimits;
};

export type SamBackpressureDecision = {
  mode: SamDegradedMode;
  shouldThrottle: boolean;
  shouldReject: boolean;
  reason: string;
};

export type SamProposalAdmission = {
  allowed: boolean;
  mode: SamDegradedMode;
  reason?: string;
  token?: string;
  priority: SamWorkPriority;
};
