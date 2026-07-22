import { describe, expect, it } from "vitest";

import { getOperatorDashboardBundle, replayOperatorDashboard, runOperatorDashboard, validateOperatorDashboard } from "@/services/operator-dashboard";
import type { OperatorDashboardFailure } from "@/types/operator-dashboard";

const conditionalFailures = ["DASHBOARD_SERVICE_MISSING", "PAGE_COMPOSITION_MISSING", "LAYOUTS_MISSING", "STATE_SYNCHRONIZATION_MISSING", "WIDGET_ORCHESTRATION_MISSING", "DASHBOARD_CONFIGURATION_MISSING", "MISSION_VIEW_MISSING", "PORTFOLIO_VIEW_MISSING", "RISK_VIEW_MISSING", "REPLAY_VIEW_MISSING", "RECOMMENDATION_VIEW_MISSING", "DIGITAL_TWIN_VIEW_MISSING", "ALERT_CENTER_MISSING", "KPI_DASHBOARD_MISSING", "EVIDENCE_EXPLORER_MISSING", "SEARCH_SERVICE_MISSING", "FILTERING_MISSING", "VISUALIZATION_SERVICE_MISSING", "OPERATOR_NAVIGATION_MISSING", "DASHBOARD_API_MISSING", "QUERY_API_MISSING", "VISUALIZATION_API_MISSING", "EVIDENCE_API_MISSING", "DASHBOARD_EVIDENCE_MISSING", "DASHBOARD_AUDIT_RECORDS_MISSING"] as const satisfies readonly OperatorDashboardFailure[];
const failClosedFailures = ["MC_1_MISSION_MANAGEMENT_INVALID", "MC_4_PORTFOLIO_MANAGEMENT_INVALID", "MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", "MC_6_DIGITAL_TWIN_INVALID", "MC_7_SIMULATION_INVALID", "MC_8_RISK_ASSESSMENT_INVALID", "MC_9_RECOMMENDATION_INTELLIGENCE_INVALID", "TENANT_ISOLATION_FAILED", "DISPLAY_LINEAGE_MISSING", "DISPLAY_EVIDENCE_REFERENCE_MISSING", "DISPLAY_CONFIDENCE_MISSING", "GOVERNING_AUTHORITY_MISSING", "AUTHORIZATION_VALIDATION_MISSING", "LEAST_PRIVILEGE_MISSING", "EVIDENCE_VISIBILITY_RULES_MISSING", "CONSTITUTIONAL_ACCESS_CONTROL_MISSING", "QUERY_NON_DETERMINISTIC", "CONFIGURATION_NOT_VERSIONED", "EXECUTION_CAPABILITY_PRESENT", "ACTION_APPROVAL_CAPABILITY_PRESENT", "WORKLOAD_DISPATCH_CAPABILITY_PRESENT", "MISSION_STATE_MUTATION_CAPABILITY_PRESENT", "PORTFOLIO_STATE_MUTATION_CAPABILITY_PRESENT", "AUTOMATION_INVOCATION_CAPABILITY_PRESENT", "GOVERNANCE_BYPASS_CAPABILITY_PRESENT", "OPERATOR_APPROVAL_BYPASS_CAPABILITY_PRESENT"] as const satisfies readonly OperatorDashboardFailure[];

describe("Operator Dashboard MC-10", () => {
  it("publishes the MC-10 operator dashboard doctrine", () => {
    const bundle = getOperatorDashboardBundle();

    expect(bundle.doctrine).toMatchObject({ version: "operator-dashboard/mc-10", owns_unified_operator_workspace: true, aggregates_all_mission_control_services: true, read_only_dashboard: true, observational_only: true, advisory_only: true, execution_authority_outside_mc_10: true, evidence_lineage_required_for_every_displayed_object: true, qualification_gate: "Operator Dashboard Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("OPERATOR_DASHBOARD_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to the Mission Control operator view chain", () => {
    const first = runOperatorDashboard({ seed: "deterministic" });
    const second = runOperatorDashboard({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["mission-management/mc-1", "portfolio-management/mc-4", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "simulation/mc-7", "risk-assessment/mc-8", "mission-recommendation-intelligence/mc-9", "cci-evidence", "cci-replay", "cci-observability", "caf-evidence", "caf-runtime-status"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateOperatorDashboard(first).valid).toBe(true);
    expect(replayOperatorDashboard()).toBe(true);
  });

  it("composes the unified read-only dashboard workspace", () => {
    const result = runOperatorDashboard();

    expect(result.view_kinds).toEqual(["MISSION", "PORTFOLIO", "RISK", "REPLAY", "RECOMMENDATION", "DIGITAL_TWIN", "ALERT", "KPI", "EVIDENCE"]);
    expect(result.dashboard).toMatchObject({ page_composition: true, dashboard_layouts: true, state_synchronization: true, widget_orchestration: true, dashboard_configuration: true, tenant_isolation: true, read_only: true });
    expect(result.readiness).toMatchObject({ read_only: true, observational_only: true, advisory_only: true, no_execution_authority: true });
  });

  it("integrates mission, portfolio, risk, replay, recommendation, and digital twin views", () => {
    const result = runOperatorDashboard();

    expect(result.mission).toMatchObject({ active_missions: true, completed_missions: true, delayed_missions: true, blocked_missions: true, mission_evidence: true, mission_health: true, lifecycle_status: true });
    expect(result.portfolio).toMatchObject({ portfolio_health: true, concurrent_missions: true, resource_allocation: true, dependencies: true, completion_forecasts: true });
    expect(result.risk).toMatchObject({ operational_risk: true, portfolio_risk: true, trend_analysis: true, heat_maps: true, confidence_levels: true, consumes_mc_8: true });
    expect(result.replay).toMatchObject({ replay_sessions: true, historical_timelines: true, evidence_navigation: true, divergence_summaries: true, consumes_mc_5: true });
    expect(result.recommendations).toMatchObject({ recommendations: true, recommendation_confidence: true, supporting_evidence: true, recommendation_rationale: true, recommendation_history: true, advisory_only: true, consumes_mc_9: true });
    expect(result.digital_twin).toMatchObject({ operational_twin: true, system_topology: true, synchronization_health: true, state_visualization: true, dependency_graph: true, consumes_mc_6: true });
  });

  it("provides alerts, KPIs, evidence exploration, search, and filtering", () => {
    const result = runOperatorDashboard();

    expect(result.alerts).toMatchObject({ active_alerts: true, acknowledgements: true, priorities: true, alert_evidence: true, operational_notifications: true, observational_only: true });
    expect(result.kpis).toMatchObject({ mission_kpis: true, operational_kpis: true, portfolio_kpis: true, risk_kpis: true, availability_kpis: true, performance_kpis: true, governance_kpis: true });
    expect(result.evidence).toMatchObject({ evidence_packages: true, lineage: true, provenance: true, supporting_artifacts: true, qualification_evidence: true });
    expect(result.search).toMatchObject({ mission_search: true, replay_search: true, evidence_search: true, recommendation_search: true, portfolio_search: true, risk_search: true, deterministic_search: true });
    expect(result.filters).toMatchObject({ tenant: true, organization: true, portfolio: true, mission: true, lifecycle_state: true, recommendation_type: true, risk_level: true, timeframe: true, evidence_source: true, deterministic_filtering: true });
  });

  it("supports visualization, navigation, security, APIs, and immutable audit evidence", () => {
    const result = runOperatorDashboard();

    expect(result.visualization).toMatchObject({ timelines: true, dependency_graphs: true, heat_maps: true, trend_charts: true, evidence_trees: true, topology_graphs: true, mission_graphs: true, operational_summaries: true });
    expect(result.navigation).toMatchObject({ unified_navigation: true, contextual_drill_down: true, evidence_first_exploration: true, historical_comparisons: true, synchronized_dashboards: true, cross_service_navigation: true });
    expect(result.security).toMatchObject({ tenant_isolation: true, authorization_validation: true, least_privilege: true, evidence_visibility_rules: true, constitutional_access_controls: true });
    expect(result.apis).toMatchObject({ dashboard_api: true, query_api: true, visualization_api: true, evidence_api: true, operational_summaries: true, widget_configuration: true, lineage_retrieval: true, provenance_lookup: true, stable: true });
    expect(result.audit).toMatchObject({ dashboard_evidence: true, visualization_evidence: true, operator_activity_evidence: true, query_evidence: true, configuration_evidence: true, audit_records: true, immutable: true, complete_lineage: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runOperatorDashboard({ scenario: failure });
    const validation = validateOperatorDashboard(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runOperatorDashboard({ scenario: failure });
    const validation = validateOperatorDashboard(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runOperatorDashboard({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runOperatorDashboard({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runOperatorDashboard({ scenario: "OPERATOR_DASHBOARD_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateOperatorDashboard(notQualified).valid).toBe(false);
  });
});
