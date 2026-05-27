import type { ValidationError, ValidationTopologySummary } from "../validation-result";
import { detectGraphCycles } from "../structural/graph-cycle-detector";
import type { GraphIndex } from "../structural/graph-index";
import { computeGraphDepth, traverseFromRoot } from "../structural/graph-traversal";

export function runTopologyPass(graph: GraphIndex) {
  const errors: ValidationError[] = [];
  const cycles = detectGraphCycles(graph);

  for (const cycle of cycles) {
    errors.push({
      code: "STRUCTURE_CYCLE_DETECTED",
      path: `steps.${cycle}.dependencies`,
      message: `Cycle detected at ${cycle}.`,
      stage: "topology",
    });
  }

  const rootIds = [...graph.rootIds];
  if (rootIds.length !== 1) {
    errors.push({
      code: "STRUCTURE_DISCONNECTED_GRAPH",
      path: "steps",
      message: "Plan must have exactly one deterministic root.",
      stage: "topology",
    });
    for (const orphan of rootIds.slice(1)) {
      errors.push({
        code: "STRUCTURE_ORPHAN_NODE",
        path: `steps.${orphan}`,
        message: `Orphan root ${orphan} detected.`,
        stage: "topology",
      });
    }
  }

  const reachable = rootIds.length > 0 ? traverseFromRoot(graph, rootIds[0]!) : new Set<string>();
  if (reachable.size > 0 && reachable.size !== graph.nodes.length) {
    errors.push({
      code: "STRUCTURE_DISCONNECTED_GRAPH",
      path: "steps",
      message: "Graph is disconnected.",
      stage: "topology",
    });
  }

  const topology: ValidationTopologySummary = {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    branchCount: 0,
    maxDepth: computeGraphDepth(graph),
  };

  return {
    errors,
    topology,
  };
}

