import { describe, expect, it } from "vitest";

import { getPortfolioManagementBundle, replayPortfolioManagement, runPortfolioManagement, validatePortfolioManagement } from "@/services/portfolio-management";
import type { PortfolioManagementFailure } from "@/types/portfolio-management";

const conditionalFailures = ["PORTFOLIO_REGISTRY_MISSING", "MISSION_PORTFOLIO_ENGINE_MISSING", "RESOURCE_PLANNER_MISSING", "PRIORITIZATION_ENGINE_MISSING", "DEPENDENCY_MANAGER_MISSING", "HEALTH_SERVICE_MISSING", "CONFLICT_DETECTION_MISSING", "ANALYTICS_MISSING", "EXECUTIVE_DASHBOARD_MISSING", "REPORTING_SERVICE_MISSING", "PORTFOLIO_EVIDENCE_MISSING", "PORTFOLIO_APIS_MISSING", "SCALE_QUALIFICATION_MISSING"] as const satisfies readonly PortfolioManagementFailure[];
const failClosedFailures = ["MC_1_MISSION_MANAGEMENT_INVALID", "MC_2_SCENARIO_PLANNING_INVALID", "MC_3_DECISION_SUPPORT_INVALID", "W1_REGISTRY_INVALID", "W1_CAF_RUNTIME_INVALID", "W2_AUTHORITY_INVALID", "W2_POLICY_INVALID", "W2_SAFETY_INVALID", "W2_EVIDENCE_INVALID", "W2_REPLAY_INVALID", "W2_CERTIFICATION_INVALID", "W2_RUNTIME_INVALID", "PORTFOLIO_HIERARCHY_MISSING", "PORTFOLIO_LIFECYCLE_INVALID", "MISSION_SYNCHRONIZATION_NON_DETERMINISTIC", "RESOURCE_CONTENTION_UNDETECTED", "CAPACITY_PLANNING_MISSING", "PRIORITY_GOVERNANCE_BYPASSED", "DYNAMIC_REPRIORITIZATION_NON_DETERMINISTIC", "DEPENDENCY_VALIDATION_FAILED", "PORTFOLIO_HEALTH_INCOMPLETE", "CROSS_MISSION_CONFLICT_UNDETECTED", "PORTFOLIO_REPORTS_NOT_REPRODUCIBLE", "PORTFOLIO_EVIDENCE_NOT_IMMUTABLE", "CONCURRENT_MISSION_LIMIT_NOT_MET", "DETERMINISTIC_REPLAY_UNDER_LOAD_FAILED", "PORTFOLIO_ACTION_GOVERNANCE_BYPASSED"] as const satisfies readonly PortfolioManagementFailure[];

describe("Portfolio Management MC-4", () => {
  it("publishes the MC-4 portfolio doctrine and 1000-mission qualification target", () => {
    const bundle = getPortfolioManagementBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "portfolio-management/mc-4",
      owns_portfolio_registry: true,
      owns_mission_portfolio_engine: true,
      owns_resource_planning: true,
      owns_prioritization: true,
      owns_dependency_management: true,
      owns_conflict_detection: true,
      owns_portfolio_analytics: true,
      owns_executive_dashboard: true,
      owns_portfolio_evidence: true,
      concurrent_mission_qualification_target: 1000,
      qualification_gate: "Portfolio Management Qualification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("PORTFOLIO_MANAGEMENT_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to MC-1 through MC-3 plus governance services", () => {
    const first = runPortfolioManagement({ seed: "deterministic" });
    const second = runPortfolioManagement({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "registry-core/w1.4a", "caf-legion-runtime/w1.8", "authority-validator/w2.5", "policy-gate/w2.6", "safety-gate/w2.7", "evidence-engine/w2.13", "replay-engine/w2.14", "certification-engine/w2.15", "runtime-orchestrator/w2.10"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePortfolioManagement(first).valid).toBe(true);
    expect(replayPortfolioManagement()).toBe(true);
  });

  it("maintains portfolio registry and mission coordination", () => {
    const result = runPortfolioManagement();

    expect(result.registry.lifecycle).toEqual(["DRAFT", "ACTIVE", "REBALANCING", "DEGRADED", "SUSPENDED", "CLOSED", "ARCHIVED"]);
    expect(result.registry).toMatchObject({ definitions: true, hierarchy: true, ownership: true, metadata: true, strategic_alignment: true, portfolio_evidence: true, authoritative_registry: true });
    expect(result.engine).toMatchObject({ mission_grouping: true, portfolio_composition: true, mission_relationships: true, mission_dependencies: true, portfolio_health: true, portfolio_synchronization: true, deterministic_state: true, simultaneous_portfolios: true });
  });

  it("plans resources, priorities, dependencies, and health constitutionally", () => {
    const result = runPortfolioManagement();

    expect(result.resources).toMatchObject({ resource_allocation: true, resource_reservation: true, capacity_planning: true, utilization_forecasting: true, bottleneck_identification: true, contention_detection: true, resource_plans: true });
    expect(result.prioritization).toMatchObject({ priority_ranking: true, mission_urgency: true, strategic_weighting: true, constitutional_constraints: true, executive_priorities: true, dynamic_reprioritization: true, governance_validated: true, deterministic_priorities: true });
    expect(result.dependencies).toMatchObject({ cross_mission_dependencies: true, blocking_relationships: true, shared_objectives: true, shared_deliverables: true, dependency_validation: true, dependency_evidence: true, dependency_graph: true });
    expect(result.health).toMatchObject({ progress: true, risk: true, schedule_variance: true, budget_utilization: true, objective_completion: true, resource_health: true, continuous_evaluation: true });
  });

  it("detects conflicts and publishes analytics, dashboard, and reports", () => {
    const result = runPortfolioManagement();

    expect(result.conflicts).toMatchObject({ resource_contention: true, objective_conflicts: true, policy_conflicts: true, authority_conflicts: true, scheduling_conflicts: true, dependency_conflicts: true, cross_mission_detection: true });
    expect(result.analytics).toMatchObject({ completion_rates: true, portfolio_velocity: true, resource_utilization: true, strategic_alignment: true, decision_latency: true, portfolio_throughput: true, portfolio_stability: true, executive_metrics: true });
    expect(result.dashboard).toMatchObject({ active_portfolios: true, active_missions: true, mission_status: true, resource_utilization: true, health_indicators: true, portfolio_kpis: true, executive_summaries: true, portfolio_explorer: true });
    expect(result.reporting).toMatchObject({ portfolio_summaries: true, executive_reports: true, mission_rollups: true, resource_reports: true, capacity_reports: true, strategic_alignment_reports: true, reproducible_reports: true, evidence_backed: true });
  });

  it("aggregates evidence, exposes APIs, and qualifies 1000 concurrent missions", () => {
    const result = runPortfolioManagement();

    expect(result.evidence).toMatchObject({ portfolio_evidence_packages: true, portfolio_lineage: true, decision_evidence: true, resource_evidence: true, performance_evidence: true, replay_references: true, certification_references: true, complete_lineage: true, immutable: true });
    expect(result.apis).toMatchObject({ portfolio_api: true, registry_api: true, resource_api: true, priority_api: true, dependency_api: true, conflict_api: true, analytics_api: true, reporting_api: true, evidence_api: true, stable: true });
    expect(result.scale.concurrent_mission_target).toBe(1000);
    expect(result.scale.concurrent_mission_capacity).toBe(1000);
    expect(result.scale).toMatchObject({ high_volume_updates: true, concurrent_portfolio_modifications: true, large_dependency_graphs: true, resource_contention_scenarios: true, deterministic_replay_under_load: true, performance_benchmarks: true, qualification_reports: true });
    expect(result.readiness.scale_ready).toBe(true);
  });

  it("requires at least 1000 concurrent missions for baseline qualification", () => {
    const result = runPortfolioManagement({ mission_count: 999 });

    expect(result.scale.concurrent_mission_capacity).toBe(0);
    expect(result.readiness.scale_ready).toBe(false);
    expect(validatePortfolioManagement(result).valid).toBe(false);
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runPortfolioManagement({ scenario: failure });
    const validation = validatePortfolioManagement(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runPortfolioManagement({ scenario: failure });
    const validation = validatePortfolioManagement(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runPortfolioManagement({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runPortfolioManagement({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runPortfolioManagement({ scenario: "PORTFOLIO_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validatePortfolioManagement(notQualified).valid).toBe(false);
  });
});
