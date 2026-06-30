import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract, computeExecutionContractHash, validateExecutionContract } from "@/services/execution-contract";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { ExecutionContract } from "@/types/execution-contract";
import type {
  OrchestratedWorkflow,
  OrchestrationEvent,
  WorkflowCertificationState,
  WorkflowEventType,
  WorkflowFailureReason,
  WorkflowLineageRecord,
  WorkflowOrchestrationValidationResult,
  WorkflowOrchestratorFramework,
  WorkflowOrchestratorScenario,
  WorkflowReplayResult,
  WorkflowState,
  WorkflowSynchronizationPoint,
  WorkflowTransition,
  WorkflowVisibilitySurface,
} from "@/types/workflow-orchestrator";

const NOW = "2026-06-29T10:00:00.000Z";
const ALLOWED_TRANSITIONS: Readonly<Record<WorkflowState, readonly WorkflowState[]>> = Object.freeze({
  REGISTERED: ["ACTIVATED"],
  ACTIVATED: ["READY"],
  READY: ["RUNNING"],
  RUNNING: ["WAITING", "SYNCHRONIZING", "PAUSED", "COMPLETED", "FAILED"],
  WAITING: ["RESUMED"],
  SYNCHRONIZING: ["RESUMED"],
  PAUSED: ["RESUMED"],
  RESUMED: ["RUNNING", "COMPLETED"],
  COMPLETED: [],
  FAILED: ["ROLLED_BACK", "TERMINATED"],
  ROLLED_BACK: ["TERMINATED"],
  TERMINATED: [],
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function uniqueFailures(values: readonly WorkflowFailureReason[]): readonly WorkflowFailureReason[] {
  return freezeArray([...new Set(values)]);
}

function eventHash(event: Omit<OrchestrationEvent, "integrity_hash">): string {
  return hashValue("workflow-orchestration-event", event);
}

function buildTransition(workflowId: string, from: WorkflowState, to: WorkflowState, event: WorkflowEventType, order: number, contract: ExecutionContract, scenario: WorkflowOrchestratorScenario): WorkflowTransition {
  return Object.freeze({
    transition_id: id("WFT", "workflow-transition-id", { workflowId, from, to, order, scenario }),
    from_state: from,
    to_state: to,
    triggering_event: event,
    responsible_component: "workflow-orchestrator",
    authority_reference: scenario === "INVALID_AUTHORITY_SCOPE" ? "" : contract.authority_scope.authority_validation_reference,
    governance_validation: scenario === "MISSING_GOVERNANCE_APPROVAL" ? "" : contract.governance_references.governance_state,
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : contract.replay_reference.replay_reference,
    timestamp: NOW,
  });
}

function buildTransitions(workflowId: string, contract: ExecutionContract, scenario: WorkflowOrchestratorScenario): readonly WorkflowTransition[] {
  if (scenario === "ILLEGAL_TRANSITION") return freezeArray([buildTransition(workflowId, "REGISTERED", "RUNNING", "WORKFLOW_ACTIVATED", 1, contract, scenario)]);
  if (scenario === "SKIPPED_STATE") return freezeArray([buildTransition(workflowId, "REGISTERED", "READY", "WORKFLOW_ACTIVATED", 1, contract, scenario)]);
  const base = [
    buildTransition(workflowId, "REGISTERED", "ACTIVATED", "WORKFLOW_ACTIVATED", 1, contract, scenario),
    buildTransition(workflowId, "ACTIVATED", "READY", "DEPENDENCY_SATISFIED", 2, contract, scenario),
  ];
  if (scenario === "DUPLICATE_TRANSITION") return freezeArray([...base, base[0]]);
  return freezeArray(base);
}

function buildEvents(workflowId: string, transitions: readonly WorkflowTransition[], contract: ExecutionContract, scenario: WorkflowOrchestratorScenario): readonly OrchestrationEvent[] {
  if (scenario === "MISSING_EVENT") return freezeArray([]);
  const eventTransitions = scenario === "CONDITIONAL_TELEMETRY_GAP" ? transitions.slice(0, Math.max(0, transitions.length - 1)) : transitions;
  return freezeArray(eventTransitions.map((transition, index) => {
    const source = {
      event_id: id("WFE", "workflow-event-id", { workflowId, event: transition.triggering_event, index, scenario }),
      event_type: transition.triggering_event,
      event_order: index + 1,
      workflow_state: transition.to_state,
      task_id: contract.current_step.step_id || null,
      lineage_reference: scenario === "LINEAGE_BROKEN" ? "" : contract.lineage_reference,
      replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : contract.replay_reference.replay_reference,
      timestamp: NOW,
    };
    return Object.freeze({ ...source, integrity_hash: eventHash(source) });
  }));
}

function buildSynchronization(contract: ExecutionContract, scenario: WorkflowOrchestratorScenario): readonly WorkflowSynchronizationPoint[] {
  const syncs = contract.dependency_graph.synchronization_points.length ? contract.dependency_graph.synchronization_points : ["sync:1:serial"];
  return freezeArray(syncs.map((sync, index) => Object.freeze({
    synchronization_id: id("WFS", "workflow-sync-id", { sync, index, scenario }),
    dependent_tasks: scenario === "RACE_CONDITION" && index === 0 ? freezeArray([sync, "race:condition"]) : freezeArray([sync]),
    synchronization_state: scenario === "SYNCHRONIZATION_CONFLICT" ? "CONFLICT" as const : scenario === "DEADLOCK" ? "DEADLOCK" as const : scenario === "INCOMPLETE_DEPENDENCIES" ? "WAITING" as const : "READY" as const,
    governance_gate: scenario === "MISSING_GOVERNANCE_APPROVAL" ? "" : contract.governance_references.governance_state,
    checkpoint_reference: contract.checkpoint_list[index % Math.max(1, contract.checkpoint_list.length)]?.checkpoint_id ?? "",
    recovery_recommendation: scenario === "SYNCHRONIZATION_CONFLICT" || scenario === "DEADLOCK" ? "safe-stop and operator review" : null,
  })));
}

function lineageHash(source: Omit<WorkflowLineageRecord, "integrity_hash">): string {
  return hashValue("workflow-lineage", source);
}

function buildLineage(workflowId: string, transitions: readonly WorkflowTransition[], events: readonly OrchestrationEvent[], contract: ExecutionContract, scenario: WorkflowOrchestratorScenario): WorkflowLineageRecord {
  const source = {
    lineage_id: id("WFL", "workflow-lineage-id", { workflowId, scenario }),
    workflow_id: workflowId,
    transition_refs: freezeArray(transitions.map((transition) => transition.transition_id)),
    event_refs: freezeArray(events.map((event) => event.event_id)),
    governance_refs: scenario === "MISSING_GOVERNANCE_APPROVAL" ? freezeArray<string>([]) : freezeArray([contract.governance_references.governance_state]),
    operator_refs: freezeArray([contract.operator_information.operator_id]),
    replay_refs: scenario === "REPLAY_DIVERGENCE" || scenario === "LINEAGE_BROKEN" ? freezeArray<string>([]) : freezeArray([contract.replay_reference.replay_reference]),
  };
  return Object.freeze({ ...source, integrity_hash: lineageHash(source) });
}

function workflowHashSource(workflow: Omit<OrchestratedWorkflow, "integrity_hash"> | OrchestratedWorkflow) {
  return {
    workflow_id: workflow.workflow_id,
    execution_id: workflow.execution_id,
    plan_id: workflow.plan_id,
    tenant_id: workflow.tenant_id,
    workflow_state: workflow.workflow_state,
    activation_record: workflow.activation_record,
    current_task: workflow.current_task,
    transition_history: workflow.transition_history,
    synchronization_points: workflow.synchronization_points,
    orchestration_events: workflow.orchestration_events.map((event) => ({ id: event.event_id, hash: event.integrity_hash })),
    checkpoints: workflow.checkpoints,
    rollback_reference: workflow.rollback_reference,
    completion_summary: workflow.completion_summary,
    governance_reference: workflow.governance_reference,
    authority_reference: workflow.authority_reference,
    lineage: workflow.lineage,
    replay_reference: workflow.replay_reference,
    hidden_orchestration_paths: workflow.hidden_orchestration_paths,
    execution_contract_hash: workflow.execution_contract.integrity_hash,
  };
}

export function computeWorkflowHash(workflow: Omit<OrchestratedWorkflow, "integrity_hash"> | OrchestratedWorkflow): string {
  return hashValue("orchestrated-workflow", workflowHashSource(workflow));
}

export function activateWorkflow(identity = generateAutonomyIdentity(), executionContract?: ExecutionContract, scenario: WorkflowOrchestratorScenario = "BASELINE"): OrchestratedWorkflow {
  const contract = executionContract ?? buildExecutionContract(identity);
  const contractValidation = validateExecutionContract(contract);
  const workflowId = contract.workflow_identity.workflow_id;
  const transitions = buildTransitions(workflowId, contract, scenario);
  const events = buildEvents(workflowId, transitions, contract, scenario);
  const synchronization = buildSynchronization(contract, scenario);
  const lineage = buildLineage(workflowId, transitions, events, contract, scenario);
  const activeDependencies = scenario === "INCOMPLETE_DEPENDENCIES" ? freezeArray(["dependency:unresolved"]) : freezeArray(contract.dependency_graph.predecessor_tasks.slice(0, 2));
  const pendingTasks = contract.dependency_graph.successor_tasks.length ? contract.dependency_graph.successor_tasks : freezeArray([contract.current_step.step_id]);
  const activationGovernance = scenario === "MISSING_GOVERNANCE_APPROVAL" ? "" : contract.governance_references.governance_state;
  const activationAuthority = scenario === "INVALID_AUTHORITY_SCOPE" ? "" : contract.authority_scope.authority_validation_reference;
  const base = {
    workflow_id: workflowId,
    execution_id: contract.execution_identity.execution_id,
    plan_id: contract.plan_association.plan_id,
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : contract.tenant_information.tenant_id,
    mission_id: contract.mission_association.mission_id,
    workflow_version: "8C.2.0",
    workflow_state: scenario === "COMPLETION_INCOMPLETE" ? "COMPLETED" as const : "READY" as const,
    activation_record: Object.freeze({
      activation_id: id("WFA", "workflow-activation-id", { workflowId, scenario }),
      workflow_id: workflowId,
      execution_id: contract.execution_identity.execution_id,
      activation_state: scenario === "UNAUTHORIZED_WORKFLOW" || contractValidation.certification_state === "FAIL" ? "REJECTED" as const : "ACTIVATED" as const,
      activation_timestamp: NOW,
      governance_reference: activationGovernance,
      authority_reference: activationAuthority,
      dependency_readiness: scenario === "INCOMPLETE_DEPENDENCIES" ? "INCOMPLETE" as const : "READY" as const,
      activation_lineage: scenario === "LINEAGE_BROKEN" ? "" : contract.lineage_reference,
    }),
    current_stage: "pre-task-sequencing",
    current_task: contract.current_step.step_id || null,
    transition_history: transitions,
    active_dependencies: activeDependencies,
    completed_tasks: scenario === "COMPLETION_INCOMPLETE" ? freezeArray<string>([]) : freezeArray(contract.dependency_graph.predecessor_tasks.slice(0, 1)),
    pending_tasks: pendingTasks,
    synchronization_points: synchronization,
    orchestration_events: events,
    checkpoints: freezeArray(contract.checkpoint_list.map((checkpoint) => checkpoint.checkpoint_id)),
    rollback_reference: contract.rollback_plan.rollback_reference,
    completion_summary: Object.freeze({
      completion_id: id("WFC", "workflow-completion-id", { workflowId, scenario }),
      completion_status: scenario === "COMPLETION_INCOMPLETE" ? "PENDING" as const : "PENDING" as const,
      all_tasks_completed: false,
      dependencies_satisfied: scenario !== "INCOMPLETE_DEPENDENCIES",
      governance_maintained: Boolean(activationGovernance),
      checkpoints_finalized: contract.checkpoint_list.length > 0,
      replay_generated: Boolean(contract.replay_reference.replay_reference),
      execution_statistics: Object.freeze({
        total_tasks: pendingTasks.length + 1,
        completed_tasks: scenario === "COMPLETION_INCOMPLETE" ? 0 : 1,
        pending_tasks: pendingTasks.length,
        synchronization_points: synchronization.length,
      }),
    }),
    governance_reference: activationGovernance,
    authority_reference: activationAuthority,
    lineage,
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : contract.replay_reference.replay_reference,
    hidden_orchestration_paths: scenario === "HIDDEN_ORCHESTRATION",
    execution_contract: contract,
  };
  const workflow = Object.freeze({ ...base, integrity_hash: computeWorkflowHash(base) });
  if (scenario !== "INVALID_EXECUTION_CONTRACT") return workflow;
  return Object.freeze({ ...workflow, execution_contract: Object.freeze({ ...contract, integrity_hash: "invalid" }) });
}

function workflowFailures(workflow: OrchestratedWorkflow): WorkflowFailureReason[] {
  const failures: WorkflowFailureReason[] = [];
  const contractValidation = validateExecutionContract(workflow.execution_contract);
  if (contractValidation.certification_state === "FAIL" || computeExecutionContractHash(workflow.execution_contract) !== workflow.execution_contract.integrity_hash) failures.push("INVALID_EXECUTION_CONTRACT");
  if (workflow.activation_record.activation_state === "REJECTED") failures.push("UNAUTHORIZED_WORKFLOW");
  if (!workflow.governance_reference || !workflow.activation_record.governance_reference) failures.push("MISSING_GOVERNANCE_APPROVAL");
  if (!workflow.authority_reference || !workflow.activation_record.authority_reference) failures.push("INVALID_AUTHORITY_SCOPE");
  if (workflow.activation_record.dependency_readiness !== "READY" || workflow.active_dependencies.includes("dependency:unresolved")) failures.push("INCOMPLETE_DEPENDENCIES");
  if (workflow.tenant_id !== workflow.execution_contract.tenant_information.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  const seen = new Set<string>();
  for (const transition of workflow.transition_history) {
    const key = `${transition.from_state}->${transition.to_state}`;
    if (seen.has(key)) failures.push("DUPLICATE_STATE_TRANSITION");
    seen.add(key);
    if (!ALLOWED_TRANSITIONS[transition.from_state].includes(transition.to_state)) failures.push("ILLEGAL_STATE_TRANSITION");
    if (!transition.governance_validation) failures.push("GOVERNANCE_BYPASS");
    if (!transition.authority_reference) failures.push("AUTHORITY_VIOLATION");
    if (!transition.replay_reference) failures.push("REPLAY_DIVERGENCE");
  }
  if (workflow.transition_history.some((transition) => transition.from_state === "REGISTERED" && transition.to_state !== "ACTIVATED")) failures.push("WORKFLOW_STATE_SKIPPED");
  if (workflow.synchronization_points.some((point) => point.synchronization_state === "CONFLICT")) failures.push("SYNCHRONIZATION_CONFLICT");
  if (workflow.synchronization_points.some((point) => point.synchronization_state === "DEADLOCK")) failures.push("DEADLOCK_DETECTED");
  if (workflow.synchronization_points.some((point) => !point.checkpoint_reference)) failures.push("MISSING_DEPENDENCY");
  if (workflow.synchronization_points.some((point) => point.dependent_tasks.includes("race:condition"))) failures.push("RACE_CONDITION");
  if (workflow.orchestration_events.length === 0) failures.push("MISSING_ORCHESTRATION_EVENT");
  if (workflow.orchestration_events.some((event) => !event.lineage_reference || !event.replay_reference)) failures.push("REPLAY_DIVERGENCE");
  if (workflow.orchestration_events.some((event) => {
    const source = {
      event_id: event.event_id,
      event_type: event.event_type,
      event_order: event.event_order,
      workflow_state: event.workflow_state,
      task_id: event.task_id,
      lineage_reference: event.lineage_reference,
      replay_reference: event.replay_reference,
      timestamp: event.timestamp,
    };
    return eventHash(source) !== event.integrity_hash;
  })) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!workflow.lineage.lineage_id || workflow.lineage.transition_refs.length === 0 || workflow.lineage.replay_refs.length === 0) failures.push("LINEAGE_BROKEN");
  if (workflow.hidden_orchestration_paths) failures.push("HIDDEN_ORCHESTRATION_PATH");
  if (workflow.workflow_state === "COMPLETED" && !workflow.completion_summary.all_tasks_completed) failures.push("COMPLETION_CRITERIA_UNMET");
  if (computeWorkflowHash(workflow) !== workflow.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return failures;
}

export function validateOrchestration(workflow: OrchestratedWorkflow): WorkflowOrchestrationValidationResult {
  const failures = uniqueFailures(workflowFailures(workflow));
  const warnings = workflow.orchestration_events.length < workflow.transition_history.length ? freezeArray<WorkflowFailureReason>(["TELEMETRY_GAP"]) : freezeArray<WorkflowFailureReason>([]);
  const certification: WorkflowCertificationState = failures.length ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  const has = (reason: WorkflowFailureReason) => failures.includes(reason);
  const source = { workflow: workflow.workflow_id, certification, failures, warnings };
  return Object.freeze({
    validation_id: id("WFV", "workflow-validation-id", source),
    workflow_id: workflow.workflow_id,
    certification_state: certification,
    failures,
    warnings,
    execution_contract_valid: !has("INVALID_EXECUTION_CONTRACT") && !has("UNAUTHORIZED_WORKFLOW"),
    workflow_consistent: !has("HIDDEN_ORCHESTRATION_PATH") && !has("INTEGRITY_HASH_MISMATCH"),
    state_consistent: !has("ILLEGAL_STATE_TRANSITION") && !has("WORKFLOW_STATE_SKIPPED") && !has("DUPLICATE_STATE_TRANSITION"),
    dependency_integrity_valid: !has("INCOMPLETE_DEPENDENCIES") && !has("MISSING_DEPENDENCY"),
    synchronization_integrity_valid: !has("SYNCHRONIZATION_CONFLICT") && !has("DEADLOCK_DETECTED") && !has("RACE_CONDITION"),
    governance_compliance_preserved: !has("MISSING_GOVERNANCE_APPROVAL") && !has("GOVERNANCE_BYPASS"),
    authority_compliance_preserved: !has("INVALID_AUTHORITY_SCOPE") && !has("AUTHORITY_VIOLATION"),
    replay_consistency_preserved: !has("REPLAY_DIVERGENCE"),
    lineage_complete: !has("LINEAGE_BROKEN"),
    tenant_isolation_enforced: !has("TENANT_ISOLATION_VIOLATION"),
    ready_for_task_sequencing: certification === "PASS" || certification === "CONDITIONAL_PASS",
    validation_hash: hashValue("workflow-validation", source),
  });
}

export function replayWorkflow(workflow: OrchestratedWorkflow): WorkflowReplayResult {
  const failures: WorkflowFailureReason[] = [];
  if (computeWorkflowHash(workflow) !== workflow.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!workflow.replay_reference || workflow.lineage.replay_refs.length === 0) failures.push("REPLAY_DIVERGENCE");
  const source = {
    replay_id: id("WFR", "workflow-replay-id", workflow.workflow_id),
    workflow_id: workflow.workflow_id,
    replay_transition_order: freezeArray(["REGISTERED" as const, ...workflow.transition_history.map((transition) => transition.to_state)]),
    replay_event_order: freezeArray(workflow.orchestration_events.map((event) => event.event_type)),
    replay_lineage_reference: workflow.lineage.lineage_id,
    validation_state: failures.length ? "FAIL" as const : validateOrchestration(workflow).certification_state,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("workflow-replay", source) });
}

export function buildWorkflowVisibilitySurface(workflow: OrchestratedWorkflow): WorkflowVisibilitySurface {
  const validation = validateOrchestration(workflow);
  return Object.freeze({
    workflow_id: workflow.workflow_id,
    execution_id: workflow.execution_id,
    workflow_state: workflow.workflow_state,
    current_task: workflow.current_task,
    completed_tasks: workflow.completed_tasks,
    pending_tasks: workflow.pending_tasks,
    synchronization_states: freezeArray(workflow.synchronization_points.map((point) => point.synchronization_state)),
    event_count: workflow.orchestration_events.length,
    governance_reference: workflow.governance_reference,
    authority_reference: workflow.authority_reference,
    failure_reasons: validation.failures,
    integrity_status: validation.failures.includes("INTEGRITY_HASH_MISMATCH") ? "INVALID" : "VALID",
  });
}

export function getWorkflowOrchestratorFramework(): WorkflowOrchestratorFramework {
  const identity = generateAutonomyIdentity();
  const contract = buildExecutionContract(identity);
  const workflow = activateWorkflow(identity, contract);
  return Object.freeze({
    identity,
    execution_contract_validation: validateExecutionContract(contract),
    workflow,
    validation: validateOrchestration(workflow),
    replay: replayWorkflow(workflow),
    visibility: buildWorkflowVisibilitySurface(workflow),
  });
}
