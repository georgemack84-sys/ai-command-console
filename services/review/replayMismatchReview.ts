import type { TenantContext } from "../tenancy/tenantTypes";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";
import { verifyReplay } from "../replay/replayVerificationEngine";

export function buildReplayMismatchReview(input: {
  tenantContext: TenantContext;
  dashboard: RecoveryDashboardReadModel;
  executionId?: string;
}) {
  const executionId = input.executionId
    ?? String(input.dashboard.activeRecoveries[0]?.executionId ?? input.dashboard.blockedRecoveries[0]?.executionId ?? "dashboard");
  const result = verifyReplay({
    tenantContext: input.tenantContext,
    executionId,
    ledgerEvents: input.dashboard.auditHistory.map((entry, index) => ({
      eventType: String(entry.eventType ?? entry.type ?? `audit:${index}`),
      eventPayload: entry,
    })),
    auditEvents: input.dashboard.auditHistory,
    continuitySnapshots: input.dashboard.simulationOutcomes,
  });

  if (!result.ok) {
    return {
      reviewState: "FROZEN",
      replayVerified: false,
      divergenceCount: 0,
      blockedReasons: [result.error.code],
      confidenceScore: 0,
      lineage: input.dashboard.auditHistory.map((entry) => String(entry.id ?? entry.auditId ?? "audit")).filter(Boolean),
    };
  }

  return {
    reviewState: result.data.divergences.length > 0 ? "FROZEN" : "VERIFIED",
    replayVerified: result.data.verified,
    divergenceCount: result.data.divergences.length,
    blockedReasons: result.data.divergences.map((divergence) => divergence.category),
    confidenceScore: result.data.confidence.score,
    lineage: result.data.reconstruction.replaySequence,
  };
}
