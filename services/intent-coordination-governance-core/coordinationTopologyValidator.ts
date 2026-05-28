import type {
  CoordinationBoundaryContract,
  CoordinationGovernanceError,
  IntentCoordinationTopology,
} from "@/types/intent-coordination-governance-core";
import { createCoordinationGovernanceError } from "./coordinationErrors";

export type TopologyStats = Readonly<{
  maxDepthObserved: number;
  relationshipCount: number;
  escalationEdgesObserved: number;
  scopeBindingsObserved: number;
  dependencyEdgesObserved: number;
}>;

export function validateIntentCoordinationTopology(input: {
  topology: IntentCoordinationTopology;
  boundaryContract: CoordinationBoundaryContract;
}): Readonly<{
  errors: readonly CoordinationGovernanceError[];
  stats: TopologyStats;
}> {
  const errors: CoordinationGovernanceError[] = [];
  const nodeMap = new Map(input.topology.nodes.map((node) => [node.intentId, node]));
  const adjacency = new Map<string, string[]>();
  let escalationEdgesObserved = 0;
  let dependencyEdgesObserved = 0;
  let scopeBindingsObserved = 0;

  for (const node of input.topology.nodes) {
    adjacency.set(node.intentId, []);
    scopeBindingsObserved += node.scopeBindings.length;
  }

  for (const relationship of input.topology.relationships) {
    const current = adjacency.get(relationship.parentIntentId);
    if (!current) {
      errors.push(createCoordinationGovernanceError("COORDINATION_TOPOLOGY_INVALID", "Hidden parent intent detected in coordination topology.", `relationships.${relationship.relationshipId}`));
      continue;
    }
    current.push(relationship.childIntentId);
    if (relationship.relationshipType === "escalation") {
      escalationEdgesObserved += 1;
    }
    if (relationship.relationshipType === "dependency") {
      dependencyEdgesObserved += 1;
    }
  }

  if (!nodeMap.has(input.topology.rootIntentId)) {
    errors.push(createCoordinationGovernanceError("COORDINATION_TOPOLOGY_INVALID", "Root intent must be explicitly present in the topology.", "rootIntentId"));
  }

  const visited = new Set<string>();
  const stack = new Set<string>();
  let maxDepthObserved = 0;

  const walk = (intentId: string, depth: number) => {
    if (stack.has(intentId)) {
      errors.push(createCoordinationGovernanceError("COORDINATION_RECURSION_DETECTED", "Recursive coordination is constitutionally forbidden.", `nodes.${intentId}`));
      return;
    }
    if (visited.has(intentId)) {
      return;
    }
    visited.add(intentId);
    stack.add(intentId);
    maxDepthObserved = Math.max(maxDepthObserved, depth);
    for (const childIntentId of adjacency.get(intentId) ?? []) {
      if (!nodeMap.has(childIntentId)) {
        errors.push(createCoordinationGovernanceError("COORDINATION_TOPOLOGY_INVALID", "Hidden dependency detected in coordination topology.", `nodes.${intentId}`));
        continue;
      }
      walk(childIntentId, depth + 1);
    }
    stack.delete(intentId);
  };

  walk(input.topology.rootIntentId, 1);

  if (visited.size !== input.topology.nodes.length) {
    errors.push(createCoordinationGovernanceError("COORDINATION_TOPOLOGY_INVALID", "All coordination nodes must be reachable from the declared root.", "nodes"));
  }
  if (maxDepthObserved > input.boundaryContract.maxRelationshipDepth) {
    errors.push(createCoordinationGovernanceError("COORDINATION_SCOPE_EXCEEDED", "Relationship depth exceeded the constitutional ceiling.", "maxRelationshipDepth"));
  }
  if (input.topology.relationships.length > input.boundaryContract.maxRelationships) {
    errors.push(createCoordinationGovernanceError("COORDINATION_SCOPE_EXCEEDED", "Relationship count exceeded the constitutional ceiling.", "maxRelationships"));
  }
  if (escalationEdgesObserved > input.boundaryContract.maxEscalationEdges) {
    errors.push(createCoordinationGovernanceError("ESCALATION_CONTAINMENT_VIOLATION", "Escalation edges exceeded the constitutional ceiling.", "maxEscalationEdges"));
  }
  if (scopeBindingsObserved > input.boundaryContract.maxScopeBindings) {
    errors.push(createCoordinationGovernanceError("COORDINATION_CONTAINMENT_VIOLATION", "Scope bindings exceeded the constitutional ceiling.", "maxScopeBindings"));
  }
  if (dependencyEdgesObserved > input.boundaryContract.maxDependencyEdges) {
    errors.push(createCoordinationGovernanceError("COORDINATION_CONTAINMENT_VIOLATION", "Dependency edges exceeded the constitutional ceiling.", "maxDependencyEdges"));
  }

  return Object.freeze({
    errors: Object.freeze(errors),
    stats: Object.freeze({
      maxDepthObserved,
      relationshipCount: input.topology.relationships.length,
      escalationEdgesObserved,
      scopeBindingsObserved,
      dependencyEdgesObserved,
    }),
  });
}
