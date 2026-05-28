import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function buildCoordinationFreezeReview(input: {
  dashboard: RecoveryDashboardReadModel;
}) {
  const frozen = Boolean(input.dashboard.escalationCoordination?.frozen || input.dashboard.continuityConvergence?.requiresFreeze);

  return {
    reviewState: frozen ? "FROZEN" : "VERIFIED",
    blockedReasons: frozen
      ? Array.from(new Set([
          input.dashboard.escalationCoordination?.blockReason ?? "coordination_freeze_active",
          ...(input.dashboard.continuityConvergence?.unresolvedDisputes ?? []),
        ])).filter(Boolean)
      : [],
    lineage: Array.from(new Set([
      input.dashboard.escalationCoordination?.escalationLineageId,
      ...(input.dashboard.continuityConvergence?.evidence ?? []),
    ])).filter(Boolean) as string[],
  };
}
