import type {
  ApprovalConflictError,
  ApprovalConflictStressInput,
  ApprovalConflictViolation,
  ApprovalConflictWeakness,
} from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

export function detectEscalationOverride(input: ApprovalConflictStressInput): Readonly<{
  escalationOverrideDetected: boolean;
  errors: readonly ApprovalConflictError[];
  violations: readonly ApprovalConflictViolation[];
  weaknesses: readonly ApprovalConflictWeakness[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const escalationOverrideDetected = markers.includes("suppressescalation")
    || markers.includes("downgradeescalation")
    || markers.includes("bypassgovernance")
    || markers.includes("cancelescalation");
  if (!escalationOverrideDetected) {
    return Object.freeze({
      escalationOverrideDetected: false,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }
  const error: ApprovalConflictError = Object.freeze({
    code: "APPROVAL_CONFLICT_ESCALATION_OVERRIDE",
    message: "Escalation override attempts are invalid; instability must amplify oversight instead.",
    path: "metadata",
  });
  const violation: ApprovalConflictViolation = Object.freeze({
    violationId: hashApprovalConflictValue("escalation-override-violation-id", input.conflictId),
    conflictId: input.conflictId,
    coordinationId: input.recommendationResult.record.coordinationId,
    domain: "escalation",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashApprovalConflictValue("escalation-override-violation", error),
  });
  const weakness: ApprovalConflictWeakness = Object.freeze({
    weaknessId: hashApprovalConflictValue("escalation-override-weakness-id", error),
    conflictId: input.conflictId,
    classification: "APPROVAL_ESCALATION_OVERRIDE_RISK",
    severity: "CRITICAL",
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashApprovalConflictValue("escalation-override-weakness", error),
  });
  return Object.freeze({
    escalationOverrideDetected: true,
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    weaknesses: Object.freeze([weakness]),
  });
}
