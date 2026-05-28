import type { ConfidenceIntegrityInspection } from "@/types/recommendation-integrity";
import { hashRecommendationIntegrityValue } from "@/services/recommendation-integrity/deterministicRecommendationHasher";

export function inspectConfidenceIntegrity(input: {
  confidenceLinked: boolean;
  confidenceSafe: boolean;
}): ConfidenceIntegrityInspection {
  const base = Object.freeze(input);
  return Object.freeze({
    ...base,
    inspectionHash: hashRecommendationIntegrityValue("confidence-inspection", base),
  });
}
