import type { ConstitutionalReplayStabilityError, ConstitutionalReplayStabilityInput } from "./replayStateTypes";
import { normalizeReplayStabilityMetadata } from "./replaySchemas";

export function detectReplayCorruption(input: ConstitutionalReplayStabilityInput): readonly ConstitutionalReplayStabilityError[] {
  const normalized = normalizeReplayStabilityMetadata(input.metadata);
  if (
    normalized.includes("replaycorruption")
    || normalized.includes("syntheticreplayinjection")
    || normalized.includes("inferredreplaygeneration")
    || normalized.includes("timestamptampering")
  ) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_REPLAY_CORRUPTION",
      message: "Replay corruption, synthetic replay, inferred generation, or timestamp tampering markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
