import { createCompatibilityViolation } from "./execution-compatibility-errors";
import type { ApprovalContract, AuthorityGraph, CompatibilityViolation } from "./execution-compatibility-types";

function detectCycle(edges: AuthorityGraph["edges"]): string[] | null {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const bucket = adjacency.get(edge.from) ?? [];
    bucket.push(edge.to);
    adjacency.set(edge.from, bucket);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  const walk = (node: string): string[] | null => {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      return [...stack.slice(start), node];
    }
    if (visited.has(node)) {
      return null;
    }
    visiting.add(node);
    stack.push(node);
    for (const next of adjacency.get(node) ?? []) {
      const cycle = walk(next);
      if (cycle) {
        return cycle;
      }
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  };

  for (const node of adjacency.keys()) {
    const cycle = walk(node);
    if (cycle) {
      return cycle;
    }
  }
  return null;
}

export function buildAuthorityGraph(approvalContracts: ApprovalContract[], steps: Array<{ id: string; inputs: Record<string, unknown> }>): AuthorityGraph {
  const nodes = approvalContracts.map((contract) => ({
    stepId: contract.stepId,
    requiredRole: contract.requiredRole,
    environmentScope: contract.scope.environmentScope,
  }));

  const edges = steps.flatMap((step) => {
    const compatibility = step.inputs.compatibility && typeof step.inputs.compatibility === "object"
      ? step.inputs.compatibility as Record<string, unknown>
      : {};
    const authority = compatibility.authority && typeof compatibility.authority === "object"
      ? compatibility.authority as Record<string, unknown>
      : {};
    const parents = Array.isArray(authority.parents)
      ? authority.parents.filter((entry): entry is string => typeof entry === "string")
      : [];

    return parents.map((parent) => ({ from: parent, to: step.id }));
  });

  return { nodes, edges };
}

export function validateAuthorityGraph(authorityGraph: AuthorityGraph): CompatibilityViolation[] {
  const violations: CompatibilityViolation[] = [];
  const nodeMap = new Map(authorityGraph.nodes.map((node) => [node.stepId, node]));

  for (const edge of authorityGraph.edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) {
      violations.push(createCompatibilityViolation(
        "PLAN_AUTHORITY_GRAPH_INVALID",
        `Authority edge ${edge.from} -> ${edge.to} references an unknown node.`,
        "authorityGraph.edges",
      ));
      continue;
    }

    const targetOutsideSource = toNode.environmentScope.some((scope) => !fromNode.environmentScope.includes(scope));
    if (targetOutsideSource) {
      violations.push(createCompatibilityViolation(
        "PLAN_AUTHORITY_GRAPH_INVALID",
        `Cross-environment authority escalation is invalid for ${edge.from} -> ${edge.to}.`,
        `authorityGraph.${edge.from}.${edge.to}`,
      ));
    }
  }

  const cycle = detectCycle(authorityGraph.edges);
  if (cycle) {
    violations.push(createCompatibilityViolation(
      "PLAN_AUTHORITY_GRAPH_INVALID",
      `Authority graph cycle detected: ${cycle.join(" -> ")}.`,
      "authorityGraph",
    ));
  }

  return violations;
}
