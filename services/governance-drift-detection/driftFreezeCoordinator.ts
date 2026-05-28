import type { GovernanceDriftError, GovernanceDriftState } from "@/types/governance-drift";

export function freezeGovernanceDriftState(input: {
  errors: readonly GovernanceDriftError[];
  governanceLinked: boolean;
  replayDeterministic: boolean;
  inheritedFailClosed: boolean;
}): GovernanceDriftState {
  if (input.inheritedFailClosed || !input.governanceLinked || !input.replayDeterministic) {
    return "FAIL_CLOSED";
  }
  if (input.errors.some((item) =>
    item.code.includes("ISOLATION")
    || item.code.includes("RUNTIME")
    || item.code.includes("CURRENT_STATE")
    || item.code.includes("REPLAY_REPAIR")
  )) {
    return "FAIL_CLOSED";
  }
  if (input.errors.length > 0) {
    return "ESCALATED";
  }
  return "SIMULATED";
}
