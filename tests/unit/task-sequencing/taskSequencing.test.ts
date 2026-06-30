import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import {
  buildTaskSequenceVisibilitySurface,
  classifyWorkflowTasks,
  computeTaskSequenceHash,
  generateTaskSequence,
  getTaskSequencingFramework,
  replayTaskSequence,
  validateTaskSequence,
} from "@/services/task-sequencing";
import type { TaskSequencingFailureReason, TaskSequencingScenario } from "@/types/task-sequencing";

function buildBaseline() {
  const identity = generateAutonomyIdentity();
  const workflow = activateWorkflow(identity, buildExecutionContract(identity));
  return { identity, workflow };
}

describe("Mission Control Phase 8C.3 Task Sequencing Engine", () => {
  it("classifies every workflow task deterministically", () => {
    const { workflow } = buildBaseline();
    const classifications = classifyWorkflowTasks(workflow);
    expect(classifications.length).toBeGreaterThan(0);
    expect(classifications.map((item) => item.task_id)).toEqual([...classifications.map((item) => item.task_id)].sort());
    expect(classifications.every((item) => item.governance_requirements.length > 0)).toBe(true);
  });

  it("generates a deterministic task sequence with gates, approvals, and ledger entries", () => {
    const { identity, workflow } = buildBaseline();
    const sequence = generateTaskSequence(identity, workflow);
    expect(sequence.current_sequence_state).toBe("PUBLISHED");
    expect(sequence.task_order.map((task) => task.task_id)).toEqual(sequence.task_classifications.map((item) => item.task_id));
    expect(sequence.gate_requirements.length).toBeGreaterThan(0);
    expect(sequence.approval_requirements.length).toBeGreaterThan(0);
    expect(sequence.scheduling_ledger).toHaveLength(sequence.sequence_events.length);
    expect(computeTaskSequenceHash(sequence)).toBe(sequence.integrity_hash);
  });

  it("coordinates parallel groups deterministically", () => {
    const { identity, workflow } = buildBaseline();
    const sequence = generateTaskSequence(identity, workflow);
    expect(sequence.parallel_groups).toHaveLength(1);
    expect(sequence.parallel_groups[0].deterministic_order).toEqual([...sequence.parallel_groups[0].task_ids].sort());
    expect(sequence.parallel_groups[0].conflict_state).toBe("CLEAR");
  });

  it("validates a baseline sequence for dependency scheduling", () => {
    const { identity, workflow } = buildBaseline();
    const validation = validateTaskSequence(generateTaskSequence(identity, workflow));
    expect(validation.certification_state).toBe("PASS");
    expect(validation.failures).toEqual([]);
    expect(validation.ready_for_dependency_scheduler).toBe(true);
  });

  it.each([
    ["INVALID_WORKFLOW", "INVALID_WORKFLOW"],
    ["MISSING_TASK_CLASSIFICATION", "TASK_CLASSIFICATION_MISSING"],
    ["NONDETERMINISTIC_ORDERING", "NONDETERMINISTIC_ORDERING"],
    ["DEPENDENCY_VIOLATION", "DEPENDENCY_ORDER_VIOLATION"],
    ["DUPLICATE_SCHEDULING", "DUPLICATE_TASK_SCHEDULING"],
    ["MISSING_TASK", "MISSING_TASK"],
    ["SKIPPED_GATE", "GATE_SKIPPED"],
    ["MISSING_APPROVAL", "APPROVAL_MISSING"],
    ["INVALID_AUTHORITY", "INVALID_AUTHORITY"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION"],
    ["CONDITIONAL_BLOCKED", "CONDITIONAL_RULE_UNSATISFIED"],
    ["SYNCHRONIZATION_FAILURE", "SYNCHRONIZATION_FAILURE"],
    ["RACE_CONDITION", "RACE_CONDITION"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["LINEAGE_BROKEN", "LINEAGE_BROKEN"],
    ["INTEGRITY_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [TaskSequencingScenario, TaskSequencingFailureReason][])("rejects sequencing scenario %s", (scenario, reason) => {
    const { identity, workflow } = buildBaseline();
    const validation = validateTaskSequence(generateTaskSequence(identity, workflow, scenario));
    expect(validation.certification_state).toBe("FAIL");
    expect(validation.failures).toContain(reason);
  });

  it("allows conditional ledger gaps without invalidating deterministic order", () => {
    const { identity, workflow } = buildBaseline();
    const validation = validateTaskSequence(generateTaskSequence(identity, workflow, "CONDITIONAL_LEDGER_GAP"));
    expect(validation.certification_state).toBe("CONDITIONAL_PASS");
    expect(validation.warnings).toContain("LEDGER_GAP");
    expect(validation.ready_for_dependency_scheduler).toBe(true);
  });

  it("replays a task sequence deterministically", () => {
    const { identity, workflow } = buildBaseline();
    const sequence = generateTaskSequence(identity, workflow);
    const replay = replayTaskSequence(sequence);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.replay_task_order).toEqual(sequence.task_order.map((task) => task.task_id));
    expect(replay.replay_event_order).toEqual(sequence.sequence_events.map((event) => event.event_type));
  });

  it("exposes task sequence visibility", () => {
    const { identity, workflow } = buildBaseline();
    const sequence = generateTaskSequence(identity, workflow);
    const visibility = buildTaskSequenceVisibilitySurface(sequence);
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.task_order).toEqual(sequence.task_order.map((task) => task.task_id));
    expect(visibility.gate_count).toBe(sequence.gate_requirements.length);
  });

  it("publishes aggregate task sequencing framework", () => {
    const framework = getTaskSequencingFramework();
    expect(framework.workflow_validation.certification_state).toBe("PASS");
    expect(framework.validation.certification_state).toBe("PASS");
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.integrity_status).toBe("VALID");
  });
});
