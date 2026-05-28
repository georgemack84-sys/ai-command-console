import type { NormalizedPlan } from "../normalization";
import { createDependencyError } from "./dependency-errors";
import type { DependencyGraph, DependencyNode, DependencyValidationError } from "./dependency-types";

function buildAncestorMap(graph: DependencyGraph): Map<string, Set<string>> {
  const reverse = new Map<string, string[]>();
  for (const node of graph.nodes) {
    reverse.set(node.stepId, []);
  }
  for (const edge of graph.edges) {
    reverse.get(edge.to)?.push(edge.from);
  }

  const ancestorMap = new Map<string, Set<string>>();
  function collect(stepId: string): Set<string> {
    if (ancestorMap.has(stepId)) {
      return ancestorMap.get(stepId)!;
    }
    const ancestors = new Set<string>();
    for (const parent of reverse.get(stepId) ?? []) {
      ancestors.add(parent);
      for (const ancestor of collect(parent)) {
        ancestors.add(ancestor);
      }
    }
    ancestorMap.set(stepId, ancestors);
    return ancestors;
  }

  for (const node of graph.nodes) {
    collect(node.stepId);
  }

  return ancestorMap;
}

function isApprovalGate(node: DependencyNode): boolean {
  return node.operation === "approval_gate";
}

function isPreflightGate(node: DependencyNode): boolean {
  return node.operation === "preflight_check";
}

export function validateGateInheritance(normalizedPlan: NormalizedPlan, graph: DependencyGraph): {
  errors: DependencyValidationError[];
} {
  const errors: DependencyValidationError[] = [];
  const nodeMap = new Map(graph.nodes.map((node) => [node.stepId, node]));
  const stepMap = new Map(normalizedPlan.steps.map((step) => [step.id, step]));
  const ancestors = buildAncestorMap(graph);

  for (const node of graph.nodes) {
    const step = stepMap.get(node.stepId);
    if (!step) {
      continue;
    }

    const ancestorNodes = [...(ancestors.get(node.stepId) ?? [])]
      .map((ancestorId) => nodeMap.get(ancestorId))
      .filter((ancestor): ancestor is DependencyNode => Boolean(ancestor));

    if (node.requiresApproval) {
      const hasApprovalAncestor = ancestorNodes.some(isApprovalGate);
      if (!hasApprovalAncestor) {
        errors.push(createDependencyError(
          "PLAN_APPROVAL_GATE_BYPASSED",
          `Step ${node.stepId} requires an approval gate ancestor.`,
          node.stepId,
          ["steps", String(step.index)],
        ));
      }
    }

    if (node.requiresPreflight || node.isDestructive) {
      const hasPreflightAncestor = ancestorNodes.some(isPreflightGate);
      if (!hasPreflightAncestor) {
        errors.push(createDependencyError(
          "PLAN_PREFLIGHT_REQUIRED",
          `Step ${node.stepId} requires a preflight gate ancestor.`,
          node.stepId,
          ["steps", String(step.index)],
        ));
      }
    }

    if (isApprovalGate(node)) {
      const invalidAncestors = ancestorNodes.filter((ancestor) => ancestor.isDestructive || ancestor.hasExternalSideEffect);
      if (invalidAncestors.length > 0) {
        errors.push(createDependencyError(
          "PLAN_GATE_INHERITANCE_BROKEN",
          `Approval gate ${node.stepId} cannot depend on mutation execution.`,
          node.stepId,
          ["steps", String(step.index)],
        ));
      }
    }
  }

  return { errors };
}
