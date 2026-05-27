import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function evaluateContainmentBoundaries(dashboard: RecoveryDashboardReadModel) {
  const requiresContainment = Boolean(
    dashboard.continuityConvergence?.requiresContainment
      || dashboard.operationalStabilityAssessment?.containmentRecommended
      || dashboard.escalationCoordination?.requiresContainment,
  );

  const boundaryFailures = [
    ...(dashboard.escalationCoordination?.requiresContainment && dashboard.escalationCoordination.frozen ? ["containment_boundary_unstable"] : []),
    ...(dashboard.continuityConvergence?.state === "CONTAINMENT_REQUIRED" ? ["continuity_containment_required"] : []),
  ];

  return {
    requiresContainment,
    boundaryFailures,
  };
}
