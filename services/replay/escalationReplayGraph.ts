import type { EscalationReplayGraph } from "@/types/escalation";
import { hashEscalationCoordinationValue } from "@/services/escalation/escalationHasher";

export function buildEscalationReplayGraph(input: {
  coordinationId: string;
  freshnessHash: string;
  lifecycleHash: string;
  correlationHash: string;
  coordinationHash: string;
  readinessHash: string;
  createdAt: string;
}): EscalationReplayGraph {
  const nodes = Object.freeze([
    Object.freeze({ nodeId: "freshness", sourceType: "freshness" as const, sourceHash: input.freshnessHash, createdAt: input.createdAt }),
    Object.freeze({ nodeId: "lifecycle", sourceType: "lifecycle" as const, sourceHash: input.lifecycleHash, createdAt: input.createdAt }),
    Object.freeze({ nodeId: "correlation", sourceType: "correlation" as const, sourceHash: input.correlationHash, createdAt: input.createdAt }),
    Object.freeze({ nodeId: "coordination", sourceType: "coordination" as const, sourceHash: input.coordinationHash, createdAt: input.createdAt }),
    Object.freeze({ nodeId: "readiness", sourceType: "readiness" as const, sourceHash: input.readinessHash, createdAt: input.createdAt }),
  ]);
  const timelineHashes = Object.freeze(nodes.map((node) => node.sourceHash));
  return Object.freeze({
    graphId: hashEscalationCoordinationValue("escalation-replay-graph-id", {
      coordinationId: input.coordinationId,
      createdAt: input.createdAt,
    }),
    coordinationId: input.coordinationId,
    nodes,
    timelineHashes,
    replaySafe: true,
    createdAt: input.createdAt,
    graphHash: hashEscalationCoordinationValue("escalation-replay-graph", {
      coordinationId: input.coordinationId,
      nodes,
      timelineHashes,
      createdAt: input.createdAt,
    }),
  });
}
