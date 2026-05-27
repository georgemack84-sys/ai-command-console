import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function projectCollapseRisk(dashboard: RecoveryDashboardReadModel) {
  return clampMetric(
    ((dashboard.continuityConvergence?.divergenceScore ?? 0.25) * 0.35)
      + ((1 - (dashboard.operationalStabilityAssessment?.survivabilityScore ?? 0.35)) * 0.35)
      + ((dashboard.operationalStabilityAssessment?.containmentRecommended ?? false) ? 0.15 : 0)
      + ((dashboard.stewardship?.shouldFreeze ?? false) ? 0.15 : 0),
    0.1,
  );
}
