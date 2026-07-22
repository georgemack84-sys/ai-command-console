import { describe, expect, it } from "vitest";

import { getMonitoringExperienceBundle, replayMonitoringExperience, runMonitoringExperience, validateMonitoringExperience } from "@/services/monitoring-experience";
import type { MonitoringExperienceFailure } from "@/types/monitoring-experience";

const conditionalFailures = ["ALERT_ENGINE_MISSING", "ALERT_REGISTRY_MISSING", "ALERT_CATEGORIZATION_MISSING", "SEVERITY_CLASSIFICATION_MISSING", "ALERT_HISTORY_MISSING", "ALERT_EVIDENCE_MISSING", "DUPLICATE_DETECTION_MISSING", "SLA_ENGINE_MISSING", "SLA_DASHBOARD_MISSING", "SLA_COMPLIANCE_RECORDS_MISSING", "SLA_VIOLATION_DETECTION_MISSING", "SLA_EVIDENCE_MISSING", "ANALYTICS_ENGINE_MISSING", "TREND_ANALYSIS_MISSING", "OPERATIONAL_METRICS_MISSING", "BOTTLENECK_IDENTIFICATION_MISSING", "PERFORMANCE_SUMMARIES_MISSING", "HEALTH_REPORTING_MISSING", "HEALTH_EVIDENCE_MISSING", "MISSION_HEALTH_MISSING", "PORTFOLIO_HEALTH_MISSING", "RUNTIME_HEALTH_MISSING", "ALERT_CENTER_MISSING", "ALERT_FILTERS_MISSING", "EVIDENCE_NAVIGATION_MISSING", "REPLAY_LINKAGE_MISSING", "LIVE_DASHBOARD_MISSING", "DASHBOARD_VIEWS_MISSING", "DASHBOARD_EVIDENCE_MISSING", "DASHBOARD_PERFORMANCE_FAILED"] as const satisfies readonly MonitoringExperienceFailure[];
const failClosedFailures = ["MC_1_MISSION_MANAGEMENT_INVALID", "MC_4_PORTFOLIO_MANAGEMENT_INVALID", "MC_5_OPERATIONAL_EVIDENCE_INVALID", "MC_6_DIGITAL_TWIN_INVALID", "MC_8_RISK_ASSESSMENT_INVALID", "MC_13A_MONITORING_PRIMITIVES_INVALID", "MC_10_OPERATOR_DASHBOARD_INVALID", "MC_12_OPERATIONAL_INTELLIGENCE_INVALID", "MONITORING_AGGREGATOR_MISSING", "MONITORING_PRIMITIVES_NOT_CONSUMED", "SYNTHETIC_MONITORING_USED", "UNQUALIFIED_MONITORING_DATA_USED", "ADVISORY_ALERT_BEHAVIOR_MISSING", "EXECUTION_ATTEMPTED", "MISSION_MUTATION_ATTEMPTED", "RUNTIME_COMMAND_ATTEMPTED", "AUTOMATION_INVOKED", "ALERT_SELF_ACKNOWLEDGED", "GOVERNANCE_BYPASS_ATTEMPTED"] as const satisfies readonly MonitoringExperienceFailure[];

describe("Monitoring Experience MC-13B", () => {
  it("publishes the MC-13B monitoring experience doctrine", () => {
    const bundle = getMonitoringExperienceBundle();

    expect(bundle.doctrine).toMatchObject({ version: "monitoring-experience/mc-13b", capability_type: "Operational Visibility Layer", consumes_monitoring_primitives: true, advisory_alerts_only: true, observational_only: true, no_execution_authority: true, operator_approval_required: true, qualification_gate: "MC-13B Monitoring Experience Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("MONITORING_EXPERIENCE_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to MC-13A plus Mission Control inputs", () => {
    const first = runMonitoringExperience({ seed: "deterministic" });
    const second = runMonitoringExperience({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["production-monitoring-primitives/mc-13a", "mission-management/mc-1", "portfolio-management/mc-4", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "risk-assessment/mc-8"]);
    expect(first.downstream_refs).toEqual(["operator-dashboard/mc-10", "operational-intelligence/mc-12"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateMonitoringExperience(first).valid).toBe(true);
    expect(replayMonitoringExperience()).toBe(true);
  });

  it("aggregates only qualified monitoring primitives and source data", () => {
    const result = runMonitoringExperience();

    expect(result.aggregator).toMatchObject({ consumes_mc13a_primitives: true, consumes_mission_lifecycle: true, consumes_portfolio_registry: true, consumes_operational_evidence: true, consumes_digital_twin: true, consumes_risk_assessment: true, qualified_data_only: true, deterministic_aggregation: true });
    expect(runMonitoringExperience({ scenario: "SYNTHETIC_MONITORING_USED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runMonitoringExperience({ scenario: "UNQUALIFIED_MONITORING_DATA_USED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("provides advisory-only alert management", () => {
    const result = runMonitoringExperience();

    expect(result.alerts.severities).toEqual(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);
    expect(result.alerts).toMatchObject({ alert_generation: true, alert_categorization: true, severity_classification: true, alert_acknowledgement_tracking: true, escalation_recommendations: true, alert_history: true, alert_evidence: true, suppression_policies: true, duplicate_detection: true, advisory_only: true });
    expect(runMonitoringExperience({ scenario: "ALERT_SELF_ACKNOWLEDGED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("qualifies SLA monitoring and operational analytics", () => {
    const result = runMonitoringExperience();

    expect(result.sla).toMatchObject({ availability_monitoring: true, response_time_tracking: true, throughput_monitoring: true, error_rate_monitoring: true, compliance_evaluation: true, trend_analysis: true, violation_detection: true, compliance_evidence: true, dashboard: true, reports: true });
    expect(result.analytics).toMatchObject({ trend_analysis: true, capacity_utilization: true, resource_efficiency: true, mission_throughput: true, performance_summaries: true, bottleneck_identification: true, historical_comparison: true, operational_metrics: true, evidence_backed: true });
  });

  it("generates health reports from qualified monitoring data", () => {
    const result = runMonitoringExperience();

    expect(result.health).toMatchObject({ mission_health: true, runtime_health: true, infrastructure_health: true, service_health: true, portfolio_health: true, resource_health: true, health_history: true, health_evidence: true });
  });

  it("provides alert center views with evidence and replay linkage", () => {
    const result = runMonitoringExperience();

    expect(result.alert_center).toMatchObject({ active_alerts: true, alert_filters: true, severity_grouping: true, mission_grouping: true, portfolio_grouping: true, historical_alerts: true, evidence_navigation: true, replay_linkage: true, alert_search: true });
  });

  it("publishes the live operations dashboard state", () => {
    const result = runMonitoringExperience();

    expect(result.dashboard).toMatchObject({ active_missions: true, mission_health: true, runtime_health: true, resource_utilization: true, alert_summaries: true, sla_status: true, digital_twin_synchronization: true, risk_indicators: true, portfolio_status: true, service_availability: true, dashboard_performance: true });
  });

  it("produces deterministic monitoring evidence", () => {
    const result = runMonitoringExperience();

    expect(result.evidence).toMatchObject({ alert_evidence: true, sla_evidence: true, analytics_evidence: true, health_evidence: true, dashboard_evidence: true, monitoring_timeline: true, monitoring_reports: true, deterministic_replay: true, immutable: true });
  });

  it("preserves observational-only governance boundaries", () => {
    const result = runMonitoringExperience();

    expect(result.readiness).toMatchObject({ deterministic_replay: true, primitives_only: true, advisory_only_alerts: true, observational_only: true, no_execution: true, no_runtime_mutation: true, operator_authority_preserved: true, governance_preserved: true });
    expect(runMonitoringExperience({ scenario: "EXECUTION_ATTEMPTED" }).readiness.decision).toBe("FAIL_CLOSED");
    expect(runMonitoringExperience({ scenario: "RUNTIME_COMMAND_ATTEMPTED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runMonitoringExperience({ scenario: failure });
    const validation = validateMonitoringExperience(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runMonitoringExperience({ scenario: failure });
    const validation = validateMonitoringExperience(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runMonitoringExperience({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runMonitoringExperience({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runMonitoringExperience({ scenario: "MONITORING_EXPERIENCE_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateMonitoringExperience(notQualified).valid).toBe(false);
  });
});
