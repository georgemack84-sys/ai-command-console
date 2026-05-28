import type { ApprovalAwareRoutingInput } from "@/types/approval-aware-coordination-router";

export function guardRoutingContainment(input: ApprovalAwareRoutingInput): readonly string[] {
  if (input.containmentState === "safe" || input.containmentState === "restricted" || input.containmentState === "frozen") {
    return Object.freeze([]);
  }
  return Object.freeze(["containment:unknown"]);
}
