import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence } from "@/services/task-sequencing";
import { buildDependencySchedule } from "@/services/dependency-scheduler";
import {
  buildExecutionMonitor,
  buildExecutionMonitorVisibilitySurface,
  computeExecutionMonitorHash,
  getExecutionMonitorFramework,
  replayExecutionMonitor,
  validateExecutionMonitor,
} from "@/services/execution-monitor";
import type { ExecutionMonitorFailureReason, ExecutionMonitorScenario } from "@/types/execution-monitor";

function buildBaseline() {
  const identity = generateAutonomyIdentity();
  const workflow = activateWorkflow(identity, buildExecutionContract(identity));
  const sequence = generateTaskSequence(identity, workflow);
  const schedule = buildDependencySchedule(identity, sequence);
  return { identity, schedule };
}

describe("Mission Control Phase 8C.5 Execution Monitor", () => {
  it("builds a healthy advisory execution monitor", () => {
    const { identity, schedule } = buildBaseline();
    const monitor = buildExecutionMonitor(identity, schedule);
    expect(monitor.monitoring_state).toBe("MONITORING");
    expect(monitor.execution_health).toBe("HEALTHY");
    expect(monitor.advisory_only).toBe(true);
    expect(monitor.execution_modified).toBe(false);
    expect(computeExecutionMonitorHash(monitor)).toBe(monitor.integrity_hash);
  });

  it("produces deterministic telemetry and health metrics", () => {
    const { identity, schedule } = buildBaseline();
    const monitor = buildExecutionMonitor(identity, schedule);
    expect(monitor.telemetry_events.map((event) => event.event_order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(monitor.health_metrics.map((metric) => metric.category)).toEqual(["EXECUTION", "ORCHESTRATION", "DEPENDENCY", "GOVERNANCE", "RESOURCE", "CHECKPOINT", "REPLAY"]);
    expect(monitor.progress_reports[0].progress_percentage).toBe(monitor.progress_percentage);
  });

  it("validates baseline monitoring for checkpoint management", () => {
    const { identity, schedule } = buildBaseline();
    const validation = validateExecutionMonitor(buildExecutionMonitor(identity, schedule));
    expect(validation.certification_state).toBe("PASS");
    expect(validation.failures).toEqual([]);
    expect(validation.ready_for_checkpoint_manager).toBe(true);
  });

  it.each([
    ["INVALID_DEPENDENCY_SCHEDULE", "INVALID_DEPENDENCY_SCHEDULE"],
    ["EXECUTION_DRIFT", "EXECUTION_DRIFT"],
    ["UNEXPECTED_STATE", "UNEXPECTED_STATE"],
    ["TASK_FAILURE", "TASK_FAILURE"],
    ["HUNG_WORKFLOW", "HUNG_WORKFLOW"],
    ["MISSED_CHECKPOINT", "MISSED_CHECKPOINT"],
    ["POLICY_VIOLATION", "POLICY_VIOLATION"],
    ["GOVERNANCE_DRIFT", "GOVERNANCE_DRIFT"],
    ["RESOURCE_DEGRADATION", "RESOURCE_DEGRADATION"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["DEPENDENCY_INCONSISTENCY", "DEPENDENCY_INCONSISTENCY"],
    ["SYNCHRONIZATION_FAILURE", "SYNCHRONIZATION_FAILURE"],
    ["OPERATOR_OVERRIDE", "OPERATOR_OVERRIDE_DETECTED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["LINEAGE_BROKEN", "LINEAGE_BROKEN"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [ExecutionMonitorScenario, ExecutionMonitorFailureReason][])("detects monitor scenario %s", (scenario, reason) => {
    const { identity, schedule } = buildBaseline();
    const validation = validateExecutionMonitor(buildExecutionMonitor(identity, schedule, scenario));
    expect(validation.certification_state).toBe("FAIL");
    expect(validation.failures).toContain(reason);
  });

  it("allows conditional telemetry gaps without granting control", () => {
    const { identity, schedule } = buildBaseline();
    const monitor = buildExecutionMonitor(identity, schedule, "CONDITIONAL_TELEMETRY_GAP");
    const validation = validateExecutionMonitor(monitor);
    expect(validation.certification_state).toBe("CONDITIONAL_PASS");
    expect(validation.warnings).toContain("TELEMETRY_GAP");
    expect(monitor.advisory_only).toBe(true);
    expect(monitor.execution_modified).toBe(false);
  });

  it("replays execution monitoring deterministically", () => {
    const { identity, schedule } = buildBaseline();
    const monitor = buildExecutionMonitor(identity, schedule);
    const replay = replayExecutionMonitor(monitor);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.replay_telemetry_order).toEqual(monitor.telemetry_events.map((event) => event.event_type));
    expect(replay.replay_health_categories).toEqual(monitor.health_metrics.map((metric) => metric.category));
  });

  it("exposes execution monitor visibility", () => {
    const { identity, schedule } = buildBaseline();
    const monitor = buildExecutionMonitor(identity, schedule);
    const visibility = buildExecutionMonitorVisibilitySurface(monitor);
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.execution_health).toBe("HEALTHY");
    expect(visibility.telemetry_count).toBe(monitor.telemetry_events.length);
  });

  it("publishes aggregate execution monitor framework", () => {
    const framework = getExecutionMonitorFramework();
    expect(framework.dependency_schedule_validation.certification_state).toBe("PASS");
    expect(framework.validation.certification_state).toBe("PASS");
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.integrity_status).toBe("VALID");
  });
});
