import type { ConstitutionalEscalationRecommendation } from "@/types/constitutional-escalation-layer";
import { normalizeEscalationValue } from "./escalationNormalizer";

export function reconstructEscalationReplay(
  recommendation: ConstitutionalEscalationRecommendation,
): ConstitutionalEscalationRecommendation {
  return Object.freeze(normalizeEscalationValue(recommendation));
}
