import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
  ForensicReplayBinding,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function validateForensicReplayBinding(
  input: ConstitutionalTelemetryInput,
): Readonly<{
  replayBinding: ForensicReplayBinding;
  errors: readonly ConstitutionalTelemetryError[];
}> {
  const replayBound = input.constitutionalReplayResult.record.replayDeterministic;
  const governanceBound = input.runtimeAdmissibilityResult.governanceBinding.governanceBound;
  const escalationBound = input.escalationDeterminismResult.record.governanceBound;
  const overrideBound = input.humanSupremacyResult.record.governanceBound;
  const containmentBound = input.antiEmergenceResult.record.governanceBound;
  const runtimeBound = input.runtimeAdmissibilityResult.record.governanceBound;
  const errors: ConstitutionalTelemetryError[] = [];
  if (!(replayBound && governanceBound && escalationBound && overrideBound && containmentBound && runtimeBound)) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_REPLAY_MISMATCH",
      message: "Telemetry forensics requires immutable replay, governance, escalation, override, containment, and runtime bindings.",
      path: "constitutionalReplayResult.record.replayDeterministic",
    }));
  }
  return Object.freeze({
    replayBinding: Object.freeze({
      bindingId: hashConstitutionalTelemetryValue("constitutional-telemetry-binding-id", input.telemetryId),
      replayBound,
      governanceBound,
      escalationBound,
      overrideBound,
      containmentBound,
      runtimeBound,
      deterministicHash: hashConstitutionalTelemetryValue("constitutional-telemetry-binding", {
        replayBound,
        governanceBound,
        escalationBound,
        overrideBound,
        containmentBound,
        runtimeBound,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
