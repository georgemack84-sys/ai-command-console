import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence } from "@/services/task-sequencing";
import { buildDependencySchedule } from "@/services/dependency-scheduler";
import { buildExecutionMonitor } from "@/services/execution-monitor";
import {
  buildCheckpointManager,
  buildCheckpointVisibilitySurface,
  computeCheckpointHash,
  computeCheckpointManagerHash,
  getCheckpointManagerFramework,
  replayCheckpointManager,
  validateCheckpointManager,
} from "@/services/checkpoint-manager";
import type { CheckpointFailureReason, CheckpointManagerScenario } from "@/types/checkpoint-manager";

function buildBaseline() {
  const identity = generateAutonomyIdentity();
  const workflow = activateWorkflow(identity, buildExecutionContract(identity));
  const sequence = generateTaskSequence(identity, workflow);
  const schedule = buildDependencySchedule(identity, sequence);
  const monitor = buildExecutionMonitor(identity, schedule);
  return { identity, monitor };
}

describe("Mission Control Phase 8C.6 Checkpoint Manager", () => {
  it("creates immutable certified recovery points without executing recovery", () => {
    const { identity, monitor } = buildBaseline();
    const manager = buildCheckpointManager(identity, monitor);
    expect(manager.lifecycle_state).toBe("AVAILABLE");
    expect(manager.checkpoints).toHaveLength(3);
    expect(manager.advisory_only).toBe(true);
    expect(manager.recovery_executed).toBe(false);
    expect(manager.rollback_executed).toBe(false);
    expect(manager.recovery_snapshot.recovery_enabled).toBe(false);
    expect(computeCheckpointManagerHash(manager)).toBe(manager.integrity_hash);
  });

  it("captures complete execution, workflow, dependency, governance, authority, and approval state", () => {
    const { identity, monitor } = buildBaseline();
    const checkpoint = buildCheckpointManager(identity, monitor).checkpoints[0];
    expect(checkpoint.execution_state.execution_id).toBe(monitor.execution_id);
    expect(checkpoint.workflow_state.workflow_id).toBe(monitor.workflow_id);
    expect(checkpoint.dependency_state.dependency_graph_ref).toMatch(/^DG-/);
    expect(checkpoint.governance_snapshot.policy_snapshot_ref).toBe(monitor.governance_reference);
    expect(checkpoint.authority_snapshot.authorization_refs).toContain(monitor.authority_reference);
    expect(checkpoint.operator_approvals.completed_approvals).toEqual([]);
    expect(checkpoint.rollback_reference.recovery_eligibility).toBe(true);
    expect(computeCheckpointHash(checkpoint)).toBe(checkpoint.integrity_hash);
  });

  it("validates baseline checkpoints for rollback preparation", () => {
    const { identity, monitor } = buildBaseline();
    const validation = validateCheckpointManager(buildCheckpointManager(identity, monitor));
    expect(validation.certification_state).toBe("PASS");
    expect(validation.failures).toEqual([]);
    expect(validation.ready_for_rollback_preparation).toBe(true);
  });

  it.each([
    ["INVALID_MONITOR", "INVALID_EXECUTION_MONITOR"],
    ["MISSING_EXECUTION_STATE", "EXECUTION_STATE_INCOMPLETE"],
    ["MISSING_WORKFLOW_STATE", "WORKFLOW_STATE_INCOMPLETE"],
    ["MISSING_DEPENDENCY_STATE", "DEPENDENCY_STATE_INCOMPLETE"],
    ["MISSING_RESOURCE_STATE", "RESOURCE_STATE_INCOMPLETE"],
    ["MISSING_GOVERNANCE_SNAPSHOT", "GOVERNANCE_SNAPSHOT_MISSING"],
    ["MISSING_AUTHORITY_SNAPSHOT", "AUTHORITY_SNAPSHOT_MISSING"],
    ["MISSING_ROLLBACK_REFERENCE", "ROLLBACK_REFERENCE_MISSING"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["LINEAGE_BROKEN", "LINEAGE_BROKEN"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["CHECKPOINT_CORRUPTION", "CHECKPOINT_CORRUPTED"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_INCOMPATIBLE", "REPLAY_INCOMPATIBLE"],
    ["DUPLICATE_CHECKPOINT", "DUPLICATE_CHECKPOINT"],
    ["CHECKPOINT_ORDER_VIOLATION", "CHECKPOINT_ORDER_VIOLATION"],
  ] as readonly [CheckpointManagerScenario, CheckpointFailureReason][])("detects checkpoint scenario %s", (scenario, reason) => {
    const { identity, monitor } = buildBaseline();
    const validation = validateCheckpointManager(buildCheckpointManager(identity, monitor, scenario));
    expect(validation.certification_state).toBe("FAIL");
    expect(validation.failures).toContain(reason);
  });

  it("allows conditional retention gaps without enabling recovery", () => {
    const { identity, monitor } = buildBaseline();
    const manager = buildCheckpointManager(identity, monitor, "CONDITIONAL_RETENTION_GAP");
    const validation = validateCheckpointManager(manager);
    expect(validation.certification_state).toBe("CONDITIONAL_PASS");
    expect(validation.warnings).toContain("RETENTION_POLICY_GAP");
    expect(validation.recovery_not_executed).toBe(true);
    expect(manager.recovery_snapshot.recovery_enabled).toBe(false);
  });

  it("replays checkpoint order deterministically", () => {
    const { identity, monitor } = buildBaseline();
    const manager = buildCheckpointManager(identity, monitor);
    const replay = replayCheckpointManager(manager);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.replay_checkpoint_order).toEqual(manager.checkpoints.map((checkpoint) => checkpoint.checkpoint_id));
    expect(replay.replay_dependency_refs).toEqual(manager.checkpoints.map((checkpoint) => checkpoint.dependency_state.dependency_graph_ref));
  });

  it("publishes checkpoint registry and visibility surfaces", () => {
    const { identity, monitor } = buildBaseline();
    const manager = buildCheckpointManager(identity, monitor);
    const visibility = buildCheckpointVisibilitySurface(manager);
    expect(manager.registry.checkpoint_catalog).toHaveLength(manager.checkpoints.length);
    expect(manager.registry.immutable_storage).toBe(true);
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.recovery_enabled).toBe(false);
    expect(visibility.certified_checkpoint_ids).toEqual(manager.checkpoints.map((checkpoint) => checkpoint.checkpoint_id));
  });

  it("publishes aggregate checkpoint manager framework", () => {
    const framework = getCheckpointManagerFramework();
    expect(framework.execution_monitor_validation.certification_state).toBe("PASS");
    expect(framework.validation.certification_state).toBe("PASS");
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.integrity_status).toBe("VALID");
  });
});
