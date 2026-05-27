import type {
  ApprovalConflictError,
  ApprovalConflictStressInput,
  ApprovalConflictViolation,
  ApprovalConflictWeakness,
} from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

export function validateStaleApprovalReplay(input: ApprovalConflictStressInput): Readonly<{
  staleReplayDetected: boolean;
  errors: readonly ApprovalConflictError[];
  violations: readonly ApprovalConflictViolation[];
  weaknesses: readonly ApprovalConflictWeakness[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const staleReplayDetected = markers.includes("staleapprovalreplay")
    || markers.includes("replaydrift")
    || markers.includes("stalegovernance")
    || markers.includes("historicalmismatch");
  if (!staleReplayDetected) {
    return Object.freeze({
      staleReplayDetected: false,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }
  const error: ApprovalConflictError = Object.freeze({
    code: "APPROVAL_CONFLICT_STALE_REPLAY",
    message: "Stale approval replay detected; historical-only replay must fail closed on drift.",
    path: "metadata",
  });
  const violation: ApprovalConflictViolation = Object.freeze({
    violationId: hashApprovalConflictValue("stale-replay-violation-id", input.conflictId),
    conflictId: input.conflictId,
    coordinationId: input.recommendationResult.record.coordinationId,
    domain: "replay",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashApprovalConflictValue("stale-replay-violation", error),
  });
  const weakness: ApprovalConflictWeakness = Object.freeze({
    weaknessId: hashApprovalConflictValue("stale-replay-weakness-id", error),
    conflictId: input.conflictId,
    classification: "APPROVAL_STALE_REPLAY_RISK",
    severity: "CRITICAL",
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashApprovalConflictValue("stale-replay-weakness", error),
  });
  return Object.freeze({
    staleReplayDetected: true,
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    weaknesses: Object.freeze([weakness]),
  });
}
