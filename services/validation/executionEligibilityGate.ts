import { VALIDATION_ERROR_CODES } from "./validationErrors";
import { dedupeReasons, PLANNER_REGISTRY_VERSION, VALIDATOR_VERSION } from "./validationPolicies";
import type { ExecutionEligibilityResult, PlanValidationResult, ValidationSnapshot } from "./validationContracts";

export function evaluateExecutionEligibility(input: {
  result: PlanValidationResult;
  snapshot?: ValidationSnapshot;
  approvalGranted?: boolean;
  currentPlanHash: string;
  currentGovernanceDecisionHash: string;
  currentSchemaVersion?: string;
  validatorVersion?: string;
  registryVersion?: string;
  governanceVersion?: string;
  freezePropagationActive?: boolean;
}) : ExecutionEligibilityResult {
  const reasons = dedupeReasons([
    ...(input.snapshot ? [] : [VALIDATION_ERROR_CODES.VALIDATION_SNAPSHOT_MISSING]),
    ...(input.result.immutableAuditId ? [] : [VALIDATION_ERROR_CODES.VALIDATION_AUDIT_LINEAGE_MISSING]),
    ...(["INVALID", "BLOCKED", "DISPUTED", "FROZEN"].includes(input.result.validationState) ? [VALIDATION_ERROR_CODES.VALIDATION_EXECUTION_NOT_ELIGIBLE] : []),
    ...(input.result.approvalRequired && !input.approvalGranted ? [VALIDATION_ERROR_CODES.APPROVAL_REQUIRED] : []),
    ...(input.snapshot && input.snapshot.planHash !== input.currentPlanHash ? [VALIDATION_ERROR_CODES.VALIDATION_PLAN_HASH_MISMATCH] : []),
    ...(input.snapshot && input.snapshot.governanceDecisionHash !== input.currentGovernanceDecisionHash ? [VALIDATION_ERROR_CODES.VALIDATION_GOVERNANCE_HASH_MISMATCH] : []),
    ...(input.snapshot && input.snapshot.validatorVersion !== (input.validatorVersion ?? VALIDATOR_VERSION) ? [VALIDATION_ERROR_CODES.VALIDATION_VERSION_MISMATCH] : []),
    ...(input.snapshot && input.snapshot.registryVersion !== (input.registryVersion ?? PLANNER_REGISTRY_VERSION) ? [VALIDATION_ERROR_CODES.VALIDATION_VERSION_MISMATCH] : []),
    ...(input.snapshot && input.snapshot.governanceVersion !== (input.governanceVersion ?? input.result.governanceVersion) ? [VALIDATION_ERROR_CODES.VALIDATION_VERSION_MISMATCH] : []),
    ...(input.snapshot && input.snapshot.schemaVersion !== (input.currentSchemaVersion ?? input.snapshot.schemaVersion) ? [VALIDATION_ERROR_CODES.VALIDATION_VERSION_MISMATCH] : []),
    ...(input.freezePropagationActive ? [VALIDATION_ERROR_CODES.VALIDATION_FREEZE_PROPAGATED] : []),
  ]);

  const frozen = input.result.frozen || Boolean(input.freezePropagationActive);
  const blocked = reasons.length > 0;

  return {
    eligible: !blocked && !frozen,
    blocked,
    frozen,
    planId: input.result.planId,
    validationId: input.result.validationId,
    snapshotId: input.snapshot?.snapshotId,
    reasons,
    requiredApproval: input.result.approvalRequired,
    governanceDecision: frozen ? "FREEZE" : blocked ? "BLOCKED" : input.result.governanceDecision,
    checkedAt: input.result.validatedAt,
  };
}
