import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies } from "@/services/dependency-analysis";
import { optimizePlan } from "@/services/planning-optimization";
import {
  buildAlternativePlanningIntake,
  buildAlternativePlanningPackage,
  buildAlternativePlanningVisibilitySurface,
  computeAlternativePlanningPackageHash,
  generateAlternativeStrategies,
  getAlternativePlanningFramework,
  loadAlternativePlanningConstraints,
  replayAlternativePlanningPackage,
  validateAlternativePlanningPackage,
} from "@/services/alternative-planning";
import type { AlternativePlanningFailureReason, AlternativePlanningScenario, AlternativeStrategyType } from "@/types/alternative-planning";

function buildBaseline() {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const optimizedPlan = optimizePlan(identity, hierarchy, graph);
  return { identity, graph, optimizedPlan };
}

const standardStrategies: readonly AlternativeStrategyType[] = ["PREFERRED", "CONSERVATIVE", "LOW_RISK", "HIGH_RELIABILITY", "OPERATOR_CONTROLLED"];

describe("Mission Control Phase 8B.4 Alternative Planning Engine", () => {
  it("builds a validated alternative planning intake", () => {
    const { identity, graph, optimizedPlan } = buildBaseline();
    const intake = buildAlternativePlanningIntake(identity, optimizedPlan, graph);
    expect(intake.optimized_plan_id).toBe(optimizedPlan.optimized_plan_id);
    expect(intake.dependency_graph_id).toBe(graph.dependency_graph_id);
    expect(intake.intake_valid).toBe(true);
    expect(intake.intake_failures).toEqual([]);
  });

  it("loads satisfied baseline alternative planning constraints", () => {
    const { identity, graph, optimizedPlan } = buildBaseline();
    const constraints = loadAlternativePlanningConstraints(buildAlternativePlanningIntake(identity, optimizedPlan, graph));
    expect(constraints.every((constraint) => constraint.satisfied)).toBe(true);
  });

  it("generates every standard advisory strategy deterministically", () => {
    const { identity, graph, optimizedPlan } = buildBaseline();
    const intake = buildAlternativePlanningIntake(identity, optimizedPlan, graph);
    const strategies = generateAlternativeStrategies(intake);
    expect(strategies.map((plan) => plan.strategy_type)).toEqual(standardStrategies);
    expect(strategies.every((plan) => plan.execution_order.length === optimizedPlan.execution_order.length)).toBe(true);
    expect(strategies.every((plan) => plan.supporting_evidence.length > 0)).toBe(true);
  });

  it("packages alternatives without selecting or executing any plan", () => {
    const { identity, graph, optimizedPlan } = buildBaseline();
    const pkg = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
    expect(pkg.certification_state).toBe("PASS");
    expect(pkg.advisory_only).toBe(true);
    expect(pkg.selected_plan_id).toBeNull();
    expect(pkg.alternatives).toHaveLength(5);
    expect(pkg.preferred_plan_id).toBe(pkg.alternatives.find((plan) => plan.strategy_type === "PREFERRED")?.alternative_plan_id);
    expect(computeAlternativePlanningPackageHash(pkg)).toBe(pkg.integrity_hash);
  });

  it("validates a baseline package for contingency planning", () => {
    const { identity, graph, optimizedPlan } = buildBaseline();
    const validation = validateAlternativePlanningPackage(buildAlternativePlanningPackage(identity, optimizedPlan, graph));
    expect(validation.certification_state).toBe("PASS");
    expect(validation.failures).toEqual([]);
    expect(validation.ready_for_contingency_planning).toBe(true);
    expect(validation.advisory_only_enforced).toBe(true);
  });

  it("builds a complete comparison matrix and tradeoff catalog", () => {
    const { identity, graph, optimizedPlan } = buildBaseline();
    const pkg = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
    expect(pkg.comparison_matrix.map((row) => row.dimension)).toContain("Execution Speed");
    expect(pkg.comparison_matrix.map((row) => row.dimension)).toContain("Operator Involvement");
    expect(pkg.tradeoff_analysis.map((row) => row.strategy_type)).toEqual(standardStrategies);
    expect(pkg.recommendation_evidence.every((item) => item.why_generated && item.when_to_select)).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_OPTIMIZED_PLAN", "UNCERTIFIED_OPTIMIZED_PLAN", "CONDITIONAL_PASS"],
    ["MISSING_METADATA", "INCOMPLETE_PLANNING_METADATA", "CONDITIONAL_PASS"],
    ["INVALID_REPLAY_REFERENCE", "INVALID_REPLAY_REFERENCE", "FAIL"],
    ["MISSING_GOVERNANCE", "MISSING_GOVERNANCE_CONSTRAINTS", "FAIL"],
    ["INCONSISTENT_LINEAGE", "INCONSISTENT_LINEAGE", "CONDITIONAL_PASS"],
    ["MISSING_STRATEGY", "REQUIRED_STRATEGY_MISSING", "FAIL"],
    ["DUPLICATE_STRATEGY", "DUPLICATE_STRATEGY", "FAIL"],
    ["UNSUPPORTED_STRATEGY", "UNSUPPORTED_STRATEGY", "FAIL"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION", "FAIL"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION", "FAIL"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE", "FAIL"],
    ["RATIONALE_INCOMPLETE", "RATIONALE_INCOMPLETE", "CONDITIONAL_PASS"],
    ["TRADEOFFS_UNDOCUMENTED", "TRADEOFFS_UNDOCUMENTED", "CONDITIONAL_PASS"],
    ["EVIDENCE_MISSING", "MISSING_EVIDENCE", "CONDITIONAL_PASS"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION", "FAIL"],
    ["HIDDEN_EXECUTION_PATH", "HIDDEN_EXECUTION_PATH", "FAIL"],
    ["CONDITIONAL_DOCUMENTATION_GAP", "DOCUMENTATION_GAP", "CONDITIONAL_PASS"],
  ] as readonly [AlternativePlanningScenario, AlternativePlanningFailureReason, string][])("certifies scenario %s", (scenario, reason, certification) => {
    const { identity, graph, optimizedPlan } = buildBaseline();
    const pkg = buildAlternativePlanningPackage(identity, optimizedPlan, graph, scenario);
    const validation = validateAlternativePlanningPackage(pkg);
    expect(pkg.failure_reasons).toContain(reason);
    expect(validation.failures).toContain(reason);
    expect(validation.certification_state).toBe(certification);
  });

  it("replays an alternative planning package deterministically", () => {
    const { identity, graph, optimizedPlan } = buildBaseline();
    const pkg = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
    const replay = replayAlternativePlanningPackage(pkg);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.replay_strategy_order).toEqual(standardStrategies);
    expect(replay.failure_reason).toBeNull();
  });

  it("exposes alternative planning visibility", () => {
    const { identity, graph, optimizedPlan } = buildBaseline();
    const pkg = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
    const visibility = buildAlternativePlanningVisibilitySurface(pkg);
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.hidden_execution_paths_visible).toBe(false);
    expect(visibility.rationale_status).toBe("COMPLETE");
    expect(visibility.strategies).toEqual(standardStrategies);
  });

  it("publishes aggregate alternative planning framework", () => {
    const framework = getAlternativePlanningFramework();
    expect(framework.package.certification_state).toBe("PASS");
    expect(framework.validation.ready_for_contingency_planning).toBe(true);
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.strategies).toEqual(standardStrategies);
  });
});
