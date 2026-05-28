import type {
  CoordinationCeiling,
  CoordinationFrameworkError,
  CoordinationTopologyGraph,
  DelegationBoundary,
} from "@/types/bounded-coordination-framework";
import { createCoordinationError } from "./coordinationErrors";

export function validateDelegationBoundaries(input: {
  graph: CoordinationTopologyGraph;
  ceiling: CoordinationCeiling;
}): { boundaries: readonly DelegationBoundary[]; errors: readonly CoordinationFrameworkError[] } {
  const errors: CoordinationFrameworkError[] = [];
  const boundaries: DelegationBoundary[] = input.graph.nodes.map((node) => {
    const reasons: string[] = [];
    const withinBranchFactor = node.delegatedNodeIds.length <= input.ceiling.maxBranchFactor;
    const withinDelegationLimit = node.delegatedNodeIds.length <= input.ceiling.maxDelegations;
    const withinEscalationDepth = node.escalationDepth <= input.ceiling.maxEscalationDepth;
    const withinDepth = true;
    const allowed = withinBranchFactor && withinDelegationLimit && withinEscalationDepth;
    if (!withinBranchFactor) {
      reasons.push("branch-factor-exceeded");
      errors.push(createCoordinationError("COORDINATION_BRANCH_FACTOR_EXCEEDED", "Delegation branch factor exceeded the constitutional ceiling.", `nodes.${node.nodeId}.delegatedNodeIds`));
    }
    if (!withinDelegationLimit) {
      reasons.push("delegation-limit-exceeded");
      errors.push(createCoordinationError("COORDINATION_TOPOLOGY_INVALID", "Delegation count exceeded the constitutional ceiling.", `nodes.${node.nodeId}.delegatedNodeIds`));
    }
    if (!withinEscalationDepth) {
      reasons.push("escalation-depth-exceeded");
      errors.push(createCoordinationError("COORDINATION_AUTHORITY_DRIFT", "Escalation depth exceeded the constitutional ceiling.", `nodes.${node.nodeId}.escalationDepth`));
    }
    return Object.freeze({
      nodeId: node.nodeId,
      allowed,
      withinDepth,
      withinBranchFactor,
      withinDelegationLimit,
      withinEscalationDepth,
      reasons: Object.freeze(reasons),
    });
  });

  return {
    boundaries: Object.freeze(boundaries),
    errors: Object.freeze(errors),
  };
}
