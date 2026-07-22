import { describe, expect, it } from "vitest";

import {
  getPlanningEngineBundle,
  replayPlanningEngine,
  runPlanningEngine,
  validatePlanningEngine,
} from "@/services/planning-engine";
import type { PlanningEngineFailure } from "@/types/planning-engine";

const conditionalFailures = [
  "GOAL_DECOMPOSITION_ENGINE_MISSING",
  "PLANNING_GRAPH_ENGINE_MISSING",
  "PLAN_GENERATION_ENGINE_MISSING",
  "OPTIMIZATION_INCOMPLETE",
  "CONSTRAINT_RESOLUTION_ENGINE_MISSING",
  "PLAN_REVIEW_FRAMEWORK_MISSING",
  "REVIEW_EVIDENCE_MISSING",
  "APPROVAL_POINT_ENGINE_MISSING",
  "APPROVAL_EVIDENCE_MISSING",
  "PLAN_VALIDATION_ENGINE_MISSING",
  "PLAN_REGISTRY_MISSING",
  "REASONING_RUNTIME_CONTRACT_MISSING",
  "PLANNING_EVIDENCE_MISSING",
] as const satisfies readonly PlanningEngineFailure[];

const failClosedFailures = [
  "W2_0_CAF_CONSTITUTION_INVALID",
  "W2_1_AGENT_REGISTRY_INVALID",
  "W2_2_LIFECYCLE_ENGINE_INVALID",
  "W2_3_CAPABILITY_REGISTRY_INVALID",
  "W2_4_SKILL_REGISTRY_INVALID",
  "W2_5_AUTHORITY_VALIDATOR_INVALID",
  "W2_6_POLICY_GATE_INVALID",
  "W2_7_SAFETY_GATE_INVALID",
  "GOAL_DECOMPOSITION_NON_DETERMINISTIC",
  "GOAL_LINEAGE_MISSING",
  "GOAL_DEPENDENCIES_INVALID",
  "PLANNING_GRAPH_CYCLE_ALLOWED",
  "DEPENDENCY_ORDERING_INVALID",
  "PLAN_GENERATION_NON_DETERMINISTIC",
  "NO_EXECUTABLE_PLAN_PRODUCED",
  "CONSTITUTIONAL_CONSTRAINT_VIOLATION_ALLOWED",
  "UNRESOLVED_CONFLICT_NOT_REPORTED",
  "PLAN_EXPLANATION_MISSING",
  "APPROVAL_WORKFLOW_NON_DETERMINISTIC",
  "APPROVAL_BEFORE_EXECUTION_MISSING",
  "INVALID_PLAN_ACCEPTED",
  "READINESS_DECISION_NON_DETERMINISTIC",
  "PLAN_HISTORY_MUTABLE",
  "PLAN_LINEAGE_INCOMPLETE",
  "REASONING_RUNTIME_CONTRACT_UNVERSIONED",
  "REASONING_RUNTIME_CONTRACT_NOT_REPLAY_COMPATIBLE",
  "PLANNING_EXECUTION_SEPARATION_BROKEN",
  "PLANNING_EVIDENCE_NOT_IMMUTABLE",
  "PLANNING_REPLAY_INVALID",
] as const satisfies readonly PlanningEngineFailure[];

describe("Planning Engine W2.8", () => {
  it("publishes the W2.8 planning doctrine and qualification bundle", () => {
    const bundle = getPlanningEngineBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "planning-engine/w2.8",
      owns_goal_decomposition: true,
      owns_planning_graphs: true,
      owns_plan_generation: true,
      owns_constraint_resolution: true,
      owns_plan_review: true,
      owns_approval_points: true,
      owns_plan_validation: true,
      owns_plan_registry: true,
      owns_reasoning_runtime_contract: true,
      owns_planning_evidence: true,
      separates_planning_from_execution: true,
      qualification_gate: "Planning Engine Qualification Gate",
    });
    expect(bundle.result.readiness.decision).toBe("PLANNING_ENGINE_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic planning to W2.0 through W2.7", () => {
    const first = runPlanningEngine();
    const second = runPlanningEngine();

    expect(first.caf_constitution_ref).toBe("caf-constitutional-foundation/w2.0");
    expect(first.agent_registry_ref).toBe("agent-registry/w2.1");
    expect(first.lifecycle_engine_ref).toBe("lifecycle-engine/w2.2");
    expect(first.capability_registry_ref).toBe("capability-registry/w2.3");
    expect(first.skill_registry_ref).toBe("skill-registry/w2.4");
    expect(first.authority_validator_ref).toBe("authority-validator/w2.5");
    expect(first.policy_gate_ref).toBe("policy-gate/w2.6");
    expect(first.safety_gate_ref).toBe("safety-gate/w2.7");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePlanningEngine(first).valid).toBe(true);
    expect(replayPlanningEngine(first)).toBe(true);
  });

  it("decomposes goals and builds validated acyclic planning graphs", () => {
    const result = runPlanningEngine();

    expect(result.goal_decomposition).toMatchObject({
      goal_parser: true,
      objective_hierarchy: true,
      mission_graph: true,
      sub_goal_generation: true,
      task_tree_generation: true,
      goal_lineage: true,
      goal_priority: true,
      goal_dependencies: true,
      completion_criteria: true,
      deterministic_decomposition: true,
      repeatable_decomposition: true,
    });
    expect(result.planning_graph).toMatchObject({
      task_nodes: true,
      dependency_edges: true,
      parallel_groups: true,
      sequential_groups: true,
      conditional_branches: true,
      decision_nodes: true,
      merge_nodes: true,
      synchronization_points: true,
      dag_validated: true,
      cycles_prevented: true,
      dependency_ordering_verified: true,
    });
  });

  it("generates executable plans and resolves constitutional constraints fail-closed", () => {
    const result = runPlanningEngine();

    expect(result.plan_generation).toMatchObject({
      task_ordering: true,
      capability_selection: true,
      skill_assignment: true,
      execution_sequencing: true,
      resource_planning: true,
      scheduling: true,
      alternative_plans: true,
      fallback_plans: true,
      recovery_plans: true,
      optimization: true,
      executable_plan: true,
      deterministic_generation: true,
    });
    expect(result.constraints).toMatchObject({
      capability_constraints: true,
      authority_constraints: true,
      policy_constraints: true,
      safety_constraints: true,
      lifecycle_constraints: true,
      resource_constraints: true,
      dependency_constraints: true,
      scheduling_constraints: true,
      tenant_constraints: true,
      environmental_constraints: true,
      unresolved_conflicts_reported: true,
      fail_closed: true,
    });
  });

  it("supports reproducible review, approval checkpoints, and plan validation", () => {
    const result = runPlanningEngine();

    expect(result.review).toMatchObject({
      review_checkpoints: true,
      operator_review: true,
      governance_review: true,
      safety_review: true,
      authority_review: true,
      policy_review: true,
      risk_review: true,
      explanation_generation: true,
      decision_logging: true,
      reproducible_reviews: true,
    });
    expect(result.approvals).toMatchObject({
      approval_stages: true,
      approval_policies: true,
      required_approvers: true,
      multi_stage_approvals: true,
      conditional_approvals: true,
      emergency_approvals: true,
      expiration_rules: true,
      approval_lineage: true,
      deterministic_workflow: true,
      replayable_approvals: true,
    });
    expect(result.validation_engine).toMatchObject({
      dependency_validation: true,
      capability_validation: true,
      authority_validation: true,
      policy_validation: true,
      safety_validation: true,
      lifecycle_validation: true,
      goal_completeness: true,
      execution_readiness: true,
      invalid_plan_rejection: true,
      deterministic_readiness: true,
      validation_evidence: true,
    });
  });

  it("maintains immutable registry, reasoning runtime contract, and planning evidence", () => {
    const result = runPlanningEngine();

    expect(result.registry).toMatchObject({
      plan_identity: true,
      plan_versions: true,
      plan_lineage: true,
      plan_ownership: true,
      plan_lifecycle: true,
      plan_metadata: true,
      execution_history: true,
      evidence_references: true,
      immutable_history: true,
      deterministic_lookup: true,
      complete_lineage: true,
    });
    expect(result.reasoning_runtime_contract).toMatchObject({
      planning_request_schema: true,
      planning_response_schema: true,
      execution_contract: true,
      constraint_contract: true,
      capability_contract: true,
      approval_contract: true,
      evidence_contract: true,
      replay_contract: true,
      failure_contract: true,
      versioned_contract: true,
      backward_compatible: true,
      replay_compatible: true,
      execution_separated: true,
    });
    expect(result.evidence.records).toHaveLength(8);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.traceable).toBe(true);
    expect(result.evidence.replay_complete).toBe(true);
    expect(result.readiness.execution_separated).toBe(true);
    expect(result.readiness.approval_before_execution).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runPlanningEngine({ scenario: failure });
    const validation = validatePlanningEngine(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runPlanningEngine({ scenario: failure });
    const validation = validatePlanningEngine(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit qualification failure as not qualified", () => {
    const result = runPlanningEngine({ scenario: "PLANNING_ENGINE_QUALIFICATION_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validatePlanningEngine(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runPlanningEngine({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runPlanningEngine({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
  });
});
