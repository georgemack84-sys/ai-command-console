import { describe, expect, it } from "vitest";
import {
  analyzeRiskActualization,
  getRiskActualizationFoundation,
  replayRiskActualization,
} from "@/services/risk-actualization-analyzer";
import type { RiskActualizationFailure, RiskActualizationScenario } from "@/types/risk-actualization-analyzer";

describe("Mission Control Phase 10.7.2 Risk Actualization Analyzer", () => {
  it("publishes the risk actualization foundation", () => {
    const foundation = getRiskActualizationFoundation();

    expect(foundation.risk_actualization_analyzer_version).toBe("risk-actualization-analyzer/v1");
    expect(foundation.api_surface.analyze_actualization).toBe("POST /risk-actualization-analyzer/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("analyzes risk actualization deterministically", () => {
    const first = analyzeRiskActualization({ scenario: "UNDERESTIMATED" });
    const second = analyzeRiskActualization({ scenario: "UNDERESTIMATED" });

    expect(first.records[0].actualization_id).toBe(second.records[0].actualization_id);
    expect(first.records[0].risk_accuracy_score).toBe(second.records[0].risk_accuracy_score);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("classifies accurate, underestimated, overestimated, missed, and mitigated risks", () => {
    expect(analyzeRiskActualization({ scenario: "ACCURATE" }).records[0].actualization_classification).toBe("ACCURATE");
    expect(analyzeRiskActualization({ scenario: "UNDERESTIMATED" }).records[0].actualization_classification).toBe("UNDERESTIMATED");
    expect(analyzeRiskActualization({ scenario: "OVERESTIMATED" }).records[0].actualization_classification).toBe("OVERESTIMATED");
    expect(analyzeRiskActualization({ scenario: "MISSED" }).records[0].actualization_classification).toBe("MISSED");
    expect(analyzeRiskActualization({ scenario: "CORRECTLY_MITIGATED" }).records[0].actualization_classification).toBe("CORRECTLY_MITIGATED");
  });

  it("calculates severity, probability, escalation, rollback, governance, and composite accuracy", () => {
    const record = analyzeRiskActualization({ scenario: "ACCURATE" }).records[0];

    expect(record.severity_accuracy_score).toBeGreaterThan(0);
    expect(record.probability_accuracy_score).toBeGreaterThan(0);
    expect(record.escalation_accuracy_score).toBeGreaterThan(0);
    expect(record.rollback_accuracy_score).toBeGreaterThan(0);
    expect(record.governance_accuracy_score).toBeGreaterThan(0);
    expect(record.risk_accuracy_score).toBeGreaterThan(0);
  });

  it("detects escalation, rollback, and governance actualization mismatches", () => {
    expect(analyzeRiskActualization({ scenario: "ESCALATION_MISSED" }).records[0].escalation_accuracy_score).toBeLessThan(1);
    expect(analyzeRiskActualization({ scenario: "ROLLBACK_MISSED" }).records[0].rollback_accuracy_score).toBeLessThan(1);
    expect(analyzeRiskActualization({ scenario: "GOVERNANCE_NEEDED" }).records[0].governance_accuracy_score).toBeLessThan(1);
  });

  it("generates comparison reports, summaries, evidence links, and immutable ledger indexes", () => {
    const result = analyzeRiskActualization({ scenario: "MISSED" });
    const record = result.records[0];

    expect(result.comparison.actualization_id).toBe(record.actualization_id);
    expect(result.summary.risk_prediction_quality).toBe("MISSED");
    expect(result.summary.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.immutable).toBe(true);
    expect(result.ledger.classification_index.MISSED).toContain(record.actualization_id);
  });

  it("keeps actualization observational-only without model, outcome, evidence, or governance mutation", () => {
    const result = analyzeRiskActualization({ scenario: "OVERESTIMATED" });
    const record = result.records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.observational_only).toBe(true);
    expect(result.updates_risk_model).toBe(false);
    expect(result.mutates_outcomes).toBe(false);
    expect(result.rewrites_evidence).toBe(false);
    expect(result.changes_governance_decisions).toBe(false);
    expect(record.observational_only).toBe(true);
  });

  it("replays risk actualization analyses", () => {
    const result = analyzeRiskActualization({ scenario: "ACCURATE" });

    expect(replayRiskActualization(result)).toBe(true);
  });

  it.each([
    ["MISSING_RISK_DATA", "HISTORICAL_RISK_DATA_MISSING"],
    ["MISSING_OUTCOME", "OUTCOME_DATA_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_REFERENCES_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_REFERENCES_MISSING"],
    ["MISSING_INTEGRITY", "INTEGRITY_HASH_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["PRODUCTION_MUTATION", "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"],
    ["OUTCOME_MUTATION", "OUTCOME_MUTATION_DETECTED"],
    ["EVIDENCE_REWRITE", "EVIDENCE_REWRITE_DETECTED"],
    ["GOVERNANCE_REWRITE", "GOVERNANCE_DECISION_REWRITE_DETECTED"],
    ["AUDIT_REMOVAL", "AUDIT_HISTORY_REMOVAL_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_CALCULATION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RiskActualizationScenario, RiskActualizationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeRiskActualization({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.updates_risk_model).toBe(false);
  });

  it("marks replay failures as pending replay", () => {
    const result = analyzeRiskActualization({ scenario: "REPLAY_DIVERGENCE" });

    expect(result.validation.state).toBe("PENDING_REPLAY");
    expect(result.validation.replay_complete).toBe(false);
  });

  it("rejects missing outcomes instead of certifying", () => {
    const result = analyzeRiskActualization({ scenario: "MISSING_OUTCOME" });

    expect(result.validation.state).toBe("REJECTED");
    expect(result.validation.outcome_data_complete).toBe(false);
  });

  it("detects risk actualization tampering during replay", () => {
    const result = analyzeRiskActualization({ scenario: "ACCURATE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRiskActualization(tampered)).toBe(false);
  });
});
