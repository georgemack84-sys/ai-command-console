import { hashPlanDraft } from "@/services/validation/validationHashing";
import { appendPlanAudit } from "./planAudit";
import type { PlanEvidenceRebuildResult, PlanReplayResult, PersistedPlanState } from "./planContracts";
import { PLAN_ERROR_CODES } from "./planContracts";
import { getPlan, getPlanHistory } from "./planPersistence";

function reconstructState(events: ReturnType<typeof getPlanHistory>["lifecycleEvents"]) : PersistedPlanState | "MISSING" {
  const last = events.at(-1);
  return (last?.nextState as PersistedPlanState | undefined) ?? "MISSING";
}

export function reconstructPlanLifecycle(planId: string, replayedAt = 0) : PlanReplayResult {
  const history = getPlanHistory(planId);
  const reconstructedState = reconstructState(history.lifecycleEvents);
  const driftReasons = [
    ...(history.lifecycleEvents.length === 0 ? [PLAN_ERROR_CODES.PLAN_REPLAY_CONFLICT] : []),
    ...(reconstructedState !== history.plan.lifecycleState ? [PLAN_ERROR_CODES.PLAN_REPLAY_CONFLICT] : []),
  ];

  const result = {
    planId,
    deterministic: driftReasons.length === 0,
    driftDetected: driftReasons.length > 0,
    driftReasons,
    reconstructedState,
    storedState: history.plan.lifecycleState,
    replayedAt,
  };

  appendPlanAudit({
    planId,
    eventType: "plan.replay_lifecycle",
    details: result,
  });

  return result;
}

export function rebuildPlanEvidence(planId: string, replayedAt = 0) : PlanEvidenceRebuildResult {
  const history = getPlanHistory(planId);
  const rebuiltPlanHash = hashPlanDraft({
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
  });

  const binding = history.validationBinding;
  const driftReasons = [
    ...(binding ? [] : [PLAN_ERROR_CODES.PLAN_VALIDATION_SNAPSHOT_MISSING]),
    ...(history.plan.planHash && rebuiltPlanHash !== history.plan.planHash ? [PLAN_ERROR_CODES.PLAN_VALIDATION_HASH_DRIFT] : []),
    ...(binding && history.plan.governanceDecisionHash !== binding.snapshot.governanceDecisionHash ? [PLAN_ERROR_CODES.PLAN_GOVERNANCE_HASH_DRIFT] : []),
    ...(!binding ? [] : [
      ...(history.plan.validatorVersion !== binding.snapshot.validatorVersion ? [PLAN_ERROR_CODES.PLAN_VERSION_DRIFT] : []),
      ...(history.plan.registryVersion !== binding.snapshot.registryVersion ? [PLAN_ERROR_CODES.PLAN_VERSION_DRIFT] : []),
      ...(history.plan.governanceVersion !== binding.snapshot.governanceVersion ? [PLAN_ERROR_CODES.PLAN_VERSION_DRIFT] : []),
    ]),
  ];

  const result = {
    planId,
    deterministic: driftReasons.length === 0,
    driftDetected: driftReasons.length > 0,
    driftReasons,
    rebuiltPlanHash,
    storedPlanHash: history.plan.planHash,
    storedGovernanceDecisionHash: history.plan.governanceDecisionHash,
    snapshotGovernanceDecisionHash: binding?.snapshot.governanceDecisionHash,
    replayedAt,
  };

  appendPlanAudit({
    planId,
    eventType: "plan.replay_evidence",
    details: result,
  });

  return result;
}
