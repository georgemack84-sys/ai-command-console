import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";

export function validateRuntimeContainment(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  if (input.antiEmergenceResult.containmentState.freezeRequired
    || input.antiEmergenceResult.record.classification !== "contained") {
    return Object.freeze([Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_CONTAINMENT_DEGRADED",
      message: "Runtime admissibility requires contained anti-emergence state and no freeze requirement.",
      path: "antiEmergenceResult.containmentState.freezeRequired",
    })]);
  }
  return Object.freeze([]);
}
