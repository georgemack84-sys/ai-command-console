import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function analyzeDegradationPropagation(dashboard: RecoveryDashboardReadModel) {
  const affectedSubsystems = Array.from(new Set([
    ...(dashboard.operationalStabilityAssessment?.unstableSubsystems || []),
    ...(dashboard.continuityConvergence?.affectedSubsystems || []),
    ...(dashboard.degradedSystems || []),
  ]));

  const degradationVelocity = clampMetric(
    (dashboard.operationalStabilityAssessment?.degradationRate ?? 0.25) * 0.55
      + (dashboard.continuityConvergence?.divergenceScore ?? 0.25) * 0.45
      + (dashboard.replayDivergenceCount > 0 ? 0.1 : 0),
    1,
  );

  return {
    degradationVelocity,
    affectedSubsystems,
  };
}
