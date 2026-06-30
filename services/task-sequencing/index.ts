import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow, validateOrchestration } from "@/services/workflow-orchestrator";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { OrchestratedWorkflow } from "@/types/workflow-orchestrator";
import type {
  ApprovalRequirement,
  ConditionalRule,
  GateRequirement,
  SequenceEvent,
  SequencedTask,
  SequencedTaskType,
  SequencingParallelGroup,
  TaskClassification,
  TaskSequencePackage,
  TaskSequenceReplayResult,
  TaskSequenceValidationResult,
  TaskSequenceVisibilitySurface,
  TaskSequencingCertificationState,
  TaskSequencingFailureReason,
  TaskSequencingFramework,
  TaskSequencingScenario,
} from "@/types/task-sequencing";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function uniqueFailures(values: readonly TaskSequencingFailureReason[]): readonly TaskSequencingFailureReason[] {
  return freezeArray([...new Set(values)]);
}

function defaultWorkflow(identity: AutonomyIdentityRecord) {
  const contract = buildExecutionContract(identity);
  return activateWorkflow(identity, contract);
}

function workflowTasks(workflow: OrchestratedWorkflow): readonly string[] {
  return freezeArray([...new Set([workflow.current_task, ...workflow.completed_tasks, ...workflow.pending_tasks].filter(Boolean) as string[])].sort());
}

function taskType(index: number): SequencedTaskType {
  return (["APPROVAL", "GATED", "SEQUENTIAL", "PARALLEL", "CONDITIONAL", "SYNCHRONIZATION", "CHECKPOINT", "RECOVERY"] as const)[index % 8];
}

export function classifyWorkflowTasks(workflow: OrchestratedWorkflow, scenario: TaskSequencingScenario = "BASELINE"): readonly TaskClassification[] {
  if (scenario === "MISSING_TASK_CLASSIFICATION") return freezeArray([]);
  return freezeArray(workflowTasks(workflow).map((taskId, index) => Object.freeze({
    task_id: taskId,
    task_type: taskType(index),
    execution_stage: index + 1,
    dependency_profile: freezeArray(workflow.active_dependencies.filter((_, depIndex) => depIndex <= index)),
    governance_requirements: scenario === "GOVERNANCE_VIOLATION" ? freezeArray<string>([]) : freezeArray([workflow.governance_reference]),
    authority_requirements: scenario === "INVALID_AUTHORITY" ? freezeArray<string>([]) : freezeArray([workflow.authority_reference]),
    scheduling_metadata: freezeArray([`stage:${index + 1}`, `workflow:${workflow.workflow_id}`]),
  })));
}

function buildSequencedTasks(workflow: OrchestratedWorkflow, classifications: readonly TaskClassification[], scenario: TaskSequencingScenario): readonly SequencedTask[] {
  const ordered = scenario === "NONDETERMINISTIC_ORDERING" || scenario === "DEPENDENCY_VIOLATION" ? freezeArray([...classifications].reverse()) : classifications;
  const maybeMissing = scenario === "MISSING_TASK" ? ordered.slice(1) : ordered;
  const duplicated = scenario === "DUPLICATE_SCHEDULING" && maybeMissing.length ? [...maybeMissing, maybeMissing[0]] : maybeMissing;
  return freezeArray(duplicated.map((classification, index) => Object.freeze({
    sequence_task_id: id("ST", "sequence-task-id", { sequence: workflow.workflow_id, task: classification.task_id, index, scenario }),
    task_id: classification.task_id,
    sequence_index: index + 1,
    execution_stage: classification.execution_stage,
    task_type: classification.task_type,
    eligibility_state: scenario === "CONDITIONAL_BLOCKED" && classification.task_type === "CONDITIONAL" ? "BLOCKED" as const : "ELIGIBLE" as const,
    dependency_refs: classification.dependency_profile,
    gate_refs: classification.governance_requirements,
    approval_refs: classification.task_type === "APPROVAL" && scenario !== "MISSING_APPROVAL" ? freezeArray([`approval:${classification.task_id}`]) : freezeArray<string>([]),
    lineage_reference: scenario === "LINEAGE_BROKEN" ? "" : workflow.lineage.lineage_id,
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : workflow.replay_reference,
  })));
}

function buildParallelGroups(workflow: OrchestratedWorkflow, tasks: readonly SequencedTask[], scenario: TaskSequencingScenario): readonly SequencingParallelGroup[] {
  const parallel = tasks.filter((task) => task.task_type === "PARALLEL" || task.task_type === "SYNCHRONIZATION");
  const groupTasks = parallel.length ? parallel.map((task) => task.task_id).sort() : tasks.slice(0, 2).map((task) => task.task_id).sort();
  return freezeArray([Object.freeze({
    parallel_group_id: id("SPG", "sequence-parallel-group-id", { workflow: workflow.workflow_id, scenario }),
    branch_id: "branch:primary",
    task_ids: freezeArray(groupTasks),
    synchronization_barrier: workflow.synchronization_points[0]?.synchronization_id ?? "",
    deterministic_order: freezeArray(groupTasks),
    conflict_state: scenario === "SYNCHRONIZATION_FAILURE" ? "CONFLICT" as const : scenario === "RACE_CONDITION" ? "RACE" as const : "CLEAR" as const,
  })]);
}

function buildGates(tasks: readonly SequencedTask[], workflow: OrchestratedWorkflow, scenario: TaskSequencingScenario): readonly GateRequirement[] {
  return freezeArray(tasks.filter((task) => ["GATED", "APPROVAL", "CONDITIONAL"].includes(task.task_type)).map((task) => Object.freeze({
    gate_id: id("SG", "sequence-gate-id", { task: task.task_id, scenario }),
    gate_type: task.task_type === "APPROVAL" ? "OPERATOR_APPROVAL" as const : "GOVERNANCE" as const,
    task_id: task.task_id,
    validation_reference: scenario === "SKIPPED_GATE" ? "" : workflow.governance_reference,
    satisfied: scenario !== "SKIPPED_GATE" && Boolean(workflow.governance_reference),
  })));
}

function buildConditionals(tasks: readonly SequencedTask[], scenario: TaskSequencingScenario): readonly ConditionalRule[] {
  return freezeArray(tasks.filter((task) => task.task_type === "CONDITIONAL").map((task) => Object.freeze({
    rule_id: id("SCR", "sequence-conditional-rule-id", { task: task.task_id, scenario }),
    task_id: task.task_id,
    condition: "dependencies satisfied and governance state valid",
    evaluation_state: scenario === "CONDITIONAL_BLOCKED" ? "BLOCKED" as const : "ELIGIBLE" as const,
    evidence_ref: `evidence:${task.task_id}:condition`,
  })));
}

function buildApprovals(tasks: readonly SequencedTask[], scenario: TaskSequencingScenario): readonly ApprovalRequirement[] {
  return freezeArray(tasks.filter((task) => task.task_type === "APPROVAL").map((task) => Object.freeze({
    approval_id: id("SA", "sequence-approval-id", { task: task.task_id, scenario }),
    task_id: task.task_id,
    approval_type: "OPERATOR" as const,
    approval_reference: scenario === "MISSING_APPROVAL" ? "" : `approval:${task.task_id}`,
    approval_state: scenario === "MISSING_APPROVAL" ? "PENDING" as const : "APPROVED" as const,
    approval_lineage: task.lineage_reference,
  })));
}

function eventHash(event: Omit<SequenceEvent, "integrity_hash">): string {
  return hashValue("sequence-event", event);
}

function buildSequenceEvents(tasks: readonly SequencedTask[], workflow: OrchestratedWorkflow, scenario: TaskSequencingScenario): readonly SequenceEvent[] {
  const eventTypes: SequenceEvent["event_type"][] = ["TASK_CLASSIFIED", "DEPENDENCY_RESOLVED", "GATE_VALIDATED", "TASK_SCHEDULED", "PARALLEL_GROUP_FORMED", "APPROVAL_SCHEDULED", "SEQUENCE_VALIDATED", "SEQUENCE_PUBLISHED"];
  return freezeArray(eventTypes.map((eventType, index) => {
    const source = {
      sequence_event_id: id("SEV", "sequence-event-id", { workflow: workflow.workflow_id, eventType, index, scenario }),
      event_order: index + 1,
      event_type: eventType,
      task_id: tasks[index % Math.max(1, tasks.length)]?.task_id ?? null,
      governance_reference: scenario === "GOVERNANCE_VIOLATION" ? "" : workflow.governance_reference,
      replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : workflow.replay_reference,
      lineage_reference: scenario === "LINEAGE_BROKEN" ? "" : workflow.lineage.lineage_id,
    };
    return Object.freeze({ ...source, integrity_hash: eventHash(source) });
  }));
}

function packageHashSource(sequence: Omit<TaskSequencePackage, "integrity_hash"> | TaskSequencePackage) {
  return {
    sequence_id: sequence.sequence_id,
    execution_id: sequence.execution_id,
    workflow_id: sequence.workflow_id,
    task_order: sequence.task_order.map((task) => ({ task: task.task_id, index: task.sequence_index, state: task.eligibility_state })),
    parallel_groups: sequence.parallel_groups,
    gate_requirements: sequence.gate_requirements,
    conditional_rules: sequence.conditional_rules,
    approval_requirements: sequence.approval_requirements,
    current_sequence_state: sequence.current_sequence_state,
    sequence_events: sequence.sequence_events.map((event) => ({ id: event.sequence_event_id, hash: event.integrity_hash })),
    scheduling_ledger: sequence.scheduling_ledger,
    governance_reference: sequence.governance_reference,
    authority_reference: sequence.authority_reference,
    lineage_reference: sequence.lineage_reference,
    replay_reference: sequence.replay_reference,
    workflow_hash: sequence.source_workflow.integrity_hash,
  };
}

export function computeTaskSequenceHash(sequence: Omit<TaskSequencePackage, "integrity_hash"> | TaskSequencePackage): string {
  return hashValue("task-sequence-package", packageHashSource(sequence));
}

export function generateTaskSequence(identity = generateAutonomyIdentity(), workflow?: OrchestratedWorkflow, scenario: TaskSequencingScenario = "BASELINE"): TaskSequencePackage {
  const sourceWorkflow = workflow ?? defaultWorkflow(identity);
  const classifications = classifyWorkflowTasks(sourceWorkflow, scenario);
  const tasks = buildSequencedTasks(sourceWorkflow, classifications, scenario);
  const parallelGroups = buildParallelGroups(sourceWorkflow, tasks, scenario);
  const gates = buildGates(tasks, sourceWorkflow, scenario);
  const conditionals = buildConditionals(tasks, scenario);
  const approvals = buildApprovals(tasks, scenario);
  const events = buildSequenceEvents(tasks, sourceWorkflow, scenario);
  const blocked = freezeArray(tasks.filter((task) => task.eligibility_state === "BLOCKED").map((task) => task.task_id));
  const base = {
    sequence_id: id("TSQ", "task-sequence-id", { workflow: sourceWorkflow.workflow_id, scenario }),
    execution_id: sourceWorkflow.execution_id,
    workflow_id: sourceWorkflow.workflow_id,
    sequence_version: "8C.3.0",
    task_classifications: classifications,
    task_order: tasks,
    parallel_groups: parallelGroups,
    dependency_graph: freezeArray(sourceWorkflow.active_dependencies),
    gate_requirements: gates,
    conditional_rules: conditionals,
    approval_requirements: approvals,
    current_sequence_state: blocked.length ? "REJECTED" as const : "PUBLISHED" as const,
    completed_tasks: sourceWorkflow.completed_tasks,
    pending_tasks: sourceWorkflow.pending_tasks,
    blocked_tasks: blocked,
    synchronization_points: freezeArray(sourceWorkflow.synchronization_points.map((point) => point.synchronization_id)),
    sequence_events: events,
    scheduling_ledger: scenario === "CONDITIONAL_LEDGER_GAP" ? freezeArray([]) : freezeArray(events.map((event) => Object.freeze({
      ledger_entry_id: id("SLE", "scheduling-ledger-entry-id", event.sequence_event_id),
      decision: event.event_type.toLowerCase(),
      task_id: event.task_id,
      sequence_reference: event.sequence_event_id,
      governance_reference: event.governance_reference,
      replay_reference: event.replay_reference,
      lineage_reference: event.lineage_reference,
    }))),
    governance_reference: scenario === "GOVERNANCE_VIOLATION" ? "" : sourceWorkflow.governance_reference,
    authority_reference: scenario === "INVALID_AUTHORITY" ? "" : sourceWorkflow.authority_reference,
    lineage_reference: scenario === "LINEAGE_BROKEN" ? "" : sourceWorkflow.lineage.lineage_id,
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : sourceWorkflow.replay_reference,
    source_workflow: scenario === "INVALID_WORKFLOW" ? Object.freeze({ ...sourceWorkflow, integrity_hash: "invalid" }) : sourceWorkflow,
  };
  const sequence = Object.freeze({ ...base, integrity_hash: computeTaskSequenceHash(base) });
  if (scenario !== "INTEGRITY_MISMATCH") return sequence;
  return Object.freeze({ ...sequence, integrity_hash: "tampered" });
}

function sequenceFailures(sequence: TaskSequencePackage): TaskSequencingFailureReason[] {
  const failures: TaskSequencingFailureReason[] = [];
  const workflowValidation = validateOrchestration(sequence.source_workflow);
  if (workflowValidation.certification_state === "FAIL") failures.push("INVALID_WORKFLOW");
  if (sequence.task_classifications.length === 0) failures.push("TASK_CLASSIFICATION_MISSING");
  const taskIds = sequence.task_order.map((task) => task.task_id);
  if (new Set(taskIds).size !== taskIds.length) failures.push("DUPLICATE_TASK_SCHEDULING");
  const classified = new Set(sequence.task_classifications.map((item) => item.task_id));
  if ([...classified].some((task) => !taskIds.includes(task)) || taskIds.length < classified.size) failures.push("MISSING_TASK");
  const expected = [...classified].sort();
  if (taskIds.length === expected.length && taskIds.join("|") !== expected.join("|")) failures.push("NONDETERMINISTIC_ORDERING");
  if (sequence.task_order.some((task) => task.sequence_index < task.execution_stage && task.execution_stage > 1)) failures.push("DEPENDENCY_ORDER_VIOLATION");
  if (sequence.gate_requirements.some((gate) => !gate.satisfied || !gate.validation_reference)) failures.push("GATE_SKIPPED");
  if (!sequence.governance_reference || sequence.sequence_events.some((event) => !event.governance_reference)) failures.push("GOVERNANCE_VIOLATION");
  if (!sequence.authority_reference) failures.push("INVALID_AUTHORITY");
  if (sequence.approval_requirements.some((approval) => approval.approval_state !== "APPROVED" || !approval.approval_reference)) failures.push("APPROVAL_MISSING");
  if (sequence.conditional_rules.some((rule) => rule.evaluation_state === "BLOCKED")) failures.push("CONDITIONAL_RULE_UNSATISFIED");
  if (sequence.parallel_groups.some((group) => group.conflict_state === "CONFLICT")) failures.push("SYNCHRONIZATION_FAILURE");
  if (sequence.parallel_groups.some((group) => group.conflict_state === "RACE")) failures.push("RACE_CONDITION");
  if (!sequence.replay_reference || sequence.task_order.some((task) => !task.replay_reference) || sequence.sequence_events.some((event) => !event.replay_reference)) failures.push("REPLAY_DIVERGENCE");
  if (!sequence.lineage_reference || sequence.task_order.some((task) => !task.lineage_reference) || sequence.sequence_events.some((event) => !event.lineage_reference)) failures.push("LINEAGE_BROKEN");
  if (sequence.scheduling_ledger.length === 0) failures.push("LEDGER_GAP");
  if (sequence.sequence_events.some((event) => {
    const source = {
      sequence_event_id: event.sequence_event_id,
      event_order: event.event_order,
      event_type: event.event_type,
      task_id: event.task_id,
      governance_reference: event.governance_reference,
      replay_reference: event.replay_reference,
      lineage_reference: event.lineage_reference,
    };
    return eventHash(source) !== event.integrity_hash;
  })) failures.push("INTEGRITY_HASH_MISMATCH");
  if (computeTaskSequenceHash(sequence) !== sequence.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return failures;
}

export function validateTaskSequence(sequence: TaskSequencePackage): TaskSequenceValidationResult {
  const failures = uniqueFailures(sequenceFailures(sequence));
  const warnings = failures.includes("LEDGER_GAP") ? freezeArray<TaskSequencingFailureReason>(["LEDGER_GAP"]) : freezeArray<TaskSequencingFailureReason>([]);
  const hardFailures = failures.filter((failure) => failure !== "LEDGER_GAP");
  const certification: TaskSequencingCertificationState = hardFailures.length ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  const has = (reason: TaskSequencingFailureReason) => failures.includes(reason);
  const source = { sequence: sequence.sequence_id, certification, failures, warnings };
  return Object.freeze({
    validation_id: id("TSV", "task-sequence-validation-id", source),
    sequence_id: sequence.sequence_id,
    certification_state: certification,
    failures,
    warnings,
    task_classification_complete: !has("TASK_CLASSIFICATION_MISSING"),
    deterministic_ordering_valid: !has("NONDETERMINISTIC_ORDERING") && !has("DUPLICATE_TASK_SCHEDULING") && !has("MISSING_TASK"),
    dependency_preservation_valid: !has("DEPENDENCY_ORDER_VIOLATION"),
    governance_gates_enforced: !has("GATE_SKIPPED") && !has("GOVERNANCE_VIOLATION"),
    approvals_scheduled: !has("APPROVAL_MISSING"),
    synchronization_valid: !has("SYNCHRONIZATION_FAILURE") && !has("RACE_CONDITION"),
    replay_consistency_valid: !has("REPLAY_DIVERGENCE"),
    ledger_complete: !has("LEDGER_GAP"),
    ready_for_dependency_scheduler: certification === "PASS" || certification === "CONDITIONAL_PASS",
    validation_hash: hashValue("task-sequence-validation", source),
  });
}

export function replayTaskSequence(sequence: TaskSequencePackage): TaskSequenceReplayResult {
  const failures: TaskSequencingFailureReason[] = [];
  if (computeTaskSequenceHash(sequence) !== sequence.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!sequence.replay_reference) failures.push("REPLAY_DIVERGENCE");
  const source = {
    replay_id: id("TSR", "task-sequence-replay-id", sequence.sequence_id),
    sequence_id: sequence.sequence_id,
    replay_task_order: freezeArray(sequence.task_order.map((task) => task.task_id)),
    replay_parallel_groups: freezeArray(sequence.parallel_groups.map((group) => group.parallel_group_id)),
    replay_event_order: freezeArray(sequence.sequence_events.map((event) => event.event_type)),
    validation_state: failures.length ? "FAIL" as const : validateTaskSequence(sequence).certification_state,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("task-sequence-replay", source) });
}

export function buildTaskSequenceVisibilitySurface(sequence: TaskSequencePackage): TaskSequenceVisibilitySurface {
  const validation = validateTaskSequence(sequence);
  return Object.freeze({
    sequence_id: sequence.sequence_id,
    workflow_id: sequence.workflow_id,
    execution_id: sequence.execution_id,
    sequence_state: sequence.current_sequence_state,
    task_order: freezeArray(sequence.task_order.map((task) => task.task_id)),
    eligible_tasks: freezeArray(sequence.task_order.filter((task) => task.eligibility_state === "ELIGIBLE").map((task) => task.task_id)),
    blocked_tasks: sequence.blocked_tasks,
    pending_tasks: sequence.pending_tasks,
    parallel_groups: freezeArray(sequence.parallel_groups.map((group) => group.task_ids)),
    gate_count: sequence.gate_requirements.length,
    approval_count: sequence.approval_requirements.length,
    failure_reasons: validation.failures,
    integrity_status: validation.failures.includes("INTEGRITY_HASH_MISMATCH") ? "INVALID" : "VALID",
  });
}

export function getTaskSequencingFramework(): TaskSequencingFramework {
  const identity = generateAutonomyIdentity();
  const workflow = defaultWorkflow(identity);
  const sequence = generateTaskSequence(identity, workflow);
  return Object.freeze({
    identity,
    workflow_validation: validateOrchestration(workflow),
    sequence,
    validation: validateTaskSequence(sequence),
    replay: replayTaskSequence(sequence),
    visibility: buildTaskSequenceVisibilitySurface(sequence),
  });
}
