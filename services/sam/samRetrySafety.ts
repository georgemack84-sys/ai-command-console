import type { SamIdempotencyInput, SamRetrySafety, SamStoredIdempotencyResult } from "./samIdempotencyTypes";
import { incrementSamCounter } from "./performance/samPerformanceMetrics";

export function evaluateSamRetrySafety({
  existing,
  incoming,
}: {
  existing: SamStoredIdempotencyResult;
  incoming: SamIdempotencyInput;
}): SamRetrySafety {
  incrementSamCounter("sam.retry.count");
  if (existing.attemptId === incoming.attemptId && existing.idempotencyKey !== incoming.idempotencyKey) {
    return "blocked_conflict";
  }
  if (existing.proposalHash !== incoming.proposalHash) {
    return "blocked_conflict";
  }
  if (existing.status === "ambiguous" || existing.status === "pending") {
    return "blocked_ambiguous";
  }
  if (existing.status === "failed") {
    return existing.replayable ? "safe_replay" : "requires_approval";
  }
  if (existing.status === "completed" || existing.status === "blocked") {
    return "duplicate_return";
  }
  return "blocked_ambiguous";
}
