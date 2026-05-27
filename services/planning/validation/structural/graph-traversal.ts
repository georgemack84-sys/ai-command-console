import type { GraphIndex } from "./graph-index";

export function traverseFromRoot(graph: GraphIndex, rootId: string) {
  const visited = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);
    for (const next of graph.outgoing.get(current) ?? []) {
      queue.push(next);
    }
  }

  return visited;
}

export function computeGraphDepth(graph: GraphIndex) {
  const memo = new Map<string, number>();

  function depth(nodeId: string): number {
    const cached = memo.get(nodeId);
    if (cached) {
      return cached;
    }
    const parents = graph.incoming.get(nodeId) ?? [];
    const value = parents.length === 0 ? 1 : 1 + Math.max(...parents.map((parent) => depth(parent)));
    memo.set(nodeId, value);
    return value;
  }

  return graph.nodes.reduce((maxDepth, node) => Math.max(maxDepth, depth(node.stepId)), 0);
}

