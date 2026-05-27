import type { GovernanceBindingInspection } from "@/types/recommendation-integrity";
import { hashRecommendationIntegrityValue } from "@/services/recommendation-integrity/deterministicRecommendationHasher";

export function inspectGovernanceBinding(input: {
  governanceSnapshotId: string;
  governanceLinked: boolean;
}): GovernanceBindingInspection {
  const base = Object.freeze(input);
  return Object.freeze({
    ...base,
    inspectionHash: hashRecommendationIntegrityValue("governance-inspection", base),
  });
}
