import type { ValidationContext } from "./validationTypes";
import { buildValidatorResult, createFailure } from "./validatorUtils";

export function validateIsolation(context: ValidationContext) {
  const manifest = context.treaty.manifest;
  const failures = [];

  if (manifest.trustZone === "quarantined") {
    failures.push(createFailure({
      code: "VALIDATION_ISOLATION_FAILED",
      message: "quarantined treaty is not admissible",
      path: "manifest.trustZone",
    }));
  }
  if (manifest.executionStarted || manifest.dispatchPerformed) {
    failures.push(createFailure({
      code: "VALIDATION_ISOLATION_FAILED",
      message: "execution markers violate isolation validation",
      path: manifest.executionStarted ? "manifest.executionStarted" : "manifest.dispatchPerformed",
    }));
  }
  if (manifest.executorConstraints.mayExecute !== false) {
    failures.push(createFailure({
      code: "VALIDATION_ISOLATION_FAILED",
      message: "executor constraints leak execution authority",
      path: "manifest.executorConstraints.mayExecute",
    }));
  }

  return {
    result: buildValidatorResult({
      validator: "isolation",
      status: failures.length === 0 ? "passed" : "denied",
      failureCode: failures[0]?.code,
      evidence: [
        manifest.trustZone,
        manifest.handoffStatus,
        manifest.preExecutionRevocationStatus,
      ],
    }),
    failures,
  };
}
