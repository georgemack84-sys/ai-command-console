import { getResilienceThresholds } from "./resilienceThresholds";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function evaluateRuntimeFreeze(dashboard: RecoveryDashboardReadModel) {
  const thresholds = getResilienceThresholds();
  const freezeReasons = [
    ...(dashboard.stewardship?.shouldFreeze ? ["stewardship_freeze_required"] : []),
    ...(dashboard.continuityConvergence?.requiresFreeze ? ["continuity_freeze_required"] : []),
    ...(dashboard.escalationCoordination?.frozen ? ["escalation_chain_frozen"] : []),
    ...(dashboard.continuityConvergence && dashboard.continuityConvergence.divergenceScore >= thresholds.freezeThreshold ? ["divergence_score_above_freeze_threshold"] : []),
    ...(dashboard.replayVerificationState === "DIVERGED" ? ["replay_divergence_detected"] : []),
  ];

  return {
    requiresFreeze: freezeReasons.length > 0,
    freezeReasons,
  };
}
