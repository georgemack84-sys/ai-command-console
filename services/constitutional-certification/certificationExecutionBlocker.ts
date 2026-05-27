import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateCertificationExecutionBlocker(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    input.constitutionalRuntimeSimulationResult.report.executable
    || input.constitutionalReadinessResult.report.executable
  ) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_HIDDEN_EXECUTION",
      message: "Certification detected an execution-capable upstream state.",
      path: "report.executable",
    }]);
  }
  return Object.freeze([]);
}
