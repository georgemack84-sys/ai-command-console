import { createDependencyError } from "./dependency-errors";
import type { DependencyGraph, DependencyNode, DependencyValidationError } from "./dependency-types";

function compareNodes(left: DependencyNode, right: DependencyNode): number {
  return left.sequenceIndex - right.sequenceIndex
    || left.stepId.localeCompare(right.stepId)
    || (left.stepType ?? "").localeCompare(right.stepType ?? "")
    || (left.declaredPriority ?? "").localeCompare(right.declaredPriority ?? "")
    || left.stepId.localeCompare(right.stepId);
}

export function stableTopologicalSort(graph: DependencyGraph): {
  orderedStepIds?: string[];
  errors: DependencyValidationError[];
} {
  const inDegree = new Map(graph.nodes.map((node) => [node.stepId, 0]));
  const adjacency = new Map<string, string[]>();
  const nodeMap = new Map(graph.nodes.map((node) => [node.stepId, node]));

  for (const node of graph.nodes) {
    adjacency.set(node.stepId, []);
  }

  for (const edge of graph.edges) {
    adjacency.get(edge.from)?.push(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  const ready = graph.nodes
    .filter((node) => (inDegree.get(node.stepId) ?? 0) === 0)
    .sort(compareNodes);
  const ordered: string[] = [];

  while (ready.length > 0) {
    const node = ready.shift()!;
    ordered.push(node.stepId);

    for (const neighbor of adjacency.get(node.stepId) ?? []) {
      const nextDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, nextDegree);
      if (nextDegree === 0) {
        ready.push(nodeMap.get(neighbor)!);
        ready.sort(compareNodes);
      }
    }
  }

  if (ordered.length !== graph.nodes.length) {
    return {
      errors: [createDependencyError(
        "PLAN_ORDERING_NON_DETERMINISTIC",
        "Stable topological ordering could not be produced.",
      )],
    };
  }

  return {
    orderedStepIds: ordered,
    errors: [],
  };
}
