import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

function hasMarker(input: ConstitutionalCertificationInput, key: string): boolean {
  return input.metadata?.[key] === true;
}

export function detectHiddenExecutionPaths(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    hasMarker(input, "execution")
    || hasMarker(input, "dispatch")
    || hasMarker(input, "toolInvocation")
    || input.constitutionalRuntimeSimulationResult.report.executable
  ) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_HIDDEN_EXECUTION",
      message: "Hidden execution path markers were detected.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
