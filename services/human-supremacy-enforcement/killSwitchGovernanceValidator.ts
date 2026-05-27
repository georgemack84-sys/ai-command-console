import type { HumanSupremacyEnforcementInput, HumanSupremacyError } from "./supremacyStateTypes";

export function validateKillSwitchGovernance(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  if (
    input.interventionType === "kill_switch"
    && !input.constitutionalReplayResult.replayBinding.governanceBound
  ) {
    return Object.freeze([Object.freeze({
      code: "HUMAN_SUPREMACY_GOVERNANCE_DETACHED",
      message: "Kill switch enforcement requires governance-bound replay.",
      path: "constitutionalReplayResult.replayBinding.governanceBound",
    })]);
  }
  return Object.freeze([]);
}
