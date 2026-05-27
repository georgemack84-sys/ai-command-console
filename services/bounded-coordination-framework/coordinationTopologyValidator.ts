import type {
  CoordinationCeiling,
  CoordinationFrameworkError,
  CoordinationTopologyGraph,
  CoordinationTopologyNode,
} from "@/types/bounded-coordination-framework";
import { createCoordinationError } from "./coordinationErrors";

type Stats = {
  maxDepthObserved: number;
  maxBranchObserved: number;
  totalDelegations: number;
  workflowNodes: number;
};

function buildNodeMap(nodes: readonly CoordinationTopologyNode[]) {
  return new Map(nodes.map((node) => [node.nodeId, node]));
}

export function validateCoordinationTopology(input: {
  graph: CoordinationTopologyGraph;
  ceiling: CoordinationCeiling;
}): { errors: readonly CoordinationFrameworkError[]; stats: Stats } {
  const errors: CoordinationFrameworkError[] = [];
  const nodeMap = buildNodeMap(input.graph.nodes);
  const seen = new Set<string>();
  const stack = new Set<string>();
  let maxDepthObserved = 0;
  let maxBranchObserved = 0;
  let totalDelegations = 0;

  const roots = input.graph.nodes.filter((node) => !node.parentNodeId);
  if (roots.length !== 1 || roots[0]?.nodeId !== input.graph.rootNodeId) {
    errors.push(createCoordinationError("COORDINATION_TOPOLOGY_INVALID", "Coordination topology requires exactly one explicit root.", "rootNodeId"));
  }

  for (const node of input.graph.nodes) {
    totalDelegations += node.delegatedNodeIds.length;
    maxBranchObserved = Math.max(maxBranchObserved, node.delegatedNodeIds.length);
    if (node.parentNodeId && !nodeMap.has(node.parentNodeId)) {
      errors.push(createCoordinationError("COORDINATION_HIDDEN_PATH_DETECTED", "Node parent must be explicitly present in the topology.", `nodes.${node.nodeId}.parentNodeId`));
    }
    for (const delegatedNodeId of node.delegatedNodeIds) {
      if (!nodeMap.has(delegatedNodeId)) {
        errors.push(createCoordinationError("COORDINATION_HIDDEN_PATH_DETECTED", "Delegated nodes must be explicitly present in the topology.", `nodes.${node.nodeId}.delegatedNodeIds`));
      }
    }
  }

  const walk = (nodeId: string, depth: number) => {
    if (stack.has(nodeId)) {
      errors.push(createCoordinationError("COORDINATION_RECURSION_DETECTED", "Recursive coordination is constitutionally forbidden.", `nodes.${nodeId}`));
      return;
    }
    if (seen.has(nodeId)) {
      return;
    }
    seen.add(nodeId);
    stack.add(nodeId);
    maxDepthObserved = Math.max(maxDepthObserved, depth);
    const node = nodeMap.get(nodeId);
    if (!node) {
      stack.delete(nodeId);
      return;
    }
    for (const delegatedNodeId of node.delegatedNodeIds) {
      walk(delegatedNodeId, depth + 1);
    }
    stack.delete(nodeId);
  };

  if (input.graph.rootNodeId) {
    walk(input.graph.rootNodeId, 1);
  }

  if (input.graph.nodes.length !== seen.size) {
    errors.push(createCoordinationError("COORDINATION_HIDDEN_PATH_DETECTED", "All coordination nodes must be reachable from the declared root.", "nodes"));
  }
  if (maxDepthObserved > input.ceiling.maxDepth) {
    errors.push(createCoordinationError("COORDINATION_DEPTH_EXCEEDED", "Coordination depth exceeded the constitutional ceiling.", "maxDepth"));
  }
  if (maxBranchObserved > input.ceiling.maxBranchFactor) {
    errors.push(createCoordinationError("COORDINATION_BRANCH_FACTOR_EXCEEDED", "Coordination branch factor exceeded the constitutional ceiling.", "maxBranchFactor"));
  }
  if (totalDelegations > input.ceiling.maxDelegations) {
    errors.push(createCoordinationError("COORDINATION_TOPOLOGY_INVALID", "Total delegations exceeded the constitutional ceiling.", "maxDelegations"));
  }
  if (input.graph.nodes.length > input.ceiling.maxWorkflowNodes) {
    errors.push(createCoordinationError("COORDINATION_TOPOLOGY_INVALID", "Workflow node count exceeded the constitutional ceiling.", "maxWorkflowNodes"));
  }

  return {
    errors: Object.freeze(errors),
    stats: {
      maxDepthObserved,
      maxBranchObserved,
      totalDelegations,
      workflowNodes: input.graph.nodes.length,
    },
  };
}
