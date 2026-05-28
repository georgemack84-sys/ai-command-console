import type { ValidationContext } from "./validationTypes";
import { buildValidatorResult, createFailure } from "./validatorUtils";

export function validateCapabilities(context: ValidationContext) {
  const constraints = context.treaty.manifest.executorConstraints;
  const failures = [];

  if (!constraints || constraints.mayExecute !== false || constraints.requiresRevalidation !== true) {
    failures.push(createFailure({
      code: "VALIDATION_CAPABILITY_DENIED",
      message: "executor constraints are not zero-trust",
      path: "manifest.executorConstraints",
    }));
  }
  if (!constraints?.allowedExecutorModes.includes("future-controlled-executor")) {
    failures.push(createFailure({
      code: "VALIDATION_CAPABILITY_DENIED",
      message: "allowed executor mode missing",
      path: "manifest.executorConstraints.allowedExecutorModes",
    }));
  }

  return {
    result: buildValidatorResult({
      validator: "capability",
      status: failures.length === 0 ? "passed" : "denied",
      failureCode: failures[0]?.code,
      evidence: constraints?.forbiddenActions ?? [],
    }),
    failures,
  };
}
