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

  const cache = new Map<string, Set<string>>();
  function collect(stepId: string): Set<string> {
    if (cache.has(stepId)) {
      return cache.get(stepId)!;
    }
    const ancestors = new Set<string>();
    for (const parent of reverse.get(stepId) ?? []) {
      ancestors.add(parent);
      for (const ancestor of collect(parent)) {
        ancestors.add(ancestor);
      }
    }
    cache.set(stepId, ancestors);
    return ancestors;
  }

  for (const node of graph.nodes) {
    collect(node.stepId);
  }

  return cache;
}

function isApprovalGate(node: DependencyNode): boolean {
  return node.operation === "approval_gate";
}

function isPreflightGate(node: DependencyNode): boolean {
  return node.operation === "preflight_check";
}

export function validateDependencyPolicies(normalizedPlan: NormalizedPlan, graph: DependencyGraph): {
  errors: DependencyValidationError[];
} {
  const errors: DependencyValidationError[] = [];
  const nodeMap = new Map(graph.nodes.map((node) => [node.stepId, node]));
  const dependents = new Map<string, DependencyNode[]>();
  const ancestors = buildAncestorMap(graph);

  for (const node of graph.nodes) {
    dependents.set(node.stepId, []);
  }
  for (const edge of graph.edges) {
    const dependent = nodeMap.get(edge.to);
    if (dependent) {
      dependents.get(edge.from)?.push(dependent);
    }
  }

  for (const step of normalizedPlan.steps) {
    const node = nodeMap.get(step.id);
    if (!node) {
      continue;
    }

    if (step.inputs.disabled === true) {
      errors.push(createDependencyError(
        "PLAN_DISABLED_STEP_REFERENCED",
        `Disabled step ${step.id} cannot participate in dependency execution order.`,
        step.id,
        ["steps", String(step.index)],
      ));
    }

    if (step.inputs.dynamicDependencyRef !== undefined) {
      errors.push(createDependencyError(
        "PLAN_DEPENDENCY_POLICY_VIOLATION",
        `Dynamic dependency references are not allowed for ${step.id}.`,
        step.id,
        ["steps", String(step.index), "inputs", "dynamicDependencyRef"],
      ));
    }

    const ancestorNodes = [...(ancestors.get(step.id) ?? [])]
      .map((ancestorId) => nodeMap.get(ancestorId))
      .filter((ancestor): ancestor is DependencyNode => Boolean(ancestor));

    if (step.inputs.targetEnvironment === "production" && node.isDestructive) {
      const hasApprovalAncestor = ancestorNodes.some(isApprovalGate);
      if (!hasApprovalAncestor) {
        errors.push(createDependencyError(
          "PLAN_APPROVAL_GATE_BYPASSED",
          `Production mutation ${step.id} requires an approval gate ancestor.`,
          step.id,
        ));
      }
    }

    if (node.isDestructive) {
      const hasPreflightAncestor = ancestorNodes.some(isPreflightGate);
      if (!hasPreflightAncestor) {
        errors.push(createDependencyError(
          "PLAN_PREFLIGHT_REQUIRED",
          `Destructive step ${step.id} requires a preflight gate ancestor.`,
          step.id,
        ));
      }
    }

    if (node.hasExternalSideEffect && !node.idempotencyKey) {
      errors.push(createDependencyError(
        "PLAN_DEPENDENCY_POLICY_VIOLATION",
        `External side-effect step ${step.id} requires idempotency metadata.`,
        step.id,
      ));
    }

    if (node.branchType === "rollback" && (dependents.get(step.id) ?? []).some((dependent) => dependent.branchType === "normal")) {
      errors.push(createDependencyError(
        "PLAN_ROLLBACK_ORDER_INVALID",
        `Rollback step ${step.id} cannot be used as forward execution.`,
        step.id,
      ));
    }
  }

  return { errors };
}
