import type { MissionGraphSnapshot } from "@/types/mission-graph";
import type { RecursiveLoopSignal } from "@/types/coordination-containment";

const MAX_COORDINATION_DEPTH = 8;

export function classifyRecursiveLoops(snapshot: MissionGraphSnapshot): RecursiveLoopSignal {
  const adjacency = new Map<string, string[]>();
  for (const edge of snapshot.edges) {
    const next = adjacency.get(edge.sourceNodeId) ?? [];
    next.push(edge.targetNodeId);
    adjacency.set(edge.sourceNodeId, next);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycleEvidence = new Set<string>();
  let maxDepth = 0;

  function walk(nodeId: string, depth: number, trail: readonly string[]) {
    maxDepth = Math.max(maxDepth, depth);
    if (visiting.has(nodeId)) {
      cycleEvidence.add([...trail, nodeId].join("->"));
      return;
    }
    if (visited.has(nodeId)) {
      return;
    }
    visiting.add(nodeId);
    for (const next of adjacency.get(nodeId) ?? []) {
      walk(next, depth + 1, [...trail, nodeId]);
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  for (const node of snapshot.nodes) {
    walk(node.nodeId, 1, []);
  }

  return Object.freeze({
    path: Object.freeze(Array.from(cycleEvidence).sort()),
    recursive: cycleEvidence.size > 0,
    depthExceeded: maxDepth > MAX_COORDINATION_DEPTH,
    evidence: Object.freeze([
      ...Array.from(cycleEvidence).sort(),
      ...(maxDepth > MAX_COORDINATION_DEPTH ? [`depth:${maxDepth}`] : []),
    ]),
  });
}
