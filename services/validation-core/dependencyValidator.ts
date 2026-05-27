import type { ValidationContext } from "./validationTypes";
import { buildValidatorResult, createFailure } from "./validatorUtils";

export function validateDependencies(context: ValidationContext) {
  const evidence = context.treaty.evidence;
  const failures = [];

  if (!evidence.productionCertification?.certificationHash) {
    failures.push(createFailure({
      code: "VALIDATION_DEPENDENCY_MISSING",
      message: "production certification missing",
      path: "evidence.productionCertification",
    }));
  }
  if (!evidence.productionEvidence?.evidenceHash) {
    failures.push(createFailure({
      code: "VALIDATION_DEPENDENCY_MISSING",
      message: "production evidence missing",
      path: "evidence.productionEvidence",
    }));
  }
  if (!evidence.operationalTrustLedger?.length) {
    failures.push(createFailure({
      code: "VALIDATION_DEPENDENCY_MISSING",
      message: "operational trust ledger missing",
      path: "evidence.operationalTrustLedger",
    }));
  }

  return {
    result: buildValidatorResult({
      validator: "dependency",
      status: failures.length === 0 ? "passed" : "failed",
      failureCode: failures[0]?.code,
      evidence: [
        evidence.productionCertification?.certificationHash ?? "missing:productionCertification",
        evidence.productionEvidence?.evidenceHash ?? "missing:productionEvidence",
        ...evidence.operationalTrustLedger.map((entry) => entry.eventHash),
      ],
    }),
    failures,
  };
}
