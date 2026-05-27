import type { ConstitutionalReplayStabilityError, ConstitutionalReplayStabilityInput } from "./replayStateTypes";
import { normalizeReplayStabilityMetadata } from "./replaySchemas";

export function validateReplayIsolation(input: ConstitutionalReplayStabilityInput): readonly ConstitutionalReplayStabilityError[] {
  const normalized = normalizeReplayStabilityMetadata(input.metadata);
  if (
    normalized.includes("execution")
    || normalized.includes("orchestration")
    || normalized.includes("runtime mutation".replace(/[^a-z0-9]+/g, ""))
    || normalized.includes("hiddenreplaypath")
  ) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_ISOLATION_VIOLATION",
      message: "Execution, orchestration, runtime mutation, or hidden replay path markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
