import { describe, expect, it } from "vitest";
import {
  analyzeRecommendationRejection,
  computeRecommendationRejectionHash,
  getRecommendationRejectionFoundation,
  REJECTION_CATEGORIES,
  replayRecommendationRejection,
} from "@/services/recommendation-rejection-analysis";
import type { RejectionAnalysisFailure, RejectionAnalysisScenario, RejectionCategory } from "@/types/recommendation-rejection-analysis";

describe("Mission Control Phase 10.3.5 Recommendation Rejection Analysis", () => {
  it("publishes the recommendation rejection analysis foundation", () => {
    const foundation = getRecommendationRejectionFoundation();

    expect(foundation.recommendation_rejection_analysis_version).toBe("recommendation-rejection-analysis/v1");
    expect(foundation.categories).toEqual(REJECTION_CATEGORIES);
    expect(foundation.api_surface.analyze_rejection).toBe("POST /recommendation-rejection-analysis/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("treats rejection as a signal without inferring intent or mutating behavior", () => {
    const result = analyzeRecommendationRejection();

    expect(result.rejection_signal_only).toBe(true);
    expect(result.infers_operator_intent).toBe(false);
    expect(result.adaptive_learning).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_operator_actions).toBe(false);
    expect(result.api_surface.adaptive_learning_supported).toBe(false);
    expect(result.api_surface.update_supported).toBe(false);
    expect(result.api_surface.delete_supported).toBe(false);
  });

  it.each([
    ["INSUFFICIENT_EVIDENCE", "INSUFFICIENT_EVIDENCE"],
    ["POOR_EXPLANATION", "POOR_EXPLANATION"],
    ["EXCESSIVE_RISK", "EXCESSIVE_RISK"],
    ["LOW_CONFIDENCE", "LOW_CONFIDENCE"],
    ["GOVERNANCE_CONCERN", "GOVERNANCE_CONCERN"],
    ["AUTHORITY_CONFLICT", "AUTHORITY_CONFLICT"],
    ["TIMING_ISSUE", "TIMING_ISSUE"],
    ["INCOMPLETE_CONTEXT", "INCOMPLETE_CONTEXT"],
    ["OPERATOR_PREFERENCE", "OPERATOR_PREFERENCE"],
    ["INCORRECT_RECOMMENDATION", "INCORRECT_RECOMMENDATION"],
    ["MULTIPLE_FACTORS", "MULTIPLE_FACTORS"],
    ["INSUFFICIENT_INFORMATION", "INSUFFICIENT_INFORMATION"],
  ] as readonly [RejectionAnalysisScenario, RejectionCategory][])("classifies %s deterministically", (scenario, category) => {
    const result = analyzeRecommendationRejection({ scenario });

    expect(result.rejection_record.rejection_categories).toContain(category);
    expect(REJECTION_CATEGORIES).toContain(result.rejection_record.primary_rejection_category);
  });

  it("records context, outcome impact, pattern, evidence, and explanation", () => {
    const result = analyzeRecommendationRejection();

    expect(result.rejection_record.context_assessment.length).toBeGreaterThan(0);
    expect(result.rejection_record.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(result.rejection_record.pattern_refs).toEqual([result.pattern_record.pattern_id]);
    expect(result.pattern_record.descriptive_only).toBe(true);
    expect(result.pattern_record.modifies_future_recommendations).toBe(false);
    expect(result.rejection_record.explanation.length).toBeGreaterThan(0);
  });

  it.each([
    ["IMPROVED_OUTCOME", "IMPROVED_OUTCOME"],
    ["DEGRADED_OUTCOME", "DEGRADED_OUTCOME"],
    ["GOVERNANCE_CONCERN", "GOVERNANCE_PRESERVED"],
  ] as const)("evaluates outcome impact for %s", (scenario, impact) => {
    expect(analyzeRecommendationRejection({ scenario }).rejection_record.outcome_after_rejection).toBe(impact);
  });

  it("creates stable rejection hashes and replay output", () => {
    const result = analyzeRecommendationRejection();

    expect(computeRecommendationRejectionHash(result.rejection_record)).toBe(result.rejection_record.integrity_hash);
    expect(replayRecommendationRejection(result)).toBe(true);
  });

  it("records append-only Truth Ledger bindings", () => {
    const result = analyzeRecommendationRejection();

    expect(result.ledger_record.append_only).toBe(true);
    expect(result.ledger_record.deleted).toBe(false);
    expect(result.ledger_record.rejection_analysis_id).toBe(result.rejection_record.rejection_analysis_id);
    expect(result.validation.ledger_recorded).toBe(true);
  });

  it("validates rejection, context, classification, outcome, governance, replay, evidence, tenant isolation, and integrity", () => {
    const result = analyzeRecommendationRejection();

    expect(result.validation.rejection_recorded).toBe(true);
    expect(result.validation.context_collected).toBe(true);
    expect(result.validation.failure_classified).toBe(true);
    expect(result.validation.outcome_evaluated).toBe(true);
    expect(result.validation.governance_validated).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.evidence_complete).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["MISSING_REASON", "REJECTION_REASON_UNAVAILABLE"],
    ["MISSING_OUTCOME", "OBSERVED_OUTCOMES_MISSING"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_VALIDATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["INCOMPLETE_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["HASH_MISMATCH", "INTEGRITY_MISMATCH_DETECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["RECONSTRUCTION_FAILURE", "RECOMMENDATION_RECONSTRUCTION_FAILED"],
    ["OPERATOR_REJECTION_UNVERIFIABLE", "OPERATOR_REJECTION_UNVERIFIABLE"],
    ["OUTCOME_EVIDENCE_UNAVAILABLE", "OUTCOME_EVIDENCE_UNAVAILABLE"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION_DETECTED"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RejectionAnalysisScenario, RejectionAnalysisFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeRecommendationRejection({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_operator_actions).toBe(false);
  });

  it("keeps missing outcome and evidence analyses pending instead of certified", () => {
    expect(analyzeRecommendationRejection({ scenario: "MISSING_OUTCOME" }).validation.state).toBe("PENDING_EVIDENCE");
    expect(analyzeRecommendationRejection({ scenario: "INCOMPLETE_EVIDENCE" }).validation.state).toBe("PENDING_EVIDENCE");
  });

  it("detects rejection analysis tampering during replay", () => {
    const result = analyzeRecommendationRejection();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRecommendationRejection(tampered)).toBe(false);
  });
});
