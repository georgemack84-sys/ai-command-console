import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";

export function validateRuntimeEscalationCompatibility(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  if (input.escalationDeterminismResult.record.oversightState === "stable"
    && !input.escalationDeterminismResult.record.failClosed) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "RUNTIME_ADMISSIBILITY_ESCALATION_INCOMPATIBLE",
    message: "Runtime admissibility requires deterministic escalation stability.",
    path: "escalationDeterminismResult.record.oversightState",
  })]);
}
