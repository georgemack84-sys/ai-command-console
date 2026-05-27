import type { ConstitutionalReplayStabilityError, ConstitutionalReplayStabilityInput } from "./replayStateTypes";
import { normalizeReplayStabilityMetadata } from "./replaySchemas";

export function enforceReplayBoundary(input: ConstitutionalReplayStabilityInput): readonly ConstitutionalReplayStabilityError[] {
  const normalized = normalizeReplayStabilityMetadata(input.metadata);
  if (
    normalized.includes("presentstateinterpretation")
    || normalized.includes("syntheticlineage")
    || normalized.includes("dynamicstategeneration")
    || normalized.includes("livegovernanceconsultation")
  ) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_BOUNDARY_VIOLATION",
      message: "Present-state interpretation, synthetic lineage, dynamic state generation, or live governance consultation markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
