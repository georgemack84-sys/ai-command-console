import type { CanonicalPlan } from "../../contracts/plan-types";

export type GraphNode = {
  stepId: string;
  index: number;
  dependencies: string[];
};

export type GraphEdge = {
  from: string;
  to: string;
};

export type GraphIndex = {
  planId: string;
  nodes: GraphNode[];
  nodeMap: Map<string, GraphNode>;
  edges: GraphEdge[];
  incoming: Map<string, string[]>;
  outgoing: Map<string, string[]>;
  rootIds: string[];
};

export function createGraphIndex(plan: CanonicalPlan): GraphIndex {
  const nodes = plan.steps.map((step, index) => ({
    stepId: step.stepId,
    index,
    dependencies: [...step.dependencies],
  }));
  const nodeMap = new Map(nodes.map((node) => [node.stepId, node]));
  const edges: GraphEdge[] = [];
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) {
    incoming.set(node.stepId, [...node.dependencies]);
    outgoing.set(node.stepId, []);
  }

  for (const node of nodes) {
    for (const dependency of node.dependencies) {
      edges.push({ from: dependency, to: node.stepId });
      outgoing.set(dependency, [...(outgoing.get(dependency) ?? []), node.stepId]);
    }
  }

  return {
    planId: plan.planId,
    nodes,
    nodeMap,
    edges,
    incoming,
    outgoing,
    rootIds: nodes.filter((node) => node.dependencies.length === 0).map((node) => node.stepId),
  };
}

