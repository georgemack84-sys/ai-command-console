import type {
  BoundedOrchestrationInput,
  BoundedOrchestrationTopology,
} from "@/types/bounded-orchestration-framework";
import type { ApprovalAwareRoutingResult } from "@/types/approval-aware-coordination-router";
import type { ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";

const MAX_DEPTH = 5;
const MAX_BREADTH = 4;
const MAX_DELEGATION_COUNT = 3;
const MAX_LINEAGE_EXPANSION = 12;
const MAX_GRAPH_NODE_COUNT = 8;

export function buildBoundedOrchestrationTopology(input: BoundedOrchestrationInput): BoundedOrchestrationTopology {
  const lineageExpansion = input.routingResult.lineage.entries.length;
  return Object.freeze({
    routeTarget: input.routingResult.target,
    staticTopology: true,
    depth: lineageExpansion + 1,
    breadth: 1,
    graphNodeCount: lineageExpansion + 3,
    lineageExpansion,
    delegationCount: lineageExpansion,
  });
}

export function validateBoundedOrchestrationTopology(
  topology: BoundedOrchestrationTopology,
): readonly string[] {
  const errors: string[] = [];
  if (topology.depth > MAX_DEPTH) {
    errors.push("topology.depth");
  }
  if (topology.breadth > MAX_BREADTH) {
    errors.push("topology.breadth");
  }
  if (topology.delegationCount > MAX_DELEGATION_COUNT) {
    errors.push("topology.delegationCount");
  }
  if (topology.lineageExpansion > MAX_LINEAGE_EXPANSION) {
    errors.push("topology.lineageExpansion");
  }
  if (topology.graphNodeCount > MAX_GRAPH_NODE_COUNT) {
    errors.push("topology.graphNodeCount");
  }
  return Object.freeze(errors.sort());
}

export function validateOrchestrationTopology(input: {
  coordinationRecord: ConstitutionalCoordinationRecord;
  routingResult: ApprovalAwareRoutingResult;
}): Readonly<{
  topology: BoundedOrchestrationTopology;
  errors: readonly string[];
}> {
  const topology = Object.freeze({
    routeTarget: input.routingResult.target,
    staticTopology: true as const,
    depth: input.routingResult.lineage.entries.length + 1,
    breadth: 1,
    graphNodeCount: input.routingResult.lineage.entries.length + 3,
    lineageExpansion: input.routingResult.lineage.entries.length,
    delegationCount: input.routingResult.lineage.entries.length,
  });
  return Object.freeze({
    topology,
    errors: validateBoundedOrchestrationTopology(topology),
  });
}
