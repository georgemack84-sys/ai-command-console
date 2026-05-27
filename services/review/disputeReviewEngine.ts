import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function buildDisputeReview(input: {
  dashboard: RecoveryDashboardReadModel;
}) {
  const unresolved = [
    ...input.dashboard.governanceDisputes.map((entry) => String(entry.id ?? entry.disputeId ?? "governance-dispute")),
    ...(input.dashboard.continuityConvergence?.unresolvedDisputes ?? []),
  ];

  return {
    reviewState: unresolved.length > 0 ? "DISPUTED" : "VERIFIED",
    unresolvedDisputes: unresolved,
    constitutionalReasoning: unresolved.length > 0
      ? ["disputed truth blocks unsafe continuation"]
      : ["no active constitutional disputes"],
  };
}
