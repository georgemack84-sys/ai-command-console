import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

function hasMarker(input: ConstitutionalCertificationInput, key: string): boolean {
  return input.metadata?.[key] === true;
}

export function validateCertificationIsolationBoundary(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    hasMarker(input, "execution")
    || hasMarker(input, "orchestration")
    || hasMarker(input, "runtimeActivation")
    || hasMarker(input, "scheduler")
  ) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_ISOLATION_VIOLATION",
      message: "Certification crossed into operational isolation boundaries.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
