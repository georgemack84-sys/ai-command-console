import { VALIDATION_ERROR_CODES } from "./validationErrors";
import { validatePlanDraft } from "./planValidator";
import { appendValidationReplayAudit } from "./validationAudit";
import type { GovernanceValidationInput, PlanDraft, ValidationReplayResult, ValidationSnapshot } from "./validationContracts";

export function replayPlanValidation(input: {
  plan: PlanDraft;
  governance?: GovernanceValidationInput;
  originalSnapshot: ValidationSnapshot;
}) : ValidationReplayResult {
  const replayed = validatePlanDraft({
    plan: input.plan,
    governance: input.governance,
  });

  const driftReasons = [
    ...(replayed.planHash !== input.originalSnapshot.planHash ? [VALIDATION_ERROR_CODES.VALIDATION_PLAN_HASH_MISMATCH] : []),
    ...(replayed.governanceDecisionHash !== input.originalSnapshot.governanceDecisionHash ? [VALIDATION_ERROR_CODES.VALIDATION_GOVERNANCE_HASH_MISMATCH] : []),
    ...(replayed.validationState !== input.originalSnapshot.validationState ? [VALIDATION_ERROR_CODES.VALIDATION_REPLAY_DRIFT_DETECTED] : []),
  ];

  const replayResult = {
    replayId: `validation-replay:${input.originalSnapshot.validationId}`,
    originalValidationId: input.originalSnapshot.validationId,
    planId: input.originalSnapshot.planId,
    deterministic: driftReasons.length === 0,
    driftDetected: driftReasons.length > 0,
    driftReasons,
    originalPlanHash: input.originalSnapshot.planHash,
    replayPlanHash: replayed.planHash,
    originalGovernanceDecisionHash: input.originalSnapshot.governanceDecisionHash,
    replayGovernanceDecisionHash: replayed.governanceDecisionHash,
    replayedAt: replayed.validatedAt,
  };

  appendValidationReplayAudit({
    replay: replayResult,
  });

  return replayResult;
}
