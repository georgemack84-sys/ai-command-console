import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateContainmentDrift(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  return input.antiEmergenceResult.record.classification !== "contained"
    ? Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_CONTAINMENT_WEAKENING",
      message: "Containment drift was detected.",
      path: "antiEmergenceResult.record.classification",
    }])
    : Object.freeze([]);
}
