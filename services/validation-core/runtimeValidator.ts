import type { ValidationContext } from "./validationTypes";
import { buildValidatorResult, createFailure } from "./validatorUtils";

export function validateRuntimeCompatibility(context: ValidationContext) {
  const certification = context.treaty.evidence.productionCertification;
  const failures = [];

  if (!context.request.runtimeProfileId) {
    failures.push(createFailure({
      code: "VALIDATION_RUNTIME_UNSUPPORTED",
      message: "runtime profile identifier missing",
      path: "request.runtimeProfileId",
    }));
  }
  if (!context.treaty.manifest.executionCompatibilityHash) {
    failures.push(createFailure({
      code: "VALIDATION_RUNTIME_UNSUPPORTED",
      message: "execution compatibility hash missing",
      path: "manifest.executionCompatibilityHash",
    }));
  }
  if (certification.certificationStatus !== "certified") {
    failures.push(createFailure({
      code: "VALIDATION_RUNTIME_UNSUPPORTED",
      message: "production certification does not allow runtime compatibility",
      path: "evidence.productionCertification.certificationStatus",
    }));
  }

  return {
    result: buildValidatorResult({
      validator: "runtime",
      status: failures.length === 0 ? "passed" : "denied",
      failureCode: failures[0]?.code,
      evidence: [
        context.request.runtimeProfileId ?? "missing:runtimeProfileId",
        context.treaty.manifest.executionCompatibilityHash,
        certification.certificationHash,
      ].filter(Boolean),
    }),
    failures,
  };
}
