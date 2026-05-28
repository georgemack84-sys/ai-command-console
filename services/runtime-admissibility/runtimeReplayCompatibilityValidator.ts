import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
} from "./runtimeAdmissibilityStateTypes";

export function validateRuntimeReplayCompatibility(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeAdmissibilityError[] {
  if (input.constitutionalReplayResult.record.replayDeterministic
    && input.constitutionalReplayResult.record.classification === "STABLE") {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "RUNTIME_ADMISSIBILITY_REPLAY_MISMATCH",
    message: "Runtime admissibility requires stable historical replay reconstruction.",
    path: "constitutionalReplayResult.record.classification",
  })]);
}
