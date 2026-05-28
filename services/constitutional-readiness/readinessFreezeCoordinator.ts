import type { ReadinessClassification } from "@/types/constitutional-readiness";

const ORDER: Record<ReadinessClassification, number> = {
  VERIFIED: 0,
  CONDITIONAL: 1,
  DEGRADED: 2,
  DISPUTED: 3,
  FROZEN: 4,
  INVALID: 5,
};

export function freezeReadinessState(input: {
  classification: ReadinessClassification;
  inheritedFailClosed: boolean;
}): ReadinessClassification {
  const floor: ReadinessClassification = input.inheritedFailClosed ? "FROZEN" : input.classification;
  return ORDER[floor] > ORDER[input.classification] ? floor : input.classification;
}
