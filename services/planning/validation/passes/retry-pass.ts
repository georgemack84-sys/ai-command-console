import type { CanonicalPlan } from "../../contracts/plan-types";
import type { ValidationError } from "../validation-result";

export const MAX_RETRY_DEPTH = 5;

export function runRetryPass(plan: CanonicalPlan) {
  const errors: ValidationError[] = [];

  if (!Number.isFinite(plan.execution.retryPolicy.maxAttempts) || plan.execution.retryPolicy.maxAttempts > MAX_RETRY_DEPTH) {
    errors.push({
      code: "STRUCTURE_RETRY_LOOP",
      path: "execution.retryPolicy.maxAttempts",
      message: "Retry attempts must be finite and bounded.",
      stage: "retry",
    });
  }

  for (const step of plan.steps) {
    const retryTarget = step.action.parameters.retryTargetStepId;
    if (typeof retryTarget === "string" && retryTarget === step.stepId) {
      errors.push({
        code: "STRUCTURE_RETRY_LOOP",
        path: `steps.${step.stepId}.action.parameters.retryTargetStepId`,
        message: "Retry target cannot point to the same step.",
        stage: "retry",
      });
    }
  }

  return { errors };
}

