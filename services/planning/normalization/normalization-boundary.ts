import type { CanonicalPlan } from "../contracts/plan-types";
import { createNormalizationError } from "./normalization-errors";
import type { NormalizedPlan } from "./normalization-types";

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function enforceNormalizationBoundary(input: {
  sourcePlan: CanonicalPlan;
  normalizedPlan: NormalizedPlan;
  graphHash: string;
  validationHash: string;
  replaySnapshot: {
    authoredStepOrder: string[];
  };
}): { ok: true } | { ok: false; error: ReturnType<typeof createNormalizationError> } {
  if (input.sourcePlan.mission.objective !== input.normalizedPlan.goal) {
    return {
      ok: false,
      error: createNormalizationError(
        "PLAN_NORMALIZATION_BOUNDARY_VIOLATION",
        "Normalization changed the plan goal.",
      ),
    };
  }

  if (input.sourcePlan.steps.length !== input.normalizedPlan.steps.length) {
    return {
      ok: false,
      error: createNormalizationError(
        "PLAN_NORMALIZATION_BOUNDARY_VIOLATION",
        "Normalization changed the step count.",
      ),
    };
  }

  const normalizedSourceOrder = input.normalizedPlan.steps.map((step) => step.sourceId ?? "");
  if (!sameJson(input.replaySnapshot.authoredStepOrder, normalizedSourceOrder)) {
    return {
      ok: false,
      error: createNormalizationError(
        "PLAN_NORMALIZATION_BOUNDARY_VIOLATION",
        "Normalization changed authored step ordering.",
        {
          expected: input.replaySnapshot.authoredStepOrder,
          actual: normalizedSourceOrder,
        },
      ),
    };
  }

  for (const [index, sourceStep] of input.sourcePlan.steps.entries()) {
    const normalizedStep = input.normalizedPlan.steps[index];
    if (!normalizedStep) {
      return {
        ok: false,
        error: createNormalizationError(
          "PLAN_NORMALIZATION_BOUNDARY_VIOLATION",
          `Normalized step missing at index ${index}.`,
        ),
      };
    }

    if (!sameJson(sourceStep.dependencies, normalizedStep.dependencies)) {
      return {
        ok: false,
        error: createNormalizationError(
          "PLAN_NORMALIZATION_BOUNDARY_VIOLATION",
          `Normalization changed dependencies for step ${sourceStep.stepId}.`,
        ),
      };
    }

    if (!sameJson(sourceStep.action, normalizedStep.action)) {
      return {
        ok: false,
        error: createNormalizationError(
          "PLAN_NORMALIZATION_BOUNDARY_VIOLATION",
          `Normalization changed action payload for step ${sourceStep.stepId}.`,
        ),
      };
    }
  }

  if (input.normalizedPlan.validatedGraphHash !== input.graphHash) {
    return {
      ok: false,
      error: createNormalizationError(
        "PLAN_NORMALIZATION_BOUNDARY_VIOLATION",
        "Normalization changed the validated graph hash.",
      ),
    };
  }

  if (input.normalizedPlan.validationHash !== input.validationHash) {
    return {
      ok: false,
      error: createNormalizationError(
        "PLAN_NORMALIZATION_BOUNDARY_VIOLATION",
        "Normalization changed the validation hash reference.",
      ),
    };
  }

  return { ok: true };
}
