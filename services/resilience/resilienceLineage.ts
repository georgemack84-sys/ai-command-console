import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";
import type { ResilienceLineage } from "./resilienceTypes";

export function buildResilienceLineage(dashboard: RecoveryDashboardReadModel): ResilienceLineage {
  const evidence = Array.from(new Set([
    ...dashboard.auditHistory.map((entry) => String(entry.id || "")).filter(Boolean).slice(0, 8),
    ...(dashboard.continuityConvergence?.evidence || []).slice(0, 6),
  ]));

  return {
    evidence,
    lineageId: `resilience:${dashboard.generatedAt}:${evidence[0] || "none"}`,
    generatedAt: dashboard.generatedAt,
  };
}
