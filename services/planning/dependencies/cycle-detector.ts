import { createDependencyError } from "./dependency-errors";
import type { DependencyGraph, DependencyValidationError } from "./dependency-types";

export function detectDependencyCycles(graph: DependencyGraph): {
  errors: DependencyValidationError[];
  cyclePath?: string[];
} {
  const adjacency = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adjacency.set(node.stepId, []);
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.from)?.push(edge.to);
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const stack: string[] = [];
  let cyclePath: string[] | undefined;

  function visit(stepId: string) {
    if (cyclePath) {
      return;
    }
    if (active.has(stepId)) {
      const start = stack.indexOf(stepId);
      cyclePath = [...stack.slice(start), stepId];
      return;
    }
    if (visited.has(stepId)) {
      return;
    }

    visited.add(stepId);
    active.add(stepId);
    stack.push(stepId);

    for (const next of adjacency.get(stepId) ?? []) {
      visit(next);
      if (cyclePath) {
        return;
      }
    }

    stack.pop();
    active.delete(stepId);
  }

  for (const node of graph.nodes) {
    visit(node.stepId);
    if (cyclePath) {
      break;
    }
  }

  if (!cyclePath) {
    return { errors: [] };
  }

  return {
    errors: [createDependencyError(
      "PLAN_DEPENDENCY_CYCLE_DETECTED",
      `Dependency cycle detected: ${cyclePath.join(" -> ")}`,
      cyclePath[0],
      cyclePath,
    )],
    cyclePath,
  };
}
