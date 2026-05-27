import type { TenantContext } from "../tenancy/tenantTypes";
import { recordReplayConfidence, recordReplayMetric } from "./replayMetrics";

export function recordReplayTelemetry({
  tenantContext,
  metric,
  confidenceScore,
}: {
  tenantContext?: TenantContext;
  metric: string;
  confidenceScore?: number;
}) {
  recordReplayMetric(metric, tenantContext?.tenantId || null);
  if (typeof confidenceScore === "number") {
    recordReplayConfidence(confidenceScore, tenantContext?.tenantId || null);
  }
}
