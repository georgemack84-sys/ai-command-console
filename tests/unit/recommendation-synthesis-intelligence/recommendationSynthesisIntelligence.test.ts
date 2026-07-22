import { describe, expect, it } from "vitest";

import {
  getRecommendationSynthesisIntelligenceContract,
  replayRecommendationSynthesisIntelligence,
  runRecommendationSynthesisIntelligence,
  validateRecommendationSynthesisIntelligence,
} from "../../../services/recommendation-synthesis-intelligence";
import type { RecommendationSynthesisScenario } from "../../../types/recommendation-synthesis-intelligence";

describe("recommendation synthesis intelligence", () => {
  it("produces one deterministic certified recommendation", () => {
    const first = runRecommendationSynthesisIntelligence();
    const second = runRecommendationSynthesisIntelligence();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.ready_for_publication).toBe(true);
    expect(first.outcome_resolution.outcomes).toHaveLength(1);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateRecommendationSynthesisIntelligence(first).valid).toBe(true);
    expect(replayRecommendationSynthesisIntelligence(first)).toBe(true);
  });

  it("publishes synthesis doctrine", () => {
    const bundle = getRecommendationSynthesisIntelligenceContract();

    expect(bundle.doctrine.exactly_one_outcome_required).toBe(true);
    expect(bundle.doctrine.advisory_only).toBe(true);
    expect(bundle.doctrine.explainability_required).toBe(true);
    expect(bundle.doctrine.policy_binding_required).toBe(true);
    expect(bundle.doctrine.duplicate_authoritative_recommendations_blocked).toBe(true);
  });

  it("validates eligibility and resolves the canonical outcome", () => {
    const result = runRecommendationSynthesisIntelligence();

    expect(result.eligibility.eligible).toBe(true);
    expect(result.recommendation.recommendation_outcome).toBe("RECOMMEND_WITH_REVIEW");
    expect(result.recommendation.recommended_strategy_ref).toBeTruthy();
    expect(result.recommendation.recommended_portfolio_ref).toBeTruthy();
    expect(result.non_recommendation).toBeNull();
  });

  it("enforces advisory boundary and complete explainability", () => {
    const result = runRecommendationSynthesisIntelligence();

    expect(result.authority_validation.advisory_only).toBe(true);
    expect(result.authority_validation.no_execution_authority).toBe(true);
    expect(result.recommendation.advisory_only).toBe(true);
    expect(result.explainability.complete).toBe(true);
    expect(result.explainability.hidden_rationale_absent).toBe(true);
  });

  it("validates lineage, integrity, replay, registry, and observability", () => {
    const result = runRecommendationSynthesisIntelligence();

    expect(result.integrity.lineage_valid).toBe(true);
    expect(result.integrity.duplicate_recommendations_detected).toHaveLength(0);
    expect(result.replay.outcome).toBe("MATCH");
    expect(result.registry.complete).toBe(true);
    expect(result.observability.observable).toBe(true);
  });

  it("runs the phase 12.9 certification suite", () => {
    const result = runRecommendationSynthesisIntelligence();

    expect(result.certification.tests).toHaveLength(28);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for eligibility, outcome, advisory, explainability, integrity, replay, governance, and tenant violations", () => {
    const scenarios: readonly RecommendationSynthesisScenario[] = [
      "RECOMMENDATION_IDENTITY_NONDETERMINISTIC",
      "ELIGIBILITY_ENFORCEMENT_FAILED",
      "INCOMPLETE_COMPARISON_ACCEPTED",
      "INCOMPLETE_FORECAST_ACCEPTED",
      "INCOMPLETE_SCENARIO_ACCEPTED",
      "INCOMPLETE_PORTFOLIO_ACCEPTED",
      "POLICY_BINDING_INVALID",
      "EVIDENCE_INSUFFICIENT",
      "REPLAY_READINESS_FAILED",
      "MULTIPLE_OUTCOMES_PRODUCED",
      "OUTCOME_NONDETERMINISTIC",
      "ADVISORY_BOUNDARY_VIOLATION",
      "EXECUTION_AUTHORITY_PRESENT",
      "OPERATOR_SUPREMACY_VIOLATED",
      "EXPLAINABILITY_INCOMPLETE",
      "HIDDEN_RATIONALE",
      "LINEAGE_VALIDATION_FAILED",
      "ORIGIN_INVALID",
      "DUPLICATE_RECOMMENDATION",
      "REPLAY_MISMATCH",
      "GOVERNANCE_FAILURE",
      "CONSTITUTIONAL_VIOLATION",
      "TENANT_ISOLATION_BREACH",
      "OBSERVABILITY_MISSING",
    ];

    for (const scenario of scenarios) {
      const result = runRecommendationSynthesisIntelligence({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.ready_for_publication).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateRecommendationSynthesisIntelligence(result).valid).toBe(false);
    }
  });
});
