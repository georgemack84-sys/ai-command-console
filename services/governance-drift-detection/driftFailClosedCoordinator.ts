import type { GovernanceDriftError, GovernanceDriftState } from "@/types/governance-drift";
import { freezeGovernanceDriftState } from "./driftFreezeCoordinator";

export function resolveGovernanceDriftState(input: {
  errors: readonly GovernanceDriftError[];
  governanceLinked: boolean;
  replayDeterministic: boolean;
  inheritedFailClosed: boolean;
}): GovernanceDriftState {
  return freezeGovernanceDriftState(input);
}
