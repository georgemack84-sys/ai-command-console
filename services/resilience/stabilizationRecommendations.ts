import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function buildStabilizationRecommendations(dashboard: RecoveryDashboardReadModel) {
  return [
    ...(dashboard.operationalStabilityAssessment?.stabilizationRequired ? ["stabilize_runtime"] : []),
    ...(dashboard.continuityConvergence?.requiresContainment ? ["maintain_containment_boundary"] : []),
    ...(dashboard.recoveryPrioritization?.governanceReviewRequired ? ["obtain_governance_review"] : []),
    ...(dashboard.escalationCoordination?.requiresOperatorVisibility ? ["maintain_operator_visibility"] : []),
  ];
}
