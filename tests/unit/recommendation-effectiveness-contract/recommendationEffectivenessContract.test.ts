import { describe, expect, it } from "vitest";
import {
  computeRecommendationEffectivenessHash,
  evaluateRecommendationEffectiveness,
  getRecommendationEffectivenessFoundation,
  RECOMMENDATION_EFFECTIVENESS_DIMENSIONS,
  replayRecommendationEffectiveness,
} from "@/services/recommendation-effectiveness-contract";
import type { RecommendationEffectivenessFailure, RecommendationEffectivenessScenario } from "@/types/recommendation-effectiveness-contract";

describe("Mission Control Phase 10.3.1 Recommendation Effectiveness Contract", () => {
  it("publishes the tightened recommendation effectiveness foundation", () => {
    const foundation = getRecommendationEffectivenessFoundation();

    expect(foundation.recommendation_effectiveness_version).toBe("recommendation-effectiveness-contract/v1");
    expect(foundation.mandatory_dimensions).toEqual(RECOMMENDATION_EFFECTIVENESS_DIMENSIONS);
    expect(foundation.api_surface.initialize_evaluation).toBe("POST /recommendation-effectiveness-contract/evaluate");
    expect(foundation.result.validation.lifecycle_state).toBe("CERTIFIED");
  });

  it("evaluates completed lifecycles without adaptive learning or mutation", () => {
    const result = evaluateRecommendationEffectiveness();

    expect(result.evaluates_completed_lifecycle_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.modifies_recommendation_behavior).toBe(false);
    expect(result.modifies_operator_action).toBe(false);
    expect(result.api_surface.adaptive_learning_supported).toBe(false);
    expect(result.api_surface.update_supported).toBe(false);
    expect(result.api_surface.delete_supported).toBe(false);
  });

  it("requires every canonical scoring dimension", () => {
    const result = evaluateRecommendationEffectiveness();

    expect(result.effectiveness_record.dimension_scores.map((score) => score.dimension)).toEqual(RECOMMENDATION_EFFECTIVENESS_DIMENSIONS);
    expect(result.validation.all_dimensions_scored).toBe(true);
    expect(result.effectiveness_record.dimension_scores.every((score) => score.evidence_refs.length > 0)).toBe(true);
  });

  it("creates stable effectiveness hashes and replay output", () => {
    const result = evaluateRecommendationEffectiveness();

    expect(computeRecommendationEffectivenessHash(result.effectiveness_record)).toBe(result.effectiveness_record.integrity_hash);
    expect(replayRecommendationEffectiveness(result)).toBe(true);
  });

  it("records append-only Truth Ledger bindings", () => {
    const result = evaluateRecommendationEffectiveness();

    expect(result.ledger_record.append_only).toBe(true);
    expect(result.ledger_record.deleted).toBe(false);
    expect(result.validation.ledger_recorded).toBe(true);
    expect(result.effectiveness_record.ledger_refs.length).toBeGreaterThan(0);
  });

  it("validates governance, replay, lineage, evidence, and tenant isolation", () => {
    const result = evaluateRecommendationEffectiveness();

    expect(result.validation.governance_validated).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.replay_reconstruction_identical).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.effectiveness_record.evidence_refs.length).toBeGreaterThan(0);
    expect(result.effectiveness_record.lineage_refs.length).toBeGreaterThan(0);
  });

  it.each([
    ["MISSING_OUTCOME", "OBSERVED_OUTCOME_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_MISSING"],
    ["MISSING_REPLAY", "REPLAY_INCOMPLETE"],
    ["MISSING_OPERATOR_ACTION", "OPERATOR_ACTION_UNAVAILABLE"],
    ["INCOMPLETE_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["MISSING_SCORE", "REQUIRED_SCORES_MISSING"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["IDENTITY_MISMATCH", "RECOMMENDATION_IDENTITY_INCONSISTENT"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION_DETECTED"],
    ["AUTHORITY_FAILURE", "AUTHORITY_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
    ["RECOMMENDATION_MUTATION", "HISTORICAL_RECOMMENDATION_MUTATION_ATTEMPTED"],
    ["OPERATOR_ACTION_MUTATION", "OPERATOR_ACTION_MUTATION_ATTEMPTED"],
  ] as readonly [RecommendationEffectivenessScenario, RecommendationEffectivenessFailure][])("fails closed for %s", (scenario, failure) => {
    const result = evaluateRecommendationEffectiveness({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.effectiveness_record.failure_reasons).toContain(failure);
    expect(result.modifies_recommendation_behavior).toBe(false);
  });

  it("keeps missing outcome and evidence evaluations pending instead of certified", () => {
    expect(evaluateRecommendationEffectiveness({ scenario: "MISSING_OUTCOME" }).validation.lifecycle_state).toBe("PENDING_EVIDENCE");
    expect(evaluateRecommendationEffectiveness({ scenario: "MISSING_EVIDENCE" }).validation.lifecycle_state).toBe("PENDING_EVIDENCE");
  });

  it("detects effectiveness record tampering during replay", () => {
    const result = evaluateRecommendationEffectiveness();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRecommendationEffectiveness(tampered)).toBe(false);
  });
});
