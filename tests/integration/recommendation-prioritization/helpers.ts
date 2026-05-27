import { prioritizeRecommendations } from "@/services/recommendation-prioritization/recommendationPrioritizationEngine";
import type {
  RecommendationPrioritizationInput,
  RecommendationPriorityInput,
} from "@/services/recommendation-prioritization/types/prioritizationTypes";
import { buildConfidenceScoringFixture } from "@/tests/integration/confidence-scoring/helpers";

function derivePriorityInput(): RecommendationPriorityInput {
  const confidenceFixture = buildConfidenceScoringFixture();
  const confidenceScore = confidenceFixture.result.confidenceScores[0]!;
  const constrainedRecommendation = confidenceFixture.input.recommendationConstraintResult.constrainedRecommendations[0]!;
  const governanceRecord = confidenceFixture.input.recommendationConstraintResult.governanceRecords[0]!;
  const replayRecord = confidenceFixture.input.recommendationConstraintResult.replayRecords[0]!;

  return Object.freeze({
    prioritizationId: "recommendation-prioritization-1",
    recommendationId: constrainedRecommendation.constrainedRecommendation.recommendationId,
    proposalId: confidenceFixture.input.recommendationSynthesisInput.proposalIntegrityResult.proposal.proposalId,
    governanceSnapshotId: governanceRecord.governanceSnapshotId,
    replaySnapshotId: replayRecord.replaySnapshotId,
    confidenceScoreId: confidenceScore.confidenceId,
    constraintEvaluationId: constrainedRecommendation.constraintHash,
    governanceSeverity: "HIGH" as const,
    replayIntegrity: "VALID" as const,
    validationStatus: "PASSED" as const,
    escalationRisk: "LOW" as const,
    containmentRisk: "MEDIUM" as const,
    approvalDependencyState: "REQUIRED_REVIEW" as const,
    operatorVisibilityRequirement: "PROMINENT" as const,
    confidenceLevel: confidenceScore.confidenceLevel,
    uncertaintyLevel: confidenceScore.uncertaintyLevel,
    upstreamFrozen: confidenceFixture.result.freeze.frozen,
    upstreamFailedClosed: confidenceFixture.result.errors.length > 0,
    executionAuthorized: false as const,
    runtimeMutationAllowed: false as const,
    schedulingAllowed: false as const,
    authorityMutationAllowed: false as const,
  });
}

export function buildRecommendationPrioritizationFixture(
  overrides: Partial<RecommendationPrioritizationInput> = {},
) {
  const confidenceFixture = buildConfidenceScoringFixture();
  const baseInput = {
    prioritizationRunId: "recommendation-prioritization-run-1",
    createdAt: "2026-05-20T22:00:00.000Z",
    constitutionalVersion: "5.1E",
    weightingVersion: "recommendation-prioritization-weighting-v1",
    orderingVersion: "recommendation-prioritization-ordering-v1",
    inputs: Object.freeze([derivePriorityInput()]),
    recommendationSynthesisResult: confidenceFixture.input.recommendationSynthesisResult,
    recommendationConstraintResult: confidenceFixture.input.recommendationConstraintResult,
    confidenceScoringResult: confidenceFixture.result,
  } satisfies RecommendationPrioritizationInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as RecommendationPrioritizationInput;

  return Object.freeze({
    confidenceFixture,
    input,
    result: prioritizeRecommendations(input),
  });
}
