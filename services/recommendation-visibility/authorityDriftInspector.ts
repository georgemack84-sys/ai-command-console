import type { AuthorityDriftInspection } from "@/types/recommendation-integrity";
import { hashRecommendationIntegrityValue } from "@/services/recommendation-integrity/deterministicRecommendationHasher";

export function inspectAuthorityDrift(input: {
  authorityDriftDetected: boolean;
  hiddenOrchestrationDetected: boolean;
}): AuthorityDriftInspection {
  const base = Object.freeze(input);
  return Object.freeze({
    ...base,
    inspectionHash: hashRecommendationIntegrityValue("authority-drift-inspection", base),
  });
}
