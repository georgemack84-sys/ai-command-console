import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateConstitutionalCertificationInput(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  const errors: ConstitutionalCertificationError[] = [];

  if (!input.constitutionalReadinessResult.derivedOnly) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_POLICY_VIOLATION",
      message: "Readiness input must be derived-only.",
      path: "constitutionalReadinessResult.derivedOnly",
    });
  }
  if (!input.constitutionalRuntimeSimulationResult.report.advisoryOnly) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_AUTHORITY_CROSSOVER",
      message: "Simulation input must remain advisory-only.",
      path: "constitutionalRuntimeSimulationResult.report.advisoryOnly",
    });
  }
  if (
    input.constitutionalReadinessResult.report.executable
    || input.constitutionalReadinessResult.report.orchestrationAllowed
    || input.constitutionalReadinessResult.report.runtimeMutationAllowed
  ) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_AUTHORITY_CROSSOVER",
      message: "Readiness output crossed into operational authority.",
      path: "constitutionalReadinessResult.report",
    });
  }

  return Object.freeze(errors);
}
