import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function projectGovernanceSurvivability(dashboard: RecoveryDashboardReadModel) {
  return clampMetric(
    1
      - (dashboard.governanceDisputes.length * 0.2)
      - (dashboard.escalationCoordination?.blocked ? 0.2 : 0)
      - (dashboard.stewardship?.governanceBlocked ? 0.25 : 0),
    0.1,
  );
}
