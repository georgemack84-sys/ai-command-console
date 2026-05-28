import { incrementSamCounter, recordSamDuration } from "../performance/samPerformanceMetrics";
import type { SamBackpressureInput, SamDegradedMode } from "./samScalingTypes";

export function determineSamDegradedMode(input: SamBackpressureInput): SamDegradedMode {
  const startedAt = Date.now();
  const {
    queueDepth,
    concurrentProposals,
    concurrentDryRuns,
    retryCount,
    pendingRetries,
    auditAppendLatencyMs,
    idempotencyStoreLatencyMs,
    memoryPressure,
    limits,
  } = input;

  let mode: SamDegradedMode = "NORMAL";

  if (
    queueDepth >= limits.MAX_QUEUE_DEPTH
    || memoryPressure >= limits.MAX_MEMORY_PRESSURE_THRESHOLD
    || pendingRetries > limits.MAX_PENDING_RETRIES
  ) {
    mode = "FROZEN";
  } else if (
    concurrentProposals >= limits.MAX_CONCURRENT_SAM_PROPOSALS
    || concurrentDryRuns >= limits.MAX_CONCURRENT_DRY_RUNS
    || auditAppendLatencyMs > limits.MAX_AUDIT_APPEND_LATENCY_MS
    || idempotencyStoreLatencyMs > limits.MAX_IDEMPOTENCY_STORE_LATENCY_MS
  ) {
    mode = "RESTRICTED";
  } else if (queueDepth >= Math.ceil(limits.MAX_QUEUE_DEPTH * 0.9) || retryCount >= limits.MAX_RETRY_ATTEMPTS) {
    mode = "DEGRADED";
  } else if (queueDepth >= Math.ceil(limits.MAX_QUEUE_DEPTH * 0.5) || pendingRetries > 0) {
    mode = "THROTTLED";
  } else if (queueDepth > 0 || retryCount > 0) {
    mode = "ELEVATED";
  }

  if (mode !== "NORMAL") {
    incrementSamCounter("sam.backpressure.activations");
  }
  recordSamDuration("sam.degraded.mode.duration", Date.now() - startedAt);
  return mode;
}
