import { SAM_IDEMPOTENCY_ERROR_CODES } from "./samIdempotencyErrors";
import { evaluateSamDeduplication } from "./samDeduplication";
import { storeSamIdempotencyResult } from "./samIdempotencyStore";
import type { SamIdempotencyInput } from "./samIdempotencyTypes";

export function ensureIdempotentExecution(input: SamIdempotencyInput) {
  if (
    !String(input.executionId || "").trim()
    || !String(input.attemptId || "").trim()
    || !String(input.idempotencyKey || "").trim()
    || !String(input.proposalHash || "").trim()
  ) {
    return {
      status: "blocked_ambiguous" as const,
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      executionId: String(input.executionId || ""),
      attemptId: String(input.attemptId || ""),
      idempotencyKey: String(input.idempotencyKey || ""),
      reason: SAM_IDEMPOTENCY_ERROR_CODES.SAM_IDEMPOTENCY_INPUT_INVALID,
    };
  }

  const decision = evaluateSamDeduplication(input);
  if (decision.status === "new_attempt") {
    storeSamIdempotencyResult({
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      executionId: input.executionId,
      attemptId: input.attemptId,
      idempotencyKey: input.idempotencyKey,
      actionType: input.actionType,
      proposalHash: input.proposalHash,
      status: "pending",
      replayable: false,
    });
  }
  return decision;
}
