import { createFrozenValidationContext, type FrozenValidationContext } from "./validation-context";
import { orchestratePlanValidation } from "./validation-orchestrator";

export function validatePlanStructure(input: unknown, context?: FrozenValidationContext) {
  return orchestratePlanValidation(input, context ?? createFrozenValidationContext());
}

