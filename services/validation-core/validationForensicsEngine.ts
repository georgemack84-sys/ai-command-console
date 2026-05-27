import type { ValidationDebugEvent, ValidatorName } from "@/types/validation-core";
import type { ValidationFailure, ValidationForensics } from "./validationTypes";
import { hashValidationCoreValue } from "./validationCoreHasher";

function validatorLabel(validator?: ValidatorName) {
  return validator ?? "unknown";
}

export function analyzeValidationForensics(input: {
  validationId: string;
  events: readonly ValidationDebugEvent[];
  failures: readonly ValidationFailure[];
}): ValidationForensics {
  const firstFailure = input.failures[0];
  const failedEvent = input.events.find((event) => event.eventType.endsWith(".failed") || event.eventType === "validation.failed");
  const failedValidator = failedEvent?.validator;
  const summary = firstFailure
    ? `Validation failed in ${validatorLabel(failedValidator)} because ${firstFailure.message}.`
    : "Validation completed without deterministic failures.";

  return Object.freeze({
    validationId: input.validationId,
    summary,
    failedValidator,
    failureCode: firstFailure?.code,
    explanationHash: hashValidationCoreValue("validation-forensics", {
      validationId: input.validationId,
      summary,
      failedValidator,
      failureCode: firstFailure?.code,
    }),
    evidence: Object.freeze(input.failures.map((failure) => `${failure.code}:${failure.path ?? "root"}`)),
  });
}
