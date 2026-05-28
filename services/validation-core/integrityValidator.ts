import { verifyExecutionTreatyIntegrity } from "@/services/execution-treaty";
import type { ValidationContext } from "./validationTypes";
import { buildValidatorResult, createFailure } from "./validatorUtils";

export function validateIntegrity(context: ValidationContext) {
  const integrity = verifyExecutionTreatyIntegrity(context.treaty);
  const failures = integrity.failures.map((failure) => createFailure({
    code: "VALIDATION_INTEGRITY_FAILURE",
    message: failure.message,
    path: failure.path,
    expected: failure.expected,
    actual: failure.actual,
  }));

  return {
    result: buildValidatorResult({
      validator: "integrity",
      status: failures.length === 0 ? "passed" : "failed",
      failureCode: failures[0]?.code,
      evidence: [
        context.treaty.hashes.manifestHash,
        context.treaty.hashes.evidenceHash,
        context.treaty.hashes.treatyHash,
        context.treaty.hashes.archiveHash,
      ],
    }),
    failures,
  };
}
