import type { DependencyEdge, DependencyNode, DependencyProjection, TraceViewerWarning } from "@/types/step-trace-viewer";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import { hashTraceViewerValue } from "./traceViewHasher";

function detectCycle(edges: readonly { from: string; to: string }[]): boolean {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adjacency.get(edge.from) ?? [];
    list.push(edge.to);
    adjacency.set(edge.from, list);
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

export function projectDependencyGraph(
  validation: ValidationPipelineOutput,
): { projection: DependencyProjection; warnings: readonly TraceViewerWarning[] } {
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];
  const seenEdges = new Set<string>();
  const warnings: TraceViewerWarning[] = [];

  nodes.push({
    nodeId: "validation-root",
    label: validation.result.validationId,
    kind: "validation" as const,
    status: "ok" as const,
  });

  for (const validator of Object.values(validation.result.validators)) {
    nodes.push({
      nodeId: `validator:${validator.validator}`,
      label: validator.validator,
      kind: "validator" as const,
      status: validator.passed ? "ok" as const : "invalid" as const,
    });
    edges.push({
      edgeId: `validation-root->validator:${validator.validator}`,
      from: "validation-root",
      to: `validator:${validator.validator}`,
      status: "ok" as const,
    });

    for (const evidence of validator.evidence) {
      const evidenceNodeId = `evidence:${evidence}`;
      if (!nodes.some((node) => node.nodeId === evidenceNodeId)) {
        nodes.push({
          nodeId: evidenceNodeId,
          label: evidence,
          kind: "evidence" as const,
          status: evidence.startsWith("missing:") ? "missing" as const : "ok" as const,
        });
      }
      const edgeKey = `validator:${validator.validator}->${evidenceNodeId}`;
      const duplicate = seenEdges.has(edgeKey);
      seenEdges.add(edgeKey);
      edges.push({
        edgeId: `${edgeKey}:${duplicate ? "duplicate" : "primary"}`,
        from: `validator:${validator.validator}`,
        to: evidenceNodeId,
        status: duplicate ? "duplicate" as const : "ok" as const,
      });
      if (duplicate) {
        warnings.push({
          code: "trace-graph-duplicate-edge",
          message: "duplicate dependency edge remains visible",
          path: edgeKey,
        });
      }
    }
  }

  const sortedNodes = [...nodes].sort((left, right) => left.nodeId.localeCompare(right.nodeId));
  const sortedEdges = [...edges].sort((left, right) => left.edgeId.localeCompare(right.edgeId));
  const hasCycle = detectCycle(sortedEdges);
  if (hasCycle) {
    warnings.push({
      code: "trace-graph-cycle-visible",
      message: "dependency cycle remains visible",
      path: "dependencyGraph",
    });
  }

  const normalizedEdges: DependencyEdge[] = sortedEdges.map((edge) => Object.freeze({
    ...edge,
    status: hasCycle && edge.status === "ok" ? "cycle" : edge.status,
  }));

  const projection: DependencyProjection = Object.freeze({
    nodes: Object.freeze(sortedNodes),
    edges: Object.freeze(normalizedEdges),
    hasCycle,
    hasDuplicateEdges: warnings.some((warning) => warning.code === "trace-graph-duplicate-edge"),
    visibleNodeCount: sortedNodes.length,
    visibleEdgeCount: sortedEdges.length,
    projectionHash: hashTraceViewerValue("trace-dependency-projection", {
      nodes: sortedNodes,
      edges: sortedEdges,
      hasCycle,
    }),
  });

  return { projection, warnings: Object.freeze(warnings) };
}
