import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function evaluateStabilizationPolicies(dashboard: RecoveryDashboardReadModel) {
  const pendingApprovals = dashboard.pendingApprovals || [];
  const governanceDisputes = dashboard.governanceDisputes || [];

  return {
    stabilizationRequired: Boolean(
      dashboard.operationalStabilityAssessment?.stabilizationRequired
      || dashboard.stewardship?.stabilizationStatus === "degrading"
      || dashboard.continuityConvergence?.state === "UNSTABLE",
    ),
    operatorInterventionRequired: Boolean(
      pendingApprovals.length > 0
      || governanceDisputes.length > 0
      || dashboard.recoveryPrioritization?.governanceReviewRequired,
    ),
  };
}
