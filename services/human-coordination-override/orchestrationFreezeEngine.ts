import type { HumanCoordinationOverrideInput, HumanCoordinationOverrideState } from "@/types/human-coordination-override";

export function resolveFrozenOverrideState(input: {
  overrideType: HumanCoordinationOverrideInput["overrideType"];
  forceFreeze: boolean;
}): HumanCoordinationOverrideState {
  if (input.forceFreeze || input.overrideType === "freeze") {
    return "frozen";
  }
  return input.overrideType === "deny" ? "denied" : input.overrideType === "revoke" ? "revoked" : "paused";
}
