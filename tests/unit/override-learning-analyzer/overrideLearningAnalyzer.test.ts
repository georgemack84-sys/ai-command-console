import { describe, expect, it } from "vitest";
import {
  analyzeOverrideLearning,
  getOverrideLearningAnalyzerFoundation,
  replayOverrideLearningAnalysis,
} from "@/services/override-learning-analyzer";
import type { OverrideLearningFailure, OverrideLearningScenario, OverrideRootCause } from "@/types/override-learning-analyzer";

describe("Mission Control Phase 10.9.4 Override Learning Analyzer", () => {
  it("publishes an evidence-only override learning contract", () => {
    const foundation = getOverrideLearningAnalyzerFoundation();

    expect(foundation.override_learning_analyzer_version).toBe("override-learning-analyzer/v1");
    expect(foundation.api_surface.analyze_override_learning).toBe("POST /override-learning-analyzer/analyze");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.adaptive_proposal_generation_supported).toBe(false);
    expect(foundation.result.analysis_state).toBe("ANALYZED");
  });

  it("analyzes override learning deterministically", () => {
    const first = analyzeOverrideLearning({ scenario: "INSUFFICIENT_EVIDENCE" });
    const second = analyzeOverrideLearning({ scenario: "INSUFFICIENT_EVIDENCE" });

    expect(first.pattern_record?.pattern_id).toBe(second.pattern_record?.pattern_id);
    expect(first.frequency_metrics?.integrity_hash).toBe(second.frequency_metrics?.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it.each([
    ["INSUFFICIENT_EVIDENCE", "INSUFFICIENT_EVIDENCE"],
    ["INACCURATE_CONFIDENCE", "INACCURATE_CONFIDENCE"],
    ["INCORRECT_PRIORITIZATION", "INCORRECT_PRIORITIZATION"],
    ["EXCESSIVE_CAUTION", "EXCESSIVE_CAUTION"],
    ["EXCESSIVE_OPTIMISM", "EXCESSIVE_OPTIMISM"],
    ["GOVERNANCE_DISAGREEMENT", "GOVERNANCE_DISAGREEMENT"],
    ["CONTEXTUAL_KNOWLEDGE", "CONTEXTUAL_KNOWLEDGE"],
    ["MISSION_SPECIFIC_FACTORS", "MISSION_SPECIFIC_FACTORS"],
  ] as readonly [OverrideLearningScenario, OverrideRootCause][])("classifies %s as %s", (scenario, rootCause) => {
    const result = analyzeOverrideLearning({ scenario });

    expect(result.root_cause).toBe(rootCause);
    expect(result.pattern_record?.root_cause).toBe(rootCause);
    expect(result.analysis_state).toBe("ANALYZED");
  });

  it("detects pattern, frequency, context, and improvement evidence", () => {
    const result = analyzeOverrideLearning({ scenario: "GOVERNANCE_DISAGREEMENT" });

    expect(result.pattern_record?.pattern_type).toBe("GOVERNANCE_RELATED_OVERRIDE");
    expect(result.frequency_metrics?.trend_direction).toBe("INCREASING");
    expect(result.context_analysis?.context_categories).toContain("GOVERNANCE_SENSITIVE_MISSION");
    expect(result.improvement_evidence?.supports_governance_review).toBe(true);
    expect(result.explanation.traceable).toBe(true);
  });

  it("preserves evidence and replay lineage from normalized feedback", () => {
    const result = analyzeOverrideLearning({ scenario: "BASELINE" });

    expect(result.pattern_record?.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(result.pattern_record?.replay_refs.length).toBeGreaterThan(0);
    expect(result.improvement_evidence?.supporting_evidence_refs).toEqual(result.pattern_record?.supporting_evidence_refs);
    expect(result.replay_lineage_complete).toBe(true);
    expect(result.evidence_lineage_complete).toBe(true);
  });

  it("keeps all learning artifacts evidence-only and non-mutating", () => {
    const result = analyzeOverrideLearning({ scenario: "EXCESSIVE_OPTIMISM" });

    expect(result.evidence_only).toBe(true);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_confidence).toBe(false);
    expect(result.retrains_models).toBe(false);
    expect(result.creates_adaptive_proposals).toBe(false);
    expect(result.changes_production_behavior).toBe(false);
    expect(result.improvement_evidence?.modifies_production_recommendations).toBe(false);
    expect(result.improvement_evidence?.changes_confidence_automatically).toBe(false);
  });

  it("rejects non-override feedback without fabricating root cause", () => {
    const result = analyzeOverrideLearning({ scenario: "NO_OVERRIDE" });

    expect(result.failures).toContain("UNSUPPORTED_FEEDBACK_TYPE");
    expect(result.root_cause).toBeNull();
    expect(result.pattern_record).toBeNull();
    expect(result.analysis_state).toBe("REJECTED");
  });

  it.each([
    ["MISSING_OVERRIDE_REFERENCE", "OVERRIDE_REFERENCE_MISSING"],
    ["MISSING_RECOMMENDATION", "RECOMMENDATION_UNAVAILABLE"],
    ["MISSING_MISSION_CONTEXT", "MISSION_CONTEXT_UNAVAILABLE"],
    ["MISSING_REPLAY_LINEAGE", "REPLAY_LINEAGE_INCOMPLETE"],
    ["MISSING_EVIDENCE", "EVIDENCE_UNAVAILABLE"],
    ["MISSING_GOVERNANCE_METADATA", "GOVERNANCE_METADATA_INCOMPLETE"],
    ["INVALID_RULE_VERSION", "ANALYSIS_RULE_VERSION_INVALID"],
    ["NORMALIZATION_REJECTED", "NORMALIZED_FEEDBACK_REJECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_FAILED"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["PRODUCTION_MUTATION_ATTEMPT", "PRODUCTION_MUTATION_ATTEMPT"],
    ["GOVERNANCE_BYPASS_ATTEMPT", "GOVERNANCE_BYPASS_ATTEMPT"],
  ] as readonly [OverrideLearningScenario, OverrideLearningFailure][])("rejects %s", (scenario, failure) => {
    const result = analyzeOverrideLearning({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.analysis_state).toBe("REJECTED");
    expect(result.replayable).toBe(false);
  });

  it("maintains append-only immutable audit and registry outputs", () => {
    const result = analyzeOverrideLearning({ scenario: "TIME_CRITICAL_MISSION" });

    expect(result.registry).toHaveLength(1);
    expect(result.immutable_registry).toBe(true);
    expect(result.append_only_audit).toBe(true);
    expect(result.audit_events.every((event) => event.append_only && event.immutable)).toBe(true);
    expect(result.context_analysis?.context_categories).toContain("TIME_CRITICAL_MISSION");
  });

  it("replays analysis output and detects tampering", () => {
    const result = analyzeOverrideLearning({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOverrideLearningAnalysis(result)).toBe(true);
    expect(replayOverrideLearningAnalysis(tampered)).toBe(false);
  });
});
