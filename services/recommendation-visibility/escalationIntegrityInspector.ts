import type { EscalationIntegrityInspection } from "@/types/recommendation-integrity";
import { hashRecommendationIntegrityValue } from "@/services/recommendation-integrity/deterministicRecommendationHasher";

export function inspectEscalationIntegrity(input: {
  escalationId: string;
  escalationState: string;
  escalationLineageId: string;
}): EscalationIntegrityInspection {
  const base = Object.freeze(input);
  return Object.freeze({
    ...base,
    inspectionHash: hashRecommendationIntegrityValue("escalation-inspection", base),
  });
}
