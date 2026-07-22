import { describe, expect, it } from "vitest";
import {
  computeRecommendationQualityHash,
  getRecommendationQualityFoundation,
  RECOMMENDATION_QUALITY_DIMENSIONS,
  replayRecommendationQuality,
  scoreRecommendationQuality,
} from "@/services/recommendation-quality-scoring";
import type { RecommendationQualityFailure, RecommendationQualityRating, RecommendationQualityScenario } from "@/types/recommendation-quality-scoring";

describe("Mission Control Phase 10.3.3 Recommendation Quality Scoring", () => {
  it("publishes the recommendation quality scoring foundation", () => {
    const foundation = getRecommendationQualityFoundation();

    expect(foundation.recommendation_quality_scoring_version).toBe("recommendation-quality-scoring/v1");
    expect(foundation.mandatory_dimensions).toEqual(RECOMMENDATION_QUALITY_DIMENSIONS);
    expect(foundation.weighting_profile.profile_version).toBe("10.3.3");
    expect(foundation.weighting_profile.weight_total).toBe(1);
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("scores quality without adaptive learning or mutation", () => {
    const result = scoreRecommendationQuality();

    expect(result.quality_scoring_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.adaptive_learning).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_outcomes).toBe(false);
    expect(result.api_surface.adaptive_learning_supported).toBe(false);
    expect(result.api_surface.update_supported).toBe(false);
    expect(result.api_surface.delete_supported).toBe(false);
  });

  it("scores every mandatory quality dimension with evidence and explanations", () => {
    const result = scoreRecommendationQuality();

    expect(result.quality_score.dimension_scores.map((score) => score.dimension)).toEqual(RECOMMENDATION_QUALITY_DIMENSIONS);
    expect(result.quality_score.dimension_scores.every((score) => score.supporting_evidence_refs.length > 0)).toBe(true);
    expect(result.quality_score.dimension_scores.every((score) => score.explanation.length > 0)).toBe(true);
    expect(result.validation.dimensions_complete).toBe(true);
  });

  it("applies deterministic weights and reproduces the composite score", () => {
    const result = scoreRecommendationQuality();
    const recomputed = Number(result.quality_score.dimension_scores.reduce((sum, score) => sum + score.weighted_score, 0).toFixed(6));

    expect(result.quality_score.weighting_profile.governance_approved).toBe(true);
    expect(result.quality_score.weighting_profile.weight_total).toBe(1);
    expect(result.quality_score.composite_effectiveness_score).toBe(recomputed);
    expect(result.validation.composite_reproducible).toBe(true);
  });

  it.each([
    ["EXCEPTIONAL", "EXCEPTIONAL"],
    ["HIGH", "HIGH"],
    ["GOOD", "GOOD"],
    ["ACCEPTABLE", "ACCEPTABLE"],
    ["MARGINAL", "MARGINAL"],
    ["POOR", "POOR"],
    ["UNACCEPTABLE", "UNACCEPTABLE"],
  ] as readonly [RecommendationQualityScenario, RecommendationQualityRating][])("classifies %s ratings deterministically", (scenario, rating) => {
    const result = scoreRecommendationQuality({ scenario });

    expect(result.quality_score.quality_rating).toBe(rating);
    expect(result.validation.composite_reproducible).toBe(true);
  });

  it("creates stable quality hashes and replay output", () => {
    const result = scoreRecommendationQuality();

    expect(computeRecommendationQualityHash(result.quality_score)).toBe(result.quality_score.integrity_hash);
    expect(replayRecommendationQuality(result)).toBe(true);
  });

  it("records append-only Truth Ledger references", () => {
    const result = scoreRecommendationQuality();

    expect(result.ledger_record.append_only).toBe(true);
    expect(result.ledger_record.deleted).toBe(false);
    expect(result.ledger_record.quality_score_id).toBe(result.quality_score.quality_score_id);
    expect(result.validation.ledger_recorded).toBe(true);
  });

  it("validates governance, replay, evidence, explanations, tenant isolation, and integrity", () => {
    const result = scoreRecommendationQuality();

    expect(result.validation.governance_validated).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.evidence_complete).toBe(true);
    expect(result.validation.explanations_complete).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["MISSING_DIMENSION", "MANDATORY_DIMENSIONS_MISSING"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["INVALID_WEIGHTING", "WEIGHTING_PROFILE_INVALID"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_VALIDATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["INCOMPLETE_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["HASH_MISMATCH", "INTEGRITY_MISMATCH_DETECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["RECONSTRUCTION_FAILURE", "RECOMMENDATION_RECONSTRUCTION_FAILED"],
    ["EVIDENCE_VERIFICATION_FAILURE", "EVIDENCE_VERIFICATION_FAILED"],
    ["COMPOSITE_MISMATCH", "COMPOSITE_SCORE_NOT_REPRODUCIBLE"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION_DETECTED"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RecommendationQualityScenario, RecommendationQualityFailure][])("fails closed for %s", (scenario, failure) => {
    const result = scoreRecommendationQuality({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_outcomes).toBe(false);
  });

  it("keeps incomplete evidence scoring pending instead of certified", () => {
    expect(scoreRecommendationQuality({ scenario: "INCOMPLETE_EVIDENCE" }).validation.state).toBe("PENDING_EVIDENCE");
  });

  it("detects quality scoring tampering during replay", () => {
    const result = scoreRecommendationQuality();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRecommendationQuality(tampered)).toBe(false);
  });
});
