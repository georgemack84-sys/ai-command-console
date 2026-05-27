import type { ConstitutionalReplayStabilityError, ConstitutionalReplayStabilityInput } from "./replayStateTypes";

export function validateReplayContainment(input: ConstitutionalReplayStabilityInput): readonly ConstitutionalReplayStabilityError[] {
  if (input.constitutionalAuthorityBoundaryResult.record.failClosed) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_CONTAINMENT_FAILURE",
      message: "Inherited fail-closed authority containment blocks replay stability certification.",
      path: "constitutionalAuthorityBoundaryResult.record.failClosed",
    })]);
  }
  return Object.freeze([]);
}
