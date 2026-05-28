import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function evaluateGovernanceIntegrity(dashboard: RecoveryDashboardReadModel) {
  const governanceDisputes = dashboard.governanceDisputes || [];
  const disputes = [
    ...governanceDisputes.map((entry) => String(entry.executionId || "unknown_dispute")),
    ...(dashboard.escalationCoordination?.blocked ? [dashboard.escalationCoordination.blockReason || "escalation_blocked"] : []),
    ...(dashboard.stewardship?.governanceBlocked ? ["stewardship_governance_blocked"] : []),
    ...(dashboard.recoveryPrioritization?.governanceReviewRequired ? ["prioritization_governance_review_required"] : []),
  ];

  const score = clampMetric(
    1
      - governanceDisputes.length * 0.22
      - (dashboard.escalationCoordination?.frozen ? 0.2 : 0)
      - (dashboard.stewardship?.governanceBlocked ? 0.28 : 0),
    0.1,
  );

  return {
    governanceIntegrity: score,
    disputedConditions: disputes,
  };
}
