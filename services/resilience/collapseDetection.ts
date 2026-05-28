import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function detectCollapseProbability(dashboard: RecoveryDashboardReadModel) {
  const quarantinedExecutions = dashboard.quarantinedExecutions || [];
  const collapseProbability = clampMetric(
    (1 - (dashboard.operationalStabilityAssessment?.survivabilityScore ?? 0.35)) * 0.3
      + (dashboard.continuityConvergence?.divergenceScore ?? 0.25) * 0.25
      + ((dashboard.stewardship?.shouldFreeze || dashboard.continuityConvergence?.requiresFreeze) ? 0.18 : 0)
      + (dashboard.escalationCoordination?.frozen ? 0.12 : 0)
      + (quarantinedExecutions.length > 0 ? 0.12 : 0),
    1,
  );

  return {
    collapseProbability,
    collapseIndicators: [
      ...(dashboard.continuityConvergence?.requiresFreeze ? ["convergence_freeze_required"] : []),
      ...(dashboard.escalationCoordination?.frozen ? ["escalation_chain_frozen"] : []),
      ...(quarantinedExecutions.length > 0 ? ["quarantined_executions_present"] : []),
    ],
  };
}
