import { describe, expect, it } from "vitest";
import {
  getRiskDriftMonitoringFoundation,
  monitorRiskDrift,
  replayRiskDriftMonitoring,
} from "@/services/risk-drift-monitoring";
import type {
  RiskDriftMonitoringFailure,
  RiskDriftMonitoringScenario,
  RiskDriftMonitoringStatus,
} from "@/types/risk-drift-monitoring";

describe("Mission Control Phase 10.12.4 Risk Drift Monitoring", () => {
  it("publishes the risk drift monitoring contract", () => {
    const foundation = getRiskDriftMonitoringFoundation();

    expect(foundation.risk_drift_monitoring_version).toBe("risk-drift-monitoring/v1");
    expect(foundation.api_surface.monitor_risk_drift).toBe("POST /risk-drift-monitoring/monitor");
    expect(foundation.api_surface.retrieve_baseline).toBe("POST /risk-drift-monitoring/baseline");
    expect(foundation.api_surface.retrieve_consistency_report).toBe("POST /risk-drift-monitoring/consistency");
    expect(foundation.api_surface.retrieve_escalation_report).toBe("POST /risk-drift-monitoring/escalation");
    expect(foundation.api_surface.retrieve_tolerance_report).toBe("POST /risk-drift-monitoring/tolerance");
    expect(foundation.api_surface.retrieve_probability_report).toBe("POST /risk-drift-monitoring/probability");
    expect(foundation.api_surface.retrieve_drift_report).toBe("POST /risk-drift-monitoring/report");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /risk-drift-monitoring/contract");
    expect(foundation.api_surface.production_risk_mutation_supported).toBe(false);
    expect(foundation.api_surface.automatic_escalation_policy_mutation_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.monitor_identifier).toBe("RiskDriftMonitoring");
    expect(foundation.result.status).toBe("PASS");
  });

  it("monitors deterministically with stable replay and integrity hashes", () => {
    const first = monitorRiskDrift();
    const second = monitorRiskDrift();

    expect(first.baseline.integrity_hash).toBe(second.baseline.integrity_hash);
    expect(first.consistency_report.integrity_hash).toBe(second.consistency_report.integrity_hash);
    expect(first.escalation_report.integrity_hash).toBe(second.escalation_report.integrity_hash);
    expect(first.tolerance_report.integrity_hash).toBe(second.tolerance_report.integrity_hash);
    expect(first.probability_report.integrity_hash).toBe(second.probability_report.integrity_hash);
    expect(first.stability_report.integrity_hash).toBe(second.stability_report.integrity_hash);
    expect(first.drift_report.integrity_hash).toBe(second.drift_report.integrity_hash);
    expect(first.escalation_timeline.integrity_hash).toBe(second.escalation_timeline.integrity_hash);
    expect(first.drift_record.integrity_hash).toBe(second.drift_record.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayRiskDriftMonitoring(first)).toBe(true);
  });

  it("maintains the approved risk baseline registry", () => {
    const baseline = monitorRiskDrift().baseline;

    expect(baseline.baseline_id).toBe("risk_baseline_mission_control_v1");
    expect(baseline.risk_model_version).toBe("risk-model/v1");
    expect(baseline.risk_categories).toEqual(expect.arrayContaining(["operational", "governance", "constitutional", "tenant_isolation"]));
    expect(baseline.probability_model).toContain("evidence_weighted_likelihood");
    expect(baseline.impact_model).toContain("constitutional_impact");
    expect(baseline.escalation_thresholds).toContain("constitutional:any");
    expect(baseline.approved_tolerance_levels).toContain("critical_fail_closed");
    expect(baseline.governance_requirements).toContain("risk_model_mutation_forbidden");
    expect(baseline.constitutional_requirements).toContain("constitutional_risk_must_escalate");
    expect(baseline.approval_reference).toBe("governance-approval:risk-baseline:v1");
    expect(baseline.effective_date).toBe("2026-07-11");
    expect(baseline.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("evaluates consistency across probability, impact, severity, recommendations, escalation, and evidence", () => {
    const report = monitorRiskDrift().consistency_report;

    expect(report.probability_consistency).toBe(0.96);
    expect(report.impact_consistency).toBe(0.96);
    expect(report.severity_consistency).toBe(0.96);
    expect(report.recommendation_consistency).toBe(0.93);
    expect(report.escalation_consistency).toBe(0.96);
    expect(report.evidence_weighting_consistency).toBe(0.94);
    expect(report.historical_alignment).toBe(0.96);
    expect(report.evaluation_variance_summary).toContain("consistently evaluated");
    expect(report.decision_consistency_matrix).toEqual(["probability", "impact", "severity", "recommendation", "escalation", "evidence_weighting", "historical_alignment"]);
  });

  it("generates escalation, tolerance, probability, and stability reports", () => {
    const result = monitorRiskDrift();

    expect(result.escalation_report.escalation_threshold_report).toContain("aligned");
    expect(result.escalation_report.threshold_stability_score).toBe(0.96);
    expect(result.escalation_report.detected_escalation_anomalies).toEqual([]);
    expect(result.tolerance_report.tolerance_drift_assessment).toContain("approved governance baseline");
    expect(result.tolerance_report.detected_tolerance_anomalies).toEqual([]);
    expect(result.probability_report.probability_stability_report).toContain("stable");
    expect(result.probability_report.estimation_consistency_score).toBe(0.96);
    expect(result.probability_report.probability_volatility).toBe(0.02);
    expect(result.stability_report.risk_stability_score).toBe(0.96);
    expect(result.stability_report.severity_variance_score).toBe(0.03);
    expect(result.stability_report.escalation_variance_score).toBe(0.04);
  });

  it("generates a deterministic evidence-backed risk drift report", () => {
    const report = monitorRiskDrift().drift_report;

    expect(report.detected_drift).toEqual([]);
    expect(report.affected_risk_categories).toEqual(expect.arrayContaining(["operational", "governance", "constitutional"]));
    expect(report.probability_analysis).toContain("calibrated");
    expect(report.severity_analysis).toContain("consistent");
    expect(report.escalation_analysis).toContain("policy-aligned");
    expect(report.tolerance_analysis).toContain("aligned");
    expect(report.governance_impacts).toContain("no_governance_impact_detected");
    expect(report.constitutional_impacts).toContain("constitutional_boundary_preserved");
    expect(report.supporting_evidence).toContain("evidence:escalation-policy");
    expect(report.recommended_responses).toContain("MONITOR");
    expect(report.deterministic).toBe(true);
    expect(report.replayable).toBe(true);
    expect(report.audit_ready).toBe(true);
  });

  it("maintains an immutable escalation drift timeline", () => {
    const timeline = monitorRiskDrift().escalation_timeline;

    expect(timeline.timeline_id).toMatch(/^escalation_drift_timeline_/);
    expect(timeline.risk_assessments).toContain("risk:current-assessment");
    expect(timeline.severity_changes).toEqual(["severity:none"]);
    expect(timeline.escalation_events).toContain("escalation:policy-aligned");
    expect(timeline.governance_reviews).toContain("governance:no-review-required");
    expect(timeline.simulation_outcomes).toContain("simulation:phase-10.11-certified");
    expect(timeline.operator_decisions).toContain("operator:review-available");
    expect(timeline.adaptation_proposals).toContain("adaptation-proposal:none-authorized");
    expect(timeline.certification_events).toContain("certification:adaptive-simulation-certified");
    expect(timeline.detected_drift).toEqual(["drift:none"]);
    expect(timeline.containment_actions).toContain("containment:monitor");
    expect(timeline.replay_refs).toContain("replay:risk-drift-monitoring");
    expect(timeline.append_only).toBe(true);
    expect(timeline.immutable).toBe(true);
  });

  it("writes the canonical RiskDriftRecord ledger entry", () => {
    const record = monitorRiskDrift({ tenant_id: "tenant-alpha" }).drift_record;

    expect(record.drift_id).toMatch(/^risk_drift_/);
    expect(record.tenant_id).toBe("tenant-alpha");
    expect(record.baseline_ref).toMatch(/[a-f0-9]{64}/);
    expect(record.risk_model_version).toBe("risk-model/v1");
    expect(record.drift_category).toBe("RISK_DRIFT");
    expect(record.risk_stability_score).toBe(0.96);
    expect(record.probability_stability_score).toBe(0.96);
    expect(record.severity_variance_score).toBe(0.03);
    expect(record.escalation_variance_score).toBe(0.04);
    expect(record.tolerance_variance_score).toBe(0.06);
    expect(record.severity).toBe("INFORMATIONAL");
    expect(record.affected_risk_assessments).toContain("risk-assessment:mission-control");
    expect(record.affected_adaptations).toContain("adaptation:risk-severity");
    expect(record.affected_decisions).toContain("decision:escalation-routing");
    expect(record.supporting_evidence).toMatch(/[a-f0-9]{64}/);
    expect(record.recommended_response).toBe("MONITOR");
    expect(record.containment_required).toBe(false);
    expect(record.timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("preserves deterministic, replayable, governance, constitutional, operator, tenant, and advisory invariants", () => {
    const result = monitorRiskDrift();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.evidence_backed).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_production_risk).toBe(false);
  });

  it.each([
    ["UNAUTHORIZED_BASELINE_CHANGE", "UNAUTHORIZED_BASELINE_CHANGE", "REQUIRES_GOVERNANCE_REVIEW"],
    ["MISSING_GOVERNANCE_APPROVAL", "MISSING_GOVERNANCE_APPROVAL", "REQUIRES_GOVERNANCE_REVIEW"],
    ["RISK_INFLATION", "RISK_INFLATION_DETECTED", "DRIFT_DETECTED"],
    ["RISK_SUPPRESSION", "RISK_SUPPRESSION_DETECTED", "DRIFT_DETECTED"],
    ["ESCALATION_THRESHOLD_DRIFT", "ESCALATION_THRESHOLD_DRIFT", "DRIFT_DETECTED"],
    ["HIDDEN_TOLERANCE_CHANGE", "HIDDEN_TOLERANCE_CHANGE", "DRIFT_DETECTED"],
    ["INCONSISTENT_SEVERITY", "INCONSISTENT_SEVERITY_SCORING", "DRIFT_DETECTED"],
    ["UNSTABLE_PROBABILITY", "UNSTABLE_PROBABILITY_ESTIMATION", "DRIFT_DETECTED"],
    ["INCONSISTENT_IMPACT", "INCONSISTENT_IMPACT_ESTIMATION", "DRIFT_DETECTED"],
    ["ADAPTATION_RISK_BIAS", "ADAPTATION_INDUCED_RISK_BIAS", "DRIFT_DETECTED"],
    ["HISTORICAL_DIVERGENCE", "HISTORICAL_RISK_DIVERGENCE", "DRIFT_DETECTED"],
    ["GOVERNANCE_SENSITIVITY_REDUCTION", "GOVERNANCE_SENSITIVITY_REDUCTION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["UNAUTHORIZED_ESCALATION_EVOLUTION", "UNAUTHORIZED_ESCALATION_EVOLUTION", "DRIFT_DETECTED"],
    ["PROBABILITY_CALIBRATION_DEGRADATION", "PROBABILITY_CALIBRATION_DEGRADATION", "DRIFT_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ASSESSMENT", "DRIFT_DETECTED"],
    ["NONREPLAYABLE_EVIDENCE", "NONREPLAYABLE_RISK_EVIDENCE", "DRIFT_DETECTED"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH", "FAIL_CLOSED"],
    ["PRODUCTION_MUTATION", "PRODUCTION_RISK_MUTATION_ATTEMPT", "FAIL_CLOSED"],
    ["UNKNOWN_BEHAVIOR", "UNKNOWN_RISK_BEHAVIOR", "FAIL_CLOSED"],
  ] as const)("classifies %s deterministically", (scenario: RiskDriftMonitoringScenario, failure: RiskDriftMonitoringFailure, status: RiskDriftMonitoringStatus) => {
    const result = monitorRiskDrift({ scenario });

    expect(result.status).toBe(status);
    expect(result.failures).toContain(failure);
    expect(result.drift_record.drift_category).toBe("RISK_DRIFT");
    expect(result.mutates_production_risk).toBe(false);
    expect(replayRiskDriftMonitoring(result)).toBe(true);
  });

  it("escalates risk suppression, escalation threshold drift, and hidden tolerance changes", () => {
    const suppression = monitorRiskDrift({ scenario: "RISK_SUPPRESSION" });
    const escalation = monitorRiskDrift({ scenario: "ESCALATION_THRESHOLD_DRIFT" });
    const tolerance = monitorRiskDrift({ scenario: "HIDDEN_TOLERANCE_CHANGE" });

    expect(suppression.drift_record.severity).toBe("HIGH");
    expect(suppression.drift_record.recommended_response).toBe("SUPPRESS_ADAPTATION");
    expect(suppression.drift_record.containment_required).toBe(true);
    expect(escalation.escalation_report.escalation_drift_summary).toContain("governance review");
    expect(escalation.escalation_report.detected_escalation_anomalies).toContain("ESCALATION_THRESHOLD_DRIFT");
    expect(tolerance.tolerance_report.detected_tolerance_anomalies).toContain("HIDDEN_TOLERANCE_CHANGE");
  });

  it("marks degraded determinism, replay, governance, constitutional, evidence, and tenant guarantees", () => {
    expect(monitorRiskDrift({ scenario: "NONDETERMINISTIC" }).deterministic).toBe(false);
    expect(monitorRiskDrift({ scenario: "NONREPLAYABLE_EVIDENCE" }).replayable).toBe(false);
    expect(monitorRiskDrift({ scenario: "NONREPLAYABLE_EVIDENCE" }).evidence_backed).toBe(false);
    expect(monitorRiskDrift({ scenario: "GOVERNANCE_SENSITIVITY_REDUCTION" }).governance_preserved).toBe(false);
    expect(monitorRiskDrift({ scenario: "PRODUCTION_MUTATION" }).constitutional_preserved).toBe(false);
    expect(monitorRiskDrift({ scenario: "TENANT_BREACH" }).tenant_isolated).toBe(false);
  });

  it("detects nested risk drift timeline tampering", () => {
    const result = monitorRiskDrift();
    const tampered = {
      ...result,
      escalation_timeline: {
        ...result.escalation_timeline,
        detected_drift: ["drift:injected"],
      },
    };

    expect(replayRiskDriftMonitoring(tampered)).toBe(false);
  });
});
