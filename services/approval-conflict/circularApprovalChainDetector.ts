import type {
  ApprovalConflictError,
  ApprovalConflictStressInput,
  ApprovalConflictViolation,
  ApprovalConflictWeakness,
} from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

export function detectCircularApprovalChain(input: ApprovalConflictStressInput): Readonly<{
  recursiveDetected: boolean;
  errors: readonly ApprovalConflictError[];
  violations: readonly ApprovalConflictViolation[];
  weaknesses: readonly ApprovalConflictWeakness[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const recursiveDetected = markers.includes("circularapproval")
    || markers.includes("recursiveapproval")
    || markers.includes("cyclicdependency")
    || markers.includes("recursiveescalationreference");
  if (!recursiveDetected) {
    return Object.freeze({
      recursiveDetected: false,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }
  const error: ApprovalConflictError = Object.freeze({
    code: "APPROVAL_CONFLICT_CIRCULAR_CHAIN",
    message: "Circular approval chains are constitutionally invalid and fail closed immediately.",
    path: "metadata",
  });
  const violation: ApprovalConflictViolation = Object.freeze({
    violationId: hashApprovalConflictValue("circular-violation-id", input.conflictId),
    conflictId: input.conflictId,
    coordinationId: input.recommendationResult.record.coordinationId,
    domain: "circularity",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashApprovalConflictValue("circular-violation", error),
  });
  const weakness: ApprovalConflictWeakness = Object.freeze({
    weaknessId: hashApprovalConflictValue("circular-weakness-id", error),
    conflictId: input.conflictId,
    classification: "APPROVAL_CIRCULAR_CHAIN_RISK",
    severity: "CONSTITUTIONAL_BLOCKER",
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashApprovalConflictValue("circular-weakness", error),
  });
  return Object.freeze({
    recursiveDetected: true,
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    weaknesses: Object.freeze([weakness]),
  });
}
