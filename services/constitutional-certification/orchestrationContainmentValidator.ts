import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

function hasMarker(input: ConstitutionalCertificationInput, key: string): boolean {
  return input.metadata?.[key] === true;
}

export function validateOrchestrationContainment(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    hasMarker(input, "orchestration")
    || hasMarker(input, "hiddenRetry")
    || hasMarker(input, "scheduler")
  ) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_HIDDEN_EXECUTION",
      message: "Orchestration containment detected forbidden operational markers.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
