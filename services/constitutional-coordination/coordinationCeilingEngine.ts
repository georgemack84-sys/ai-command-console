import type { ConstitutionalCeilingLevel, ConstitutionalCoordinationState } from "@/types/constitutional-coordination";
import type { ContainmentState } from "@/types/coordination-containment";

export function resolveConstitutionalCeiling(containmentState: ContainmentState): ConstitutionalCeilingLevel {
  if (containmentState === "safe") {
    return "strict";
  }
  if (containmentState === "restricted") {
    return "restricted";
  }
  return "frozen";
}

export function resolveConstitutionalCoordinationState(input: {
  ceilingLevel: ConstitutionalCeilingLevel;
  governanceValid: boolean;
  replayValid: boolean;
  escalationBound: boolean;
  errorsPresent: boolean;
}): ConstitutionalCoordinationState {
  if (input.ceilingLevel === "frozen") {
    return "frozen";
  }
  if (input.errorsPresent || !input.governanceValid || !input.replayValid) {
    return "invalid";
  }
  if (input.ceilingLevel === "restricted") {
    return "restricted";
  }
  if (input.escalationBound) {
    return "coordinated";
  }
  return "replay_bound";
}
