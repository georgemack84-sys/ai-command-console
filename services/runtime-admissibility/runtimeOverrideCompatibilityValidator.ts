import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";

export function validateRuntimeOverrideCompatibility(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  const supremacy = input.humanSupremacyResult;
  if (supremacy.record.enforcementState === "ENFORCED"
    && supremacy.freeze.scope !== "global"
    && !supremacy.killSwitch.active) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "RUNTIME_ADMISSIBILITY_OVERRIDE_INCOMPATIBLE",
    message: "Human supremacy currently freezes, revokes, or invalidates runtime admissibility.",
    path: "humanSupremacyResult.record.enforcementState",
  })]);
}
