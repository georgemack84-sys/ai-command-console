import { createValidationSnapshot } from "@/services/validation/validationSnapshot";
import type { PlanValidationResult, ValidationSnapshot } from "@/services/validation/validationContracts";

export function capturePlanValidationSnapshot(input: {
  validationResult: PlanValidationResult;
  schemaVersion: string;
}) : ValidationSnapshot {
  return createValidationSnapshot({
    result: input.validationResult,
    schemaVersion: input.schemaVersion,
    executionEligible: input.validationResult.executionEligible,
  });
}
