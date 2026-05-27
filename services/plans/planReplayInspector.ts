import { replayPlanValidation } from "@/services/validation/validationReplay";
import { PLAN_ERROR_CODES } from "./planContracts";
import { getPlanHistory } from "./planPersistence";
import { rebuildPlanEvidence, reconstructPlanLifecycle } from "./planReplay";
import { rebuildLifecycleHash, reconstructPlanState } from "./planStateRebuilder";

export function detectLifecycleDrift(planId: string) {
  const lifecycle = reconstructPlanLifecycle(planId);
  return {
    planId,
    driftDetected: lifecycle.driftDetected,
    reasons: lifecycle.driftReasons,
  };
}

export function detectValidationDrift(planId: string) {
  const history = getPlanHistory(planId);
  if (!history.validationBinding) {
    return {
      planId,
      driftDetected: true,
      reasons: [PLAN_ERROR_CODES.PLAN_VALIDATION_SNAPSHOT_MISSING],
    };
  }
  const replay = replayPlanValidation({
    plan: {
      planId: history.plan.planId,
      intent: history.plan.intent,
      metadata: {
        createdBy: history.plan.createdBy,
        source: history.plan.source,
      },
      schemaVersion: history.plan.schemaVersion,
      steps: history.steps.map((step) => ({
        id: step.stepId,
        type: step.type,
        tool: step.tool ?? "",
        input: step.input as Record<string, unknown>,
        safety: {
          riskLevel: step.riskLevel,
          requiresApproval: step.requiresApproval,
        },
      })),
    },
    governance: history.validationBinding.governance,
    originalSnapshot: history.validationBinding.snapshot,
  });

  return {
    planId,
    driftDetected: replay.driftDetected,
    reasons: replay.driftReasons.length > 0 ? replay.driftReasons : (replay.deterministic ? [] : [PLAN_ERROR_CODES.PLAN_VALIDATION_DRIFT]),
  };
}

export function detectGovernanceDrift(planId: string) {
  const rebuilt = rebuildPlanEvidence(planId);
  return {
    planId,
    driftDetected: rebuilt.driftReasons.includes(PLAN_ERROR_CODES.PLAN_GOVERNANCE_HASH_DRIFT),
    reasons: rebuilt.driftReasons.filter((reason) => reason === PLAN_ERROR_CODES.PLAN_GOVERNANCE_HASH_DRIFT || reason === PLAN_ERROR_CODES.PLAN_VERSION_DRIFT),
  };
}

export function verifyReplayIntegrity(planId: string) {
  const lifecycle = reconstructPlanLifecycle(planId);
  const evidence = rebuildPlanEvidence(planId);
  const state = reconstructPlanState(planId);
  const lifecycleHash = rebuildLifecycleHash(planId);

  const reasons = [
    ...lifecycle.driftReasons,
    ...evidence.driftReasons,
    ...(state === "MISSING" ? [PLAN_ERROR_CODES.PLAN_REPLAY_FAILED] : []),
  ];

  return {
    planId,
    deterministic: reasons.length === 0,
    driftDetected: reasons.length > 0,
    reasons: Array.from(new Set(reasons)),
    lifecycleHash,
  };
}
