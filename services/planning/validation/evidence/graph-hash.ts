import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import type { GraphIndex } from "../structural/graph-index";

export function hashValidationGraph(graph: GraphIndex) {
  return hashPayloadDeterministically({
    planId: graph.planId,
    nodes: graph.nodes.map((node) => ({
      stepId: node.stepId,
      index: node.index,
      dependencies: [...node.dependencies],
    })),
    edges: graph.edges
      .map((edge) => `${edge.from}->${edge.to}`)
      .sort((left, right) => left.localeCompare(right)),
    roots: [...graph.rootIds].sort((left, right) => left.localeCompare(right)),
  });
}

