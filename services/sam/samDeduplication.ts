import { SAM_IDEMPOTENCY_ERROR_CODES } from "./samIdempotencyErrors";
import { getSamIdempotencyByAttemptId, getSamIdempotencyByKey } from "./samIdempotencyStore";
import { evaluateSamRetrySafety } from "./samRetrySafety";
import type { SamIdempotencyDecision, SamIdempotencyInput } from "./samIdempotencyTypes";

export function evaluateSamDeduplication(input: SamIdempotencyInput): SamIdempotencyDecision {
  const existingByAttempt = getSamIdempotencyByAttemptId(input.attemptId, input);
  if (existingByAttempt && existingByAttempt.idempotencyKey !== input.idempotencyKey) {
    return {
      status: "blocked_conflict",
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      executionId: input.executionId,
      attemptId: input.attemptId,
      idempotencyKey: input.idempotencyKey,
      reason: SAM_IDEMPOTENCY_ERROR_CODES.SAM_IDEMPOTENCY_CONFLICT,
    };
  }

  const existingByKey = getSamIdempotencyByKey(input.idempotencyKey, input);
  if (!existingByKey) {
    return {
      status: "new_attempt",
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      executionId: input.executionId,
      attemptId: input.attemptId,
      idempotencyKey: input.idempotencyKey,
    };
  }

  const retrySafety = evaluateSamRetrySafety({
    existing: existingByKey,
    incoming: input,
  });

  if (retrySafety === "duplicate_return") {
    return {
      status: "duplicate_returned",
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      executionId: input.executionId,
      attemptId: input.attemptId,
      idempotencyKey: input.idempotencyKey,
      resultHash: existingByKey.resultHash,
      result: existingByKey.result,
      reason: "SAME_KEY_SAME_RESULT",
    };
  }

  if (retrySafety === "safe_replay") {
    return {
      status: "new_attempt",
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      executionId: input.executionId,
      attemptId: input.attemptId,
      idempotencyKey: input.idempotencyKey,
      reason: "SAFE_REPLAY",
    };
  }

  if (retrySafety === "blocked_conflict") {
    return {
      status: "blocked_conflict",
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      executionId: input.executionId,
      attemptId: input.attemptId,
      idempotencyKey: input.idempotencyKey,
      reason: SAM_IDEMPOTENCY_ERROR_CODES.SAM_IDEMPOTENCY_CONFLICT,
    };
  }

  return {
    status: retrySafety === "blocked_ambiguous" ? "blocked_ambiguous" : "unsafe_retry",
    tenantId: input.tenantId,
    workspaceId: input.workspaceId,
    executionId: input.executionId,
    attemptId: input.attemptId,
    idempotencyKey: input.idempotencyKey,
    reason:
      retrySafety === "blocked_ambiguous"
        ? SAM_IDEMPOTENCY_ERROR_CODES.SAM_IDEMPOTENCY_AMBIGUOUS
        : SAM_IDEMPOTENCY_ERROR_CODES.SAM_UNSAFE_RETRY,
  };
}
