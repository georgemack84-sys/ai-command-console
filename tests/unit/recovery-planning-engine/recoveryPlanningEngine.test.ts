import { describe, expect, it, vi } from "vitest";
import { analyzeFailure } from "@/services/failure-analysis-engine";
import {
  buildRecoveryPlanningObservabilitySurface,
  computeRecoveryPlanningPackageHash,
  generateRecoveryPlans,
  getRecoveryPlanningEngineContract,
  replayRecoveryPlanningPackage,
  validateRecoveryPlanningPackage,
} from "@/services/recovery-planning-engine";
import type { RecoveryPlanningFailure, RecoveryPlanningScenario, RecoveryStrategyType } from "@/types/recovery-planning-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.2.3 Recovery Planning Engine", () => {
  it("defines the advisory-only deterministic recovery planning doctrine", () => {
    const contract = getRecoveryPlanningEngineContract();

    expect(contract.doctrine.engine_version).toBe("recovery-planning-engine/v8ALT.2.3");
    expect(contract.doctrine.principles).toContain("deterministic-planning");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.strategy_types).toEqual(["ROLLBACK", "RESTART", "CHECKPOINT_RECOVERY", "STAGED_RECOVERY", "DEPENDENCY_REPAIR", "ALTERNATIVE_EXECUTION_PATH", "PARTIAL_CONTINUATION"]);
    expect(contract.doctrine.lifecycle_states).toEqual(["PLANNED", "VALIDATING", "GOVERNANCE_REVIEW", "READY_FOR_OPERATOR", "APPROVED", "REJECTED"]);
    expect(contract.doctrine.operator_approval_required).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("generates complete rollback, restart, checkpoint, staged, dependency, alternative, and partial continuation plans", () => {
    const pkg = generateRecoveryPlans();
    const validation = validateRecoveryPlanningPackage(pkg);

    expect(pkg.planning_id).toMatch(/^RPL-/);
    expect(new Set(pkg.plans.map((plan) => plan.strategy_type))).toEqual(new Set(["ROLLBACK", "RESTART", "CHECKPOINT_RECOVERY", "STAGED_RECOVERY", "DEPENDENCY_REPAIR", "ALTERNATIVE_EXECUTION_PATH", "PARTIAL_CONTINUATION"]));
    expect(pkg.plans.every((plan) => plan.recovery_steps.length > 0)).toBe(true);
    expect(pkg.plans.every((plan) => plan.dependencies.length > 0)).toBe(true);
    expect(pkg.plans.every((plan) => plan.operator_approval_required)).toBe(true);
    expect(pkg.selected_plan.strategy_type).toBe("CHECKPOINT_RECOVERY");
    expect(validation.valid).toBe(true);
  });

  it.each([
    ["CHECKPOINT_CORRUPTION", "ROLLBACK"],
    ["ORCHESTRATION_FAILURE", "RESTART"],
    ["BASELINE_EXECUTION", "CHECKPOINT_RECOVERY"],
    ["RESOURCE_EXHAUSTION", "STAGED_RECOVERY"],
    ["DEPENDENCY_FAILURE", "DEPENDENCY_REPAIR"],
    ["PLANNING_FAILURE", "ALTERNATIVE_EXECUTION_PATH"],
    ["SUPERVISION_FAILURE", "PARTIAL_CONTINUATION"],
  ] as readonly [RecoveryPlanningScenario, RecoveryStrategyType][])("prefers %s-appropriate strategy %s deterministically", (scenario, expected) => {
    const first = generateRecoveryPlans({ scenario });
    const second = generateRecoveryPlans({ scenario });

    expect(first.selected_plan.strategy_type).toBe(expected);
    expect(first.package_hash).toBe(second.package_hash);
    expect(first.selected_plan.plan_hash).toBe(second.selected_plan.plan_hash);
  });

  it("evaluates confidence, cost, governance impact, replay consistency, operational risk, and mission preservation", () => {
    const pkg = generateRecoveryPlans({ scenario: "DEPENDENCY_FAILURE" });
    const dependencyPlan = pkg.plans.find((plan) => plan.strategy_type === "DEPENDENCY_REPAIR");

    expect(dependencyPlan).toBeDefined();
    expect(dependencyPlan?.evaluation.recovery_confidence).toBeGreaterThan(0.8);
    expect(dependencyPlan?.evaluation.recovery_cost).toBeGreaterThan(0);
    expect(["MINIMAL", "LOW", "MODERATE"]).toContain(dependencyPlan?.evaluation.governance_impact);
    expect(dependencyPlan?.evaluation.replay_consistency).toBeGreaterThan(0.9);
    expect(dependencyPlan?.evaluation.mission_preservation).toBeGreaterThan(0.8);
    expect(dependencyPlan?.evaluation.evaluation_score).toBeGreaterThan(0.7);
  });

  it("ranks strategies by deterministic governance, replay, confidence, risk, cost, preservation, dependency, and duration factors", () => {
    const pkg = generateRecoveryPlans({ scenario: "PLANNING_FAILURE" });

    expect(pkg.ranking_factors).toEqual(["governance compliance", "constitutional compliance", "replay consistency", "integrity preservation", "recovery confidence", "operational risk", "recovery cost", "mission preservation", "dependency stability", "estimated recovery duration"]);
    expect(pkg.plans.map((plan) => plan.rank)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pkg.selected_plan.rank).toBe(1);
    expect(pkg.selected_plan.strategy_type).toBe("ALTERNATIVE_EXECUTION_PATH");
  });

  it("links plans to failure analysis, replay, lineage, repository, governance evidence, authority evidence, and integrity metadata", () => {
    const failureAnalysis = analyzeFailure({ scenario: "RESOURCE_EXHAUSTION" });
    const pkg = generateRecoveryPlans({ failure_analysis: failureAnalysis });

    expect(pkg.analysis_id).toBe(failureAnalysis.analysis_id);
    expect(pkg.recovery_id).toBe(failureAnalysis.recovery_id);
    expect(pkg.repository.plan_ids).toEqual(pkg.plans.map((plan) => plan.recovery_plan_id));
    expect(pkg.repository.selected_plan_id).toBe(pkg.selected_plan.recovery_plan_id);
    expect(pkg.repository.governance_evidence.length).toBe(pkg.plans.length);
    expect(pkg.repository.authority_evidence.length).toBe(pkg.plans.length);
    expect(pkg.replay.strategy_generation).toBeTruthy();
    expect(pkg.repository.integrity_hash).toBeTruthy();
  });

  it.each([
    ["LOW_CONFIDENCE", "CONFIDENCE_INSUFFICIENT"],
    ["REPLAY_MISMATCH", "REPLAY_INVALID"],
    ["INTEGRITY_FAILURE", "INTEGRITY_INVALID"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_INVALID"],
    ["AUTONOMOUS_EXECUTION_ATTEMPT", "AUTONOMOUS_EXECUTION_DETECTED"],
    ["ROLLBACK_EXECUTION_ATTEMPT", "ROLLBACK_EXECUTION_DETECTED"],
    ["RESTART_EXECUTION_ATTEMPT", "RESTART_EXECUTION_DETECTED"],
    ["CHECKPOINT_RESTORE_ATTEMPT", "CHECKPOINT_RESTORE_DETECTED"],
    ["GOVERNANCE_MUTATION_ATTEMPT", "GOVERNANCE_MUTATION_DETECTED"],
    ["AUTHORITY_ESCALATION_ATTEMPT", "AUTHORITY_ESCALATION_DETECTED"],
    ["HIDDEN_ALTERNATIVES", "HIDDEN_ALTERNATIVES_DETECTED"],
  ] as readonly [RecoveryPlanningScenario, RecoveryPlanningFailure][])("fails closed for %s", (scenario, failure) => {
    const pkg = generateRecoveryPlans({ scenario });
    const validation = validateRecoveryPlanningPackage(pkg);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("preserves advisory-only boundaries and does not execute recovery in the baseline", () => {
    const pkg = generateRecoveryPlans();
    const validation = validateRecoveryPlanningPackage(pkg);

    expect(pkg.advisory_only).toBe(true);
    expect(pkg.recovery_executed).toBe(false);
    expect(pkg.rollback_performed).toBe(false);
    expect(pkg.restart_performed).toBe(false);
    expect(pkg.checkpoint_restored).toBe(false);
    expect(pkg.governance_modified).toBe(false);
    expect(pkg.authority_escalated).toBe(false);
    expect(pkg.alternatives_hidden).toBe(false);
    expect(validation.advisory_only).toBe(true);
  });

  it("replays and hashes recovery planning packages deterministically", () => {
    const first = generateRecoveryPlans({ scenario: "RESOURCE_EXHAUSTION" });
    const second = generateRecoveryPlans({ scenario: "RESOURCE_EXHAUSTION" });
    const replay = replayRecoveryPlanningPackage(first);

    expect(second.package_hash).toBe(first.package_hash);
    expect(first.package_hash).toBe(computeRecoveryPlanningPackageHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(first.package_hash);
  });

  it("exposes operator-visible planning diagnostics", () => {
    const surface = buildRecoveryPlanningObservabilitySurface(generateRecoveryPlans({ scenario: "DEPENDENCY_FAILURE" }));

    expect(surface.selected_strategy).toBe("DEPENDENCY_REPAIR");
    expect(surface.plan_count).toBe(7);
    expect(surface.selected_rank).toBe(1);
    expect(surface.selected_confidence).toMatch(/VERY_HIGH|HIGH/);
    expect(surface.replay_valid).toBe(true);
    expect(surface.advisory_only).toBe(true);
  });
});
