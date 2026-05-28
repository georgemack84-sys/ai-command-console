import type { NormalizedPlan } from "../normalization";
import { createDependencyError } from "./dependency-errors";
import type { DependencyGraph, DependencyNode, DependencyValidationError } from "./dependency-types";

const allowedBranchTypes = new Set(["normal", "failure", "rollback", "terminal"]);

function buildDependents(graph: DependencyGraph): Map<string, DependencyNode[]> {
  const nodeMap = new Map(graph.nodes.map((node) => [node.stepId, node]));
  const dependents = new Map<string, DependencyNode[]>();
  for (const node of graph.nodes) {
    dependents.set(node.stepId, []);
  }
  for (const edge of graph.edges) {
    const dependent = nodeMap.get(edge.to);
    if (dependent) {
      dependents.get(edge.from)?.push(dependent);
    }
  }
  return dependents;
}

export function validateBranchSemantics(normalizedPlan: NormalizedPlan, graph: DependencyGraph): {
  errors: DependencyValidationError[];
} {
  const errors: DependencyValidationError[] = [];
  const dependents = buildDependents(graph);
  const nodeMap = new Map(graph.nodes.map((node) => [node.stepId, node]));

  for (const step of normalizedPlan.steps) {
    const rawBranchType = step.inputs.branchType;
    if (rawBranchType !== undefined && !allowedBranchTypes.has(String(rawBranchType))) {
      errors.push(createDependencyError(
        "PLAN_DEPENDENCY_POLICY_VIOLATION",
        `Unknown branch semantics ${String(rawBranchType)} are not allowed.`,
        step.id,
        ["steps", String(step.index), "inputs", "branchType"],
      ));
    }
  }

  for (const node of graph.nodes) {
    const nodeDependents = dependents.get(node.stepId) ?? [];

    if (node.branchType === "rollback" && nodeDependents.some((dependent) => dependent.branchType === "normal")) {
      errors.push(createDependencyError(
        "PLAN_ROLLBACK_ORDER_INVALID",
        `Rollback step ${node.stepId} cannot feed the normal success path.`,
        node.stepId,
      ));
    }

    if (node.branchType === "failure" && nodeDependents.some((dependent) => dependent.branchType === "normal")) {
      errors.push(createDependencyError(
        "PLAN_FAILURE_BRANCH_USED_AS_SUCCESS_PATH",
        `Failure branch step ${node.stepId} cannot be reused as a success dependency.`,
        node.stepId,
      ));
    }

    if (node.branchType === "terminal" && nodeDependents.length > 0) {
      errors.push(createDependencyError(
        "PLAN_TERMINAL_STEP_HAS_DEPENDENTS",
        `Terminal step ${node.stepId} cannot have dependents.`,
        node.stepId,
      ));
    }

    if (node.operation === "verify") {
      const step = normalizedPlan.steps.find((entry) => entry.id === node.stepId);
      const targetStepId = typeof step?.inputs.verifiesStepId === "string"
        ? step.inputs.verifiesStepId
        : undefined;
      const target = targetStepId ? nodeMap.get(targetStepId) : undefined;

      if (!target || node.sequenceIndex <= target.sequenceIndex) {
        errors.push(createDependencyError(
          "PLAN_VERIFICATION_ORDER_INVALID",
          `Verification step ${node.stepId} must come after the step it verifies.`,
          node.stepId,
        ));
      }
    }
  }

  return { errors };
}
