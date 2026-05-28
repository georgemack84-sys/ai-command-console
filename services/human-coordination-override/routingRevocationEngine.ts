import type { HumanCoordinationOverrideInput } from "@/types/human-coordination-override";

export function resolveRoutingRevocationTarget(input: {
  overrideType: HumanCoordinationOverrideInput["overrideType"];
}): "coordination_hold" | "human_review" {
  return input.overrideType === "revoke" || input.overrideType === "deny" || input.overrideType === "freeze"
    ? "coordination_hold"
    : "human_review";
}
