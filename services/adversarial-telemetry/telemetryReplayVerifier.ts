import type { ConstitutionalTelemetryInput, TelemetryReplayVerification } from "@/types/adversarial-telemetry";
import { hashTelemetryValue } from "./telemetryHashEngine";

export function verifyTelemetryReplay(input: {
  telemetryInput: ConstitutionalTelemetryInput;
  replayStable: boolean;
}): TelemetryReplayVerification {
  const replayDeterministic = input.replayStable && input.telemetryInput.constitutionalAuditEpisodeResult.record.replaySafe;
  return Object.freeze({
    replayStable: input.replayStable,
    replayDeterministic,
    verificationHash: hashTelemetryValue("telemetry-replay-verification", {
      telemetryId: input.telemetryInput.telemetryId,
      replayStable: input.replayStable,
      replayDeterministic,
    }),
  });
}
