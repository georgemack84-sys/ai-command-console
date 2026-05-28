import type { HumanSupremacyEnforcementInput, HumanSupremacyError } from "./supremacyStateTypes";

export function validateFreezeReplay(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  if (
    input.interventionType === "freeze"
    && !input.constitutionalReplayResult.replayBinding.escalationBound
  ) {
    return Object.freeze([Object.freeze({
      code: "HUMAN_SUPREMACY_REPLAY_MISMATCH",
      message: "Freeze reconstruction requires escalation-bound replay history.",
      path: "constitutionalReplayResult.replayBinding.escalationBound",
    })]);
  }
  return Object.freeze([]);
}
