import type { AttackSimulationState, ConstitutionalAttackError } from "@/types/constitutional-attack-engine";

export function resolveAttackSimulationState(input: {
  errors: readonly ConstitutionalAttackError[];
  governanceLinked: boolean;
  replayDeterministic: boolean;
  inheritedFailClosed: boolean;
}): AttackSimulationState {
  if (input.inheritedFailClosed || input.errors.length > 0) {
    return "FAIL_CLOSED";
  }
  if (!input.governanceLinked || !input.replayDeterministic) {
    return "CONDITIONALLY_BLOCKED";
  }
  return "SIMULATED";
}
