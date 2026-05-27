import type { DependencyDriftView } from "@/types/plan-diff-inspector";
import { collectNamedArrayValues, isPlainObject } from "./inspectionHasher";

function normalizeEdges(value: unknown): readonly string[] {
  const edgeValues = new Set<string>();

  const dependencyArrays = collectNamedArrayValues(value, (_path, key) => /dependenc/i.test(key));
  for (const entry of dependencyArrays) {
    for (const item of entry.values) {
      if (typeof item === "string") {
        edgeValues.add(item);
      } else if (isPlainObject(item)) {
        const from = typeof item.from === "string" ? item.from : undefined;
        const to = typeof item.to === "string" ? item.to : undefined;
        if (from && to) {
          edgeValues.add(`${from}->${to}`);
        }
      }
    }
  }

  if (isPlainObject(value) && isPlainObject((value as Record<string, unknown>).traceViewSummary)) {
    const dependencyGraph = ((value as Record<string, unknown>).traceViewSummary as Record<string, unknown>).dependencyGraph;
    if (isPlainObject(dependencyGraph) && Array.isArray(dependencyGraph.edges)) {
      for (const edge of dependencyGraph.edges) {
        if (isPlainObject(edge) && typeof edge.from === "string" && typeof edge.to === "string") {
          edgeValues.add(`${edge.from}->${edge.to}`);
        }
      }
    }
  }

  return Object.freeze([...edgeValues].sort((left, right) => left.localeCompare(right)));
}

function detectCycle(edges: readonly string[]): boolean {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const [from, to] = edge.split("->");
    if (!from || !to) {
      continue;
    }
    const next = adjacency.get(from) ?? [];
    next.push(to);
    adjacency.set(from, next);
  }
  const visited = new Set<string>();
  const active = new Set<string>();

  function walk(node: string): boolean {
    if (active.has(node)) {
      return true;
    }
    if (visited.has(node)) {
      return false;
    }
    visited.add(node);
    active.add(node);
    for (const next of adjacency.get(node) ?? []) {
      if (walk(next)) {
        return true;
      }
    }
    active.delete(node);
    return false;
  }

  for (const node of adjacency.keys()) {
    if (walk(node)) {
      return true;
    }
  }
  return false;
}

export function projectDependencyDrift(input: {
  baseArtifact: unknown;
  targetArtifact: unknown;
}): DependencyDriftView {
  const baseEdges = normalizeEdges(input.baseArtifact);
  const targetEdges = normalizeEdges(input.targetArtifact);
  const addedEdges = targetEdges.filter((edge) => !baseEdges.includes(edge));
  const removedEdges = baseEdges.filter((edge) => !targetEdges.includes(edge));
  const reorderedDependencies = addedEdges.length === 0
    && removedEdges.length === 0
    && JSON.stringify(baseEdges) !== JSON.stringify(targetEdges);
  const cycleDetected = detectCycle(targetEdges);
  const duplicateEdges = new Set(targetEdges).size !== targetEdges.length;
  const unknownDrift = baseEdges.length === 0 && targetEdges.length === 0;

  return Object.freeze({
    driftClass: unknownDrift
      ? "UNKNOWN_DRIFT"
      : addedEdges.length > 0 || removedEdges.length > 0 || reorderedDependencies || cycleDetected || duplicateEdges
        ? "SEMANTIC_DRIFT"
        : "NO_DRIFT",
    addedEdges: Object.freeze(addedEdges),
    removedEdges: Object.freeze(removedEdges),
    reorderedDependencies,
    cycleDetected,
    duplicateEdges,
    visibleEdgeCount: targetEdges.length,
  });
}
