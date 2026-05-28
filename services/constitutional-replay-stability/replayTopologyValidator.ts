import type { ConstitutionalReplayStabilityError, ConstitutionalReplayStabilityInput } from "./replayStateTypes";
import { normalizeReplayStabilityMetadata } from "./replaySchemas";

export function validateReplayTopology(input: ConstitutionalReplayStabilityInput): readonly ConstitutionalReplayStabilityError[] {
  const normalized = normalizeReplayStabilityMetadata(input.metadata);
  if (
    normalized.includes("replaytopologymutation")
    || normalized.includes("topologyregeneration")
    || normalized.includes("runtime topology".replace(/[^a-z0-9]+/g, ""))
  ) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_TOPOLOGY_MUTATION",
      message: "Replay topology mutation or topology regeneration markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
