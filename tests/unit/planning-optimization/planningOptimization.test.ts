import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies } from "@/services/dependency-analysis";
import {
  buildOptimizationIntake,
  buildOptimizationVisibilitySurface,
  computeOptimizedPlanHash,
  getPlanningOptimizationFramework,
  loadOptimizationConstraints,
  optimizePlan,
  replayOptimizedPlan,
  validateOptimizedPlan,
} from "@/services/planning-optimization";
import type { OptimizationFailureReason, OptimizationScenario } from "@/types/planning-optimization";

function buildBaseline() {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  return { identity, hierarchy, graph };
}

describe("Mission Control Phase 8B.3 Planning Optimization Engine", () => {
  it("builds a normalized optimization intake from a certified dependency graph", () => {
    const { identity, hierarchy, graph } = buildBaseline();
    const intake = buildOptimizationIntake(identity, hierarchy, graph);
    expect(intake.dependency_graph_id).toBe(graph.dependency_graph_id);
    expect(intake.critical_path).toEqual(graph.critical_path);
    expect(intake.blocked_tasks).toEqual([]);
    expect(intake.replay_reference).toBe(graph.replay_reference);
  });

  it("loads satisfied baseline optimization constraints", () => {
    const { identity, hierarchy, graph } = buildBaseline();
    const constraints = loadOptimizationConstraints(buildOptimizationIntake(identity, hierarchy, graph));
    expect(constraints.every((constraint) => constraint.satisfied)).toBe(true);
    expect(constraints.some((constraint) => constraint.constraint_class === "SAFETY_REQUIREMENT")).toBe(true);
    expect(constraints.some((constraint) => constraint.constraint_class === "REPLAY_REQUIREMENT")).toBe(true);
  });

  it("generates a deterministic certified optimized plan", () => {
    const { identity, hierarchy, graph } = buildBaseline();
    const plan = optimizePlan(identity, hierarchy, graph);
    expect(plan.certification_state).toBe("PASS");
    expect(plan.execution_order.map((step) => step.task_id)).toEqual(graph.critical_path);
    expect(plan.parallel_groups.length).toBeGreaterThan(0);
    expect(plan.governance_checkpoints).toHaveLength(graph.critical_path.length);
    expect(computeOptimizedPlanHash(plan)).toBe(plan.integrity_hash);
  });

  it("validates a baseline optimized plan for alternative planning", () => {
    const { identity, hierarchy, graph } = buildBaseline();
    const plan = optimizePlan(identity, hierarchy, graph);
    const validation = validateOptimizedPlan(identity, plan, graph);
    expect(validation.certification_state).toBe("PASS");
    expect(validation.failures).toEqual([]);
    expect(validation.ready_for_alternative_planning).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_GRAPH", "UNCERTIFIED_DEPENDENCY_GRAPH", "CONDITIONAL_PASS"],
    ["MISSING_ORDERING", "MISSING_TASK_ORDERING", "CONDITIONAL_PASS"],
    ["UNRESOLVED_BLOCKERS", "UNRESOLVED_BLOCKERS", "CONDITIONAL_PASS"],
    ["MISSING_REPLAY", "REPLAY_REFERENCE_MISSING", "CONDITIONAL_PASS"],
    ["INVALID_TENANT", "INVALID_TENANT_CONTEXT", "CONDITIONAL_PASS"],
    ["INCOMPLETE_GOVERNANCE", "INCOMPLETE_GOVERNANCE_METADATA", "CONDITIONAL_PASS"],
    ["OUT_OF_ORDER", "DEPENDENCY_ORDER_VIOLATION", "FAIL"],
    ["UNSAFE_PARALLELISM", "UNSAFE_PARALLELISM", "FAIL"],
    ["RESOURCE_CONTENTION", "RESOURCE_CONTENTION", "CONDITIONAL_PASS"],
    ["GOVERNANCE_SKIP", "GOVERNANCE_CHECK_SKIPPED", "CONDITIONAL_PASS"],
    ["SAFETY_MARGIN_REDUCED", "SAFETY_MARGIN_REDUCED", "CONDITIONAL_PASS"],
    ["NONDETERMINISTIC_REPLAY", "NONDETERMINISTIC_REPLAY", "FAIL"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION", "FAIL"],
    ["HIDDEN_OPTIMIZATION", "HIDDEN_OPTIMIZATION_PATH", "CONDITIONAL_PASS"],
    ["POLICY_VIOLATION", "POLICY_VIOLATION", "FAIL"],
    ["CONDITIONAL_REPORTING_GAP", "REPORTING_GAP", "CONDITIONAL_PASS"],
  ] as readonly [OptimizationScenario, OptimizationFailureReason, string][])("detects scenario %s", (scenario, reason, certification) => {
    const { identity, hierarchy, graph } = buildBaseline();
    const plan = optimizePlan(identity, hierarchy, graph, scenario);
    const validation = validateOptimizedPlan(identity, plan, graph);
    expect(plan.rejected_optimizations.map((item) => item.reason_rejected)).toContain(reason);
    expect(validation.failures).toContain(reason);
    expect(validation.certification_state).toBe(certification);
  });

  it("replays optimized plans deterministically", () => {
    const { identity, hierarchy, graph } = buildBaseline();
    const plan = optimizePlan(identity, hierarchy, graph);
    const replay = replayOptimizedPlan(plan);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.replay_order).toEqual(graph.critical_path);
    expect(replay.failure_reason).toBeNull();
  });

  it("detects nondeterministic replay during replay validation", () => {
    const { identity, hierarchy, graph } = buildBaseline();
    const plan = optimizePlan(identity, hierarchy, graph, "NONDETERMINISTIC_REPLAY");
    const replay = replayOptimizedPlan(plan);
    expect(replay.validation_state).toBe("FAIL");
    expect(replay.failure_reason).toBe("NONDETERMINISTIC_REPLAY");
  });

  it("exposes governance, safety, rejection, and replay visibility", () => {
    const { identity, hierarchy, graph } = buildBaseline();
    const plan = optimizePlan(identity, hierarchy, graph);
    const visibility = buildOptimizationVisibilitySurface(identity, plan, graph);
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.hidden_optimizations_visible).toBe(false);
    expect(visibility.governance_checkpoints).toHaveLength(plan.governance_checkpoints.length);
    expect(visibility.replay_order).toEqual(graph.critical_path);
  });

  it("publishes aggregate planning optimization framework", () => {
    const framework = getPlanningOptimizationFramework();
    expect(framework.plan.certification_state).toBe("PASS");
    expect(framework.validation.ready_for_alternative_planning).toBe(true);
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.execution_order).toHaveLength(framework.plan.execution_order.length);
  });
});
