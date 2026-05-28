import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function verifySurvivability(dashboard: RecoveryDashboardReadModel) {
  const survivabilityScore = clampMetric(
    (
      (dashboard.operationalStabilityAssessment?.survivabilityScore ?? 0.25)
      + (dashboard.stewardship?.survivabilityScore ?? 0.25)
      + (dashboard.continuityConvergence?.survivabilityConfidence ?? 0.2)
    ) / 3,
    0.1,
  );

  const disputed = [
    ...(dashboard.continuityConvergence?.state === "DISPUTED" ? ["continuity_convergence_disputed"] : []),
    ...(dashboard.stewardship?.state === "DISPUTED" ? ["stewardship_disputed"] : []),
    ...(dashboard.replayVerificationState === "DIVERGED" ? ["replay_diverged"] : []),
  ];

  return {
    survivabilityScore,
    disputed,
  };
}
