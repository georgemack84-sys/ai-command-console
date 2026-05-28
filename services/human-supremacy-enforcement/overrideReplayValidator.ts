import type { HumanSupremacyEnforcementInput, HumanSupremacyError } from "./supremacyStateTypes";

export function validateOverrideReplay(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  if (
    input.interventionType === "override"
    && input.constitutionalReplayResult.record.classification !== "STABLE"
  ) {
    return Object.freeze([Object.freeze({
      code: "HUMAN_SUPREMACY_REPLAY_MISMATCH",
      message: "Override propagation requires stable historical replay reconstruction.",
      path: "constitutionalReplayResult.record.classification",
    })]);
  }
  return Object.freeze([]);
}
