import { describe, expect, it } from "vitest";
import {
  computeRecommendationDimensionEvaluationHash,
  evaluateRecommendationDimensions,
  getRecommendationDimensionEvaluationFoundation,
  RECOMMENDATION_DIMENSIONS,
  replayRecommendationDimensionEvaluation,
} from "@/services/recommendation-dimension-evaluation";
import type { DimensionEvaluationFailure, DimensionEvaluationScenario, DimensionRating, RecommendationDimension } from "@/types/recommendation-dimension-evaluation";

describe("Mission Control Phase 10.3.7 Recommendation Dimension Evaluation", () => {
  it("publishes the recommendation dimension evaluation foundation", () => {
    const foundation = getRecommendationDimensionEvaluationFoundation();

    expect(foundation.recommendation_dimension_evaluation_version).toBe("recommendation-dimension-evaluation/v1");
    expect(foundation.dimensions).toEqual(RECOMMENDATION_DIMENSIONS);
    expect(foundation.api_surface.evaluate_dimensions).toBe("POST /recommendation-dimension-evaluation/evaluate");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("evaluates dimensions as diagnostic advisory intelligence only", () => {
    const result = evaluateRecommendationDimensions();

    expect(result.diagnostic_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.dimensions_independent).toBe(true);
    expect(result.adaptive_learning).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.api_surface.adaptive_learning_supported).toBe(false);
    expect(result.api_surface.update_supported).toBe(false);
    expect(result.api_surface.delete_supported).toBe(false);
  });

  it("scores every mandatory dimension with evidence, findings, explanations, and improvements", () => {
    const result = evaluateRecommendationDimensions();

    expect(result.evaluation_record.dimension_scores.map((score) => score.dimension)).toEqual(RECOMMENDATION_DIMENSIONS);
    expect(result.evaluation_record.dimension_scores.every((score) => score.independent)).toBe(true);
    expect(result.evaluation_record.dimension_scores.every((score) => score.supporting_evidence_refs.length > 0)).toBe(true);
    expect(result.evaluation_record.dimension_scores.every((score) => score.findings.length > 0)).toBe(true);
    expect(result.evaluation_record.dimension_scores.every((score) => score.explanation.length > 0)).toBe(true);
    expect(result.evaluation_record.improvement_opportunities.length).toBeGreaterThan(0);
  });

  it.each([
    ["EXCEPTIONAL", "EXCEPTIONAL"],
    ["HIGH", "HIGH"],
    ["GOOD", "GOOD"],
    ["ADEQUATE", "ADEQUATE"],
    ["LIMITED", "LIMITED"],
    ["POOR", "POOR"],
    ["UNACCEPTABLE", "UNACCEPTABLE"],
  ] as readonly [DimensionEvaluationScenario, DimensionRating][])("classifies %s ratings deterministically", (scenario, rating) => {
    const result = evaluateRecommendationDimensions({ scenario });

    expect(result.evaluation_record.dimension_scores.every((score) => score.rating === rating)).toBe(true);
  });

  it.each([
    ["WEAK_EVIDENCE_ONLY", "EVIDENCE"],
    ["WEAK_RISK_ONLY", "RISK"],
    ["WEAK_CONFIDENCE_ONLY", "CONFIDENCE"],
    ["WEAK_GOVERNANCE_ONLY", "GOVERNANCE"],
    ["WEAK_EXPLAINABILITY_ONLY", "EXPLAINABILITY"],
    ["WEAK_ALTERNATIVES_ONLY", "ALTERNATIVES"],
    ["WEAK_ROLLBACK_ONLY", "ROLLBACK"],
  ] as readonly [DimensionEvaluationScenario, RecommendationDimension][])("keeps %s isolated to one dimension", (scenario, weakDimension) => {
    const result = evaluateRecommendationDimensions({ scenario });
    const weak = result.evaluation_record.dimension_scores.find((score) => score.dimension === weakDimension)!;
    const others = result.evaluation_record.dimension_scores.filter((score) => score.dimension !== weakDimension);

    expect(weak.score).toBeLessThan(0.5);
    expect(others.every((score) => score.score >= 0.5)).toBe(true);
    expect(result.validation.dimensions_independent).toBe(true);
  });

  it("creates stable evaluation hashes and replay output", () => {
    const result = evaluateRecommendationDimensions();

    expect(computeRecommendationDimensionEvaluationHash(result.evaluation_record)).toBe(result.evaluation_record.integrity_hash);
    expect(replayRecommendationDimensionEvaluation(result)).toBe(true);
  });

  it("records append-only Truth Ledger bindings for dimension scores", () => {
    const result = evaluateRecommendationDimensions();

    expect(result.ledger_record.append_only).toBe(true);
    expect(result.ledger_record.deleted).toBe(false);
    expect(result.ledger_record.dimension_score_refs).toEqual(result.evaluation_record.dimension_scores.map((score) => score.dimension_score_id));
    expect(result.validation.ledger_recorded).toBe(true);
  });

  it("validates dimensions, governance, replay, evidence, explanations, tenant isolation, and integrity", () => {
    const result = evaluateRecommendationDimensions();

    expect(result.validation.dimensions_complete).toBe(true);
    expect(result.validation.dimensions_independent).toBe(true);
    expect(result.validation.governance_validated).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.evidence_complete).toBe(true);
    expect(result.validation.explanations_complete).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["MISSING_RECOMMENDATION", "RECOMMENDATION_UNAVAILABLE"],
    ["INCOMPLETE_DIMENSIONS", "DIMENSION_EVALUATION_INCOMPLETE"],
    ["MISSING_EVIDENCE", "MANDATORY_EVIDENCE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_VALIDATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["INCOMPLETE_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["HASH_MISMATCH", "INTEGRITY_MISMATCH_DETECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["RECONSTRUCTION_FAILURE", "RECOMMENDATION_RECONSTRUCTION_FAILED"],
    ["EVIDENCE_INTEGRITY_FAILURE", "EVIDENCE_INTEGRITY_FAILED"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION_DETECTED"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [DimensionEvaluationScenario, DimensionEvaluationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = evaluateRecommendationDimensions({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.modifies_recommendations).toBe(false);
  });

  it("keeps missing or invalid evidence evaluations pending instead of certified", () => {
    expect(evaluateRecommendationDimensions({ scenario: "MISSING_EVIDENCE" }).validation.state).toBe("PENDING_EVIDENCE");
    expect(evaluateRecommendationDimensions({ scenario: "EVIDENCE_INTEGRITY_FAILURE" }).validation.state).toBe("PENDING_EVIDENCE");
  });

  it("detects dimension evaluation tampering during replay", () => {
    const result = evaluateRecommendationDimensions();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRecommendationDimensionEvaluation(tampered)).toBe(false);
  });
});
