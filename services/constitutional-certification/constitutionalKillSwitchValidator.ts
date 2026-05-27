import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateConstitutionalKillSwitch(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (input.humanSupremacyResult.killSwitch.active && input.humanSupremacyResult.killSwitch.scope !== "global") {
    return Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_OVERRIDE_FAILURE",
      message: "Kill switch activation did not propagate globally.",
      path: "humanSupremacyResult.killSwitch",
    }]);
  }
  return Object.freeze([]);
}
