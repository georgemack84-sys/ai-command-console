import type { ApprovalReadinessRecord, ConstitutionalReadinessInput, ReadinessError } from "@/types/constitutional-readiness";
import { normalizeReadinessMetadata } from "./readinessContracts";
import { hashReadinessValue } from "./readinessHashEngine";

export function validateApprovalReadiness(input: ConstitutionalReadinessInput): {
  record: ApprovalReadinessRecord;
  errors: readonly ReadinessError[];
} {
  const normalized = normalizeReadinessMetadata(input.metadata);
  const approvalScore = input.adversarialTelemetryResult.metrics.approval_instability_score;
  const errors: ReadinessError[] = [];

  if (approvalScore > 0) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_APPROVAL_NONDETERMINISM",
      message: "Approval instability or ambiguity was detected in upstream telemetry.",
      path: "adversarialTelemetryResult.metrics.approval_instability_score",
    }));
  }
  if (
    normalized.includes("approvalinjection")
    || normalized.includes("staleapproval")
    || normalized.includes("circularapproval")
    || normalized.includes("approvalinheritance")
  ) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_APPROVAL_BOUNDARY_FAILURE",
      message: "Approval injection, stale replay, circular chains, or inherited approval markers were detected.",
      path: "metadata",
    }));
  }

  const record: ApprovalReadinessRecord = Object.freeze({
    readinessId: input.readinessId,
    approvalInstabilityScore: approvalScore,
    approvalDeterministic: errors.length === 0,
    verificationHash: hashReadinessValue("constitutional-readiness-approval-record", {
      readinessId: input.readinessId,
      approvalScore,
      errors: errors.map((item) => item.code),
    }),
  });

  return Object.freeze({
    record,
    errors: Object.freeze(errors),
  });
}
