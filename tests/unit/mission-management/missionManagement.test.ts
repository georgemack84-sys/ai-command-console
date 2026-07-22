import { describe, expect, it } from "vitest";

import { getMissionManagementBundle, replayMissionManagement, runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import type { MissionLifecycleState, MissionManagementFailure, MissionProjectionPhase } from "@/types/mission-management";

const lifecycleStates: readonly MissionLifecycleState[] = ["DRAFT", "REGISTERED", "DEFINED", "VALIDATING", "APPROVED", "SCHEDULED", "READY", "ACTIVE", "PAUSED", "BLOCKED", "DEGRADED", "RECOVERING", "COMPLETING", "COMPLETED", "CANCELLED", "RETIRED"];
const projectionPhases: readonly MissionProjectionPhase[] = ["Definition", "Validation", "Planning", "Readiness", "Execution", "Intervention", "Completion", "Closure"];
const conditionalFailures = ["MISSION_REGISTRY_MISSING", "MISSION_LIFECYCLE_MISSING", "MISSION_TEMPLATES_MISSING", "MISSION_OBJECTIVES_MISSING", "MISSION_ASSIGNMENT_MISSING", "MISSION_DEPENDENCIES_MISSING", "MISSION_TIMELINE_MISSING", "MISSION_EVIDENCE_MISSING", "MISSION_RULES_MISSING", "MISSION_LINEAGE_MISSING", "MISSION_PROJECTION_MISSING", "MISSION_APIS_MISSING", "MISSION_OBSERVABILITY_MISSING"] as const satisfies readonly MissionManagementFailure[];
const failClosedFailures = ["W1_IDENTITY_INVALID", "W1_REGISTRY_INVALID", "W1_CONFIGURATION_INVALID", "W1_SECURITY_INVALID", "W1_OBSERVABILITY_INVALID", "W1_CAF_RUNTIME_INVALID", "W2_LIFECYCLE_INVALID", "W2_AUTHORITY_INVALID", "W2_POLICY_INVALID", "W2_SAFETY_INVALID", "W2_PLANNING_INVALID", "W2_MEMORY_INVALID", "W2_RUNTIME_INVALID", "W2_EVIDENCE_INVALID", "W2_REPLAY_INVALID", "W2_CERTIFICATION_INVALID", "W2_OPERATOR_CONSOLE_INVALID", "MISSION_REGISTRY_TENANT_ISOLATION_FAILED", "MISSION_IDENTIFIERS_MUTABLE", "MISSION_LIFECYCLE_STATE_COUNT_INVALID", "MISSION_LIFECYCLE_ALTERNATE_TERMINOLOGY", "MISSION_TRANSITION_NON_DETERMINISTIC", "MISSION_TRANSITION_GOVERNANCE_BYPASSED", "MISSION_TEMPLATE_GOVERNANCE_MISSING", "MISSION_OBJECTIVE_EVIDENCE_MISSING", "MISSION_ASSIGNMENT_QUALIFICATION_BYPASSED", "MISSION_DEPENDENCY_CYCLE_UNDETECTED", "MISSION_TIMELINE_REPLAY_INVALID", "MISSION_EVIDENCE_NOT_IMMUTABLE", "MISSION_RULES_BYPASSED", "MISSION_LINEAGE_MUTABLE", "MISSION_PROJECTION_PHASE_COUNT_INVALID", "MISSION_QUERY_NON_DETERMINISTIC"] as const satisfies readonly MissionManagementFailure[];

describe("Mission Management MC-1", () => {
  it("publishes the canonical mission management doctrine", () => {
    const bundle = getMissionManagementBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "mission-management/mc-1",
      owns_canonical_mission_model: true,
      owns_mission_registry: true,
      owns_mission_lifecycle: true,
      owns_mission_templates: true,
      owns_mission_objectives: true,
      owns_mission_assignment: true,
      owns_mission_dependencies: true,
      owns_mission_timeline: true,
      owns_mission_evidence_integration: true,
      no_additional_lifecycle_states: true,
      no_alternate_lifecycle_models: true,
      qualification_gate: "Mission Management Qualification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("MISSION_MANAGEMENT_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic mission management to qualified W1 and W2 dependencies", () => {
    const first = runMissionManagement({ seed: "deterministic" });
    const second = runMissionManagement({ seed: "deterministic" });

    expect(first.upstream_refs).toHaveLength(17);
    expect(first.upstream_refs[0]).toBe("identity-core/w1.1a");
    expect(first.upstream_refs.at(-1)).toBe("operator-console/w2.16");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateMissionManagement(first).valid).toBe(true);
    expect(replayMissionManagement()).toBe(true);
  });

  it("enforces the exact 16-state lifecycle and 8-phase projection", () => {
    const result = runMissionManagement();

    expect(result.lifecycle.states).toEqual(lifecycleStates);
    expect(result.lifecycle.states).toHaveLength(16);
    expect(new Set(result.lifecycle.states).size).toBe(16);
    expect(result.lifecycle.deterministic_transitions).toBe(true);
    expect(result.lifecycle.fail_closed_validation).toBe(true);
    expect(result.lifecycle.immutable_transition_history).toBe(true);
    expect(result.projection.phases).toEqual(projectionPhases);
    expect(result.projection.phases).toHaveLength(8);
    expect(result.projection.derived_from_lifecycle_only).toBe(true);
    expect(result.projection.lifecycle_authoritative).toBe(true);
    expect(result.projection.no_alternate_model).toBe(true);
  });

  it("publishes registry, lineage, templates, and objective management", () => {
    const result = runMissionManagement();

    expect(result.registry).toMatchObject({ mission_registration: true, mission_discovery: true, mission_lookup: true, mission_ownership: true, version_history: true, metadata: true, tenant_isolation: true, namespace_support: true, immutable_identifiers: true, mission_catalog: true, registry_queries: true });
    expect(result.lineage.statuses).toEqual(["ROOT", "DERIVED", "BRANCHED", "SUPERSEDED", "RETIRED", "HISTORICAL"]);
    expect(result.lineage).toMatchObject({ ancestry: true, derivation: true, branching: true, supersession: true, retirement: true, historical_lineage: true, immutable_lineage: true, no_alternate_lineage: true });
    expect(result.templates).toMatchObject({ standard_definitions: true, parameterized_templates: true, template_inheritance: true, version_management: true, template_approval: true, template_governance: true, template_library: true, template_validator: true });
    expect(result.objectives).toMatchObject({ objective_definition: true, objective_hierarchy: true, success_criteria: true, completion_criteria: true, priority: true, objective_dependencies: true, objective_evidence: true, objective_graph: true, objective_validation: true });
  });

  it("supports assignments, dependencies, and timelines with governance validation", () => {
    const result = runMissionManagement();

    expect(result.assignment).toMatchObject({ operators: true, teams: true, caf_agents: true, capabilities: true, resources: true, organizations: true, authority_validation: true, policy_validation: true, availability_validation: true, qualification_validation: true, assignment_records: true, assignment_history: true });
    expect(result.dependencies).toMatchObject({ predecessor_missions: true, successor_missions: true, blocking_missions: true, prerequisite_validation: true, dependency_graph: true, cycle_detection: true, dependency_evidence: true, dependency_reports: true });
    expect(result.timeline).toMatchObject({ scheduling: true, milestones: true, checkpoints: true, projected_timeline: true, historical_timeline: true, timeline_replay: true, execution_history: true, timeline_graph: true, timeline_records: true });
  });

  it("generates immutable evidence, mission rules, APIs, and observability", () => {
    const result = runMissionManagement();

    expect(result.evidence).toMatchObject({ lifecycle_events: true, approvals: true, assignments: true, objective_completion: true, dependency_validation: true, constitutional_decisions: true, operator_actions: true, replay_references: true, immutable_event_evidence: true, evidence_packages: true });
    expect(result.rules).toMatchObject({ lifecycle_validation: true, transition_legality: true, authority_validation: true, policy_validation: true, safety_validation: true, operator_supremacy: true, tenant_isolation: true, governance_compliance: true, bypass_prevention: true });
    expect(result.apis).toMatchObject({ mission_api: true, registry_api: true, timeline_api: true, assignment_api: true, objective_api: true, template_api: true, dependency_api: true, lifecycle_api: true, query_api: true, deterministic_queries: true, stable: true });
    expect(result.observability).toMatchObject({ lifecycle_metrics: true, assignment_metrics: true, objective_metrics: true, dependency_metrics: true, timeline_metrics: true, transition_latency: true, constitutional_violations: true, audit_metrics: true, health_metrics: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runMissionManagement({ scenario: failure });
    const validation = validateMissionManagement(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runMissionManagement({ scenario: failure });
    const validation = validateMissionManagement(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runMissionManagement({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runMissionManagement({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runMissionManagement({ scenario: "MISSION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateMissionManagement(notQualified).valid).toBe(false);
  });
});
