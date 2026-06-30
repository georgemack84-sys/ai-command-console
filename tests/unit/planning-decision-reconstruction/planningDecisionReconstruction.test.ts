import { describe, expect, it } from "vitest";
import {
  buildPlanningDecisionReconstructionPackage,
  buildPlanningDecisionVisibilitySurface,
  computeDecisionReplayHash,
  computeDelegationReplayHash,
  computePlanningDecisionValidationHash,
  computePlanningReplayHash,
  computePlanningReplayIdentityHash,
  computeReasoningReplayHash,
  getPlanningDecisionReconstructionFramework,
} from "@/services/planning-decision-reconstruction";
import type { PlanningDecisionReconstructionFailure, PlanningDecisionReconstructionScenario } from "@/types/planning-decision-reconstruction";

describe("Mission Control Phase 8G.3 Planning & Decision Reconstruction", () => {
  it("publishes planning and decision reconstruction doctrine", () => {
    const framework = getPlanningDecisionReconstructionFramework();

    expect(framework.doctrine.engine_version).toBe("planning-decision-reconstruction/v8G.3");
    expect(framework.doctrine.principles).toContain("no-regenerated-reasoning");
    expect(framework.doctrine.reasoning_chain).toEqual(["OBJECTIVE", "EVIDENCE_COLLECTION", "CONSTRAINT_EVALUATION", "ALTERNATIVE_GENERATION", "RISK_ASSESSMENT", "GOVERNANCE_REVIEW", "AUTHORITY_VALIDATION", "CONFIDENCE_CALCULATION", "DECISION_SELECTION"]);
    expect(framework.doctrine.outcomes).toEqual(["VERIFIED", "PARTIAL", "MISMATCH", "INVALID"]);
  });

  it("reconstructs a complete immutable baseline planning package", () => {
    const pkg = buildPlanningDecisionReconstructionPackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.engine_version).toBe("planning-decision-reconstruction/v8G.3");
    expect(pkg.validation.outcome).toBe("VERIFIED");
    expect(pkg.validation.certification_ready).toBe(true);
    expect(pkg.validation.speculative_reasoning_generated).toBe(false);
    expect(pkg.speculative_reasoning_permitted).toBe(false);
    expect(pkg.planning_replay.objective_hierarchy).toHaveLength(4);
    expect(pkg.planning_replay.alternatives).toHaveLength(3);
    expect(pkg.planning_replay.selected_strategy).toBe("governed-sequential-execution");
    expect(pkg.reasoning_replay.selected_fallback).toBe("operator-takeover");
  });

  it("produces deterministic hashes across all replay artifacts", () => {
    const first = buildPlanningDecisionReconstructionPackage();
    const second = buildPlanningDecisionReconstructionPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computePlanningReplayIdentityHash(first.identity)).toBe(first.identity.integrity_hash);
    expect(computePlanningReplayHash(first.planning_replay)).toBe(first.planning_replay.planning_hash);
    expect(computeDecisionReplayHash(first.decision_replay)).toBe(first.decision_replay.decision_hash);
    expect(computeDelegationReplayHash(first.delegation_replay)).toBe(first.delegation_replay.delegation_hash);
    expect(computeReasoningReplayHash(first.reasoning_replay)).toBe(first.reasoning_replay.reasoning_hash);
    expect(computePlanningDecisionValidationHash(first.validation)).toBe(first.validation.validation_hash);
  });

  it("replays objective, decision, delegation, confidence, optimization, and fallback evidence", () => {
    const pkg = buildPlanningDecisionReconstructionPackage();

    expect(pkg.decision_replay.decision_sequence.at(0)).toBe("OBJECTIVE");
    expect(pkg.decision_replay.decision_sequence.at(-1)).toBe("DECISION_SELECTION");
    expect(pkg.delegation_replay.delegated_tasks).toContain("task:prepare-execution");
    expect(pkg.reasoning_replay.confidence_inputs).toContain("authority certainty");
    expect(pkg.reasoning_replay.optimization_history).toContain("optimize:preserve-governance");
    expect(pkg.reasoning_replay.fallback_evaluation).toContain("safe-stop");
  });

  it.each([
    ["PLANNING_DIVERGENCE", "PLANNING_DIVERGENCE", "MISMATCH"],
    ["DECISION_MISMATCH", "DECISION_MISMATCH", "MISMATCH"],
    ["MISSING_PLANNING_EVIDENCE", "MISSING_PLANNING_EVIDENCE", "PARTIAL"],
    ["CONFIDENCE_MISMATCH", "CONFIDENCE_MISMATCH", "MISMATCH"],
    ["DELEGATION_INCONSISTENCY", "DELEGATION_INCONSISTENCY", "MISMATCH"],
    ["AUTHORITY_MISMATCH", "AUTHORITY_MISMATCH", "INVALID"],
    ["OPTIMIZATION_DIVERGENCE", "OPTIMIZATION_DIVERGENCE", "MISMATCH"],
    ["FALLBACK_MISMATCH", "FALLBACK_MISMATCH", "MISMATCH"],
    ["GOVERNANCE_INCONSISTENCY", "GOVERNANCE_INCONSISTENCY", "INVALID"],
    ["LINEAGE_BREAK", "LINEAGE_BREAK", "INVALID"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE", "INVALID"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VALIDATION_FAILED", "INVALID"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION", "INVALID"],
  ] as readonly [PlanningDecisionReconstructionScenario, PlanningDecisionReconstructionFailure, string][])("fails closed for %s", (scenario, failure, outcome) => {
    const pkg = buildPlanningDecisionReconstructionPackage({ scenario });

    expect(pkg.validation.outcome).toBe(outcome);
    expect(pkg.validation.failures).toContain(failure);
    expect(pkg.validation.certification_ready).toBe(false);
    expect(pkg.validation.speculative_reasoning_generated).toBe(false);
    expect(pkg.speculative_reasoning_permitted).toBe(false);
  });

  it("exposes planning decision visibility", () => {
    const surface = buildPlanningDecisionVisibilitySurface(buildPlanningDecisionReconstructionPackage({ scenario: "CONFIDENCE_MISMATCH" }));

    expect(surface.outcome).toBe("MISMATCH");
    expect(surface.failure_reasons).toContain("CONFIDENCE_MISMATCH");
    expect(surface.alternatives).toBe(3);
    expect(surface.confidence_level).toBe("LOW");
    expect(surface.certification_ready).toBe(false);
  });
});
