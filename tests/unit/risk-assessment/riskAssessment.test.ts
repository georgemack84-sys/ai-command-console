import { describe, expect, it } from "vitest";

import { getRiskAssessmentBundle, replayRiskAssessment, runRiskAssessment, validateRiskAssessment } from "@/services/risk-assessment";
import type { RiskAssessmentFailure } from "@/types/risk-assessment";

const conditionalFailures = ["RISK_EVALUATION_ENGINE_MISSING", "CONFIDENCE_EVALUATION_MISSING", "SEVERITY_DETERMINATION_MISSING", "EXPOSURE_ASSESSMENT_MISSING", "RISK_REGISTRY_MISSING", "RISK_TREND_ENGINE_MISSING", "RISK_FORECAST_ENGINE_MISSING", "RISK_CORRELATION_ENGINE_MISSING", "RISK_PRIORITIZATION_ENGINE_MISSING", "RISK_EXPLAINABILITY_ENGINE_MISSING", "RISK_VISUALIZATION_SERVICE_MISSING", "RISK_REPORTS_MISSING", "RISK_HEAT_MAPS_MISSING", "RISK_EVIDENCE_MISSING", "RISK_APIS_MISSING"] as const satisfies readonly RiskAssessmentFailure[];
const failClosedFailures = ["MC_2_SCENARIO_PLANNING_INVALID", "MC_3_DECISION_SUPPORT_INVALID", "MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", "MC_6_DIGITAL_TWIN_INVALID", "MC_7_SIMULATION_INVALID", "TEMPORAL_ANALYTICS_CONTRACT_MISSING", "TEMPORAL_ANALYTICS_NOT_AUTHORITATIVE", "RISK_EVALUATION_NON_DETERMINISTIC", "RISK_RECORD_LINEAGE_MISSING", "TREND_EVIDENCE_MISSING", "FORECAST_EVIDENCE_MISSING", "CASCADING_RISK_DETECTION_MISSING", "CORRELATION_EVIDENCE_MISSING", "PRIORITIZATION_NOT_GOVERNED", "OPAQUE_RISK_SCORING_DETECTED", "EVIDENCE_BACKED_ASSESSMENTS_MISSING", "DASHBOARD_EVIDENCE_MISSING", "RISK_EVIDENCE_MUTABLE", "RISK_LINEAGE_INCOMPLETE", "MISSION_STATE_MUTATION_ATTEMPTED", "DIGITAL_TWIN_MUTATION_ATTEMPTED", "SIMULATION_OUTCOME_MUTATION_ATTEMPTED", "OPERATOR_DECISION_OVERRIDE_ATTEMPTED"] as const satisfies readonly RiskAssessmentFailure[];

describe("Risk Assessment MC-8", () => {
  it("publishes the MC-8 risk assessment doctrine", () => {
    const bundle = getRiskAssessmentBundle();

    expect(bundle.doctrine).toMatchObject({ version: "risk-assessment/mc-8", owns_continuous_risk_evaluation: true, owns_risk_registry: true, owns_risk_trends_and_forecasts: true, owns_risk_correlation_and_prioritization: true, owns_risk_explainability_and_visualization: true, consumes_temporal_analytics_contract: true, recommendations_are_advisory_only: true, state_mutation_prohibited: true, evidence_backed_risk_required: true, qualification_gate: "Risk Assessment Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("RISK_ASSESSMENT_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to Mission Control and temporal analytics inputs", () => {
    const first = runRiskAssessment({ seed: "deterministic" });
    const second = runRiskAssessment({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["scenario-planning/mc-2", "decision-support/mc-3", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "simulation/mc-7", "temporal-analytics/contract"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateRiskAssessment(first).valid).toBe(true);
    expect(replayRiskAssessment()).toBe(true);
  });

  it("consumes temporal analytics as the exclusive governed risk input", () => {
    const result = runRiskAssessment();

    expect(result.temporal).toMatchObject({ historical_trends: true, current_conditions: true, projected_conditions: true, immutable_inputs: true, complete_lineage: true, deterministic_inputs: true, authoritative_for_risk: true });
    expect(result.readiness.temporal_analytics_exclusive).toBe(true);
    expect(result.readiness.deterministic).toBe(true);
  });

  it("evaluates and registers governed operational risks", () => {
    const result = runRiskAssessment();

    expect(result.risk_score).toBe(68);
    expect(result.severity).toBe("HIGH");
    expect(result.trend).toBe("DETERIORATING");
    expect(result.evaluation).toMatchObject({ continuous_evaluation: true, risk_calculation: true, risk_aggregation: true, confidence_evaluation: true, severity_determination: true, exposure_assessment: true, deterministic_evaluation: true });
    expect(result.registry).toMatchObject({ risk_records: true, severity: true, probability: true, impact: true, mitigation_status: true, lineage: true, evidence: true, governed_records: true });
  });

  it("analyzes trends, forecasts, correlations, and priority", () => {
    const result = runRiskAssessment();

    expect(result.trends).toMatchObject({ trend_detection: true, acceleration_detection: true, deceleration_detection: true, historical_comparisons: true, risk_progression: true, trend_reports: true, trend_evidence: true });
    expect(result.forecast).toMatchObject({ near_term_forecasting: true, long_term_forecasting: true, expected_degradation: true, recovery_likelihood: true, risk_projection: true, forecast_reports: true, prediction_evidence: true });
    expect(result.correlation).toMatchObject({ dependency_analysis: true, cascading_failures: true, compound_risks: true, cross_mission_impacts: true, portfolio_correlations: true, correlation_graph: true, dependency_evidence: true });
    expect(result.prioritization).toMatchObject({ severity_weighting: true, probability_weighting: true, mission_criticality: true, temporal_urgency: true, portfolio_impact: true, confidence_weighting: true, prioritized_risk_list: true, governed_criteria: true });
  });

  it("keeps recommendations advisory, explainable, and non-mutating", () => {
    const result = runRiskAssessment();

    expect(result.explainability).toMatchObject({ risk_justification: true, supporting_analytics: true, evidence_references: true, historical_comparisons: true, no_opaque_scoring: true, advisory_only: true });
    expect(result.readiness.advisory_only).toBe(true);
    expect(result.readiness.no_state_mutation).toBe(true);
  });

  it("generates dashboards, heat maps, reports, evidence, and APIs", () => {
    const result = runRiskAssessment();

    expect(result.visualization).toMatchObject({ risk_dashboard: true, heat_maps: true, trend_graphs: true, severity_distribution: true, forecast_timeline: true, dashboard_evidence: true, visualization_evidence: true });
    expect(result.reports).toMatchObject({ current_risk: true, historical_trend: true, forecast: true, supporting_evidence: true, recommended_attention_areas: true, heat_maps_generated: true, portfolio_awareness: true });
    expect(result.evidence).toMatchObject({ evaluation_evidence: true, trend_evidence: true, forecast_evidence: true, correlation_evidence: true, priority_evidence: true, explainability_evidence: true, dashboard_evidence: true, visualization_evidence: true, immutable: true, traceable_to_temporal_analytics: true, complete_lineage: true });
    expect(result.apis).toMatchObject({ assessment_api: true, registry_api: true, trend_api: true, forecast_api: true, correlation_api: true, prioritization_api: true, explainability_api: true, visualization_api: true, report_api: true, stable: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runRiskAssessment({ scenario: failure });
    const validation = validateRiskAssessment(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runRiskAssessment({ scenario: failure });
    const validation = validateRiskAssessment(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runRiskAssessment({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runRiskAssessment({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runRiskAssessment({ scenario: "RISK_ASSESSMENT_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateRiskAssessment(notQualified).valid).toBe(false);
  });
});
