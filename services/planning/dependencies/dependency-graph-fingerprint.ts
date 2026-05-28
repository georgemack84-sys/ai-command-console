import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import { serializeDeterministically } from "../normalization";
import type { DependencyGraph } from "./dependency-types";

export function createDependencyGraphFingerprint(graph: DependencyGraph): string {
  const payload = {
    planId: graph.planId,
    graphVersion: graph.graphVersion,
    graphHash: graph.graphHash ?? "",
    roots: [...graph.roots],
    terminalStepIds: [...graph.terminalStepIds],
    nodes: graph.nodes.map((node) => ({
      stepId: node.stepId,
      sourceId: node.sourceId ?? null,
      sequenceIndex: node.sequenceIndex,
      stepType: node.stepType ?? null,
      operation: node.operation ?? null,
      branchType: node.branchType ?? null,
      requiresApproval: node.requiresApproval ?? false,
      requiresPreflight: node.requiresPreflight ?? false,
      isDestructive: node.isDestructive ?? false,
      hasExternalSideEffect: node.hasExternalSideEffect ?? false,
      idempotencyKey: node.idempotencyKey ?? null,
    })),
    edges: graph.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      edgeType: edge.edgeType,
    })),
  };

  return hashPayloadDeterministically(JSON.parse(serializeDeterministically(payload)));
}
