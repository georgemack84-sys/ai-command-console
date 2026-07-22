import { describe, expect, it } from "vitest";
import {
  analyzeRejectionLearning,
  getRejectionLearningAnalyzerFoundation,
  replayRejectionLearningAnalysis,
} from "@/services/rejection-learning-analyzer";
import type { RejectionLearningCategory, RejectionLearningFailure, RejectionLearningScenario } from "@/types/rejection-learning-analyzer";

describe("Mission Control Phase 10.9.5 Rejection Learning Analyzer", () => {
  it("publishes an evidence-only rejection learning contract", () => {
    const foundation = getRejectionLearningAnalyzerFoundation();

    expect(foundation.rejection_learning_analyzer_version).toBe("rejection-learning-analyzer/v1");
    expect(foundation.api_surface.analyze_rejection_learning).toBe("POST /rejection-learning-analyzer/analyze");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.adaptive_proposal_generation_supported).toBe(false);
    expect(foundation.result.analysis_state).toBe("ANALYZED");
  });

  it("analyzes rejection learning deterministically", () => {
    const first = analyzeRejectionLearning({ scenario: "EVIDENCE_INSUFFICIENT" });
    const second = analyzeRejectionLearning({ scenario: "EVIDENCE_INSUFFICIENT" });

    expect(first.primary_classification).toBe(second.primary_classification);
    expect(first.gap_records[0]?.integrity_hash).toBe(second.gap_records[0]?.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it.each([
    ["EVIDENCE_INSUFFICIENT", "EVIDENCE_INSUFFICIENT"],
    ["RECOMMENDATION_INCORRECT", "RECOMMENDATION_INCORRECT"],
    ["CONFIDENCE_MISMATCH", "CONFIDENCE_MISMATCH"],
    ["GOVERNANCE_ISSUE", "GOVERNANCE_ISSUE"],
    ["TIMING_ISSUE", "TIMING_ISSUE"],
    ["INCOMPLETE_CONTEXT", "INCOMPLETE_CONTEXT"],
    ["OPERATOR_EXPERTISE", "OPERATOR_EXPERTISE"],
    ["SIMULATION_DISAGREEMENT", "SIMULATION_DISAGREEMENT"],
  ] as readonly [RejectionLearningScenario, RejectionLearningCategory][])("classifies %s as %s", (scenario, category) => {
    const result = analyzeRejectionLearning({ scenario });

    expect(result.primary_classification).toBe(category);
    expect(result.analysis_state).toBe("ANALYZED");
    expect(result.classification_confidence).toBeGreaterThan(0);
  });

  it("generates failure, gap, opportunity, evidence, and registry outputs", () => {
    const result = analyzeRejectionLearning({ scenario: "GOVERNANCE_ISSUE" });

    expect(result.failure_analysis).toBe("GOVERNANCE_COMPLIANCE");
    expect(result.gap_records[0]?.category).toBe("GOVERNANCE_VALIDATION_GAP");
    expect(result.improvement_opportunities[0]?.opportunity_type).toBe("BETTER_GOVERNANCE_VALIDATION");
    expect(result.improvement_evidence?.governance_relevance).toBe("HIGH");
    expect(result.pattern_registry[0]?.canonical_rejection_category).toBe("GOVERNANCE_ISSUE");
  });

  it("preserves evidence, replay, mission outcome, and downstream outcome lineage", () => {
    const result = analyzeRejectionLearning({ scenario: "BASELINE" });

    expect(result.gap_records[0]?.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(result.gap_records[0]?.replay_refs.length).toBeGreaterThan(0);
    expect(result.improvement_evidence?.mission_outcome).toContain("mission outcome");
    expect(result.improvement_evidence?.downstream_outcome).toContain("downstream outcome");
    expect(result.explanation.replay_lineage.length).toBeGreaterThan(0);
  });

  it("keeps improvement opportunities advisory-only and non-mutating", () => {
    const result = analyzeRejectionLearning({ scenario: "SIMULATION_DISAGREEMENT" });
    const opportunity = result.improvement_opportunities[0];

    expect(result.evidence_only).toBe(true);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_confidence).toBe(false);
    expect(result.retrains_models).toBe(false);
    expect(result.creates_adaptive_proposals).toBe(false);
    expect(result.changes_production_behavior).toBe(false);
    expect(opportunity?.changes_production_recommendations).toBe(false);
    expect(opportunity?.modifies_recommendation_logic).toBe(false);
    expect(opportunity?.bypasses_approval_workflows).toBe(false);
  });

  it("rejects non-rejection feedback without fabricating classification", () => {
    const result = analyzeRejectionLearning({ scenario: "NO_REJECTION" });

    expect(result.failures).toContain("UNSUPPORTED_FEEDBACK_TYPE");
    expect(result.primary_classification).toBeNull();
    expect(result.gap_records).toHaveLength(0);
    expect(result.analysis_state).toBe("REJECTED");
  });

  it.each([
    ["MISSING_REJECTION_REFERENCE", "REJECTION_REFERENCE_MISSING"],
    ["MISSING_RECOMMENDATION", "RECOMMENDATION_UNAVAILABLE"],
    ["MISSING_REPLAY_LINEAGE", "REPLAY_LINEAGE_INCOMPLETE"],
    ["MISSING_EVIDENCE", "EVIDENCE_UNAVAILABLE"],
    ["MISSING_MISSION_OUTCOME", "MISSION_OUTCOME_UNAVAILABLE"],
    ["MISSING_GOVERNANCE_METADATA", "GOVERNANCE_METADATA_INCOMPLETE"],
    ["INVALID_RULE_VERSION", "ANALYSIS_RULE_VERSION_INVALID"],
    ["NORMALIZATION_REJECTED", "NORMALIZED_FEEDBACK_REJECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_FAILED"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["PRODUCTION_MUTATION_ATTEMPT", "PRODUCTION_MUTATION_ATTEMPT"],
    ["GOVERNANCE_BYPASS_ATTEMPT", "GOVERNANCE_BYPASS_ATTEMPT"],
  ] as readonly [RejectionLearningScenario, RejectionLearningFailure][])("rejects %s", (scenario, failure) => {
    const result = analyzeRejectionLearning({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.analysis_state).toBe("REJECTED");
    expect(result.replayable).toBe(false);
  });

  it("maintains append-only immutable audit and registry outputs", () => {
    const result = analyzeRejectionLearning({ scenario: "TIMING_ISSUE" });

    expect(result.pattern_registry).toHaveLength(1);
    expect(result.immutable_registry).toBe(true);
    expect(result.append_only_audit).toBe(true);
    expect(result.audit_events.every((event) => event.append_only && event.immutable)).toBe(true);
  });

  it("replays analysis output and detects tampering", () => {
    const result = analyzeRejectionLearning({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRejectionLearningAnalysis(result)).toBe(true);
    expect(replayRejectionLearningAnalysis(tampered)).toBe(false);
  });
});
