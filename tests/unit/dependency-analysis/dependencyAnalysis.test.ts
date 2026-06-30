import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import {
  analyzeDependencies,
  buildDependencyIntake,
  buildDependencyVisibilitySurface,
  computeDependencyGraphHash,
  getDependencyAnalysisFramework,
  replayDependencyGraph,
  validateDependencyGraph,
} from "@/services/dependency-analysis";
import type { DependencyAnalysisScenario } from "@/types/dependency-analysis";

describe("Mission Control Phase 8B.2 Dependency Analysis Engine", () => {
  it("builds a normalized dependency intake contract", () => {
    const identity = generateAutonomyIdentity();
    const hierarchy = decomposeObjective(identity);
    const intake = buildDependencyIntake(identity, hierarchy);
    expect(intake.normalized_tasks).toHaveLength(hierarchy.tasks.length);
    expect(Object.keys(intake.task_identity_map)).toHaveLength(hierarchy.tasks.length);
    expect(intake.replay_reference).toBe(hierarchy.replay_reference);
  });

  it("builds a deterministic dependency graph with all dependency types", () => {
    const identity = generateAutonomyIdentity();
    const graph = analyzeDependencies(identity, decomposeObjective(identity));
    expect(graph.nodes).toHaveLength(6);
    expect(graph.edges.some((edge) => edge.dependency_type === "TASK")).toBe(true);
    expect(graph.edges.some((edge) => edge.dependency_type === "DATA")).toBe(true);
    expect(graph.edges.some((edge) => edge.dependency_type === "AUTHORITY")).toBe(true);
    expect(graph.edges.some((edge) => edge.dependency_type === "GOVERNANCE")).toBe(true);
    expect(graph.edges.some((edge) => edge.dependency_type === "RESOURCE")).toBe(true);
    expect(graph.edges.some((edge) => edge.dependency_type === "TEMPORAL")).toBe(true);
    expect(computeDependencyGraphHash(graph)).toBe(graph.integrity_hash);
  });

  it("validates a baseline graph for optimization readiness", () => {
    const identity = generateAutonomyIdentity();
    const hierarchy = decomposeObjective(identity);
    const graph = analyzeDependencies(identity, hierarchy);
    const validation = validateDependencyGraph(identity, graph, hierarchy);
    expect(validation.validation_state).toBe("PASS");
    expect(validation.ready_for_optimization).toBe(true);
    expect(validation.failures).toEqual([]);
  });

  it.each([
    ["MISSING_TASK_ID", "MISSING_TASK_ID"],
    ["DUPLICATE_TASK", "DUPLICATE_TASK_ID"],
    ["ORPHAN_TASK", "ORPHAN_TASK"],
    ["INVALID_TENANT", "INVALID_TENANT_REFERENCE"],
    ["MISSING_REPLAY", "REPLAY_METADATA_MISSING"],
    ["MISSING_DATA", "MISSING_DATA"],
    ["AUTHORITY_GAP", "MISSING_AUTHORITY"],
    ["GOVERNANCE_UNRESOLVED", "MISSING_POLICY_VALIDATION"],
    ["RESOURCE_UNAVAILABLE", "RESOURCE_UNAVAILABLE"],
    ["TEMPORAL_CONFLICT", "TEMPORAL_CONFLICT"],
    ["CYCLIC_DEPENDENCY", "CYCLIC_DEPENDENCY"],
    ["NONDETERMINISTIC_ORDERING", "NONDETERMINISTIC_ORDERING"],
    ["HIDDEN_EDGE", "HIDDEN_DEPENDENCY_EDGE"],
    ["CRITICAL_PATH_MISSING", "CRITICAL_PATH_MISSING"],
    ["UNEXPLAINED_BLOCKER", "UNEXPLAINED_BLOCKER"],
  ] as readonly [DependencyAnalysisScenario, string][])("detects scenario %s", (scenario, reason) => {
    const identity = generateAutonomyIdentity();
    const hierarchy = decomposeObjective(identity);
    const graph = analyzeDependencies(identity, hierarchy, scenario);
    const validation = validateDependencyGraph(identity, graph, hierarchy);
    expect(validation.failures).toContain(reason as never);
  });

  it("classifies ready, blocked, parallel, and critical path tasks", () => {
    const identity = generateAutonomyIdentity();
    const graph = analyzeDependencies(identity, decomposeObjective(identity));
    expect(graph.ready_tasks).toHaveLength(1);
    expect(graph.blocked_tasks).toEqual([]);
    expect(graph.parallel_groups.length).toBeGreaterThan(0);
    expect(graph.critical_path).toHaveLength(graph.nodes.length);
  });

  it("replays a dependency graph deterministically", () => {
    const identity = generateAutonomyIdentity();
    const graph = analyzeDependencies(identity, decomposeObjective(identity));
    const replay = replayDependencyGraph(graph);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_ordering).toEqual(graph.critical_path);
    expect(replay.reconstructed_edges).toHaveLength(graph.edges.length);
  });

  it("detects replay cycle failures", () => {
    const identity = generateAutonomyIdentity();
    const graph = analyzeDependencies(identity, decomposeObjective(identity), "CYCLIC_DEPENDENCY");
    const replay = replayDependencyGraph(graph);
    expect(replay.validation_state).toBe("FAIL");
    expect(replay.failure_reason).toBe("CYCLIC_DEPENDENCY");
  });

  it("exposes dependency visibility", () => {
    const identity = generateAutonomyIdentity();
    const hierarchy = decomposeObjective(identity);
    const graph = analyzeDependencies(identity, hierarchy);
    const visibility = buildDependencyVisibilitySurface(identity, graph, hierarchy);
    expect(visibility.hidden_edges_visible).toBe(false);
    expect(visibility.governance_dependency_report.length).toBeGreaterThan(0);
    expect(visibility.authority_dependency_report.length).toBeGreaterThan(0);
    expect(visibility.integrity_status).toBe("VALID");
  });

  it("publishes aggregate dependency framework", () => {
    const framework = getDependencyAnalysisFramework();
    expect(framework.validation.ready_for_optimization).toBe(true);
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.critical_path).toHaveLength(framework.graph.nodes.length);
  });
});
