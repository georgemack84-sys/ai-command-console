import type { NormalizedPlan } from "../normalization";
import { createDependencyError } from "./dependency-errors";
import type { DependencyValidationError } from "./dependency-types";

export function validateDependencyReferences(normalizedPlan: NormalizedPlan): {
  errors: DependencyValidationError[];
} {
  const errors: DependencyValidationError[] = [];
  const seenStepIds = new Set<string>();
  const stepIds = new Set(normalizedPlan.steps.map((step) => step.id));
  const sourceIds = new Map(
    normalizedPlan.steps
      .filter((step) => typeof step.sourceId === "string" && step.sourceId.length > 0)
      .map((step) => [step.sourceId!, step.id]),
  );

  for (const step of normalizedPlan.steps) {
    if (seenStepIds.has(step.id)) {
      errors.push(createDependencyError(
        "PLAN_DUPLICATE_STEP_ID",
        `Duplicate step id ${step.id} detected.`,
        step.id,
        ["steps", String(step.index), "id"],
      ));
    }
    seenStepIds.add(step.id);

    const seenDependencies = new Set<string>();
    for (const dependency of step.dependencies) {
      const resolvedDependency = stepIds.has(dependency)
        ? dependency
        : sourceIds.get(dependency) ?? dependency;

      if (!stepIds.has(resolvedDependency)) {
        errors.push(createDependencyError(
          "PLAN_DEPENDENCY_REFERENCE_NOT_FOUND",
          `Dependency ${dependency} was not found in the normalized plan.`,
          step.id,
          ["steps", String(step.index), "dependencies"],
        ));
      }

      if (resolvedDependency === step.id || dependency === step.sourceId) {
        errors.push(createDependencyError(
          "PLAN_SELF_DEPENDENCY_BLOCKED",
          `Step ${step.id} cannot depend on itself.`,
          step.id,
          ["steps", String(step.index), "dependencies"],
        ));
      }

      if (seenDependencies.has(resolvedDependency)) {
        errors.push(createDependencyError(
          "PLAN_DUPLICATE_DEPENDENCY_FOUND",
          `Step ${step.id} declares dependency ${dependency} more than once.`,
          step.id,
          ["steps", String(step.index), "dependencies"],
        ));
      }

      seenDependencies.add(resolvedDependency);
    }
  }

  return { errors };
}
