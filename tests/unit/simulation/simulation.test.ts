import { describe, expect, it } from "vitest";

import { getSimulationBundle, replaySimulation, runSimulation, validateSimulation } from "@/services/simulation";
import type { SimulationFailure } from "@/types/simulation";

const conditionalFailures = ["SIMULATION_ENGINE_MISSING", "STATE_PROJECTION_MISSING", "EVENT_PROJECTION_MISSING", "TIMELINE_SIMULATION_MISSING", "DEPENDENCY_EVALUATION_MISSING", "STATE_EVOLUTION_MISSING", "SCHEDULING_MISSING", "MISSION_SIMULATION_MISSING", "OPERATIONAL_FORECASTING_MISSING", "DECISION_IMPACT_SIMULATION_MISSING", "RESOURCE_SIMULATION_MISSING", "RISK_SIMULATION_MISSING", "SCENARIO_EXECUTION_MISSING", "PREDICTIVE_ANALYTICS_MISSING", "SIMULATION_EVIDENCE_MISSING", "SIMULATION_REPORTS_MISSING", "SIMULATION_APIS_MISSING"] as const satisfies readonly SimulationFailure[];
const failClosedFailures = ["MC_1_MISSION_MANAGEMENT_INVALID", "MC_2_SCENARIO_PLANNING_INVALID", "MC_3_DECISION_SUPPORT_INVALID", "MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", "MC_6_DIGITAL_TWIN_INVALID", "DIGITAL_TWIN_NOT_AUTHORITATIVE_MODEL", "SIMULATION_MUTATES_LIVE_MISSION", "SIMULATION_NON_DETERMINISTIC", "MISSION_EXECUTION_NOT_SIMULATED", "OBJECTIVE_PROGRESSION_MISSING", "RESOURCE_CONSUMPTION_MISSING", "MILESTONE_PROJECTION_MISSING", "COMPLETION_PREDICTION_MISSING", "FORECASTS_NOT_EXPLAINABLE", "BOTTLENECK_PREDICTION_MISSING", "ALTERNATIVE_FUTURES_MISSING", "TRADEOFF_EVIDENCE_MISSING", "RESOURCE_FORECASTS_MISSING", "RESOURCE_CONSTRAINTS_MISSING", "CASCADING_RISK_MISSING", "RECOVERY_EVALUATION_MISSING", "SCENARIOS_NOT_DETERMINISTIC", "PREDICTIONS_LACK_CONFIDENCE", "PREDICTIONS_LACK_JUSTIFICATION", "SIMULATION_EVIDENCE_MUTABLE", "EVIDENCE_LINEAGE_INCOMPLETE", "REPLAY_VALIDATION_FAILED"] as const satisfies readonly SimulationFailure[];

describe("Simulation MC-7", () => {
  it("publishes the MC-7 simulation doctrine", () => {
    const bundle = getSimulationBundle();

    expect(bundle.doctrine).toMatchObject({ version: "simulation/mc-7", owns_deterministic_simulation_engine: true, owns_mission_simulation: true, owns_operational_forecasting: true, owns_decision_impact_simulation: true, owns_resource_and_risk_simulation: true, consumes_digital_twin_as_authoritative_model: true, live_mission_mutation_prohibited: true, evidence_backed_predictions_required: true, qualification_gate: "Simulation Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("SIMULATION_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to Mission Control upstreams", () => {
    const first = runSimulation({ seed: "deterministic", scenario_kind: "CONSERVATIVE" });
    const second = runSimulation({ seed: "deterministic", scenario_kind: "CONSERVATIVE" });

    expect(first.upstream_refs).toEqual(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "operational-evidence-replay/mc-5", "digital-twin/mc-6"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSimulation(first).valid).toBe(true);
    expect(replaySimulation()).toBe(true);
  });

  it("runs deterministic simulations from the Digital Twin without mutating live missions", () => {
    const result = runSimulation();

    expect(result.engine).toMatchObject({ runtime: true, deterministic_state_projection: true, event_projection: true, timeline_simulation: true, dependency_evaluation: true, state_evolution: true, simulation_scheduling: true, digital_twin_authoritative_model: true, no_live_mission_mutation: true, deterministic_execution: true });
    expect(result.readiness.twin_authoritative).toBe(true);
    expect(result.readiness.no_live_mutation).toBe(true);
    expect(result.readiness.deterministic).toBe(true);
  });

  it("simulates mission execution and operational forecasts", () => {
    const result = runSimulation();

    expect(result.mission).toMatchObject({ mission_execution: true, objective_progression: true, dependency_resolution: true, resource_consumption: true, timeline_advancement: true, milestone_projection: true, completion_prediction: true });
    expect(result.forecasting).toMatchObject({ progress_prediction: true, delay_prediction: true, risk_forecasting: true, capacity_forecasting: true, bottleneck_prediction: true, workload_projection: true, deadline_estimation: true, explainable_forecasts: true });
  });

  it("supports decision impact, resource, and risk simulations", () => {
    const result = runSimulation();

    expect(result.impact).toMatchObject({ decision_branching: true, alternative_futures: true, comparative_outcomes: true, decision_sensitivity: true, tradeoff_evaluation: true, recommendation_simulation: true, evidence_backed_comparisons: true });
    expect(result.resources).toMatchObject({ personnel_allocation: true, compute_consumption: true, budget_projection: true, capacity_planning: true, resource_contention: true, constraint_evaluation: true, utilization_forecasts: true });
    expect(result.risk).toMatchObject({ failure_simulation: true, dependency_failure: true, cascading_effects: true, schedule_risk: true, resource_risk: true, mission_risk: true, recovery_evaluation: true });
  });

  it("executes all scenario classes deterministically", () => {
    const result = runSimulation({ scenario_kind: "WORST_CASE" });

    expect(result.scenario_kind).toBe("WORST_CASE");
    expect(result.scenarios.templates).toEqual(["BASELINE", "OPTIMISTIC", "CONSERVATIVE", "WORST_CASE", "BEST_CASE", "CUSTOM"]);
    expect(result.scenarios).toMatchObject({ scenario_registry: true, versioning: true, comparison: true, replay: true, deterministic_execution: true });
  });

  it("produces explainable predictions with confidence metrics", () => {
    const result = runSimulation();

    expect(result.analytics).toMatchObject({ success_probability: 0.87, completion_estimate_hours: 72, expected_delay_hours: 4, risk_trend: "MODERATE", resource_forecasts: true, performance_forecasts: true, confidence: 0.91 });
    expect(result.analytics.justification).toContain("MC-6 twin graph");
  });

  it("generates immutable evidence, reports, and APIs for simulation outputs", () => {
    const result = runSimulation();

    expect(result.evidence).toMatchObject({ inputs: true, digital_twin_version: "digital-twin/mc-6", lifecycle_version: "mission-management/mc-1", monitoring_snapshot: true, simulation_parameters: true, simulation_timeline: true, state_transitions: true, prediction_evidence: true, confidence_metrics: true, operator_decisions: true, immutable: true, complete_lineage: true });
    expect(result.reports).toMatchObject({ simulation_reports: true, predicted_outcomes: true, evidence_packages: true, evidence_lineage: true, simulation_ledger: true, verification_records: true, replay_validated: true, constitutionally_governed: true });
    expect(result.apis).toMatchObject({ simulation_request_api: true, scenario_execution_api: true, forecast_api: true, impact_analysis_api: true, evidence_api: true, report_api: true, stable: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runSimulation({ scenario: failure });
    const validation = validateSimulation(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runSimulation({ scenario: failure });
    const validation = validateSimulation(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runSimulation({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runSimulation({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runSimulation({ scenario: "SIMULATION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateSimulation(notQualified).valid).toBe(false);
  });
});
