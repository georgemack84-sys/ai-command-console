import type {
  ApprovalConflictError,
  ApprovalConflictStressInput,
  ApprovalConflictViolation,
  ApprovalConflictWeakness,
} from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

export function detectInvalidInheritance(input: ApprovalConflictStressInput): Readonly<{
  inheritanceBlocked: boolean;
  scopeIsolated: boolean;
  errors: readonly ApprovalConflictError[];
  violations: readonly ApprovalConflictViolation[];
  weaknesses: readonly ApprovalConflictWeakness[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const inheritanceBlocked = markers.includes("approvalscopeexpansion")
    || markers.includes("authorityinheritance")
    || markers.includes("unauthorizeddelegation")
    || markers.includes("transitiveapproval");
  if (!inheritanceBlocked) {
    return Object.freeze({
      inheritanceBlocked: false,
      scopeIsolated: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }
  const error: ApprovalConflictError = Object.freeze({
    code: "APPROVAL_CONFLICT_INVALID_INHERITANCE",
    message: "Approval inheritance leakage is blocked; scope isolation must be preserved.",
    path: "metadata",
  });
  const violation: ApprovalConflictViolation = Object.freeze({
    violationId: hashApprovalConflictValue("inheritance-violation-id", input.conflictId),
    conflictId: input.conflictId,
    coordinationId: input.recommendationResult.record.coordinationId,
    domain: "inheritance",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashApprovalConflictValue("inheritance-violation", error),
  });
  const weakness: ApprovalConflictWeakness = Object.freeze({
    weaknessId: hashApprovalConflictValue("inheritance-weakness-id", error),
    conflictId: input.conflictId,
    classification: "APPROVAL_INHERITANCE_RISK",
    severity: "CONSTITUTIONAL_BLOCKER",
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashApprovalConflictValue("inheritance-weakness", error),
  });
  return Object.freeze({
    inheritanceBlocked: true,
    scopeIsolated: false,
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    weaknesses: Object.freeze([weakness]),
  });
}
