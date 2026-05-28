import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
} from "./telemetryStateTypes";

export function validateTelemetryReplay(
  input: ConstitutionalTelemetryInput,
): readonly ConstitutionalTelemetryError[] {
  if (input.constitutionalReplayResult.record.replayDeterministic
    && input.runtimeAdmissibilityResult.record.replaySafe) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "CONSTITUTIONAL_TELEMETRY_REPLAY_MISMATCH",
    message: "Telemetry replay validation requires immutable replay determinism across replay and runtime admissibility.",
    path: "constitutionalReplayResult.record.replayDeterministic",
  })]);
}
