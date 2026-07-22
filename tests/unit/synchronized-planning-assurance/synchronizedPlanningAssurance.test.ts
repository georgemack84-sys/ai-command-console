import { describe, expect, it } from "vitest";
import {
  analyzePlanningConflicts,
  buildPlanningObservabilitySurface,
  computeCompatibilityScore,
  generateSynchronizedPlan,
  getSynchronizedPlanningAssurance,
  replaySynchronizedPlanning,
  validateDependencies,
  validateObjective,
  validateSequencing,
  validateSynchronizedPlanning,
} from "@/services/synchronized-planning-assurance";
import type { PlanningFailure, PlanningScenario } from "@/types/synchronized-planning-assurance";

describe("synchronized planning assurance", () => {
  it("publishes the 8ALT.7.2 certified doctrine bundle", () => {
    const bundle = getSynchronizedPlanningAssurance();

    expect(bundle.doctrine.contract_version).toBe("synchronized-planning-assurance/v8ALT.7.2");
    expect(bundle.doctrine.final_state).toBe("SYNCHRONIZED_PLANNING_ASSURANCE_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.replay.deterministic).toBe(true);
  });

  it("generates one deterministic synchronized plan for all participating agents", () => {
    const first = generateSynchronizedPlan();
    const second = generateSynchronizedPlan();

    expect(first.contract_hash).toBe(second.contract_hash);
    expect(first.planning_state).toBe("CERTIFIED");
    expect(first.agent_plans.length).toBe(first.participating_agents.length);
    expect(new Set(first.agent_plans.map((plan) => plan.objective_interpretation_hash)).size).toBe(1);
    expect(new Set(first.agent_plans.map((plan) => plan.execution_graph.join(">"))).size).toBe(1);
  });

  it("validates shared objective, dependencies, and sequencing in the baseline", () => {
    expect(validateObjective().objective_valid).toBe(true);
    expect(validateDependencies().dependency_alignment_valid).toBe(true);
    expect(validateSequencing().sequencing_valid).toBe(true);
  });

  it("builds a conflict-free acyclic planning graph with deterministic ordering", () => {
    const contract = generateSynchronizedPlan();
    const validation = validateSynchronizedPlanning(contract);

    expect(validation.graph_valid).toBe(true);
    expect(validation.conflict_free).toBe(true);
    expect(contract.execution_graph.map((node) => node.execution_order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(contract.dependency_graph.every((dependency) => dependency.validation_state === "VALID")).toBe(true);
  });

  it("computes high compatibility and complete replay evidence for baseline planning", () => {
    const score = computeCompatibilityScore();
    const contract = generateSynchronizedPlan();
    const replay = replaySynchronizedPlanning(contract);

    expect(score.compatibility_score).toBeGreaterThan(0.9);
    expect(score.conflict_score).toBe(0);
    expect(contract.evidence.objective_evidence.length).toBe(contract.participating_agents.length);
    expect(contract.evidence.replay_reference).toBeTruthy();
    expect(replay.deterministic).toBe(true);
  });

  it("enforces governance, constitutional, authority, tenant, and visibility controls", () => {
    const contract = generateSynchronizedPlan();
    const validation = validateSynchronizedPlanning(contract);

    expect(validation.governance_valid).toBe(true);
    expect(validation.constitutional_valid).toBe(true);
    expect(validation.authority_valid).toBe(true);
    expect(validation.tenant_isolated).toBe(true);
    expect(validation.operator_visible).toBe(true);
    expect(contract.shared_objective.constraints).toContain("no-execution-authority");
  });

  it.each([
    ["OBJECTIVE_MISMATCH", "OBJECTIVE_INTERPRETATION_MISMATCH"],
    ["NONDETERMINISTIC_PLAN", "PLAN_GENERATION_NONDETERMINISTIC"],
    ["MISSING_DEPENDENCY", "MISSING_DEPENDENCY_DETECTED"],
    ["DEPENDENCY_ORDER_MISMATCH", "DEPENDENCY_ORDERING_MISMATCH"],
    ["INCOMPATIBLE_TASK_ORDER", "INCOMPATIBLE_TASK_ORDER_DETECTED"],
    ["CONSTRAINT_MISMATCH", "CONSTRAINT_MISMATCH_DETECTED"],
    ["GRAPH_CYCLE", "PLANNING_GRAPH_CYCLE_DETECTED"],
    ["CONFLICTING_OBJECTIVES", "CONFLICTING_OBJECTIVES_DETECTED"],
    ["DUPLICATE_TASK_OWNERSHIP", "DUPLICATE_TASK_OWNERSHIP_DETECTED"],
    ["PLAN_DIVERGENCE", "PLAN_DIVERGENCE_DETECTED"],
    ["GOVERNANCE_MISMATCH", "GOVERNANCE_MISMATCH_DETECTED"],
    ["AUTHORITY_OVERLAP", "AUTHORITY_OVERLAP_DETECTED"],
    ["CONSTITUTIONAL_MISMATCH", "CONSTITUTIONAL_MISMATCH_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_HASH_INVALID"],
    ["CROSS_TENANT_PLANNING", "CROSS_TENANT_PLANNING_DETECTED"],
    ["HIDDEN_PLANNING_ACTIVITY", "HIDDEN_PLANNING_ACTIVITY_DETECTED"],
  ] satisfies [PlanningScenario, PlanningFailure][])("fails closed for %s", (scenario, failure) => {
    const contract = generateSynchronizedPlan({ scenario });
    const validation = validateSynchronizedPlanning(contract);

    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("returns replayable and explainable conflict analysis", () => {
    const conflicts = analyzePlanningConflicts({ scenario: "PLAN_DIVERGENCE" });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      conflict_type: "DIVERGENCE",
      severity: "CRITICAL",
      divergence_category: "EXECUTION",
    });
    expect(conflicts[0].recommended_resolution).toBeTruthy();
  });

  it("publishes an operator-visible observability surface", () => {
    const surface = buildPlanningObservabilitySurface();

    expect(surface.state).toBe("CERTIFIED");
    expect(surface.compatibility_score).toBeGreaterThan(0.9);
    expect(surface.graph_node_count).toBe(7);
    expect(surface.dependency_count).toBe(6);
    expect(surface.contract_hash).toBeTruthy();
  });
});
