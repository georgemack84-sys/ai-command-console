import type { HumanCoordinationOverrideError, HumanCoordinationOverrideInput } from "@/types/human-coordination-override";

export function shouldFreezeOverride(input: {
  overrideInput: HumanCoordinationOverrideInput;
  errorCodes: readonly HumanCoordinationOverrideError["code"][];
}): boolean {
  return input.overrideInput.overrideType === "freeze"
    || input.errorCodes.some((code) =>
      code.includes("REPLAY_AMBIGUITY")
      || code.includes("LINEAGE_CORRUPTION")
      || code.includes("CONTAINMENT_BYPASS")
      || code.includes("ROUTING_RESTORATION"));
}
