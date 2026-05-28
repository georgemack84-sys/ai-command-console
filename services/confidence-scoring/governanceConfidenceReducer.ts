import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceScoringInput, GovernanceImpactScore } from "./types/confidenceScoringTypes";

export function buildGovernanceImpact(
  input: ConfidenceScoringInput,
  governanceAlignmentScore: number,
): GovernanceImpactScore {
  const governanceSnapshotId = input.recommendationSynthesisInput.recommendationValidationResult.result.governanceSnapshotId;
  const policySnapshotIds = Object.freeze([...input.recommendationSynthesisInput.policySnapshotIds].sort((a, b) => a.localeCompare(b)));
  const cautionAmplified = governanceAlignmentScore < 0.75;
  return Object.freeze({
    governanceSnapshotId,
    policySnapshotIds,
    alignmentScore: governanceAlignmentScore,
    cautionAmplified,
    deterministicHash: hashRecommendationValue("confidence-scoring-governance-impact", {
      governanceSnapshotId,
      policySnapshotIds,
      governanceAlignmentScore,
      cautionAmplified,
    }),
  });
}
