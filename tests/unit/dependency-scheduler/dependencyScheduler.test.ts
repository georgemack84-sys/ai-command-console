import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence } from "@/services/task-sequencing";
import {
  buildDependencySchedule,
  buildDependencyScheduleVisibilitySurface,
  computeDependencyScheduleHash,
  getDependencySchedulerFramework,
  registerDependencies,
  replayDependencySchedule,
  validateDependencySchedule,
} from "@/services/dependency-scheduler";
import type { DependencyCategory, DependencySchedulerFailureReason, DependencySchedulerScenario } from "@/types/dependency-scheduler";

function buildBaseline() {
  const identity = generateAutonomyIdentity();
  const workflow = activateWorkflow(identity, buildExecutionContract(identity));
  const sequence = generateTaskSequence(identity, workflow);
  return { identity, sequence };
}

const categories: readonly DependencyCategory[] = ["TASK", "RESOURCE", "GOVERNANCE", "OPERATOR_APPROVAL", "EXTERNAL", "POLICY", "SYNCHRONIZATION", "CHECKPOINT"];

describe("Mission Control Phase 8C.4 Dependency Scheduler", () => {
  it("registers all dependency categories deterministically", () => {
    const { sequence } = buildBaseline();
    const registry = registerDependencies(sequence);
    expect(new Set(registry.map((entry) => entry.dependency_type))).toEqual(new Set(categories));
    expect(registry.every((entry) => entry.dependency_status === "READY")).toBe(true);
  });

  it("builds a ready dependency schedule without executing tasks", () => {
    const { identity, sequence } = buildBaseline();
    const schedule = buildDependencySchedule(identity, sequence);
    expect(schedule.dependency_status).toBe("READY");
    expect(schedule.ready_tasks).toEqual(sequence.task_order.map((task) => task.task_id));
    expect(schedule.blocked_tasks).toEqual([]);
    expect(schedule.recovery_recommendations).toEqual([]);
    expect(computeDependencyScheduleHash(schedule)).toBe(schedule.integrity_hash);
  });

  it("validates a baseline schedule for execution monitoring", () => {
    const { identity, sequence } = buildBaseline();
    const validation = validateDependencySchedule(buildDependencySchedule(identity, sequence));
    expect(validation.certification_state).toBe("PASS");
    expect(validation.failures).toEqual([]);
    expect(validation.ready_for_execution_monitor).toBe(true);
  });

  it.each([
    ["INVALID_TASK_SEQUENCE", "INVALID_TASK_SEQUENCE"],
    ["MISSING_DEPENDENCY", "MISSING_DEPENDENCY"],
    ["CIRCULAR_DEPENDENCY", "CIRCULAR_DEPENDENCY"],
    ["DEPENDENCY_TIMEOUT", "DEPENDENCY_TIMEOUT"],
    ["DEPENDENCY_VIOLATION", "DEPENDENCY_VIOLATION"],
    ["RESOURCE_CONFLICT", "RESOURCE_CONFLICT"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_FAILURE"],
    ["APPROVAL_MISSING", "APPROVAL_MISSING"],
    ["EXTERNAL_PREREQUISITE_MISSING", "EXTERNAL_PREREQUISITE_MISSING"],
    ["POLICY_VIOLATION", "POLICY_VIOLATION"],
    ["SYNC_BARRIER_UNSATISFIED", "SYNC_BARRIER_UNSATISFIED"],
    ["CHECKPOINT_MISSING", "CHECKPOINT_DEPENDENCY_MISSING"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LINEAGE_BROKEN", "LINEAGE_BROKEN"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [DependencySchedulerScenario, DependencySchedulerFailureReason][])("rejects scheduler scenario %s", (scenario, reason) => {
    const { identity, sequence } = buildBaseline();
    const validation = validateDependencySchedule(buildDependencySchedule(identity, sequence, scenario));
    expect(validation.certification_state).toBe("FAIL");
    expect(validation.failures).toContain(reason);
  });

  it("generates deterministic advisory recovery recommendations for blocked dependencies", () => {
    const { identity, sequence } = buildBaseline();
    const schedule = buildDependencySchedule(identity, sequence, "RESOURCE_CONFLICT");
    expect(schedule.blocked_tasks.length).toBeGreaterThan(0);
    expect(schedule.recovery_recommendations.map((item) => item.recommendation_type)).toContain("SCHEDULE_ALTERNATIVE_RESOURCE");
    expect(schedule.recovery_recommendations.every((item) => item.advisory_only)).toBe(true);
  });

  it("allows conditional monitoring gaps without invalidating readiness model", () => {
    const { identity, sequence } = buildBaseline();
    const validation = validateDependencySchedule(buildDependencySchedule(identity, sequence, "CONDITIONAL_MONITORING_GAP"));
    expect(validation.certification_state).toBe("CONDITIONAL_PASS");
    expect(validation.warnings).toContain("MONITORING_GAP");
    expect(validation.ready_for_execution_monitor).toBe(true);
  });

  it("replays a dependency schedule deterministically", () => {
    const { identity, sequence } = buildBaseline();
    const schedule = buildDependencySchedule(identity, sequence);
    const replay = replayDependencySchedule(schedule);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.replay_ready_tasks).toEqual(schedule.ready_tasks);
    expect(replay.replay_blocked_tasks).toEqual([]);
  });

  it("exposes dependency scheduler visibility", () => {
    const { identity, sequence } = buildBaseline();
    const schedule = buildDependencySchedule(identity, sequence);
    const visibility = buildDependencyScheduleVisibilitySurface(schedule);
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.dependency_status).toBe("READY");
    expect(visibility.dependency_count).toBe(schedule.dependency_registry.length);
  });

  it("publishes aggregate dependency scheduler framework", () => {
    const framework = getDependencySchedulerFramework();
    expect(framework.sequence_validation.certification_state).toBe("PASS");
    expect(framework.validation.certification_state).toBe("PASS");
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.integrity_status).toBe("VALID");
  });
});
