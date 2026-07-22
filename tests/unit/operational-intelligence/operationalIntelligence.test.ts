import { describe, expect, it } from "vitest";

import { getOperationalIntelligenceBundle, replayOperationalIntelligence, runOperationalIntelligence, validateOperationalIntelligence } from "@/services/operational-intelligence";
import type { OperationalIntelligenceFailure } from "@/types/operational-intelligence";

const conditionalFailures = ["STRATEGIC_INTELLIGENCE_ENGINE_MISSING", "TREND_ANALYSIS_MISSING", "STRATEGIC_ASSESSMENT_MISSING", "OPERATIONAL_PATTERN_DETECTION_MISSING", "LONG_TERM_PERFORMANCE_ANALYSIS_MISSING", "ORGANIZATIONAL_HEALTH_ANALYSIS_MISSING", "MISSION_SUCCESS_ANALYSIS_MISSING", "INSIGHT_ENGINE_MISSING", "EMERGING_ISSUES_MISSING", "SUCCESS_PATTERNS_MISSING", "DEGRADATION_INDICATORS_MISSING", "BOTTLENECK_OBSERVATIONS_MISSING", "GOVERNANCE_OBSERVATIONS_MISSING", "EXECUTIVE_INTELLIGENCE_MISSING", "TREND_ENGINE_MISSING", "FORECAST_ENGINE_MISSING", "ORGANIZATIONAL_INTELLIGENCE_MISSING", "CAPABILITY_INTELLIGENCE_MISSING", "RISK_INTELLIGENCE_MISSING", "INTELLIGENCE_REGISTRY_MISSING", "INTELLIGENCE_REPORTS_MISSING", "EXECUTIVE_BRIEFINGS_MISSING", "INTELLIGENCE_EVIDENCE_MISSING", "OPERATIONAL_INTELLIGENCE_APIS_MISSING"] as const satisfies readonly OperationalIntelligenceFailure[];
const failClosedFailures = ["MC_1_MISSION_MANAGEMENT_INVALID", "MC_2_SCENARIO_PLANNING_INVALID", "MC_3_DECISION_SUPPORT_INVALID", "MC_4_PORTFOLIO_MANAGEMENT_INVALID", "MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", "MC_6_DIGITAL_TWIN_INVALID", "MC_8_RISK_ASSESSMENT_INVALID", "MC_9_RECOMMENDATION_INTELLIGENCE_INVALID", "MC_10_OPERATOR_DASHBOARD_INVALID", "MC_11_INSTITUTIONAL_MEMORY_INVALID", "TEMPORAL_ANALYTICS_CONTRACT_MISSING", "TEMPORAL_ANALYTICS_NON_COMPLIANT", "EXECUTIVE_REPORTS_INCONSISTENT", "TREND_DETECTION_INACCURATE", "FORECASTS_NOT_REPRODUCIBLE", "FORECASTS_NOT_ADVISORY", "PORTFOLIO_INTELLIGENCE_INVALID", "MISSION_INTELLIGENCE_INVALID", "INTELLIGENCE_WITHOUT_EVIDENCE", "EVIDENCE_TRACEABILITY_INCOMPLETE", "REPLAY_TRACEABILITY_MISSING", "INSTITUTIONAL_MEMORY_INTEGRATION_MISSING", "DETERMINISTIC_GENERATION_FAILED", "OPERATION_EXECUTION_ATTEMPTED", "MISSION_APPROVAL_ATTEMPTED", "OPERATIONAL_STATE_MUTATION_ATTEMPTED", "MISSION_DATA_MUTATION_ATTEMPTED", "GOVERNANCE_OVERRIDE_ATTEMPTED", "AUTHORITY_VALIDATION_BYPASSED", "POLICY_EVALUATION_BYPASSED", "SAFETY_VALIDATION_BYPASSED"] as const satisfies readonly OperationalIntelligenceFailure[];

describe("Operational Intelligence MC-12", () => {
  it("publishes the MC-12 operational intelligence doctrine", () => {
    const bundle = getOperationalIntelligenceBundle();

    expect(bundle.doctrine).toMatchObject({ version: "operational-intelligence/mc-12", owns_strategic_intelligence_engine: true, owns_operational_insight_engine: true, owns_executive_intelligence_service: true, owns_trend_forecast_and_organizational_intelligence: true, consumes_temporal_analytics_contract: true, evidence_backed_executive_insight_required: true, advisory_only: true, no_operational_execution: true, qualification_gate: "Operational Intelligence Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("OPERATIONAL_INTELLIGENCE_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to the MC strategic intelligence chain", () => {
    const first = runOperationalIntelligence({ seed: "deterministic" });
    const second = runOperationalIntelligence({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "portfolio-management/mc-4", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "risk-assessment/mc-8", "mission-recommendation-intelligence/mc-9", "operator-dashboard/mc-10", "institutional-memory/mc-11", "temporal-analytics/contract"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateOperationalIntelligence(first).valid).toBe(true);
    expect(replayOperationalIntelligence()).toBe(true);
  });

  it("consumes temporal analytics and generates strategic intelligence deterministically", () => {
    const result = runOperationalIntelligence();

    expect(result.temporal).toMatchObject({ historical_evidence: true, operational_metrics: true, trend_inputs: true, portfolio_history: true, deterministic_inputs: true, evidence_backed: true });
    expect(result.strategic).toMatchObject({ trend_analysis: true, strategic_assessment: true, operational_pattern_detection: true, long_term_performance_analysis: true, organizational_health_analysis: true, mission_success_analysis: true, deterministic_generation: true });
  });

  it("produces operational insights and executive intelligence", () => {
    const result = runOperationalIntelligence();

    expect(result.insights).toMatchObject({ emerging_issues: true, recurring_success_patterns: true, degradation_indicators: true, operational_bottlenecks: true, governance_observations: true, evidence_backed_observations: true });
    expect(result.executive).toMatchObject({ executive_dashboards: true, executive_summaries: true, organizational_health_reports: true, strategic_status_reports: true, executive_briefings: true, consistent_reports: true });
  });

  it("qualifies trends, forecasts, and organizational intelligence", () => {
    const result = runOperationalIntelligence();

    expect(result.trends).toMatchObject({ mission_trends: true, portfolio_trends: true, resource_trends: true, capability_trends: true, operational_trends: true, governance_trends: true, accurate_detection: true });
    expect(result.forecast).toMatchObject({ temporal_analytics: true, historical_evidence: true, institutional_memory: true, portfolio_history: true, evidence_backed_projections: true, advisory_forecasts: true, reproducible_forecasts: true });
    expect(result.organization).toMatchObject({ organizational_maturity: true, operational_readiness: true, execution_efficiency: true, governance_effectiveness: true, policy_compliance: true, operational_stability: true });
  });

  it("publishes categorized reports, evidence, and APIs", () => {
    const result = runOperationalIntelligence();

    expect(result.registry.categories).toEqual(["MISSION", "PORTFOLIO", "ORGANIZATIONAL", "CAPABILITY", "RISK", "EXECUTIVE"]);
    expect(result.registry).toMatchObject({ intelligence_reports: true, operational_insights: true, executive_intelligence: true, trend_reports: true, strategic_forecasts: true, executive_briefings: true, governed_registry: true });
    expect(result.reports).toMatchObject({ mission_intelligence: true, portfolio_intelligence: true, organizational_intelligence: true, capability_intelligence: true, risk_intelligence: true, executive_intelligence: true, strategic_trend_reports: true, qualification_report: true });
    expect(result.evidence).toMatchObject({ originating_evidence: true, supporting_reports: true, temporal_references: true, confidence_indicators: true, traceability: true, provenance: true, replay_references: true, institutional_memory_references: true, immutable: true });
    expect(result.apis).toMatchObject({ strategic_api: true, insight_api: true, executive_api: true, trend_api: true, forecast_api: true, organizational_api: true, registry_api: true, report_api: true, evidence_api: true, stable: true });
  });

  it("preserves advisory-only governance boundaries", () => {
    const result = runOperationalIntelligence();

    expect(result.readiness).toMatchObject({ deterministic: true, advisory_only: true, no_execution: true, no_state_mutation: true, governance_preserved: true, temporal_analytics_compliant: true, replay_traceable: true, institutional_memory_integrated: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runOperationalIntelligence({ scenario: failure });
    const validation = validateOperationalIntelligence(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runOperationalIntelligence({ scenario: failure });
    const validation = validateOperationalIntelligence(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runOperationalIntelligence({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runOperationalIntelligence({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runOperationalIntelligence({ scenario: "OPERATIONAL_INTELLIGENCE_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateOperationalIntelligence(notQualified).valid).toBe(false);
  });
});
