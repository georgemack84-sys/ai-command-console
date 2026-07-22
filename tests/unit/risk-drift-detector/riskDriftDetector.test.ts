import { describe, expect, it } from "vitest";
import { analyzeRiskDrift, getRiskDriftFoundation, replayRiskDrift } from "@/services/risk-drift-detector";
import type { RiskDriftFailure, RiskDriftScenario } from "@/types/risk-drift-detector";

describe("Mission Control Phase 10.7.3 Risk Drift Detector", () => {
  it("publishes the risk drift foundation", () => {
    const foundation = getRiskDriftFoundation();

    expect(foundation.risk_drift_detector_version).toBe("risk-drift-detector/v1");
    expect(foundation.api_surface.analyze_drift).toBe("POST /risk-drift-detector/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("detects risk drift deterministically", () => {
    const first = analyzeRiskDrift({ scenario: "SIGNIFICANT" });
    const second = analyzeRiskDrift({ scenario: "SIGNIFICANT" });

    expect(first.records[0].risk_drift_id).toBe(second.records[0].risk_drift_id);
    expect(first.records[0].drift_score).toBe(second.records[0].drift_score);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("classifies supported drift outcomes", () => {
    expect(analyzeRiskDrift({ scenario: "IMPROVING" }).records[0].drift_classification).toBe("IMPROVING");
    expect(analyzeRiskDrift({ scenario: "STABLE" }).records[0].drift_classification).toBe("STABLE");
    expect(analyzeRiskDrift({ scenario: "MINOR" }).records[0].drift_classification).toBe("MINOR_DRIFT");
    expect(analyzeRiskDrift({ scenario: "MODERATE" }).records[0].drift_classification).toBe("MODERATE_DRIFT");
    expect(analyzeRiskDrift({ scenario: "SIGNIFICANT" }).records[0].drift_classification).toBe("SIGNIFICANT_DRIFT");
    expect(analyzeRiskDrift({ scenario: "CRITICAL" }).records[0].drift_classification).toBe("CRITICAL_DRIFT");
    expect(analyzeRiskDrift({ scenario: "GOVERNANCE_SENSITIVE" }).records[0].drift_classification).toBe("GOVERNANCE_SENSITIVE_DRIFT");
    expect(analyzeRiskDrift({ scenario: "CONSTITUTIONAL" }).records[0].drift_classification).toBe("CONSTITUTIONAL_DRIFT");
    expect(analyzeRiskDrift({ scenario: "TENANT_SPECIFIC" }).records[0].drift_classification).toBe("TENANT_SPECIFIC_DRIFT");
    expect(analyzeRiskDrift({ scenario: "DOMAIN_SPECIFIC" }).records[0].drift_classification).toBe("DOMAIN_SPECIFIC_DRIFT");
  });

  it("detects all required risk drift dimensions", () => {
    expect(analyzeRiskDrift({ scenario: "SEVERITY" }).records[0].drift_type).toBe("SEVERITY_DRIFT");
    expect(analyzeRiskDrift({ scenario: "PROBABILITY" }).records[0].drift_type).toBe("PROBABILITY_DRIFT");
    expect(analyzeRiskDrift({ scenario: "ESCALATION" }).records[0].drift_type).toBe("ESCALATION_DRIFT");
    expect(analyzeRiskDrift({ scenario: "GOVERNANCE" }).records[0].drift_type).toBe("GOVERNANCE_DRIFT");
    expect(analyzeRiskDrift({ scenario: "MISSION" }).records[0].drift_type).toBe("MISSION_TYPE_DRIFT");
    expect(analyzeRiskDrift({ scenario: "OPERATOR" }).records[0].drift_type).toBe("OPERATOR_SPECIFIC_DRIFT");
    expect(analyzeRiskDrift({ scenario: "TENANT" }).records[0].drift_type).toBe("TENANT_SPECIFIC_DRIFT");
    expect(analyzeRiskDrift({ scenario: "DOMAIN" }).records[0].drift_type).toBe("DOMAIN_DRIFT");
    expect(analyzeRiskDrift({ scenario: "ENVIRONMENTAL" }).records[0].drift_type).toBe("ENVIRONMENTAL_DRIFT");
    expect(analyzeRiskDrift({ scenario: "COMPOSITE" }).records[0].drift_type).toBe("COMPOSITE_PREDICTION_DRIFT");
  });

  it("calculates confidence intervals, trend analysis, and timelines", () => {
    const result = analyzeRiskDrift({ scenario: "CRITICAL" });
    const record = result.records[0];

    expect(record.drift_score).toBeGreaterThan(0);
    expect(record.confidence_interval[0]).toBeLessThan(record.confidence_interval[1]);
    expect(result.trend.direction_of_change).toBe("VOLATILE");
    expect(result.trend.historical_progression.length).toBe(3);
    expect(result.timeline.significant_events.length).toBeGreaterThan(0);
  });

  it("applies false-positive mitigation and immutable ledger indexes", () => {
    const result = analyzeRiskDrift({ scenario: "DOMAIN" });
    const record = result.records[0];

    expect(result.evidence_registry.false_positive_mitigation_applied).toBe(true);
    expect(result.evidence_registry.multi_mission_validation_refs.length).toBeGreaterThan(0);
    expect(result.evidence_registry.confidence_threshold_refs.length).toBeGreaterThan(0);
    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.immutable).toBe(true);
    expect(result.ledger.classification_index.DOMAIN_SPECIFIC_DRIFT).toContain(record.risk_drift_id);
    expect(result.ledger.type_index.DOMAIN_DRIFT).toContain(record.risk_drift_id);
  });

  it("keeps drift analysis advisory and observational only", () => {
    const result = analyzeRiskDrift({ scenario: "GOVERNANCE" });
    const record = result.records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.observational_only).toBe(true);
    expect(result.updates_risk_model).toBe(false);
    expect(result.updates_risk_thresholds).toBe(false);
    expect(result.changes_governance_policy).toBe(false);
    expect(result.changes_constitutional_safeguards).toBe(false);
    expect(record.overrides_operator_authority).toBe(false);
  });

  it("replays risk drift analysis", () => {
    const result = analyzeRiskDrift({ scenario: "SEVERITY" });

    expect(replayRiskDrift(result)).toBe(true);
  });

  it.each([
    ["MISSING_HISTORY", "HISTORICAL_DATASET_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["MISSING_STATISTICS", "STATISTICAL_CONSISTENCY_MISSING"],
    ["MISSING_MULTI_MISSION", "MULTI_MISSION_VALIDATION_MISSING"],
    ["MISSING_CONFIDENCE_THRESHOLD", "CONFIDENCE_THRESHOLD_VALIDATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_REFERENCES_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_REFERENCES_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["PRODUCTION_MUTATION", "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"],
    ["THRESHOLD_MUTATION", "RISK_THRESHOLD_MUTATION_DETECTED"],
    ["EVIDENCE_REWRITE", "EVIDENCE_REWRITE_DETECTED"],
    ["MISSION_HISTORY_REWRITE", "MISSION_HISTORY_REWRITE_DETECTED"],
    ["GOVERNANCE_POLICY_MUTATION", "GOVERNANCE_POLICY_MUTATION_DETECTED"],
    ["CONSTITUTIONAL_SUPPRESSION", "CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"],
    ["OPERATOR_OVERRIDE", "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_DRIFT_ANALYSIS"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RiskDriftScenario, RiskDriftFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeRiskDrift({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.updates_risk_model).toBe(false);
  });

  it("marks replay failures as pending replay", () => {
    const result = analyzeRiskDrift({ scenario: "REPLAY_DIVERGENCE" });

    expect(result.validation.state).toBe("PENDING_REPLAY");
    expect(result.validation.replay_complete).toBe(false);
  });

  it("rejects missing historical datasets", () => {
    const result = analyzeRiskDrift({ scenario: "MISSING_HISTORY" });

    expect(result.validation.state).toBe("REJECTED");
    expect(result.validation.historical_dataset_complete).toBe(false);
  });

  it("detects drift tampering during replay", () => {
    const result = analyzeRiskDrift({ scenario: "SEVERITY" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRiskDrift(tampered)).toBe(false);
  });
});
