import type { ConvergenceTelemetryEvent } from "./convergenceTypes";

export function buildConvergenceTelemetry({
  continuityConfidence,
  divergenceScore,
  replayDrift,
  escalationInstability,
  orphanedOperationCount,
  staleOwnershipCount,
  unresolvedDisputeCount,
  systemicRisk,
  requiresContainment,
  requiresEscalation,
  timestamp,
}: {
  continuityConfidence: number;
  divergenceScore: number;
  replayDrift: number;
  escalationInstability: number;
  orphanedOperationCount: number;
  staleOwnershipCount: number;
  unresolvedDisputeCount: number;
  systemicRisk: number;
  requiresContainment: boolean;
  requiresEscalation: boolean;
  timestamp: string;
}): ConvergenceTelemetryEvent[] {
  return [
    { eventType: "convergence.confidence", value: continuityConfidence, timestamp },
    { eventType: "divergence.frequency", value: divergenceScore, timestamp },
    { eventType: "replay.drift.velocity", value: replayDrift, timestamp },
    { eventType: "escalation.instability", value: escalationInstability, timestamp },
    { eventType: "orphaned.operation.count", value: orphanedOperationCount, timestamp },
    { eventType: "stale.ownership.count", value: staleOwnershipCount, timestamp },
    { eventType: "unresolved.dispute.count", value: unresolvedDisputeCount, timestamp },
    { eventType: "systemic.divergence.risk", value: systemicRisk, timestamp },
    { eventType: "containment.recommendation", value: requiresContainment ? 1 : 0, timestamp },
    { eventType: "escalation.recommendation", value: requiresEscalation ? 1 : 0, timestamp },
  ];
}
