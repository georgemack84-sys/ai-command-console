import { describe, expect, it } from "vitest";
import { analyzeRiskPatternIntelligence, getRiskPatternIntelligenceFoundation, replayRiskPatternIntelligence } from "@/services/risk-pattern-intelligence";
import type { RiskPatternFailure, RiskPatternScenario } from "@/types/risk-pattern-intelligence";

describe("Mission Control Phase 10.7.5 Risk Pattern Intelligence", () => {
  it("publishes the risk pattern intelligence foundation", () => {
    const foundation = getRiskPatternIntelligenceFoundation();

    expect(foundation.risk_pattern_intelligence_version).toBe("risk-pattern-intelligence/v1");
    expect(foundation.api_surface.analyze_patterns).toBe("POST /risk-pattern-intelligence/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("detects risk patterns deterministically", () => {
    const first = analyzeRiskPatternIntelligence({ scenario: "COMPOSITE" });
    const second = analyzeRiskPatternIntelligence({ scenario: "COMPOSITE" });

    expect(first.patterns[0].risk_pattern_id).toBe(second.patterns[0].risk_pattern_id);
    expect(first.confidence.confidence_score).toBe(second.confidence.confidence_score);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("classifies all required pattern categories", () => {
    expect(analyzeRiskPatternIntelligence({ scenario: "SEVERITY_UNDERESTIMATION" }).patterns[0].pattern_category).toBe("SEVERITY_UNDERESTIMATION");
    expect(analyzeRiskPatternIntelligence({ scenario: "SEVERITY_OVERESTIMATION" }).patterns[0].pattern_category).toBe("SEVERITY_OVERESTIMATION");
    expect(analyzeRiskPatternIntelligence({ scenario: "PROBABILITY_UNDERESTIMATION" }).patterns[0].pattern_category).toBe("PROBABILITY_UNDERESTIMATION");
    expect(analyzeRiskPatternIntelligence({ scenario: "PROBABILITY_OVERESTIMATION" }).patterns[0].pattern_category).toBe("PROBABILITY_OVERESTIMATION");
    expect(analyzeRiskPatternIntelligence({ scenario: "BLIND_SPOT" }).patterns[0].pattern_category).toBe("RECURRING_BLIND_SPOT");
    expect(analyzeRiskPatternIntelligence({ scenario: "FALSE_ALARM" }).patterns[0].pattern_category).toBe("FALSE_ALARM");
    expect(analyzeRiskPatternIntelligence({ scenario: "GOVERNANCE_RISK" }).patterns[0].pattern_category).toBe("MISSED_GOVERNANCE_RISK");
    expect(analyzeRiskPatternIntelligence({ scenario: "CONSTITUTIONAL_RISK" }).patterns[0].pattern_category).toBe("CONSTITUTIONAL_RISK_PATTERN");
    expect(analyzeRiskPatternIntelligence({ scenario: "MISSION_TYPE" }).patterns[0].pattern_category).toBe("MISSION_TYPE_PATTERN");
    expect(analyzeRiskPatternIntelligence({ scenario: "TENANT_SPECIFIC" }).patterns[0].pattern_category).toBe("TENANT_SPECIFIC_PATTERN");
    expect(analyzeRiskPatternIntelligence({ scenario: "OPERATOR_TENDENCY" }).patterns[0].pattern_category).toBe("OPERATOR_TENDENCY");
    expect(analyzeRiskPatternIntelligence({ scenario: "ENVIRONMENTAL" }).patterns[0].pattern_category).toBe("ENVIRONMENTAL_INFLUENCE");
    expect(analyzeRiskPatternIntelligence({ scenario: "ESCALATION_FAILURE" }).patterns[0].pattern_category).toBe("ESCALATION_FAILURE");
    expect(analyzeRiskPatternIntelligence({ scenario: "ROLLBACK_FAILURE" }).patterns[0].pattern_category).toBe("ROLLBACK_FAILURE");
    expect(analyzeRiskPatternIntelligence({ scenario: "COMPOSITE" }).patterns[0].pattern_category).toBe("COMPOSITE_BEHAVIORAL_PATTERN");
  });

  it("generates confidence, timeline, evidence, and recommendations", () => {
    const result = analyzeRiskPatternIntelligence({ scenario: "ENVIRONMENTAL" });

    expect(result.confidence.confidence_score).toBeGreaterThan(0);
    expect(result.confidence.evidence_completeness_score).toBeGreaterThan(0);
    expect(result.timeline.pattern_growth.length).toBe(3);
    expect(result.evidence_registry.operational_telemetry_refs.length).toBeGreaterThan(0);
    expect(result.recommendations[0].category).toBe("ENHANCED_MONITORING");
  });

  it("requires review for governance and constitutional patterns", () => {
    const governance = analyzeRiskPatternIntelligence({ scenario: "GOVERNANCE_RISK" });
    const constitutional = analyzeRiskPatternIntelligence({ scenario: "CONSTITUTIONAL_RISK" });

    expect(governance.recommendations[0].governance_review_required).toBe(true);
    expect(constitutional.recommendations[0].governance_review_required).toBe(true);
    expect(constitutional.recommendations[0].simulation_required).toBe(true);
  });

  it("keeps pattern intelligence advisory only", () => {
    const result = analyzeRiskPatternIntelligence({ scenario: "ESCALATION_FAILURE" });
    const pattern = result.patterns[0];

    expect(result.advisory_only).toBe(true);
    expect(result.observational_only).toBe(true);
    expect(result.mutates_production_risk_models).toBe(false);
    expect(result.changes_escalation_thresholds).toBe(false);
    expect(result.changes_rollback_thresholds).toBe(false);
    expect(result.changes_governance_policy).toBe(false);
    expect(pattern.overrides_operator_authority).toBe(false);
  });

  it("indexes pattern categories and recommendations in an immutable ledger", () => {
    const result = analyzeRiskPatternIntelligence({ scenario: "ROLLBACK_FAILURE" });
    const pattern = result.patterns[0];
    const recommendation = result.recommendations[0];

    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.immutable).toBe(true);
    expect(result.ledger.deleted).toBe(false);
    expect(result.ledger.category_index.ROLLBACK_FAILURE).toContain(pattern.risk_pattern_id);
    expect(result.ledger.recommendation_index.ROLLBACK_REFINEMENT).toContain(recommendation.recommendation_id);
  });

  it("replays risk pattern intelligence", () => {
    const result = analyzeRiskPatternIntelligence({ scenario: "SEVERITY_UNDERESTIMATION" });

    expect(replayRiskPatternIntelligence(result)).toBe(true);
  });

  it.each([
    ["MISSING_OBSERVATIONS", "MULTIPLE_OBSERVATIONS_MISSING"],
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_MISSING"],
    ["MISSING_CLASSIFICATION", "DETERMINISTIC_CLASSIFICATION_MISSING"],
    ["MISSING_CONFIDENCE", "CONFIDENCE_EVALUATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_REFERENCES_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_REFERENCES_MISSING"],
    ["MISSING_TIMELINE", "HISTORY_TIMELINE_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["PRODUCTION_MUTATION", "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"],
    ["ESCALATION_THRESHOLD_MUTATION", "ESCALATION_THRESHOLD_MUTATION_DETECTED"],
    ["ROLLBACK_THRESHOLD_MUTATION", "ROLLBACK_THRESHOLD_MUTATION_DETECTED"],
    ["GOVERNANCE_POLICY_MUTATION", "GOVERNANCE_POLICY_MUTATION_DETECTED"],
    ["GOVERNANCE_DECISION_OVERRIDE", "GOVERNANCE_DECISION_OVERRIDE_DETECTED"],
    ["OPERATOR_OVERRIDE", "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"],
    ["EVIDENCE_REWRITE", "HISTORICAL_EVIDENCE_REWRITE_DETECTED"],
    ["MISSION_HISTORY_REWRITE", "MISSION_HISTORY_REWRITE_DETECTED"],
    ["CONSTITUTIONAL_SUPPRESSION", "CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_PATTERN_ANALYSIS"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RiskPatternScenario, RiskPatternFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeRiskPatternIntelligence({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.mutates_production_risk_models).toBe(false);
  });

  it("marks replay failures as pending replay", () => {
    const result = analyzeRiskPatternIntelligence({ scenario: "REPLAY_DIVERGENCE" });

    expect(result.validation.state).toBe("PENDING_REPLAY");
    expect(result.validation.replay_complete).toBe(false);
  });

  it("rejects patterns without multiple observations", () => {
    const result = analyzeRiskPatternIntelligence({ scenario: "MISSING_OBSERVATIONS" });

    expect(result.validation.state).toBe("REJECTED");
    expect(result.validation.multiple_observations_complete).toBe(false);
  });

  it("detects replay tampering", () => {
    const result = analyzeRiskPatternIntelligence({ scenario: "COMPOSITE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRiskPatternIntelligence(tampered)).toBe(false);
  });
});
