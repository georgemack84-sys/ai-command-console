import { clampMetric } from "../stability/stabilityMetrics";

export function buildCoordinationTelemetry(input: {
  coordinationAttempts: number;
  conflictCount: number;
  frozenCount: number;
  containmentRoutingCount: number;
  replayMismatchCount: number;
  denialCount: number;
  approvalRequiredCount: number;
  timestamp: string;
}) {
  return [
    { metric: "coordination_attempts", value: clampMetric(input.coordinationAttempts, 0), timestamp: input.timestamp },
    { metric: "coordination_conflict_count", value: clampMetric(input.conflictCount, 0), timestamp: input.timestamp },
    { metric: "coordination_frozen_count", value: clampMetric(input.frozenCount, 0), timestamp: input.timestamp },
    { metric: "coordination_containment_routing_count", value: clampMetric(input.containmentRoutingCount, 0), timestamp: input.timestamp },
    { metric: "coordination_replay_mismatch_count", value: clampMetric(input.replayMismatchCount, 0), timestamp: input.timestamp },
    { metric: "coordination_denial_count", value: clampMetric(input.denialCount, 0), timestamp: input.timestamp },
    { metric: "coordination_approval_required_count", value: clampMetric(input.approvalRequiredCount, 0), timestamp: input.timestamp },
  ];
}
