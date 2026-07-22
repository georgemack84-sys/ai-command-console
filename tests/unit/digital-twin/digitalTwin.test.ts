import { describe, expect, it } from "vitest";

import { getDigitalTwinBundle, replayDigitalTwin, runDigitalTwin, validateDigitalTwin } from "@/services/digital-twin";
import type { DigitalTwinFailure } from "@/types/digital-twin";

const conditionalFailures = ["DIGITAL_TWIN_ENGINE_MISSING", "PROJECTION_ENGINE_MISSING", "SYNCHRONIZATION_ENGINE_MISSING", "TWIN_STATE_GRAPH_MISSING", "SNAPSHOT_MANAGER_MISSING", "TWIN_QUERY_SERVICE_MISSING", "HISTORICAL_RECONSTRUCTION_MISSING", "DIVERGENCE_DETECTION_MISSING", "VISUALIZATION_MODEL_MISSING", "TWIN_EVIDENCE_MISSING", "SYNCHRONIZATION_REPORTS_MISSING", "DIGITAL_TWIN_APIS_MISSING"] as const satisfies readonly DigitalTwinFailure[];
const failClosedFailures = ["MC_1_MISSION_MANAGEMENT_INVALID", "MC_2_SCENARIO_PLANNING_INVALID", "MC_3_DECISION_SUPPORT_INVALID", "MC_4_PORTFOLIO_MANAGEMENT_INVALID", "MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", "CCI_EVENT_HISTORY_NOT_AUTHORITATIVE", "TWIN_DIRECT_MUTATION_ALLOWED", "TWIN_INDEPENDENT_SOURCE_OF_TRUTH", "TWIN_STATE_NOT_REPLAYABLE", "TWIN_TRANSITION_EVIDENCE_MISSING", "PROJECTION_NON_DETERMINISTIC", "TWIN_REPLACES_AUTHORITATIVE_RECORDS", "SYNCHRONIZATION_NON_DETERMINISTIC", "REPLAY_TWIN_EQUIVALENCE_FAILED", "TWIN_GRAPH_LINEAGE_INCOMPLETE", "SNAPSHOTS_AUTHORITATIVE", "SNAPSHOT_NOT_REPRODUCIBLE", "TWIN_QUERY_NOT_EVIDENCE_BACKED", "HISTORICAL_RECONSTRUCTION_FAILED", "DIVERGENCE_EVIDENCE_MISSING", "VISUALIZATION_MUTATES_TWIN", "SYNCHRONIZATION_REPORTS_NOT_EVIDENCE_BACKED", "DETERMINISTIC_REPLAY_VALIDATION_FAILED", "OPERATIONAL_EVIDENCE_QUALIFICATION_FAILED"] as const satisfies readonly DigitalTwinFailure[];

describe("Digital Twin MC-6", () => {
  it("publishes the MC-6 digital twin doctrine", () => {
    const bundle = getDigitalTwinBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "digital-twin/mc-6",
      owns_digital_twin_engine: true,
      owns_projection_engine: true,
      owns_state_synchronization: true,
      owns_twin_state_graph: true,
      owns_snapshot_manager: true,
      owns_historical_reconstruction: true,
      derives_exclusively_from_cci_event_history: true,
      twin_is_not_source_of_truth: true,
      direct_mutation_prohibited: true,
      qualification_gate: "Digital Twin Qualification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("DIGITAL_TWIN_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to MC-1 through MC-5", () => {
    const first = runDigitalTwin({ seed: "deterministic" });
    const second = runDigitalTwin({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "portfolio-management/mc-4", "operational-evidence-replay/mc-5"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateDigitalTwin(first).valid).toBe(true);
    expect(replayDigitalTwin()).toBe(true);
  });

  it("constructs event-derived twin state without becoming a source of truth", () => {
    const result = runDigitalTwin();

    expect(result.engine).toMatchObject({ event_ingestion: true, event_ordering: true, state_projection: true, aggregate_reconstruction: true, graph_maintenance: true, historical_reconstruction: true, snapshot_generation: true, derived_exclusively_from_cci_event_history: true, no_direct_mutation: true, not_source_of_truth: true, every_state_replayable: true, complete_lineage: true });
    expect(result.projection).toMatchObject({ current_state: true, historical_state: true, point_in_time_reconstruction: true, incremental_updates: true, mission_projections: true, deterministic_projection: true, projections_do_not_replace_authoritative_records: true });
    expect(result.readiness.cci_event_history_exclusive).toBe(true);
    expect(result.readiness.no_direct_mutation).toBe(true);
  });

  it("synchronizes replay, twin state, and event history", () => {
    const result = runDigitalTwin();

    expect(result.synchronization).toMatchObject({ event_history_alignment: true, operational_twin_alignment: true, replay_reconstruction_alignment: true, synchronization_validation: true, divergence_detection: true, recovery: true, reconciliation_reports: true, deterministic_synchronization: true, replay_twin_equivalence: true });
    expect(result.reports).toMatchObject({ status: "SYNCHRONIZED", replay_position: "cci-event-history:position:1000", twin_position: "twin:position:1000", divergence_summary: true, validation_evidence: true, replay_comparison: true, reconciliation_evidence: true, evidence_backed: true });
    expect(result.readiness.replay_equivalent).toBe(true);
  });

  it("maintains the full twin state graph and snapshot constraints", () => {
    const result = runDigitalTwin();

    expect(result.graph.node_kinds).toEqual(["MISSION", "PORTFOLIO", "OBJECTIVE", "DECISION", "RESOURCE", "EVIDENCE", "OPERATOR", "DEPENDENCY"]);
    expect(result.graph.edge_kinds).toEqual(["OWNERSHIP", "DEPENDENCY", "EXECUTION", "LINEAGE", "EVIDENCE", "ASSIGNMENT", "AUTHORITY"]);
    expect(result.graph).toMatchObject({ dependency_traversal: true, impact_analysis: true, relationship_discovery: true, lineage_exploration: true, evidence_relationships: true, complete_graph_lineage: true });
    expect(result.snapshots).toMatchObject({ checkpoint_creation: true, historical_comparison: true, rollback_visualization: true, replay_optimization: true, snapshots_are_optimization_only: true, replay_remains_authoritative: true, reproducible_from_event_history: true });
  });

  it("supports evidence-backed queries, history, divergence, visualization, and APIs", () => {
    const result = runDigitalTwin();

    expect(result.query).toMatchObject({ current_state_queries: true, historical_state_queries: true, mission_evolution: true, decision_evolution: true, portfolio_evolution: true, evidence_relationships: true, dependency_graphs: true, graph_queries: true, timeline_queries: true, evidence_queries: true, replay_alignment: true, evidence_backed_results: true });
    expect(result.historical).toMatchObject({ point_in_time_reconstruction: true, mission_history: true, decision_history: true, portfolio_history: true, resource_history: true, uses_only_cci_event_history: true, reconstructs_every_mission: true });
    expect(result.divergence).toMatchObject({ continuous_validation: true, replay_derived_state_comparison: true, current_twin_state_comparison: true, divergence_reports: true, reconciliation_evidence: true, recovery_recommendations: true, operational_evidence_generated: true });
    expect(result.visualization).toMatchObject({ dashboards: true, replay_viewer: true, mission_explorer: true, portfolio_explorer: true, evidence_explorer: true, normalized_operational_model: true, consumes_twin_state: true, never_modifies_twin_state: true });
    expect(result.apis).toMatchObject({ projection_api: true, query_api: true, synchronization_api: true, snapshot_api: true, historical_reconstruction_api: true, graph_relationships: true, replay_comparison: true, snapshot_comparison: true, stable: true });
  });

  it("generates immutable operational evidence for twin transitions", () => {
    const result = runDigitalTwin();

    expect(result.evidence).toMatchObject({ synchronization_evidence: true, transition_evidence: true, lineage_evidence: true, divergence_evidence: true, replay_validation_evidence: true, immutable_evidence_references: true, operational_evidence_qualification: true });
    expect(result.readiness.evidence_ready).toBe(true);
    expect(result.readiness.reports_ready).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runDigitalTwin({ scenario: failure });
    const validation = validateDigitalTwin(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runDigitalTwin({ scenario: failure });
    const validation = validateDigitalTwin(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runDigitalTwin({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runDigitalTwin({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runDigitalTwin({ scenario: "DIGITAL_TWIN_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateDigitalTwin(notQualified).valid).toBe(false);
  });
});
