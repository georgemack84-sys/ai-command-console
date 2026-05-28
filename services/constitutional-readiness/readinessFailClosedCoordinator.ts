import type { ReadinessClassification } from "@/types/constitutional-readiness";

export function resolveReadinessFailClosedState(input: {
  classification: ReadinessClassification;
  containmentFreezeRecommended: boolean;
  inheritedFailClosed: boolean;
  errors: readonly { code: string }[];
}): ReadinessClassification {
  if (input.classification === "INVALID") {
    return "INVALID";
  }
  if (
    input.inheritedFailClosed
    || input.containmentFreezeRecommended
    || input.errors.some((item) =>
      item.code.includes("CONTAINMENT_FREEZE_REQUIRED")
      || item.code.includes("GOVERNANCE_SUPREMACY_FAILURE")
      || item.code.includes("REPLAY_DIVERGENCE")
      || item.code.includes("REPLAY_INTEGRITY_FAILURE"))
  ) {
    return "FROZEN";
  }
  return input.classification;
}
