import type { ValidationContext } from "./validationTypes";
import { buildValidatorResult, createFailure } from "./validatorUtils";

export function validateGovernance(context: ValidationContext) {
  const manifest = context.treaty.manifest;
  const evidence = context.treaty.evidence;
  const failures = [];

  if (!manifest.governanceSnapshotHash) {
    failures.push(createFailure({
      code: "VALIDATION_GOVERNANCE_FAILED",
      message: "governance snapshot hash missing",
      path: "manifest.governanceSnapshotHash",
    }));
  }
  if (!manifest.approvalChainHash) {
    failures.push(createFailure({
      code: "VALIDATION_GOVERNANCE_FAILED",
      message: "approval chain hash missing",
      path: "manifest.approvalChainHash",
    }));
  }
  if (!manifest.governanceInheritanceHash) {
    failures.push(createFailure({
      code: "VALIDATION_GOVERNANCE_FAILED",
      message: "governance inheritance hash missing",
      path: "manifest.governanceInheritanceHash",
    }));
  }
  if (!evidence.productionEvidence.governanceValidation.valid) {
    failures.push(createFailure({
      code: "VALIDATION_GOVERNANCE_FAILED",
      message: "production governance validation failed",
      path: "evidence.productionEvidence.governanceValidation",
    }));
  }

  return {
    result: buildValidatorResult({
      validator: "governance",
      status: failures.length === 0 ? "passed" : "denied",
      failureCode: failures[0]?.code,
      evidence: [
        manifest.governanceSnapshotHash,
        manifest.approvalChainHash,
        manifest.governanceInheritanceHash,
      ].filter(Boolean),
    }),
    failures,
  };
}
