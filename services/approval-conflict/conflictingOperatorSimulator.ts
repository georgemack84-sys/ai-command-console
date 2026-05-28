import type {
  ApprovalConflictError,
  ApprovalConflictStressInput,
  ApprovalConflictViolation,
  ApprovalConflictWeakness,
} from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

export function simulateConflictingOperators(input: ApprovalConflictStressInput): Readonly<{
  conflictingOperators: boolean;
  errors: readonly ApprovalConflictError[];
  violations: readonly ApprovalConflictViolation[];
  weaknesses: readonly ApprovalConflictWeakness[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const conflictingOperators = markers.includes("conflictingoperators")
    || markers.includes("contradictoryapproval")
    || markers.includes("contradictoryescalation")
    || markers.includes("simultaneousoverride");
  if (!conflictingOperators) {
    return Object.freeze({
      conflictingOperators: false,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }
  const error: ApprovalConflictError = Object.freeze({
    code: "APPROVAL_CONFLICT_OPERATOR_CONTRADICTION",
    message: "Conflicting operators require freeze and governance review; automatic reconciliation is forbidden.",
    path: "metadata",
  });
  const violation: ApprovalConflictViolation = Object.freeze({
    violationId: hashApprovalConflictValue("operator-violation-id", input.conflictId),
    conflictId: input.conflictId,
    coordinationId: input.recommendationResult.record.coordinationId,
    domain: "operator",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashApprovalConflictValue("operator-violation", error),
  });
  const weakness: ApprovalConflictWeakness = Object.freeze({
    weaknessId: hashApprovalConflictValue("operator-weakness-id", error),
    conflictId: input.conflictId,
    classification: "APPROVAL_OPERATOR_CONFLICT_RISK",
    severity: "CRITICAL",
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashApprovalConflictValue("operator-weakness", error),
  });
  return Object.freeze({
    conflictingOperators: true,
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    weaknesses: Object.freeze([weakness]),
  });
}
