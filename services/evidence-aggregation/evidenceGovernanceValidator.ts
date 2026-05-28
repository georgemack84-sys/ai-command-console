import { correlateRecommendationGovernance } from "@/services/recommendation-synthesis/recommendationGovernanceCorrelator";
import type { EvidenceAggregationError, EvidenceAggregationInput, EvidenceReference } from "./types/evidenceAggregationTypes";

export function validateEvidenceGovernance(input: {
  aggregationInput: EvidenceAggregationInput;
  references: readonly EvidenceReference[];
}): readonly EvidenceAggregationError[] {
  const errors: EvidenceAggregationError[] = correlateRecommendationGovernance(input.aggregationInput.recommendationSynthesisInput).map((error) => ({
    code: "EVIDENCE_AGGREGATION_GOVERNANCE_AMBIGUITY" as const,
    message: error.message,
    path: error.path,
  }));

  const governanceIds = new Set(input.references.map((reference) => reference.governanceSnapshotId).filter(Boolean));
  if (governanceIds.size > 1) {
    errors.push({
      code: "EVIDENCE_AGGREGATION_GOVERNANCE_AMBIGUITY",
      message: "Evidence sources disagree on governance snapshot ancestry.",
      path: "evidenceReferences.governanceSnapshotId",
    });
  }
  return Object.freeze(errors);
}
