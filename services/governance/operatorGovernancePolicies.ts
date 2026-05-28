import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function buildOperatorGovernancePolicies(input: {
  dashboard: RecoveryDashboardReadModel;
}) {
  return Array.from(new Set([
    "operator_approval_required",
    ...(input.dashboard.governanceDisputes.length > 0 ? ["disputed_truth_requires_operator_visibility"] : []),
    ...(input.dashboard.continuityConvergence?.requiresFreeze ? ["replay_mismatch_blocks_continuation"] : []),
    ...(input.dashboard.escalationCoordination?.frozen ? ["coordination_freeze_active"] : []),
  ]));
}
