import type { ConstitutionalReplayStabilityError, ConstitutionalReplayStabilityInput } from "./replayStateTypes";

export function loadReplayVersion(input: ConstitutionalReplayStabilityInput): readonly ConstitutionalReplayStabilityError[] {
  if (!input.validatorVersionId) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_VALIDATOR_MISMATCH",
      message: "Validator version is required for deterministic constitutional replay.",
      path: "validatorVersionId",
    })]);
  }
  return Object.freeze([]);
}
