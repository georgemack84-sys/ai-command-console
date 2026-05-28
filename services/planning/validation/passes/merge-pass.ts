import type { CanonicalPlan } from "../../contracts/plan-types";
import type { ValidationError } from "../validation-result";

export function runMergePass(plan: CanonicalPlan) {
  const errors: ValidationError[] = [];

  for (const step of plan.steps) {
    if (step.dependencies.length <= 1) {
      continue;
    }

    const mergePolicy = step.action.parameters.mergePolicy;
    const mergeSources = step.action.parameters.mergeSources;
    if (typeof mergePolicy !== "string" || !Array.isArray(mergeSources)) {
      errors.push({
        code: "STRUCTURE_UNSAFE_MERGE",
        path: `steps.${step.stepId}.action.parameters`,
        message: "Merge steps must declare explicit mergePolicy and mergeSources.",
        stage: "merge",
      });
      continue;
    }

    const dependencies = [...step.dependencies].sort((left, right) => left.localeCompare(right));
    const provided = mergeSources.filter((value): value is string => typeof value === "string").sort((left, right) => left.localeCompare(right));

    if (dependencies.length !== provided.length || dependencies.some((dependency, index) => dependency !== provided[index])) {
      errors.push({
        code: "STRUCTURE_UNSAFE_MERGE",
        path: `steps.${step.stepId}.action.parameters.mergeSources`,
        message: "Merge sources must exactly match dependencies.",
        stage: "merge",
      });
    }
  }

  return { errors };
}

