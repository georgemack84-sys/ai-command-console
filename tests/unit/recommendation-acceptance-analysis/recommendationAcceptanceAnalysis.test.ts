import { describe, expect, it } from "vitest";
import {
  ACCEPTANCE_CLASSIFICATIONS,
  analyzeRecommendationAcceptance,
  computeRecommendationAcceptanceHash,
  getRecommendationAcceptanceFoundation,
  replayRecommendationAcceptance,
} from "@/services/recommendation-acceptance-analysis";
import type { AcceptanceAnalysisFailure, AcceptanceAnalysisScenario, AcceptanceClassification } from "@/types/recommendation-acceptance-analysis";

describe("Mission Control Phase 10.3.4 Recommendation Acceptance Analysis", () => {
  it("publishes the recommendation acceptance analysis foundation", () => {
    const foundation = getRecommendationAcceptanceFoundation();

    expect(foundation.recommendation_acceptance_analysis_version).toBe("recommendation-acceptance-analysis/v1");
    expect(foundation.classifications).toEqual(ACCEPTANCE_CLASSIFICATIONS);
    expect(foundation.api_surface.analyze_acceptance).toBe("POST /recommendation-acceptance-analysis/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("treats acceptance as a signal without inferring intent or mutating behavior", () => {
    const result = analyzeRecommendationAcceptance();

    expect(result.acceptance_signal_only).toBe(true);
    expect(result.infers_operator_intent).toBe(false);
    expect(result.adaptive_learning).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_operator_actions).toBe(false);
    expect(result.api_surface.adaptive_learning_supported).toBe(false);
    expect(result.api_surface.update_supported).toBe(false);
    expect(result.api_surface.delete_supported).toBe(false);
  });

  it.each([
    ["SUCCESSFUL", "SUCCESSFUL_ACCEPTANCE"],
    ["PARTIAL", "PARTIALLY_SUCCESSFUL_ACCEPTANCE"],
    ["NEUTRAL", "NEUTRAL_ACCEPTANCE"],
    ["INEFFECTIVE", "INEFFECTIVE_ACCEPTANCE"],
    ["HARMFUL", "HARMFUL_ACCEPTANCE"],
    ["PREMATURE", "PREMATURE_ACCEPTANCE"],
    ["GOVERNANCE_RESTRICTED", "GOVERNANCE_RESTRICTED_ACCEPTANCE"],
    ["INSUFFICIENT_EVIDENCE", "INSUFFICIENT_EVIDENCE"],
  ] as readonly [AcceptanceAnalysisScenario, AcceptanceClassification][])("classifies %s deterministically", (scenario, classification) => {
    const result = analyzeRecommendationAcceptance({ scenario });

    expect(result.acceptance_record.acceptance_classification).toBe(classification);
    expect(ACCEPTANCE_CLASSIFICATIONS).toContain(result.acceptance_record.acceptance_classification);
  });

  it("records evidence-backed acceptance correlation and trend references", () => {
    const result = analyzeRecommendationAcceptance();

    expect(result.acceptance_record.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(result.acceptance_record.trend_refs).toEqual([result.trend_record.trend_id]);
    expect(result.trend_record.descriptive_only).toBe(true);
    expect(result.trend_record.modifies_future_recommendations).toBe(false);
    expect(result.acceptance_record.explanation.length).toBeGreaterThan(0);
  });

  it("creates stable acceptance hashes and replay output", () => {
    const result = analyzeRecommendationAcceptance();

    expect(computeRecommendationAcceptanceHash(result.acceptance_record)).toBe(result.acceptance_record.integrity_hash);
    expect(replayRecommendationAcceptance(result)).toBe(true);
  });

  it("records append-only Truth Ledger bindings", () => {
    const result = analyzeRecommendationAcceptance();

    expect(result.ledger_record.append_only).toBe(true);
    expect(result.ledger_record.deleted).toBe(false);
    expect(result.ledger_record.acceptance_analysis_id).toBe(result.acceptance_record.acceptance_analysis_id);
    expect(result.validation.ledger_recorded).toBe(true);
  });

  it("validates acceptance, implementation, outcome, governance, replay, evidence, tenant isolation, and integrity", () => {
    const result = analyzeRecommendationAcceptance();

    expect(result.validation.acceptance_recorded).toBe(true);
    expect(result.validation.implementation_verified).toBe(true);
    expect(result.validation.outcome_observed).toBe(true);
    expect(result.validation.governance_validated).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.evidence_complete).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["MISSING_ACCEPTANCE", "OPERATOR_ACCEPTANCE_UNAVAILABLE"],
    ["MISSING_OUTCOME", "OBSERVED_OUTCOMES_MISSING"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_VALIDATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["INCOMPLETE_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["HASH_MISMATCH", "INTEGRITY_MISMATCH_DETECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["RECONSTRUCTION_FAILURE", "RECOMMENDATION_RECONSTRUCTION_FAILED"],
    ["OPERATOR_ACTION_UNVERIFIABLE", "OPERATOR_ACTION_UNVERIFIABLE"],
    ["OUTCOME_EVIDENCE_UNAVAILABLE", "OUTCOME_EVIDENCE_UNAVAILABLE"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION_DETECTED"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [AcceptanceAnalysisScenario, AcceptanceAnalysisFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeRecommendationAcceptance({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_operator_actions).toBe(false);
  });

  it("keeps missing outcome and evidence analyses pending instead of certified", () => {
    expect(analyzeRecommendationAcceptance({ scenario: "MISSING_OUTCOME" }).validation.state).toBe("PENDING_EVIDENCE");
    expect(analyzeRecommendationAcceptance({ scenario: "INCOMPLETE_EVIDENCE" }).validation.state).toBe("PENDING_EVIDENCE");
  });

  it("detects acceptance analysis tampering during replay", () => {
    const result = analyzeRecommendationAcceptance();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRecommendationAcceptance(tampered)).toBe(false);
  });
});
