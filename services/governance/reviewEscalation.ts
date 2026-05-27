import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function buildReviewEscalation(input: {
  dashboard: RecoveryDashboardReadModel;
  reviewType: string;
}) {
  const escalationRequired = Boolean(
    input.dashboard.governanceDisputes.length > 0
    || input.dashboard.escalationCoordination?.blocked
    || input.dashboard.continuityConvergence?.requiresEscalation,
  );

  return {
    reviewType: input.reviewType,
    escalationRequired,
    escalationChain: escalationRequired
      ? Array.from(new Set([
          input.dashboard.escalationCoordination?.escalationLineageId,
          ...(input.dashboard.continuityConvergence?.evidence ?? []),
        ])).filter(Boolean) as string[]
      : [],
  };
}
