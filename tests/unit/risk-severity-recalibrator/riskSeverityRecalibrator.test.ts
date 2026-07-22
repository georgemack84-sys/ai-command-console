import { describe, expect, it } from "vitest";
import { analyzeRiskSeverityRecalibration, getRiskSeverityRecalibratorFoundation, replayRiskSeverityRecalibration } from "@/services/risk-severity-recalibrator";
import type { RiskSeverityRecalibrationFailure, RiskSeverityRecalibrationScenario } from "@/types/risk-severity-recalibrator";

describe("Mission Control Phase 10.7.4 Risk Severity Recalibrator", () => {
  it("publishes the risk severity recalibrator foundation", () => {
    const foundation = getRiskSeverityRecalibratorFoundation();

    expect(foundation.risk_severity_recalibrator_version).toBe("risk-severity-recalibrator/v1");
    expect(foundation.api_surface.analyze_recalibration).toBe("POST /risk-severity-recalibrator/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("generates deterministic recalibration proposals", () => {
    const first = analyzeRiskSeverityRecalibration({ scenario: "SEVERITY_SUPPRESSED" });
    const second = analyzeRiskSeverityRecalibration({ scenario: "SEVERITY_SUPPRESSED" });

    expect(first.records[0].recalibration_id).toBe(second.records[0].recalibration_id);
    expect(first.calibration_analysis.severity_calibration_score).toBe(second.calibration_analysis.severity_calibration_score);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("classifies supported calibration outcomes", () => {
    expect(analyzeRiskSeverityRecalibration({ scenario: "ACCURATE" }).calibration_analysis.calibration_rating).toBe("ACCURATE");
    expect(analyzeRiskSeverityRecalibration({ scenario: "SEVERITY_INFLATED" }).calibration_analysis.calibration_rating).toBe("SEVERITY_INFLATED");
    expect(analyzeRiskSeverityRecalibration({ scenario: "SEVERITY_SUPPRESSED" }).calibration_analysis.calibration_rating).toBe("SEVERITY_SUPPRESSED");
    expect(analyzeRiskSeverityRecalibration({ scenario: "PROBABILITY_OVERESTIMATED" }).calibration_analysis.calibration_rating).toBe("PROBABILITY_OVERESTIMATED");
    expect(analyzeRiskSeverityRecalibration({ scenario: "PROBABILITY_UNDERESTIMATED" }).calibration_analysis.calibration_rating).toBe("PROBABILITY_UNDERESTIMATED");
    expect(analyzeRiskSeverityRecalibration({ scenario: "IMPACT_MISCALIBRATED" }).calibration_analysis.calibration_rating).toBe("IMPACT_MISCALIBRATED");
    expect(analyzeRiskSeverityRecalibration({ scenario: "ESCALATION_THRESHOLD" }).calibration_analysis.calibration_rating).toBe("ESCALATION_THRESHOLD_MISCALIBRATED");
    expect(analyzeRiskSeverityRecalibration({ scenario: "ROLLBACK_THRESHOLD" }).calibration_analysis.calibration_rating).toBe("ROLLBACK_THRESHOLD_MISCALIBRATED");
    expect(analyzeRiskSeverityRecalibration({ scenario: "UNSTABLE" }).calibration_analysis.calibration_rating).toBe("UNSTABLE");
  });

  it("covers recalibration proposal categories", () => {
    expect(analyzeRiskSeverityRecalibration({ scenario: "SEVERITY_SUPPRESSED" }).records[0].calibration_type).toBe("SEVERITY_ADJUSTMENT");
    expect(analyzeRiskSeverityRecalibration({ scenario: "PROBABILITY_UNDERESTIMATED" }).records[0].calibration_type).toBe("PROBABILITY_ADJUSTMENT");
    expect(analyzeRiskSeverityRecalibration({ scenario: "IMPACT_MISCALIBRATED" }).records[0].calibration_type).toBe("IMPACT_ADJUSTMENT");
    expect(analyzeRiskSeverityRecalibration({ scenario: "ESCALATION_THRESHOLD" }).records[0].calibration_type).toBe("ESCALATION_THRESHOLD_REFINEMENT");
    expect(analyzeRiskSeverityRecalibration({ scenario: "ROLLBACK_THRESHOLD" }).records[0].calibration_type).toBe("ROLLBACK_THRESHOLD_REFINEMENT");
    expect(analyzeRiskSeverityRecalibration({ scenario: "EVIDENCE_REQUIREMENT" }).records[0].calibration_type).toBe("EVIDENCE_REQUIREMENT");
    expect(analyzeRiskSeverityRecalibration({ scenario: "ENHANCED_MONITORING" }).records[0].calibration_type).toBe("ENHANCED_MONITORING");
    expect(analyzeRiskSeverityRecalibration({ scenario: "GOVERNANCE_ESCALATION" }).records[0].calibration_type).toBe("GOVERNANCE_ESCALATION");
    expect(analyzeRiskSeverityRecalibration({ scenario: "SIMULATION_REQUIREMENT" }).records[0].calibration_type).toBe("SIMULATION_REQUIREMENT");
  });

  it("calculates calibration dimensions and expected improvements", () => {
    const result = analyzeRiskSeverityRecalibration({ scenario: "IMPACT_MISCALIBRATED" });

    expect(result.calibration_analysis.severity_calibration_score).toBeGreaterThan(0);
    expect(result.calibration_analysis.probability_calibration_score).toBeGreaterThan(0);
    expect(result.calibration_analysis.impact_calibration_score).toBeGreaterThan(0);
    expect(result.calibration_analysis.escalation_threshold_score).toBeGreaterThan(0);
    expect(result.calibration_analysis.rollback_threshold_score).toBeGreaterThan(0);
    expect(result.records[0].expected_improvement).toBeGreaterThan(0);
    expect(result.proposals[0].expected_accuracy_gain).toBe(result.records[0].expected_improvement);
  });

  it("requires governance review and simulation for high-impact proposals", () => {
    const result = analyzeRiskSeverityRecalibration({ scenario: "ESCALATION_THRESHOLD" });

    expect(result.records[0].operator_review_required).toBe(true);
    expect(result.records[0].simulation_required).toBe(true);
    expect(result.proposals[0].governance_review_required).toBe(true);
    expect(result.proposals[0].approval_requirements).toContain("simulation_certification");
  });

  it("keeps recalibration advisory only", () => {
    const result = analyzeRiskSeverityRecalibration({ scenario: "ROLLBACK_THRESHOLD" });
    const record = result.records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.observational_only).toBe(true);
    expect(result.mutates_production_severity_models).toBe(false);
    expect(result.mutates_production_probability_models).toBe(false);
    expect(result.changes_escalation_thresholds).toBe(false);
    expect(result.changes_rollback_policies).toBe(false);
    expect(result.changes_governance_policy).toBe(false);
    expect(record.overrides_operator_authority).toBe(false);
  });

  it("indexes recalibration records in an immutable ledger", () => {
    const result = analyzeRiskSeverityRecalibration({ scenario: "SEVERITY_INFLATED" });
    const record = result.records[0];

    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.immutable).toBe(true);
    expect(result.ledger.deleted).toBe(false);
    expect(result.ledger.rating_index.SEVERITY_INFLATED).toContain(record.recalibration_id);
    expect(result.ledger.type_index.SEVERITY_ADJUSTMENT).toContain(record.recalibration_id);
  });

  it("replays risk severity recalibration", () => {
    const result = analyzeRiskSeverityRecalibration({ scenario: "SEVERITY_SUPPRESSED" });

    expect(replayRiskSeverityRecalibration(result)).toBe(true);
  });

  it.each([
    ["MISSING_ASSESSMENTS", "HISTORICAL_ASSESSMENTS_MISSING"],
    ["MISSING_OUTCOMES", "ACTUAL_OUTCOMES_MISSING"],
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_MISSING"],
    ["MISSING_CALCULATION", "DETERMINISTIC_CALCULATION_MISSING"],
    ["MISSING_EXPLANATION", "EXPLAINABLE_LOGIC_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_REFERENCES_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_REFERENCES_MISSING"],
    ["MISSING_SIMULATION", "SIMULATION_REQUIREMENT_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["SEVERITY_MODEL_MUTATION", "PRODUCTION_SEVERITY_MODEL_MUTATION_DETECTED"],
    ["PROBABILITY_MODEL_MUTATION", "PRODUCTION_PROBABILITY_MODEL_MUTATION_DETECTED"],
    ["ESCALATION_THRESHOLD_MUTATION", "ESCALATION_THRESHOLD_MUTATION_DETECTED"],
    ["ROLLBACK_POLICY_MUTATION", "ROLLBACK_POLICY_MUTATION_DETECTED"],
    ["GOVERNANCE_POLICY_MUTATION", "GOVERNANCE_POLICY_MUTATION_DETECTED"],
    ["OPERATOR_OVERRIDE", "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"],
    ["EVIDENCE_REWRITE", "HISTORICAL_EVIDENCE_REWRITE_DETECTED"],
    ["MISSION_HISTORY_REWRITE", "MISSION_HISTORY_REWRITE_DETECTED"],
    ["CONSTITUTIONAL_SUPPRESSION", "CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_RECALIBRATION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RiskSeverityRecalibrationScenario, RiskSeverityRecalibrationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeRiskSeverityRecalibration({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.mutates_production_severity_models).toBe(false);
  });

  it("marks replay failures as pending replay", () => {
    const result = analyzeRiskSeverityRecalibration({ scenario: "REPLAY_DIVERGENCE" });

    expect(result.validation.state).toBe("PENDING_REPLAY");
    expect(result.validation.replay_complete).toBe(false);
  });

  it("rejects missing required historical inputs", () => {
    const result = analyzeRiskSeverityRecalibration({ scenario: "MISSING_OUTCOMES" });

    expect(result.validation.state).toBe("REJECTED");
    expect(result.validation.actual_outcomes_complete).toBe(false);
  });

  it("detects replay tampering", () => {
    const result = analyzeRiskSeverityRecalibration({ scenario: "SEVERITY_SUPPRESSED" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRiskSeverityRecalibration(tampered)).toBe(false);
  });
});
