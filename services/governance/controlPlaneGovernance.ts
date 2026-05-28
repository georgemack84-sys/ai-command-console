import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function evaluateControlPlaneGovernance(input: {
  dashboard: RecoveryDashboardReadModel;
  reviewType: string;
}) {
  const blockedReasons = [
    ...(input.dashboard.stewardship ? [] : ["CONTROL_PLANE_CONTEXT_MISSING"]),
    ...(input.dashboard.governanceDisputes.length > 0 ? ["CONSTITUTIONAL_ENFORCEMENT_FAILED"] : []),
    ...(input.dashboard.continuityConvergence?.requiresFreeze ? ["REPLAY_MISMATCH_UNRESOLVED"] : []),
    ...(input.dashboard.escalationCoordination?.frozen ? ["COORDINATION_FREEZE_ACTIVE"] : []),
  ];

  return {
    reviewType: input.reviewType,
    allowed: blockedReasons.length === 0,
    blockedReasons,
    constitutionalReasoning: blockedReasons.length
      ? ["control plane remains governed by freeze, dispute, and replay precedence"]
      : ["control plane context verified for read-only retrieval"],
  };
}
