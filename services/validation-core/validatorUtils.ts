import type { ValidatorName, ValidatorResult, ValidatorResultStatus } from "@/types/validation-core";
import type { ValidationFailure } from "./validationTypes";
import { hashValidationCoreValue } from "./validationCoreHasher";

export function buildValidatorResult(input: {
  validator: ValidatorName;
  status: ValidatorResultStatus;
  failureCode?: string;
  evidence: readonly string[];
}): ValidatorResult {
  return {
    validator: input.validator,
    status: input.status,
    passed: input.status === "passed",
    failureCode: input.failureCode,
    evidence: [...input.evidence],
    hash: hashValidationCoreValue("validator-result", input),
  };
}

export function createFailure(input: ValidationFailure): ValidationFailure {
  return Object.freeze({ ...input });
}
