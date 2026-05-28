import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export function buildEvidenceReviewBundle(input: {
  dashboard: RecoveryDashboardReadModel;
  executionId?: string;
}) {
  const auditIds = input.dashboard.auditHistory
    .map((entry) => String(entry.id ?? entry.auditId ?? ""))
    .filter(Boolean);
  const disputeIds = input.dashboard.governanceDisputes
    .map((entry) => String(entry.id ?? entry.disputeId ?? ""))
    .filter(Boolean);

  return {
    bundleId: `evidence:${input.executionId ?? "dashboard"}`,
    executionId: input.executionId ?? null,
    immutable: true as const,
    evidenceReferences: Array.from(new Set([
      ...auditIds,
      ...disputeIds,
      ...(input.dashboard.continuityConvergence?.evidence ?? []),
      ...input.dashboard.activeRecoveries.map((entry) => String(entry.executionId ?? entry.id ?? "")).filter(Boolean),
      ...input.dashboard.blockedRecoveries.map((entry) => String(entry.executionId ?? entry.id ?? "")).filter(Boolean),
    ])).sort(),
    replayVerificationState: input.dashboard.replayVerificationState,
    disputeCount: input.dashboard.governanceDisputes.length,
    approvalCount: input.dashboard.pendingApprovals.length,
  };
}
