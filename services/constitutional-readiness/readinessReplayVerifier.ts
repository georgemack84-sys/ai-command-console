import type { ConstitutionalReadinessInput, ReadinessReplayVerification } from "@/types/constitutional-readiness";
import { hashReadinessValue } from "./readinessHashEngine";

export function verifyReadinessReplay(input: {
  readinessInput: ConstitutionalReadinessInput;
  replayStable: boolean;
}): ReadinessReplayVerification {
  const replayDeterministic = input.replayStable
    && input.readinessInput.adversarialTelemetryResult.record.replaySafe;
  return Object.freeze({
    replayStable: input.replayStable,
    replayDeterministic,
    replayHash: hashReadinessValue("constitutional-readiness-replay-verification", {
      readinessId: input.readinessInput.readinessId,
      replayStable: input.replayStable,
      replayDeterministic,
    }),
  });
}
