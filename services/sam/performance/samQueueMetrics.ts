export type SamQueueMetricsSnapshot = {
  queueDepth: number;
  lastQueueWaitDurationMs: number;
  totalQueueWaitDurationMs: number;
  lastLockWaitDurationMs: number;
  totalLockWaitDurationMs: number;
};

let queueDepth = 0;
let lastQueueWaitDurationMs = 0;
let totalQueueWaitDurationMs = 0;
let lastLockWaitDurationMs = 0;
let totalLockWaitDurationMs = 0;

export function resetSamQueueMetrics() {
  queueDepth = 0;
  lastQueueWaitDurationMs = 0;
  totalQueueWaitDurationMs = 0;
  lastLockWaitDurationMs = 0;
  totalLockWaitDurationMs = 0;
}

export function setSamQueueDepth(depth: number) {
  queueDepth = Math.max(0, Math.floor(depth));
}

export function recordSamQueueWaitDuration(durationMs: number) {
  lastQueueWaitDurationMs = Math.max(0, durationMs);
  totalQueueWaitDurationMs += lastQueueWaitDurationMs;
}

export function recordSamLockWaitDuration(durationMs: number) {
  lastLockWaitDurationMs = Math.max(0, durationMs);
  totalLockWaitDurationMs += lastLockWaitDurationMs;
}

export function getSamQueueMetrics(): SamQueueMetricsSnapshot {
  return {
    queueDepth,
    lastQueueWaitDurationMs,
    totalQueueWaitDurationMs,
    lastLockWaitDurationMs,
    totalLockWaitDurationMs,
  };
}
