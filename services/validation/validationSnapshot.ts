import { hashEvidence } from "@/services/audit/evidenceHashing";
import type { PlanValidationResult, ValidationSnapshot } from "./validationContracts";

export function createValidationSnapshot(input: {
  result: PlanValidationResult;
  schemaVersion: string;
  executionEligible?: boolean;
}) : ValidationSnapshot {
  return Object.freeze({
    snapshotId: `validation-snapshot:${hashEvidence({
      validationId: input.result.validationId,
      planHash: input.result.planHash,
      governanceDecisionHash: input.result.governanceDecisionHash,
    }).slice(0, 16)}`,
    validationId: input.result.validationId,
    planId: input.result.planId,
    planHash: input.result.planHash,
    governanceDecisionHash: input.result.governanceDecisionHash,
    schemaVersion: input.schemaVersion,
    validatorVersion: input.result.validatorVersion,
    registryVersion: input.result.registryVersion,
    governanceVersion: input.result.governanceVersion,
    validationState: input.result.validationState,
    riskLevel: input.result.riskLevel,
    approvalRequired: input.result.approvalRequired,
    executionEligible: input.executionEligible ?? input.result.executionEligible,
    frozen: input.result.frozen,
    freezeReasons: [...input.result.freezeReasons],
    createdAt: input.result.validatedAt,
    immutableAuditId: input.result.immutableAuditId,
  });
}
