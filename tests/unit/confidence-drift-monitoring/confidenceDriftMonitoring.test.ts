import { describe, expect, it } from "vitest";
import {
  getConfidenceDriftMonitoringFoundation,
  monitorConfidenceDrift,
  replayConfidenceDriftMonitoring,
} from "@/services/confidence-drift-monitoring";
import type {
  ConfidenceDriftMonitoringFailure,
  ConfidenceDriftMonitoringScenario,
  ConfidenceDriftMonitoringStatus,
} from "@/types/confidence-drift-monitoring";

describe("Mission Control Phase 10.12.3 Confidence Drift Monitoring", () => {
  it("publishes the confidence drift monitoring contract", () => {
    const foundation = getConfidenceDriftMonitoringFoundation();

    expect(foundation.confidence_drift_monitoring_version).toBe("confidence-drift-monitoring/v1");
    expect(foundation.api_surface.monitor_confidence_drift).toBe("POST /confidence-drift-monitoring/monitor");
    expect(foundation.api_surface.retrieve_baseline).toBe("POST /confidence-drift-monitoring/baseline");
    expect(foundation.api_surface.retrieve_calibration_report).toBe("POST /confidence-drift-monitoring/calibration");
    expect(foundation.api_surface.retrieve_evidence_validation).toBe("POST /confidence-drift-monitoring/evidence");
    expect(foundation.api_surface.retrieve_timeline).toBe("POST /confidence-drift-monitoring/timeline");
    expect(foundation.api_surface.retrieve_ledger_record).toBe("POST /confidence-drift-monitoring/ledger");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /confidence-drift-monitoring/contract");
    expect(foundation.api_surface.production_confidence_mutation_supported).toBe(false);
    expect(foundation.api_surface.automatic_recalibration_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.monitor_identifier).toBe("ConfidenceDriftMonitoring");
    expect(foundation.result.status).toBe("PASS");
  });

  it("monitors deterministically with stable replay and integrity hashes", () => {
    const first = monitorConfidenceDrift();
    const second = monitorConfidenceDrift();

    expect(first.baseline.integrity_hash).toBe(second.baseline.integrity_hash);
    expect(first.calibration_report.integrity_hash).toBe(second.calibration_report.integrity_hash);
    expect(first.stability_analysis.integrity_hash).toBe(second.stability_analysis.integrity_hash);
    expect(first.evidence_validation.integrity_hash).toBe(second.evidence_validation.integrity_hash);
    expect(first.historical_analysis.integrity_hash).toBe(second.historical_analysis.integrity_hash);
    expect(first.drift_index_report.integrity_hash).toBe(second.drift_index_report.integrity_hash);
    expect(first.drift_timeline.integrity_hash).toBe(second.drift_timeline.integrity_hash);
    expect(first.drift_record.integrity_hash).toBe(second.drift_record.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayConfidenceDriftMonitoring(first)).toBe(true);
  });

  it("maintains the approved confidence baseline registry", () => {
    const baseline = monitorConfidenceDrift().baseline;

    expect(baseline.baseline_id).toBe("confidence_baseline_mission_control_v1");
    expect(baseline.confidence_model_version).toBe("confidence-model/v1");
    expect(baseline.mission_scope).toBe("mission-control-adaptive-intelligence");
    expect(baseline.calibration_profile).toContain("calibrated_probability");
    expect(baseline.confidence_thresholds).toContain("requires_evidence_above:0.90");
    expect(baseline.evidence_weighting_rules).toContain("verified_outcome:1.00");
    expect(baseline.governance_requirements).toContain("confidence_mutation_forbidden");
    expect(baseline.constitutional_requirements).toContain("evidence_proportionality_required");
    expect(baseline.approval_reference).toBe("governance-approval:confidence-baseline:v1");
    expect(baseline.effective_date).toBe("2026-07-11");
    expect(baseline.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("generates calibration reports for accuracy, reliability, anomalies, and actions", () => {
    const report = monitorConfidenceDrift().calibration_report;

    expect(report.report_id).toMatch(/^confidence_calibration_/);
    expect(report.calibration_score).toBe(0.95);
    expect(report.calibration_curve).toHaveLength(6);
    expect(report.confidence_accuracy_report).toContain("accurately calibrated");
    expect(report.confidence_reliability_summary).toContain("proportional");
    expect(report.prediction_accuracy).toBeGreaterThan(0.9);
    expect(report.uncertainty_representation_score).toBeGreaterThan(0.9);
    expect(report.detected_anomalies).toEqual([]);
    expect(report.governance_impacts).toContain("no_governance_impact_detected");
    expect(report.recommended_actions).toContain("continue_monitoring");
  });

  it("validates evidence-to-confidence proportionality", () => {
    const validation = monitorConfidenceDrift().evidence_validation;

    expect(validation.evidence_sufficiency).toBeGreaterThan(0.9);
    expect(validation.evidence_freshness).toBeGreaterThan(0.9);
    expect(validation.evidence_quality).toBeGreaterThan(0.9);
    expect(validation.evidence_diversity).toBeGreaterThan(0.9);
    expect(validation.evidence_consistency).toBeGreaterThan(0.9);
    expect(validation.evidence_completeness).toBeGreaterThan(0.9);
    expect(validation.evidence_lineage).toEqual(expect.arrayContaining(["evidence:outcome-observation", "evidence:simulation-validation"]));
    expect(validation.evidence_alignment_report).toContain("proportional");
    expect(validation.evidence_confidence_ratio).toBe(1.01);
    expect(validation.detected_mismatches).toEqual([]);
  });

  it("calculates stability, historical analysis, and the confidence drift index", () => {
    const result = monitorConfidenceDrift();

    expect(result.stability_analysis.stability_score).toBe(0.95);
    expect(result.stability_analysis.confidence_volatility).toBe(0.02);
    expect(result.stability_analysis.confidence_stability_report).toContain("stable");
    expect(result.historical_analysis.historical_drift_analysis).toContain("No historical");
    expect(result.historical_analysis.confidence_trends).toEqual(["baseline:v1", "calibration:t1", "outcome:t2", "monitoring:current"]);
    expect(result.historical_analysis.operator_influence_report).toContain("does not mutate");
    expect(result.drift_index_report.confidence_drift_index).toBe(0.05);
    expect(result.drift_index_report.calibration_deviation).toBe(0.04);
    expect(result.drift_index_report.evidence_mismatch).toBe(0.05);
  });

  it("maintains a replayable append-only drift timeline", () => {
    const timeline = monitorConfidenceDrift().drift_timeline;

    expect(timeline.timeline_id).toMatch(/^confidence_drift_timeline_/);
    expect(timeline.confidence_changes).toContain("confidence:current-assessment");
    expect(timeline.calibration_updates).toContain("calibration:monitoring-current");
    expect(timeline.drift_events).toEqual(["drift:none"]);
    expect(timeline.evidence_changes).toContain("evidence:lineage-verified");
    expect(timeline.adaptation_proposals).toContain("adaptation-proposal:none-authorized");
    expect(timeline.governance_reviews).toContain("governance:no-review-required");
    expect(timeline.simulation_results).toContain("simulation:phase-10.11-certified");
    expect(timeline.operator_decisions).toContain("operator:review-available");
    expect(timeline.certification_events).toContain("certification:adaptive-simulation-certified");
    expect(timeline.replay_refs).toContain("replay:confidence-drift-monitoring");
    expect(timeline.append_only).toBe(true);
    expect(timeline.immutable).toBe(true);
  });

  it("writes the canonical ConfidenceDriftRecord ledger entry", () => {
    const record = monitorConfidenceDrift({ tenant_id: "tenant-alpha" }).drift_record;

    expect(record.drift_id).toMatch(/^confidence_drift_/);
    expect(record.tenant_id).toBe("tenant-alpha");
    expect(record.baseline_ref).toMatch(/[a-f0-9]{64}/);
    expect(record.confidence_model_version).toBe("confidence-model/v1");
    expect(record.drift_category).toBe("CONFIDENCE_DRIFT");
    expect(record.confidence_drift_index).toBe(0.05);
    expect(record.calibration_score).toBe(0.95);
    expect(record.stability_score).toBe(0.95);
    expect(record.severity).toBe("INFORMATIONAL");
    expect(record.evidence_alignment_score).toBe(0.99);
    expect(record.affected_adaptations).toContain("adaptation:confidence-calibration");
    expect(record.affected_decisions).toContain("decision:confidence-weighted-recommendation");
    expect(record.supporting_evidence).toMatch(/[a-f0-9]{64}/);
    expect(record.recommended_response).toBe("MONITOR");
    expect(record.containment_required).toBe(false);
    expect(record.timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("preserves deterministic, replayable, governance, constitutional, operator, tenant, and advisory invariants", () => {
    const result = monitorConfidenceDrift();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.evidence_backed).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_production_confidence).toBe(false);
  });

  it.each([
    ["UNAUTHORIZED_BASELINE_CHANGE", "UNAUTHORIZED_BASELINE_CHANGE", "REQUIRES_GOVERNANCE_REVIEW"],
    ["MISSING_GOVERNANCE_APPROVAL", "MISSING_GOVERNANCE_APPROVAL", "REQUIRES_GOVERNANCE_REVIEW"],
    ["CONFIDENCE_INFLATION", "CONFIDENCE_INFLATION_DETECTED", "DRIFT_DETECTED"],
    ["CONFIDENCE_COLLAPSE", "CONFIDENCE_COLLAPSE_DETECTED", "DRIFT_DETECTED"],
    ["UNEXPLAINED_SHIFT", "UNEXPLAINED_CONFIDENCE_SHIFT", "DRIFT_DETECTED"],
    ["CONFIDENCE_INSTABILITY", "CONFIDENCE_INSTABILITY_DETECTED", "DRIFT_DETECTED"],
    ["EVIDENCE_MISMATCH", "EVIDENCE_CONFIDENCE_MISMATCH", "DRIFT_DETECTED"],
    ["HISTORICAL_DIVERGENCE", "HISTORICAL_CONFIDENCE_DIVERGENCE", "DRIFT_DETECTED"],
    ["UNSUPPORTED_CERTAINTY", "UNSUPPORTED_CERTAINTY_DETECTED", "DRIFT_DETECTED"],
    ["EXCESSIVE_UNCERTAINTY", "EXCESSIVE_UNCERTAINTY_DETECTED", "DRIFT_DETECTED"],
    ["CONFIDENCE_OSCILLATION", "CONFIDENCE_OSCILLATION_DETECTED", "DRIFT_DETECTED"],
    ["ADAPTATION_DEGRADATION", "ADAPTATION_INDUCED_CALIBRATION_DEGRADATION", "DRIFT_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ASSESSMENT", "DRIFT_DETECTED"],
    ["NONREPLAYABLE_EVIDENCE", "NONREPLAYABLE_CONFIDENCE_EVIDENCE", "DRIFT_DETECTED"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH", "FAIL_CLOSED"],
    ["PRODUCTION_MUTATION", "PRODUCTION_CONFIDENCE_MUTATION_ATTEMPT", "FAIL_CLOSED"],
    ["UNKNOWN_BEHAVIOR", "UNKNOWN_CONFIDENCE_BEHAVIOR", "FAIL_CLOSED"],
  ] as const)("classifies %s deterministically", (scenario: ConfidenceDriftMonitoringScenario, failure: ConfidenceDriftMonitoringFailure, status: ConfidenceDriftMonitoringStatus) => {
    const result = monitorConfidenceDrift({ scenario });

    expect(result.status).toBe(status);
    expect(result.failures).toContain(failure);
    expect(result.drift_record.drift_category).toBe("CONFIDENCE_DRIFT");
    expect(result.mutates_production_confidence).toBe(false);
    expect(replayConfidenceDriftMonitoring(result)).toBe(true);
  });

  it("escalates confidence inflation, collapse, evidence mismatch, and adaptation degradation", () => {
    const inflation = monitorConfidenceDrift({ scenario: "CONFIDENCE_INFLATION" });
    const mismatch = monitorConfidenceDrift({ scenario: "EVIDENCE_MISMATCH" });

    expect(inflation.drift_record.severity).toBe("HIGH");
    expect(inflation.drift_record.recommended_response).toBe("SUPPRESS_ADAPTATION");
    expect(inflation.drift_record.containment_required).toBe(true);
    expect(inflation.calibration_report.detected_anomalies).toContain("CONFIDENCE_INFLATION_DETECTED");
    expect(mismatch.evidence_validation.evidence_alignment_report).toContain("not proportional");
    expect(mismatch.evidence_backed).toBe(false);
  });

  it("marks degraded determinism, explanation, replay, governance, constitutional, and tenant guarantees", () => {
    expect(monitorConfidenceDrift({ scenario: "NONDETERMINISTIC" }).deterministic).toBe(false);
    expect(monitorConfidenceDrift({ scenario: "UNEXPLAINED_SHIFT" }).explainable).toBe(false);
    expect(monitorConfidenceDrift({ scenario: "NONREPLAYABLE_EVIDENCE" }).replayable).toBe(false);
    expect(monitorConfidenceDrift({ scenario: "MISSING_GOVERNANCE_APPROVAL" }).governance_preserved).toBe(false);
    expect(monitorConfidenceDrift({ scenario: "PRODUCTION_MUTATION" }).constitutional_preserved).toBe(false);
    expect(monitorConfidenceDrift({ scenario: "TENANT_BREACH" }).tenant_isolated).toBe(false);
  });

  it("detects nested confidence drift timeline tampering", () => {
    const result = monitorConfidenceDrift();
    const tampered = {
      ...result,
      drift_timeline: {
        ...result.drift_timeline,
        drift_events: ["drift:injected"],
      },
    };

    expect(replayConfidenceDriftMonitoring(tampered)).toBe(false);
  });
});
