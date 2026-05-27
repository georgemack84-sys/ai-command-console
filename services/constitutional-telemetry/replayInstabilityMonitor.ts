import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
  TelemetryEvent,
} from "./telemetryStateTypes";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function monitorReplayInstability(
  input: ConstitutionalTelemetryInput,
): Readonly<{
  event: TelemetryEvent;
  errors: readonly ConstitutionalTelemetryError[];
}> {
  const triggered = !input.constitutionalReplayResult.record.replayDeterministic
    || input.constitutionalReplayResult.record.classification !== "STABLE";
  const errors = triggered
    ? [Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_REPLAY_MISMATCH" as const,
      message: "Telemetry detected replay instability or divergence from historical truth.",
      path: "constitutionalReplayResult.record.classification",
    })]
    : [];
  return Object.freeze({
    event: Object.freeze({
      telemetryId: input.telemetryId,
      domain: "replay_instability",
      triggered,
      severity: triggered ? "critical" : "none",
      reason: triggered ? "Replay stability no longer remained deterministic and historical-only." : "Replay remained deterministic and reconstructive-only.",
      deterministicHash: hashConstitutionalTelemetryValue("constitutional-telemetry-replay-event", {
        telemetryId: input.telemetryId,
        triggered,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
