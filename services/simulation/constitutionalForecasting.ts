import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function forecastConstitutionalRisk(dashboard: RecoveryDashboardReadModel) {
  return clampMetric(
    (dashboard.stewardship?.governanceBlocked ? 0.4 : 0)
      + ((dashboard.continuityConvergence?.requiresFreeze ?? false) ? 0.3 : 0)
      + ((dashboard.recoveryPrioritization?.governanceReviewRequired ?? false) ? 0.2 : 0)
      + (dashboard.governanceDisputes.length * 0.08),
    0.1,
  );
}
