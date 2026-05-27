import type { CoordinationFrameworkError, CoordinationTopologyGraph, CoordinationTopologyNode } from "@/types/bounded-coordination-framework";
import { createCoordinationError } from "./coordinationErrors";

const ALLOWED_TOPOLOGIES = new Set<CoordinationTopologyGraph["topologyType"]>([
  "linear",
  "bounded_tree",
  "bounded_fanout",
]);

export function validateCoordinationTopologySchema(graph: CoordinationTopologyGraph): readonly CoordinationFrameworkError[] {
  const errors: CoordinationFrameworkError[] = [];
  if (!ALLOWED_TOPOLOGIES.has(graph.topologyType)) {
    errors.push(createCoordinationError("COORDINATION_TOPOLOGY_INVALID", "Unknown coordination topology is unsafe.", "topologyType"));
  }
  if (!graph.nodes.length) {
    errors.push(createCoordinationError("COORDINATION_TOPOLOGY_INVALID", "Coordination topology requires at least one node.", "nodes"));
  }
  return Object.freeze(errors);
}

export function validateCoordinationNode(node: CoordinationTopologyNode): readonly CoordinationFrameworkError[] {
  const errors: CoordinationFrameworkError[] = [];
  if (!node.nodeId || !node.authorityBoundaryId || !node.governanceSnapshotId || !node.replayHash || !node.createdAt) {
    errors.push(createCoordinationError("COORDINATION_TOPOLOGY_INVALID", "Coordination nodes require stable lineage fields.", "nodes"));
  }
  if (!Number.isFinite(node.escalationDepth) || node.escalationDepth < 0) {
    errors.push(createCoordinationError("COORDINATION_TOPOLOGY_INVALID", "Escalation depth must be finite and non-negative.", "escalationDepth"));
  }
  if (!Number.isFinite(node.estimatedDurationMs) || node.estimatedDurationMs < 0) {
    errors.push(createCoordinationError("COORDINATION_TOPOLOGY_INVALID", "Estimated duration must be finite and non-negative.", "estimatedDurationMs"));
  }
  return Object.freeze(errors);
}
