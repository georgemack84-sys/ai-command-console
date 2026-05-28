import type { MissionGraphEdge, MissionGraphError, MissionGraphNode, ReplayPath } from "@/types/mission-graph";
import { createMissionGraphError } from "./graphBoundaryEnforcer";

function detectCycle(nodes: readonly MissionGraphNode[], edges: readonly MissionGraphEdge[]): boolean {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.nodeId, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }
    visiting.add(nodeId);
    for (const next of adjacency.get(nodeId) ?? []) {
      if (visit(next)) {
        return true;
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };

  return nodes.some((node) => visit(node.nodeId));
}

export function validateMissionGraphConsistency(input: {
  nodes: readonly MissionGraphNode[];
  edges: readonly MissionGraphEdge[];
  replayPaths: readonly ReplayPath[];
  governanceValidated: boolean;
  replaySafe: boolean;
  lifecycleEntries: number;
  escalationEntries: number;
}): readonly MissionGraphError[] {
  const errors: MissionGraphError[] = [];
  const nodeIds = new Set(input.nodes.map((node) => node.nodeId));
  const connectedNodeIds = new Set<string>();
  for (const edge of input.edges) {
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
      errors.push(createMissionGraphError(
        "MISSION_GRAPH_TOPOLOGY_INCONSISTENCY",
        "Mission graph edge references an unknown node.",
        `edges.${edge.edgeId}`,
      ));
    }
    connectedNodeIds.add(edge.sourceNodeId);
    connectedNodeIds.add(edge.targetNodeId);
  }
  for (const node of input.nodes) {
    if (!connectedNodeIds.has(node.nodeId)) {
      errors.push(createMissionGraphError(
        "MISSION_GRAPH_ORPHAN_NODE",
        "Mission graph node is orphaned from visibility topology.",
        `nodes.${node.nodeId}`,
      ));
    }
  }
  if (detectCycle(input.nodes, input.edges)) {
    errors.push(createMissionGraphError(
      "MISSION_GRAPH_CIRCULAR_DEPENDENCY_CORRUPTION",
      "Mission graph contains a circular dependency topology.",
      "edges",
    ));
  }
  if (!input.governanceValidated) {
    errors.push(createMissionGraphError(
      "MISSION_GRAPH_GOVERNANCE_UNCERTAINTY",
      "Mission graph consumed governance-uncertain evidence.",
      "governance",
    ));
  }
  if (!input.replaySafe) {
    errors.push(createMissionGraphError(
      "MISSION_GRAPH_REPLAY_AMBIGUITY",
      "Mission graph replay ancestry is not replay-safe.",
      "replayPaths",
    ));
  }
  if (input.lifecycleEntries === 0 || input.escalationEntries === 0) {
    errors.push(createMissionGraphError(
      "MISSION_GRAPH_UNKNOWN_LINEAGE",
      "Mission graph requires immutable lifecycle and escalation lineage.",
      "lineage",
    ));
  }
  for (const replayPath of input.replayPaths) {
    if (!replayPath.replaySafe || replayPath.nodeIds.some((nodeId) => !nodeIds.has(nodeId))) {
      errors.push(createMissionGraphError(
        "MISSION_GRAPH_INVALID_REPLAY_ANCESTRY",
        "Mission graph replay path references invalid ancestry.",
        `replayPaths.${replayPath.pathId}`,
      ));
    }
  }
  return Object.freeze(errors);
}
