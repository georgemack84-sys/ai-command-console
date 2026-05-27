import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateCertificationContainmentBoundary(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  return input.constitutionalReadinessResult.report.readinessClassification === "FROZEN"
    || input.constitutionalReadinessResult.report.readinessClassification === "DISPUTED"
    || input.constitutionalReadinessResult.report.readinessClassification === "INVALID"
    ? Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_CONTAINMENT_WEAKENING",
      message: "Readiness containment boundary already failed closed.",
      path: "constitutionalReadinessResult.report.readinessClassification",
    }])
    : Object.freeze([]);
}
