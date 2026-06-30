import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies } from "@/services/dependency-analysis";
import { optimizePlan } from "@/services/planning-optimization";
import { buildAlternativePlanningPackage } from "@/services/alternative-planning";
import {
  analyzeFailureScenarios,
  buildContingencyIntake,
  buildContingencyPlanningPackage,
  buildContingencyVisibilitySurface,
  buildRecoveryDecisionMatrix,
  buildRecoveryPlans,
  computeContingencyPackageHash,
  getContingencyPlanningFramework,
  replayContingencyPlanningPackage,
  validateContingencyPlanningPackage,
} from "@/services/contingency-planning";
import type { ContingencyFailureReason, ContingencyPlanningScenario, FailureCategory, RecoveryStrategyType } from "@/types/contingency-planning";

function buildBaseline() {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const optimizedPlan = optimizePlan(identity, hierarchy, graph);
  const alternativePackage = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
  return { identity, graph, optimizedPlan, alternativePackage };
}

const strategies: readonly RecoveryStrategyType[] = ["ROLLBACK", "RETRY", "OPERATOR_INTERVENTION", "SAFE_STOP", "DEGRADED_EXECUTION"];
const categories: readonly FailureCategory[] = ["PARTIAL_FAILURE", "DEPENDENCY_FAILURE", "GOVERNANCE_FAILURE", "AUTHORITY_LOSS", "ENVIRONMENTAL_CHANGE", "MULTIPLE_FAILURES"];

describe("Mission Control Phase 8B.5 Contingency Planning Engine", () => {
  it("builds a normalized contingency intake from optimized and alternative plans", () => {
    const { identity, graph, optimizedPlan, alternativePackage } = buildBaseline();
    const intake = buildContingencyIntake(identity, optimizedPlan, alternativePackage, graph);
    expect(intake.optimized_plan_id).toBe(optimizedPlan.optimized_plan_id);
    expect(intake.alternative_package_id).toBe(alternativePackage.alternative_package_id);
    expect(intake.recovery_metadata_complete).toBe(true);
    expect(intake.intake_failures).toEqual([]);
  });

  it("analyzes all supported failure categories", () => {
    const { identity, graph, optimizedPlan, alternativePackage } = buildBaseline();
    const scenarios = analyzeFailureScenarios(buildContingencyIntake(identity, optimizedPlan, alternativePackage, graph));
    expect(scenarios.map((scenario) => scenario.failure_category)).toEqual(categories);
    expect(scenarios.every((scenario) => scenario.recommended_strategies.length > 0)).toBe(true);
  });

  it("generates rollback, retry, operator intervention, safe-stop, and degraded execution plans", () => {
    const { identity, graph, optimizedPlan, alternativePackage } = buildBaseline();
    const plans = buildRecoveryPlans(buildContingencyIntake(identity, optimizedPlan, alternativePackage, graph));
    expect(plans.map((plan) => plan.strategy_type)).toEqual(strategies);
    expect(plans.every((plan) => plan.trigger_conditions.length > 0)).toBe(true);
    expect(plans.every((plan) => plan.supporting_evidence.length > 0)).toBe(true);
  });

  it("builds the recovery decision matrix from failure category to recovery strategy", () => {
    const matrix = buildRecoveryDecisionMatrix();
    expect(matrix.map((row) => row.failure_category)).toEqual(categories);
    expect(matrix.find((row) => row.failure_category === "GOVERNANCE_FAILURE")?.recommended_recovery).toEqual(["OPERATOR_INTERVENTION"]);
    expect(matrix.find((row) => row.failure_category === "MULTIPLE_FAILURES")?.recommended_recovery).toEqual(["ROLLBACK", "OPERATOR_INTERVENTION"]);
  });

  it("packages contingency plans without initiating recovery", () => {
    const { identity, graph, optimizedPlan, alternativePackage } = buildBaseline();
    const pkg = buildContingencyPlanningPackage(identity, optimizedPlan, alternativePackage, graph);
    expect(pkg.certification_state).toBe("PASS");
    expect(pkg.advisory_only).toBe(true);
    expect(pkg.recovery_initiated).toBe(false);
    expect(pkg.selected_recovery_plan_id).toBeNull();
    expect(pkg.recovery_plans).toHaveLength(5);
    expect(computeContingencyPackageHash(pkg)).toBe(pkg.integrity_hash);
  });

  it("validates a baseline package for planning confidence", () => {
    const { identity, graph, optimizedPlan, alternativePackage } = buildBaseline();
    const validation = validateContingencyPlanningPackage(buildContingencyPlanningPackage(identity, optimizedPlan, alternativePackage, graph));
    expect(validation.certification_state).toBe("PASS");
    expect(validation.failures).toEqual([]);
    expect(validation.ready_for_planning_confidence).toBe(true);
    expect(validation.advisory_only_enforced).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_OPTIMIZED_PLAN", "UNCERTIFIED_OPTIMIZED_PLAN", "FAIL"],
    ["UNCERTIFIED_ALTERNATIVE_PACKAGE", "UNCERTIFIED_ALTERNATIVE_PACKAGE", "FAIL"],
    ["MISSING_RECOVERY_METADATA", "INCOMPLETE_RECOVERY_METADATA", "CONDITIONAL_PASS"],
    ["MISSING_GOVERNANCE", "MISSING_GOVERNANCE_CONSTRAINTS", "FAIL"],
    ["INVALID_REPLAY_REFERENCE", "INVALID_REPLAY_REFERENCE", "FAIL"],
    ["INCONSISTENT_PLANNING_STATE", "INCONSISTENT_PLANNING_STATE", "FAIL"],
    ["MISSING_ROLLBACK", "RECOVERY_STRATEGY_MISSING", "FAIL"],
    ["MISSING_RETRY", "RECOVERY_STRATEGY_MISSING", "FAIL"],
    ["MISSING_OPERATOR_INTERVENTION", "RECOVERY_STRATEGY_MISSING", "FAIL"],
    ["MISSING_SAFE_STOP", "RECOVERY_STRATEGY_MISSING", "FAIL"],
    ["MISSING_DEGRADED_EXECUTION", "RECOVERY_STRATEGY_MISSING", "FAIL"],
    ["ROLLBACK_IMPOSSIBLE", "ROLLBACK_PATH_UNAVAILABLE", "FAIL"],
    ["UNSAFE_RETRY", "UNSAFE_RETRY_CONDITIONS", "FAIL"],
    ["INCOMPLETE_OPERATOR_GUIDANCE", "OPERATOR_GUIDANCE_INCOMPLETE", "CONDITIONAL_PASS"],
    ["SAFE_STOP_STATE_LOSS", "SAFE_STOP_STATE_PRESERVATION_FAILED", "FAIL"],
    ["DEGRADED_GOVERNANCE_VIOLATION", "DEGRADED_EXECUTION_GOVERNANCE_VIOLATION", "FAIL"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION", "FAIL"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE", "FAIL"],
    ["EVIDENCE_CHAIN_BROKEN", "MISSING_EVIDENCE", "FAIL"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION", "FAIL"],
    ["HIDDEN_RECOVERY_LOGIC", "HIDDEN_RECOVERY_LOGIC", "FAIL"],
    ["UNRECOVERABLE_STATE", "UNRECOVERABLE_EXECUTION_STATE", "FAIL"],
    ["CONDITIONAL_REPORTING_GAP", "REPORTING_GAP", "CONDITIONAL_PASS"],
  ] as readonly [ContingencyPlanningScenario, ContingencyFailureReason, string][])("certifies scenario %s", (scenario, reason, certification) => {
    const { identity, graph, optimizedPlan, alternativePackage } = buildBaseline();
    const pkg = buildContingencyPlanningPackage(identity, optimizedPlan, alternativePackage, graph, scenario);
    const validation = validateContingencyPlanningPackage(pkg);
    expect(pkg.failure_reasons).toContain(reason);
    expect(validation.failures).toContain(reason);
    expect(validation.certification_state).toBe(certification);
  });

  it("replays contingency planning deterministically", () => {
    const { identity, graph, optimizedPlan, alternativePackage } = buildBaseline();
    const pkg = buildContingencyPlanningPackage(identity, optimizedPlan, alternativePackage, graph);
    const replay = replayContingencyPlanningPackage(pkg);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.replay_plan_order).toEqual(strategies);
    expect(replay.replay_scenario_order).toEqual(categories);
  });

  it("exposes contingency visibility", () => {
    const { identity, graph, optimizedPlan, alternativePackage } = buildBaseline();
    const visibility = buildContingencyVisibilitySurface(buildContingencyPlanningPackage(identity, optimizedPlan, alternativePackage, graph));
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.hidden_recovery_logic_visible).toBe(false);
    expect(visibility.recovery_strategies).toEqual(strategies);
    expect(visibility.failure_categories).toEqual(categories);
  });

  it("publishes aggregate contingency planning framework", () => {
    const framework = getContingencyPlanningFramework();
    expect(framework.package.certification_state).toBe("PASS");
    expect(framework.validation.ready_for_planning_confidence).toBe(true);
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.recovery_strategies).toEqual(strategies);
  });
});
