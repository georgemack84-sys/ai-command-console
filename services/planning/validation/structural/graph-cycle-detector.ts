import type { GraphIndex } from "./graph-index";

export function detectGraphCycles(graph: GraphIndex) {
  const cycles = new Set<string>();
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(nodeId: string) {
    if (visiting.has(nodeId)) {
      cycles.add(nodeId);
      return;
    }
    if (visited.has(nodeId)) {
      return;
    }
    visiting.add(nodeId);
    for (const next of graph.outgoing.get(nodeId) ?? []) {
      visit(next);
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  for (const node of graph.nodes) {
    visit(node.stepId);
  }

  return [...cycles];
}

