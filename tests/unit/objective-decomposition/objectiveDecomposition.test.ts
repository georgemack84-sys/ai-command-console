import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import {
  buildMissionObjective,
  buildObjectiveVisibilitySurface,
  computeObjectiveHierarchyHash,
  decomposeObjective,
  getObjectiveDecompositionFramework,
  interpretObjective,
  replayObjectiveDecomposition,
  validateObjectiveHierarchy,
} from "@/services/objective-decomposition";
import type { ObjectiveDecompositionScenario } from "@/types/objective-decomposition";

describe("Mission Control Phase 8B.1 Objective Decomposition Engine", () => {
  it("builds and interprets an approved objective deterministically", () => {
    const identity = generateAutonomyIdentity();
    const objective = buildMissionObjective(identity);
    const interpreted = interpretObjective(objective);
    expect(objective.approved).toBe(true);
    expect(interpreted.normalized_objective).toBe("deploy-governed-mission-update");
    expect(interpreted.planning_boundaries).toContain("decomposition only");
  });

  it("decomposes an objective into sub-objectives, milestones, and atomic tasks", () => {
    const identity = generateAutonomyIdentity();
    const hierarchy = decomposeObjective(identity);
    expect(hierarchy.sub_objectives.length).toBeGreaterThan(0);
    expect(hierarchy.milestones).toHaveLength(6);
    expect(hierarchy.tasks).toHaveLength(6);
    expect(hierarchy.tasks.every((task) => task.hidden_subactions === false)).toBe(true);
    expect(computeObjectiveHierarchyHash(hierarchy)).toBe(hierarchy.integrity_hash);
  });

  it("validates a baseline hierarchy as ready for dependency analysis", () => {
    const identity = generateAutonomyIdentity();
    const hierarchy = decomposeObjective(identity);
    const validation = validateObjectiveHierarchy(identity, hierarchy);
    expect(validation.validation_state).toBe("PASS");
    expect(validation.ready_for_dependency_analysis).toBe(true);
    expect(validation.failures).toEqual([]);
  });

  it.each([
    ["MISSING_APPROVAL", "OBJECTIVE_APPROVAL_MISSING"],
    ["DUPLICATE_OBJECTIVE", "DUPLICATE_OBJECTIVE"],
    ["INVALID_AUTHORITY", "INVALID_AUTHORITY"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["AMBIGUOUS_OBJECTIVE", "OBJECTIVE_SCHEMA_INVALID"],
    ["CYCLIC_HIERARCHY", "CYCLIC_HIERARCHY"],
    ["DUPLICATE_TASK", "DUPLICATE_TASK_ID"],
    ["ORPHAN_TASK", "ORPHAN_TASK"],
    ["MISSING_MILESTONE", "MILESTONE_MISSING"],
    ["NONDETERMINISTIC_ORDERING", "NONDETERMINISTIC_ORDERING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATION"],
    ["HIDDEN_TASK", "HIDDEN_TASK"],
  ] as readonly [ObjectiveDecompositionScenario, string][])("rejects scenario %s", (scenario, reason) => {
    const identity = generateAutonomyIdentity();
    const hierarchy = decomposeObjective(identity, scenario);
    const registry = scenario === "DUPLICATE_OBJECTIVE" ? [hierarchy, hierarchy] : [hierarchy];
    const validation = validateObjectiveHierarchy(identity, hierarchy, registry);
    expect(validation.validation_state).toBe("FAIL");
    expect(validation.failures).toContain(reason as never);
  });

  it("replays decomposition deterministically", () => {
    const hierarchy = decomposeObjective(generateAutonomyIdentity());
    const replay = replayObjectiveDecomposition(hierarchy);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_tasks).toEqual(hierarchy.tasks.map((task) => task.task_id));
  });

  it("detects replay ordering mismatch", () => {
    const hierarchy = decomposeObjective(generateAutonomyIdentity(), "NONDETERMINISTIC_ORDERING");
    const replay = replayObjectiveDecomposition(hierarchy);
    expect(replay.validation_state).toBe("FAIL");
    expect(replay.failure_reason).toBe("NONDETERMINISTIC_ORDERING");
  });

  it("exposes visibility with explanations and governance constraints", () => {
    const identity = generateAutonomyIdentity();
    const hierarchy = decomposeObjective(identity);
    const visibility = buildObjectiveVisibilitySurface(identity, hierarchy);
    expect(visibility.planning_state).toBe("READY");
    expect(visibility.hidden_tasks_visible).toBe(false);
    expect(visibility.task_explanations.length).toBe(hierarchy.tasks.length);
    expect(visibility.governance_constraints).toContain("operator supremacy");
  });

  it("publishes aggregate framework", () => {
    const framework = getObjectiveDecompositionFramework();
    expect(framework.validation.ready_for_dependency_analysis).toBe(true);
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.task_count).toBe(6);
  });
});
