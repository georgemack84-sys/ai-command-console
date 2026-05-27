import { clampMetric } from "../stability/stabilityMetrics";

export function buildAuditTelemetry(input: {
  disputeCount: number;
  replayMismatchCount: number;
  exportedCount: number;
  timestamp: string;
}) {
  return [
    { metric: "audit_dispute_count", value: clampMetric(input.disputeCount, 0), timestamp: input.timestamp },
    { metric: "audit_replay_mismatch_count", value: clampMetric(input.replayMismatchCount, 0), timestamp: input.timestamp },
    { metric: "audit_exported_count", value: clampMetric(input.exportedCount, 0), timestamp: input.timestamp },
  ];
}
