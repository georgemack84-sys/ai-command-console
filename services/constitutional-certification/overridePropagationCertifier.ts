import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function certifyOverridePropagation(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    input.humanSupremacyResult.overridePropagation.globallyPropagated
    && input.humanSupremacyResult.overridePropagation.propagationState === "immediate"
  ) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "CONSTITUTIONAL_CERTIFICATION_OVERRIDE_FAILURE",
    message: "Override propagation failed certification.",
    path: "humanSupremacyResult.overridePropagation",
  }]);
}
