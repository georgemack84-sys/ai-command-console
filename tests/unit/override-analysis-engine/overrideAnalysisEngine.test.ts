import { describe, expect, it } from "vitest";
import {
  analyzeOverride,
  computeOverrideAnalysisHash,
  getOverrideAnalysisFoundation,
  OVERRIDE_CATEGORIES,
  replayOverrideAnalysis,
} from "@/services/override-analysis-engine";
import type { OverrideAnalysisFailure, OverrideAnalysisScenario, OverrideCategory } from "@/types/override-analysis-engine";

describe("Mission Control Phase 10.3.6 Override Analysis Engine", () => {
  it("publishes the override analysis foundation", () => {
    const foundation = getOverrideAnalysisFoundation();

    expect(foundation.override_analysis_engine_version).toBe("override-analysis-engine/v1");
    expect(foundation.categories).toEqual(OVERRIDE_CATEGORIES);
    expect(foundation.api_surface.analyze_override).toBe("POST /override-analysis-engine/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("treats overrides as signals without inferring intent or mutating behavior", () => {
    const result = analyzeOverride();

    expect(result.override_signal_only).toBe(true);
    expect(result.infers_operator_intent).toBe(false);
    expect(result.adaptive_learning).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_operator_actions).toBe(false);
    expect(result.api_surface.adaptive_learning_supported).toBe(false);
    expect(result.api_surface.update_supported).toBe(false);
    expect(result.api_surface.delete_supported).toBe(false);
  });

  it.each([
    ["IMPROVED_RECOMMENDATION", "IMPROVED_RECOMMENDATION"],
    ["PARTIAL_IMPROVEMENT", "PARTIAL_IMPROVEMENT"],
    ["MINOR_OPTIMIZATION", "MINOR_OPTIMIZATION"],
    ["CONTEXT_CHANGED", "CONTEXT_CHANGED"],
    ["RESOURCE_CONSTRAINT", "RESOURCE_CONSTRAINT"],
    ["MISSION_PRIORITY_CHANGE", "MISSION_PRIORITY_CHANGE"],
    ["TIMING_ADJUSTMENT", "TIMING_ADJUSTMENT"],
    ["GOVERNANCE_REQUIRED", "GOVERNANCE_REQUIRED"],
    ["POLICY_ENFORCEMENT", "POLICY_ENFORCEMENT"],
    ["CONSTITUTIONAL_PROTECTION", "CONSTITUTIONAL_PROTECTION"],
    ["AUTHORITY_LIMITATION", "AUTHORITY_LIMITATION"],
    ["ESCALATION_REQUIRED", "ESCALATION_REQUIRED"],
    ["APPROVAL_REQUIRED", "APPROVAL_REQUIRED"],
    ["RISK_REDUCTION", "RISK_REDUCTION"],
    ["SAFETY_IMPROVEMENT", "SAFETY_IMPROVEMENT"],
    ["UNCERTAINTY_MITIGATION", "UNCERTAINTY_MITIGATION"],
    ["BETTER_ALTERNATIVE", "BETTER_ALTERNATIVE"],
    ["IMPROVED_EVIDENCE", "IMPROVED_EVIDENCE"],
    ["CLARITY_IMPROVEMENT", "CLARITY_IMPROVEMENT"],
    ["ADDITIONAL_CONTEXT", "ADDITIONAL_CONTEXT"],
    ["WORKFLOW_PREFERENCE", "WORKFLOW_PREFERENCE"],
    ["ORGANIZATIONAL_STANDARD", "ORGANIZATIONAL_STANDARD"],
    ["OPERATOR_DISCRETION", "OPERATOR_DISCRETION"],
  ] as readonly [OverrideAnalysisScenario, OverrideCategory][])("classifies %s deterministically", (scenario, category) => {
    const result = analyzeOverride({ scenario });

    expect(result.override_record.override_categories).toContain(category);
    expect(OVERRIDE_CATEGORIES).toContain(result.override_record.primary_override_category);
  });

  it("records comparison, outcome, trend, evidence, explanation, and advisory improvements", () => {
    const result = analyzeOverride({ scenario: "IMPROVED_EVIDENCE" });

    expect(result.override_record.original_recommendation.length).toBeGreaterThan(0);
    expect(result.override_record.modified_recommendation.length).toBeGreaterThan(0);
    expect(result.override_record.recommendation_comparison.length).toBeGreaterThan(0);
    expect(result.override_record.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(result.override_record.trend_refs).toEqual([result.trend_record.trend_id]);
    expect(result.override_record.improvement_opportunities.length).toBeGreaterThan(0);
    expect(result.override_record.modifies_recommendation_behavior).toBe(false);
    expect(result.trend_record.modifies_future_recommendations).toBe(false);
    expect(result.override_record.explanation.length).toBeGreaterThan(0);
  });

  it.each([
    ["RISK_REDUCTION", "REDUCED_RISK"],
    ["GOVERNANCE_REQUIRED", "GOVERNANCE_PRESERVED"],
    ["WORKFLOW_PREFERENCE", "OPERATIONAL_EFFICIENCY"],
    ["IMPROVED_RECOMMENDATION", "IMPROVED_OUTCOME"],
  ] as const)("evaluates override outcome for %s", (scenario, outcome) => {
    expect(analyzeOverride({ scenario }).override_record.override_outcome_assessment).toBe(outcome);
  });

  it("creates stable override hashes and replay output", () => {
    const result = analyzeOverride();

    expect(computeOverrideAnalysisHash(result.override_record)).toBe(result.override_record.integrity_hash);
    expect(replayOverrideAnalysis(result)).toBe(true);
  });

  it("records append-only Truth Ledger bindings", () => {
    const result = analyzeOverride();

    expect(result.ledger_record.append_only).toBe(true);
    expect(result.ledger_record.deleted).toBe(false);
    expect(result.ledger_record.override_analysis_id).toBe(result.override_record.override_analysis_id);
    expect(result.validation.ledger_recorded).toBe(true);
  });

  it("validates override, justification, comparison, outcome, improvements, governance, replay, evidence, tenant isolation, and integrity", () => {
    const result = analyzeOverride();

    expect(result.validation.override_recorded).toBe(true);
    expect(result.validation.justification_captured).toBe(true);
    expect(result.validation.comparison_completed).toBe(true);
    expect(result.validation.override_classified).toBe(true);
    expect(result.validation.outcome_evaluated).toBe(true);
    expect(result.validation.improvements_identified).toBe(true);
    expect(result.validation.governance_validated).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.evidence_complete).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["MISSING_OVERRIDE", "OVERRIDE_RECORD_MISSING"],
    ["MISSING_OPERATOR_ACTION", "OPERATOR_ACTION_UNAVAILABLE"],
    ["MISSING_RECOMMENDATION", "RECOMMENDATION_UNAVAILABLE"],
    ["INCOMPLETE_COMPARISON", "COMPARISON_INCOMPLETE"],
    ["MISSING_JUSTIFICATION", "OVERRIDE_JUSTIFICATION_MISSING"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_VALIDATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["INCOMPLETE_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["HASH_MISMATCH", "INTEGRITY_MISMATCH_DETECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["RECONSTRUCTION_FAILURE", "RECOMMENDATION_RECONSTRUCTION_FAILED"],
    ["OVERRIDE_UNVERIFIABLE", "OVERRIDE_UNVERIFIABLE"],
    ["SUPPORTING_EVIDENCE_UNAVAILABLE", "SUPPORTING_EVIDENCE_UNAVAILABLE"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION_DETECTED"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [OverrideAnalysisScenario, OverrideAnalysisFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeOverride({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_operator_actions).toBe(false);
  });

  it("keeps evidence-deficient override analysis pending instead of certified", () => {
    expect(analyzeOverride({ scenario: "INCOMPLETE_EVIDENCE" }).validation.state).toBe("PENDING_EVIDENCE");
    expect(analyzeOverride({ scenario: "SUPPORTING_EVIDENCE_UNAVAILABLE" }).validation.state).toBe("PENDING_EVIDENCE");
  });

  it("detects override analysis tampering during replay", () => {
    const result = analyzeOverride();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOverrideAnalysis(tampered)).toBe(false);
  });
});
