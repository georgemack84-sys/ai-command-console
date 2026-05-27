import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function forecastOperationalTrust(dashboard: RecoveryDashboardReadModel) {
  return clampMetric(
    ((dashboard.operationalStabilityAssessment?.continuityConfidence ?? dashboard.continuityConfidence ?? 0.25) * 0.4)
      + ((dashboard.continuityConvergence?.replayConfidence ?? 0.25) * 0.25)
      + ((dashboard.stewardship?.confidence ?? 0.25) * 0.2)
      + ((dashboard.recoveryPrioritization?.prioritizationConfidence ?? 0.25) * 0.15),
    0.1,
  );
}
