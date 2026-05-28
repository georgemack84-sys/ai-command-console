import type { ConstitutionalReplayAttackState, ConstitutionalReplayError } from "@/types/constitutional-replay";

export function freezeReplayState(input: {
  errors: readonly ConstitutionalReplayError[];
  governanceLinked: boolean;
  replayDeterministic: boolean;
  inheritedFailClosed: boolean;
}): ConstitutionalReplayAttackState {
  if (input.inheritedFailClosed || !input.governanceLinked || !input.replayDeterministic) {
    return "FAIL_CLOSED";
  }
  if (input.errors.some((item) =>
    item.code.includes("VALIDATOR")
    || item.code.includes("ISOLATION")
    || item.code.includes("RUNTIME")
    || item.code.includes("REPAIR")
    || item.code.includes("CURRENT_STATE")
  )) {
    return "FAIL_CLOSED";
  }
  if (input.errors.length > 0) {
    return "ESCALATED";
  }
  return "SIMULATED";
}
