import type { ConstitutionalReplayStabilityError, ReplayStateRecord } from "./replayStateTypes";

export function validateReplayConsistency(input: {
  state: ReplayStateRecord;
}): readonly ConstitutionalReplayStabilityError[] {
  const errors: ConstitutionalReplayStabilityError[] = [];
  if (input.state.overrideState !== "preserved" && input.state.escalationState === "stable") {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_OVERRIDE_CORRUPTION",
      message: "Replay consistency failed because stable escalation cannot coexist with lost override propagation.",
      path: "state.overrideState",
    }));
  }
  return Object.freeze(errors);
}
