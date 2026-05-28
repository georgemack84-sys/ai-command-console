import type { ValidationContext } from "./validationTypes";
import { buildValidatorResult, createFailure } from "./validatorUtils";

export function validateSchema(context: ValidationContext) {
  const manifest = context.treaty.manifest;
  const failures = [];

  if (!manifest.treatyId || !manifest.handoffId || !manifest.planId || !manifest.planHash) {
    failures.push(createFailure({
      code: "VALIDATION_SCHEMA_INVALID",
      message: "treaty manifest identifiers are incomplete",
      path: "manifest",
    }));
  }
  if (manifest.executionStarted || manifest.dispatchPerformed) {
    failures.push(createFailure({
      code: "VALIDATION_SCHEMA_INVALID",
      message: "execution state leaked into validation target",
      path: manifest.executionStarted ? "manifest.executionStarted" : "manifest.dispatchPerformed",
    }));
  }
  if (!manifest.executorConstraints) {
    failures.push(createFailure({
      code: "VALIDATION_SCHEMA_INVALID",
      message: "executor constraints missing",
      path: "manifest.executorConstraints",
    }));
  }

  return {
    result: buildValidatorResult({
      validator: "schema",
      status: failures.length === 0 ? "passed" : "failed",
      failureCode: failures[0]?.code,
      evidence: [
        manifest.treatyId,
        manifest.planHash,
      ],
    }),
    failures,
  };
}
