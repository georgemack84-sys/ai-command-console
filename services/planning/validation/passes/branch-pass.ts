import type { CanonicalPlan } from "../../contracts/plan-types";
import type { ValidationError } from "../validation-result";
import type { GraphIndex } from "../structural/graph-index";

export const MAX_BRANCH_DEPTH = 3;
export const MAX_BRANCH_COUNT = 8;

type BranchCase = {
  condition: string;
  nextStepId: string;
};

function isBranchCase(value: unknown): value is BranchCase {
  return Boolean(
    value
    && typeof value === "object"
    && typeof (value as { condition?: unknown }).condition === "string"
    && typeof (value as { nextStepId?: unknown }).nextStepId === "string",
  );
}

export function runBranchPass(plan: CanonicalPlan, graph: GraphIndex) {
  const errors: ValidationError[] = [];
  let branchCount = 0;

  for (const step of plan.steps) {
    if (step.type !== "route") {
      continue;
    }

    branchCount += 1;
    const branchCases = step.action.parameters.branchCases;
    if (!Array.isArray(branchCases) || branchCases.length === 0 || !branchCases.every(isBranchCase)) {
      errors.push({
        code: "STRUCTURE_INVALID_BRANCH",
        path: `steps.${step.stepId}.action.parameters.branchCases`,
        message: "Route steps must declare explicit branchCases.",
        stage: "branch",
      });
      continue;
    }

    for (const branch of branchCases) {
      if (!branch.condition.trim()) {
        errors.push({
          code: "STRUCTURE_INVALID_BRANCH",
          path: `steps.${step.stepId}.action.parameters.branchCases`,
          message: "Branch conditions must be non-empty.",
          stage: "branch",
        });
      }

      const target = graph.nodeMap.get(branch.nextStepId);
      const source = graph.nodeMap.get(step.stepId);
      if (!target || !source || target.index <= source.index) {
        errors.push({
          code: "STRUCTURE_INVALID_BRANCH",
          path: `steps.${step.stepId}.action.parameters.branchCases`,
          message: `Branch target ${branch.nextStepId} must exist after the route step.`,
          stage: "branch",
        });
      }
    }
  }

  if (branchCount > MAX_BRANCH_COUNT) {
    errors.push({
      code: "STRUCTURE_CONTAINMENT_FAILURE",
      path: "steps",
      message: "Branch count exceeded.",
      stage: "branch",
    });
  }

  if (plan.steps.filter((step) => step.type === "route").length > MAX_BRANCH_DEPTH) {
    errors.push({
      code: "STRUCTURE_INVALID_BRANCH",
      path: "steps",
      message: "Nested branch depth exceeded.",
      stage: "branch",
    });
  }

  return {
    errors,
    branchCount,
  };
}

