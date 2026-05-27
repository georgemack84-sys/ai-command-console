import type {
  ApprovalConflictError,
  ApprovalConflictStressInput,
  ApprovalConflictViolation,
  ApprovalConflictWeakness,
} from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "./deterministicApprovalConflictHasher";

function markers(input: ApprovalConflictStressInput): readonly string[] {
  const values = JSON.stringify(input.metadata ?? {}).toLowerCase();
  return [
    values,
    ...input.recommendationResult.errors.map((item) => item.code.toLowerCase()),
  ];
}

export function simulateDependencyRevocation(input: ApprovalConflictStressInput): Readonly<{
  dependencyRevoked: boolean;
  errors: readonly ApprovalConflictError[];
  violations: readonly ApprovalConflictViolation[];
  weaknesses: readonly ApprovalConflictWeakness[];
}> {
  const allMarkers = markers(input);
  const dependencyRevoked = allMarkers.some((item) =>
    item.includes("revokedparentapproval")
    || item.includes("orphanedapproval")
    || item.includes("approvalidationpropagation")
    || item.includes("governancemismatch")
  );
  if (!dependencyRevoked) {
    return Object.freeze({
      dependencyRevoked: false,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }
  const error: ApprovalConflictError = Object.freeze({
    code: "APPROVAL_CONFLICT_DEPENDENCY_REVOCATION",
    message: "Dependency revocation invalidates downstream approval trust and freezes coordination.",
    path: "metadata",
  });
  const violation: ApprovalConflictViolation = Object.freeze({
    violationId: hashApprovalConflictValue("dependency-violation-id", input.conflictId),
    conflictId: input.conflictId,
    coordinationId: input.recommendationResult.record.coordinationId,
    domain: "dependency",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashApprovalConflictValue("dependency-violation", error),
  });
  const weakness: ApprovalConflictWeakness = Object.freeze({
    weaknessId: hashApprovalConflictValue("dependency-weakness-id", error),
    conflictId: input.conflictId,
    classification: "APPROVAL_DEPENDENCY_REVOCATION_RISK",
    severity: "CRITICAL",
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashApprovalConflictValue("dependency-weakness", error),
  });
  return Object.freeze({
    dependencyRevoked: true,
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    weaknesses: Object.freeze([weakness]),
  });
}
