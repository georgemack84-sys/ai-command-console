import type { ValidationContext } from "./validationTypes";
import { buildValidatorResult, createFailure } from "./validatorUtils";

export function validateRollback(context: ValidationContext) {
  const survivability = context.treaty.evidence.survivability;
  const failures = [];

  if (!survivability.survivabilityHash || !survivability.failureSnapshotHash) {
    failures.push(createFailure({
      code: "VALIDATION_ROLLBACK_UNSAFE",
      message: "survivability evidence is incomplete",
      path: "evidence.survivability",
    }));
  }
  if (survivability.runtimeMode === "FULL_CONTAINMENT" && context.treaty.manifest.handoffStatus === "ready") {
    failures.push(createFailure({
      code: "VALIDATION_ROLLBACK_UNSAFE",
      message: "full containment is not rollback-ready",
      path: "evidence.survivability.runtimeMode",
    }));
  }

  return {
    result: buildValidatorResult({
      validator: "rollback",
      status: failures.length === 0 ? "passed" : "revalidation-required",
      failureCode: failures[0]?.code,
      evidence: [
        survivability.survivabilityHash,
        survivability.failureSnapshotHash,
        survivability.runtimeMode,
        survivability.trustState,
      ].filter(Boolean),
    }),
    failures,
  };
}
