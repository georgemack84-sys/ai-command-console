import { createCompatibilityViolation } from "./execution-compatibility-errors";
import type { CompatibilityViolation, EscalationGraph } from "./execution-compatibility-types";

function detectCycle(edges: EscalationGraph["edges"]): string[] | null {
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

export function buildEscalationGraph(steps: Array<{ id: string; inputs: Record<string, unknown> }>): EscalationGraph {
  const nodes = steps.map((step) => {
    const compatibility = step.inputs.compatibility && typeof step.inputs.compatibility === "object"
      ? step.inputs.compatibility as Record<string, unknown>
      : {};
    const escalation = compatibility.escalation && typeof compatibility.escalation === "object"
      ? compatibility.escalation as Record<string, unknown>
      : {};

    return {
      stepId: step.id,
      terminal: escalation.terminal === true,
    };
  });

  const edges = steps.flatMap((step) => {
    const compatibility = step.inputs.compatibility && typeof step.inputs.compatibility === "object"
      ? step.inputs.compatibility as Record<string, unknown>
      : {};
    const escalation = compatibility.escalation && typeof compatibility.escalation === "object"
      ? compatibility.escalation as Record<string, unknown>
      : {};
    const targets = Array.isArray(escalation.targets)
      ? escalation.targets.filter((entry): entry is string => typeof entry === "string")
      : [];

    return targets.map((target) => ({ from: step.id, to: target }));
  });

  return { nodes, edges };
}

export function validateEscalationGraph(escalationGraph: EscalationGraph): CompatibilityViolation[] {
  const violations: CompatibilityViolation[] = [];
  const nodeMap = new Map(escalationGraph.nodes.map((node) => [node.stepId, node]));

  for (const edge of escalationGraph.edges) {
    if (!nodeMap.has(edge.from) || !nodeMap.has(edge.to)) {
      violations.push(createCompatibilityViolation(
        "PLAN_ESCALATION_GRAPH_INVALID",
        `Escalation edge ${edge.from} -> ${edge.to} references an unknown node.`,
        "escalationGraph.edges",
      ));
    }
  }

  const cycle = detectCycle(escalationGraph.edges);
  if (cycle) {
    violations.push(createCompatibilityViolation(
      "PLAN_ESCALATION_GRAPH_INVALID",
      `Escalation graph loop detected: ${cycle.join(" -> ")}.`,
      "escalationGraph",
    ));
  }

  const outbound = new Set(escalationGraph.edges.map((edge) => edge.from));
  for (const node of escalationGraph.nodes) {
    if (!outbound.has(node.stepId) && escalationGraph.edges.some((edge) => edge.to === node.stepId) && !node.terminal) {
      violations.push(createCompatibilityViolation(
        "PLAN_ESCALATION_GRAPH_INVALID",
        `Escalation graph dead end detected at ${node.stepId}.`,
        `escalationGraph.${node.stepId}`,
      ));
    }
  }

  return violations;
}
