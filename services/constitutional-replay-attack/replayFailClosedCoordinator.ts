import type { ConstitutionalReplayAttackState, ConstitutionalReplayError } from "@/types/constitutional-replay";
import { freezeReplayState } from "./replayStateFreezer";

export function resolveConstitutionalReplayState(input: {
  errors: readonly ConstitutionalReplayError[];
  governanceLinked: boolean;
  replayDeterministic: boolean;
  inheritedFailClosed: boolean;
}): ConstitutionalReplayAttackState {
  return freezeReplayState(input);
}
