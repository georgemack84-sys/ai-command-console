import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence } from "@/services/task-sequencing";
import { buildDependencySchedule } from "@/services/dependency-scheduler";
import { buildExecutionMonitor, validateExecutionMonitor } from "@/services/execution-monitor";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { ExecutionMonitorPackage } from "@/types/execution-monitor";
import type {
  ApprovalStateSnapshot,
  AuthorityStateSnapshot,
  CertifiedCheckpoint,
  CheckpointFailureReason,
  CheckpointLineageReference,
  CheckpointManagerFramework,
  CheckpointManagerPackage,
  CheckpointManagerScenario,
  CheckpointRegistry,
  CheckpointRegistryRecord,
  CheckpointReplayResult,
  CheckpointTimestamp,
  CheckpointTrigger,
  CheckpointValidationResult,
  CheckpointVisibilitySurface,
  DependencyStateSnapshot,
  ExecutionStateSnapshot,
  GovernanceStateSnapshot,
  RecoverySnapshot,
  ResourceStateSnapshot,
  RollbackReference,
  WorkflowStateSnapshot,
} from "@/types/checkpoint-manager";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function uniqueFailures(values: readonly CheckpointFailureReason[]): readonly CheckpointFailureReason[] {
  return freezeArray([...new Set(values)]);
}

function defaultMonitor(identity: AutonomyIdentityRecord) {
  const contract = buildExecutionContract(identity);
  const workflow = activateWorkflow(identity, contract);
  const sequence = generateTaskSequence(identity, workflow);
  const schedule = buildDependencySchedule(identity, sequence);
  return buildExecutionMonitor(identity, schedule);
}

function timestampFor(monitor: ExecutionMonitorPackage, sequence: number, certified: boolean): CheckpointTimestamp {
  const stamp = `checkpoint-time:${monitor.execution_id}:${sequence}`;
  return Object.freeze({
    requested_at: `${stamp}:requested`,
    captured_at: `${stamp}:captured`,
    certified_at: certified ? `${stamp}:certified` : null,
    registered_at: certified ? `${stamp}:registered` : null,
  });
}

function executionSnapshot(monitor: ExecutionMonitorPackage, scenario: CheckpointManagerScenario): ExecutionStateSnapshot {
  return Object.freeze({
    execution_id: scenario === "MISSING_EXECUTION_STATE" ? "" : monitor.execution_id,
    execution_status: monitor.monitoring_state,
    progress_percentage: monitor.progress_percentage,
    active_tasks: monitor.task_activity.active_tasks,
    completed_tasks: monitor.task_activity.completed_tasks,
    pending_tasks: freezeArray([...monitor.task_activity.queued_tasks, ...monitor.task_activity.waiting_tasks]),
    execution_timing_ms: monitor.latency_metrics.workflow_latency_ms,
    orchestration_metadata_ref: scenario === "MISSING_EXECUTION_STATE" ? "" : `orchestration:${monitor.source_schedule.dependency_schedule_id}`,
  });
}

function workflowSnapshot(monitor: ExecutionMonitorPackage, scenario: CheckpointManagerScenario): WorkflowStateSnapshot {
  const workflow = monitor.source_schedule.source_sequence.source_workflow;
  const ordering = monitor.source_schedule.source_sequence.task_order.map((task) => task.task_id);
  return Object.freeze({
    workflow_id: scenario === "MISSING_WORKFLOW_STATE" ? "" : monitor.workflow_id,
    workflow_state: workflow.workflow_state,
    execution_stage: monitor.progress_reports[0]?.workflow_stage ?? "UNKNOWN",
    current_task: monitor.current_step,
    completed_tasks: monitor.task_activity.completed_tasks,
    pending_tasks: monitor.task_activity.queued_tasks,
    synchronization_state: monitor.source_schedule.source_sequence.synchronization_points.length ? "BARRIERED" : "SYNCHRONIZED",
    execution_ordering: scenario === "MISSING_WORKFLOW_STATE" ? freezeArray<string>([]) : freezeArray(ordering),
  });
}

function dependencySnapshot(monitor: ExecutionMonitorPackage, scenario: CheckpointManagerScenario): DependencyStateSnapshot {
  return Object.freeze({
    dependency_graph_ref: scenario === "MISSING_DEPENDENCY_STATE" ? "" : id("DG", "checkpoint-dependency-graph-ref", monitor.source_schedule.dependency_graph),
    satisfied_dependencies: freezeArray(monitor.source_schedule.readiness_records.flatMap((record) => record.satisfied_dependencies)),
    pending_dependencies: monitor.source_schedule.waiting_tasks,
    blocked_dependencies: monitor.source_schedule.blocked_tasks,
    synchronization_barriers: monitor.source_schedule.source_sequence.synchronization_points,
    dependency_validation_ref: scenario === "MISSING_DEPENDENCY_STATE" ? "" : `dependency-validation:${monitor.source_schedule.dependency_schedule_id}`,
  });
}

function resourceSnapshot(monitor: ExecutionMonitorPackage, scenario: CheckpointManagerScenario): ResourceStateSnapshot {
  return Object.freeze({
    compute_utilization: monitor.resource_utilization.compute_utilization,
    storage_allocation: scenario === "MISSING_RESOURCE_STATE" ? -1 : monitor.resource_utilization.storage_utilization,
    network_status: scenario === "MISSING_RESOURCE_STATE" ? "" : monitor.resource_utilization.external_service_availability,
    execution_resources: scenario === "MISSING_RESOURCE_STATE" ? freezeArray<string>([]) : freezeArray(["agent:primary", "service:execution", "storage:checkpoint"]),
    service_availability: scenario === "MISSING_RESOURCE_STATE" ? "" : monitor.resource_utilization.agent_availability,
  });
}

function governanceSnapshot(monitor: ExecutionMonitorPackage, scenario: CheckpointManagerScenario): GovernanceStateSnapshot {
  return Object.freeze({
    governance_state: scenario === "MISSING_GOVERNANCE_SNAPSHOT" ? "" : "VALIDATED",
    policy_snapshot_ref: scenario === "MISSING_GOVERNANCE_SNAPSHOT" ? "" : monitor.governance_reference,
    constitutional_validation: monitor.governance_status.constitutional_compliant,
    compliance_status: monitor.governance_status.policy_compliant,
    risk_assessment_ref: scenario === "MISSING_GOVERNANCE_SNAPSHOT" ? "" : `risk:${monitor.monitor_id}`,
    recommendation_refs: scenario === "MISSING_GOVERNANCE_SNAPSHOT" ? freezeArray<string>([]) : monitor.monitoring_lineage.governance_refs,
  });
}

function authoritySnapshot(monitor: ExecutionMonitorPackage, scenario: CheckpointManagerScenario): AuthorityStateSnapshot {
  return Object.freeze({
    authority_scope: scenario === "MISSING_AUTHORITY_SNAPSHOT" ? "" : "CONTROLLED_EXECUTION",
    operator_authority: scenario === "MISSING_AUTHORITY_SNAPSHOT" ? "" : "WORKSPACE_OPERATOR",
    delegated_authority: scenario === "MISSING_AUTHORITY_SNAPSHOT" ? freezeArray<string>([]) : freezeArray(["execution:observe", "checkpoint:create"]),
    approval_status: scenario === "MISSING_AUTHORITY_SNAPSHOT" ? "" : "APPROVED",
    authorization_refs: scenario === "MISSING_AUTHORITY_SNAPSHOT" ? freezeArray<string>([]) : freezeArray([monitor.authority_reference]),
  });
}

function approvalSnapshot(monitor: ExecutionMonitorPackage, scenario: CheckpointManagerScenario): ApprovalStateSnapshot {
  const approvals = monitor.operator_interventions.filter((item) => item.intervention_type === "APPROVAL" || item.intervention_type === "ACKNOWLEDGEMENT");
  return Object.freeze({
    completed_approvals: scenario === "MISSING_APPROVAL_SNAPSHOT" ? freezeArray<string>([]) : freezeArray(approvals.map((item) => item.intervention_id)),
    pending_approvals: scenario === "MISSING_APPROVAL_SNAPSHOT" ? freezeArray<string>([]) : freezeArray(monitor.operator_interventions.filter((item) => item.intervention_state === "PENDING").map((item) => item.intervention_id)),
    rejected_approvals: freezeArray(monitor.operator_interventions.filter((item) => item.intervention_state === "REJECTED").map((item) => item.intervention_id)),
    approval_timestamps: scenario === "MISSING_APPROVAL_SNAPSHOT" ? freezeArray<string>([]) : freezeArray(approvals.map((item, index) => `approval-time:${item.intervention_id}:${index}`)),
    approval_lineage: scenario === "MISSING_APPROVAL_SNAPSHOT" ? freezeArray<string>([]) : freezeArray(monitor.operator_interventions.map((item) => item.lineage_reference)),
  });
}

function rollbackReference(monitor: ExecutionMonitorPackage, sequence: number, scenario: CheckpointManagerScenario): RollbackReference {
  return Object.freeze({
    rollback_identifier: scenario === "MISSING_ROLLBACK_REFERENCE" ? "" : id("RB", "checkpoint-rollback-id", { monitor: monitor.monitor_id, sequence }),
    recovery_boundary: scenario === "MISSING_ROLLBACK_REFERENCE" ? "" : `boundary:${monitor.execution_id}:${sequence}`,
    rollback_sequence: scenario === "MISSING_ROLLBACK_REFERENCE" ? freezeArray<string>([]) : freezeArray(monitor.task_activity.completed_tasks),
    recovery_eligibility: scenario !== "MISSING_ROLLBACK_REFERENCE",
  });
}

function checkpointHashSource(checkpoint: Omit<CertifiedCheckpoint, "integrity_hash"> | CertifiedCheckpoint) {
  return {
    checkpoint_id: checkpoint.checkpoint_id,
    checkpoint_version: checkpoint.checkpoint_version,
    trigger: checkpoint.trigger,
    lifecycle_state: checkpoint.lifecycle_state,
    tenant_id: checkpoint.tenant_id,
    execution_id: checkpoint.execution_id,
    workflow_id: checkpoint.workflow_id,
    workflow_state: checkpoint.workflow_state,
    execution_state: checkpoint.execution_state,
    completed_tasks: checkpoint.completed_tasks,
    pending_tasks: checkpoint.pending_tasks,
    active_tasks: checkpoint.active_tasks,
    resource_state: checkpoint.resource_state,
    dependency_state: checkpoint.dependency_state,
    governance_snapshot: checkpoint.governance_snapshot,
    authority_snapshot: checkpoint.authority_snapshot,
    operator_approvals: checkpoint.operator_approvals,
    rollback_reference: checkpoint.rollback_reference,
    replay_reference: checkpoint.replay_reference,
    lineage_reference: checkpoint.lineage_reference,
    immutable: checkpoint.immutable,
    recovery_executed: checkpoint.recovery_executed,
    timestamp: checkpoint.timestamp,
  };
}

export function computeCheckpointHash(checkpoint: Omit<CertifiedCheckpoint, "integrity_hash"> | CertifiedCheckpoint): string {
  return hashValue("checkpoint-manager-checkpoint", checkpointHashSource(checkpoint));
}

function buildCheckpoint(monitor: ExecutionMonitorPackage, sequence: number, trigger: CheckpointTrigger, parent: string | null, scenario: CheckpointManagerScenario): CertifiedCheckpoint {
  const checkpointId = id("CP", "checkpoint-manager-checkpoint-id", { monitor: monitor.monitor_id, sequence, trigger, scenario });
  const rollback = rollbackReference(monitor, sequence, scenario);
  const lineage: CheckpointLineageReference = Object.freeze({
    lineage_id: scenario === "LINEAGE_BROKEN" ? "" : id("CPL", "checkpoint-lineage-id", { checkpointId, sequence }),
    parent_checkpoint_id: scenario === "LINEAGE_BROKEN" ? null : parent,
    child_checkpoint_ids: freezeArray<string>([]),
    execution_sequence: scenario === "CHECKPOINT_ORDER_VIOLATION" && sequence === 2 ? 1 : sequence,
    workflow_progression: scenario === "LINEAGE_BROKEN" ? freezeArray<string>([]) : freezeArray(monitor.source_schedule.source_sequence.task_order.map((task) => task.task_id).slice(0, Math.max(1, sequence))),
    rollback_refs: scenario === "LINEAGE_BROKEN" ? freezeArray<string>([]) : freezeArray([rollback.rollback_identifier]),
    replay_lineage: scenario === "LINEAGE_BROKEN" || scenario === "MISSING_REPLAY_REFERENCE" ? freezeArray<string>([]) : freezeArray([monitor.replay_reference]),
  });
  const base = {
    checkpoint_id: checkpointId,
    checkpoint_version: `v${sequence}`,
    trigger,
    lifecycle_state: scenario === "CHECKPOINT_CORRUPTION" && sequence === 2 ? "CORRUPTED" as const : "AVAILABLE" as const,
    tenant_id: scenario === "TENANT_VIOLATION" && sequence === 2 ? "tenant_beta" : monitor.tenant_id,
    execution_id: monitor.execution_id,
    workflow_id: monitor.workflow_id,
    workflow_state: workflowSnapshot(monitor, scenario),
    execution_state: executionSnapshot(monitor, scenario),
    completed_tasks: monitor.task_activity.completed_tasks,
    pending_tasks: monitor.task_activity.queued_tasks,
    active_tasks: monitor.task_activity.active_tasks,
    resource_state: resourceSnapshot(monitor, scenario),
    dependency_state: dependencySnapshot(monitor, scenario),
    governance_snapshot: governanceSnapshot(monitor, scenario),
    authority_snapshot: authoritySnapshot(monitor, scenario),
    operator_approvals: approvalSnapshot(monitor, scenario),
    rollback_reference: rollback,
    replay_reference: scenario === "MISSING_REPLAY_REFERENCE" || scenario === "REPLAY_INCOMPATIBLE" ? "" : `${monitor.replay_reference}:checkpoint:${sequence}`,
    lineage_reference: lineage,
    immutable: true as const,
    recovery_executed: false as const,
    timestamp: timestampFor(monitor, sequence, scenario !== "CHECKPOINT_CORRUPTION"),
  };
  return Object.freeze({ ...base, integrity_hash: computeCheckpointHash(base) });
}

function linkChildren(checkpoints: readonly CertifiedCheckpoint[]): readonly CertifiedCheckpoint[] {
  return freezeArray(checkpoints.map((checkpoint, index) => {
    const child = checkpoints[index + 1]?.checkpoint_id;
    return Object.freeze({
      ...checkpoint,
      lineage_reference: Object.freeze({
        ...checkpoint.lineage_reference,
        child_checkpoint_ids: child ? freezeArray([child]) : freezeArray<string>([]),
      }),
    });
  }).map((checkpoint) => Object.freeze({ ...checkpoint, integrity_hash: computeCheckpointHash(checkpoint) })));
}

function buildCheckpoints(monitor: ExecutionMonitorPackage, scenario: CheckpointManagerScenario): readonly CertifiedCheckpoint[] {
  const triggers: readonly CheckpointTrigger[] = ["WORKFLOW_MILESTONE", "GOVERNANCE_APPROVAL", "SCHEDULED_INTERVAL"];
  const checkpoints = triggers.map((trigger, index) => buildCheckpoint(monitor, index + 1, trigger, index === 0 ? null : id("CP", "checkpoint-manager-checkpoint-id", { monitor: monitor.monitor_id, sequence: index, trigger: triggers[index - 1], scenario }), scenario));
  const linked = linkChildren(checkpoints);
  if (scenario === "INTEGRITY_MISMATCH") return freezeArray(linked.map((checkpoint, index) => index === 1 ? Object.freeze({ ...checkpoint, integrity_hash: "tampered" }) : checkpoint));
  if (scenario !== "DUPLICATE_CHECKPOINT") return linked;
  return freezeArray([...linked, linked[1]]);
}

function registryHashSource(registry: Omit<CheckpointRegistry, "integrity_hash"> | CheckpointRegistry) {
  return {
    registry_id: registry.registry_id,
    execution_id: registry.execution_id,
    workflow_id: registry.workflow_id,
    tenant_id: registry.tenant_id,
    checkpoint_catalog: registry.checkpoint_catalog,
    version_history: registry.version_history,
    lineage_refs: registry.lineage_refs,
    replay_refs: registry.replay_refs,
    recovery_refs: registry.recovery_refs,
    immutable_storage: registry.immutable_storage,
  };
}

function buildRegistry(monitor: ExecutionMonitorPackage, checkpoints: readonly CertifiedCheckpoint[], scenario: CheckpointManagerScenario): CheckpointRegistry {
  const records = checkpoints.map((checkpoint): CheckpointRegistryRecord => Object.freeze({
    registry_id: id("CPRR", "checkpoint-registry-record-id", checkpoint.checkpoint_id),
    checkpoint_id: checkpoint.checkpoint_id,
    checkpoint_version: checkpoint.checkpoint_version,
    checkpoint_status: checkpoint.lifecycle_state,
    lineage_reference: checkpoint.lineage_reference.lineage_id,
    replay_reference: checkpoint.replay_reference,
    rollback_reference: checkpoint.rollback_reference.rollback_identifier,
    integrity_hash: checkpoint.integrity_hash,
  }));
  const base = {
    registry_id: id("CPR", "checkpoint-registry-id", { monitor: monitor.monitor_id, scenario }),
    execution_id: monitor.execution_id,
    workflow_id: monitor.workflow_id,
    tenant_id: monitor.tenant_id,
    checkpoint_catalog: freezeArray(records),
    version_history: scenario === "CONDITIONAL_RETENTION_GAP" ? freezeArray(checkpoints.slice(0, -1).map((checkpoint) => checkpoint.checkpoint_version)) : freezeArray(checkpoints.map((checkpoint) => checkpoint.checkpoint_version)),
    lineage_refs: freezeArray(checkpoints.map((checkpoint) => checkpoint.lineage_reference.lineage_id).filter(Boolean)),
    replay_refs: scenario === "REPLAY_INCOMPATIBLE" ? freezeArray<string>([]) : freezeArray(checkpoints.map((checkpoint) => checkpoint.replay_reference).filter(Boolean)),
    recovery_refs: freezeArray(checkpoints.map((checkpoint) => checkpoint.rollback_reference.rollback_identifier).filter(Boolean)),
    immutable_storage: true as const,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("checkpoint-manager-registry", registryHashSource(base)) });
}

function recoveryHashSource(snapshot: Omit<RecoverySnapshot, "integrity_hash"> | RecoverySnapshot) {
  return {
    recovery_snapshot_id: snapshot.recovery_snapshot_id,
    execution_id: snapshot.execution_id,
    workflow_id: snapshot.workflow_id,
    checkpoint_refs: snapshot.checkpoint_refs,
    recovery_starting_points: snapshot.recovery_starting_points,
    rollback_boundaries: snapshot.rollback_boundaries,
    execution_continuation_context: snapshot.execution_continuation_context,
    replay_references: snapshot.replay_references,
    recovery_enabled: snapshot.recovery_enabled,
  };
}

function buildRecoverySnapshot(monitor: ExecutionMonitorPackage, checkpoints: readonly CertifiedCheckpoint[], scenario: CheckpointManagerScenario): RecoverySnapshot {
  const base = {
    recovery_snapshot_id: id("CPS", "checkpoint-recovery-snapshot-id", { monitor: monitor.monitor_id, scenario }),
    execution_id: monitor.execution_id,
    workflow_id: monitor.workflow_id,
    checkpoint_refs: freezeArray(checkpoints.map((checkpoint) => checkpoint.checkpoint_id)),
    recovery_starting_points: freezeArray(checkpoints.map((checkpoint) => checkpoint.execution_state.execution_id).filter(Boolean)),
    rollback_boundaries: freezeArray(checkpoints.map((checkpoint) => checkpoint.rollback_reference.recovery_boundary).filter(Boolean)),
    execution_continuation_context: freezeArray(checkpoints.map((checkpoint) => checkpoint.workflow_state.current_task ?? "workflow:complete")),
    replay_references: scenario === "REPLAY_INCOMPATIBLE" ? freezeArray<string>([]) : freezeArray(checkpoints.map((checkpoint) => checkpoint.replay_reference).filter(Boolean)),
    recovery_enabled: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("checkpoint-manager-recovery-snapshot", recoveryHashSource(base)) });
}

function packageHashSource(manager: Omit<CheckpointManagerPackage, "integrity_hash"> | CheckpointManagerPackage) {
  return {
    manager_id: manager.manager_id,
    execution_id: manager.execution_id,
    workflow_id: manager.workflow_id,
    tenant_id: manager.tenant_id,
    lifecycle_state: manager.lifecycle_state,
    checkpoints: manager.checkpoints.map((checkpoint) => ({ id: checkpoint.checkpoint_id, hash: checkpoint.integrity_hash })),
    registry: manager.registry,
    recovery_snapshot: manager.recovery_snapshot,
    source_monitor_hash: manager.source_monitor.integrity_hash,
    advisory_only: manager.advisory_only,
    recovery_executed: manager.recovery_executed,
    rollback_executed: manager.rollback_executed,
  };
}

export function computeCheckpointManagerHash(manager: Omit<CheckpointManagerPackage, "integrity_hash"> | CheckpointManagerPackage): string {
  return hashValue("checkpoint-manager-package", packageHashSource(manager));
}

export function buildCheckpointManager(identity = generateAutonomyIdentity(), monitor?: ExecutionMonitorPackage, scenario: CheckpointManagerScenario = "BASELINE"): CheckpointManagerPackage {
  const sourceMonitor = monitor ?? defaultMonitor(identity);
  const effectiveMonitor = scenario === "INVALID_MONITOR" ? Object.freeze({ ...sourceMonitor, integrity_hash: "invalid" }) : sourceMonitor;
  const checkpoints = buildCheckpoints(effectiveMonitor, scenario);
  const registry = buildRegistry(effectiveMonitor, checkpoints, scenario);
  const recovery = buildRecoverySnapshot(effectiveMonitor, checkpoints, scenario);
  const base = {
    manager_id: id("CPM", "checkpoint-manager-id", { monitor: effectiveMonitor.monitor_id, scenario }),
    execution_id: effectiveMonitor.execution_id,
    workflow_id: effectiveMonitor.workflow_id,
    tenant_id: effectiveMonitor.tenant_id,
    lifecycle_state: checkpoints.some((checkpoint) => checkpoint.lifecycle_state === "CORRUPTED") ? "CORRUPTED" as const : "AVAILABLE" as const,
    checkpoints,
    registry,
    recovery_snapshot: recovery,
    source_monitor: effectiveMonitor,
    advisory_only: true as const,
    recovery_executed: false as const,
    rollback_executed: false as const,
  };
  const manager = Object.freeze({ ...base, integrity_hash: computeCheckpointManagerHash(base) });
  return manager;
}

function failuresForCheckpoint(checkpoint: CertifiedCheckpoint, manager: CheckpointManagerPackage, index: number): CheckpointFailureReason[] {
  const failures: CheckpointFailureReason[] = [];
  if (checkpoint.tenant_id !== manager.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!checkpoint.execution_state.execution_id || !checkpoint.execution_state.orchestration_metadata_ref) failures.push("EXECUTION_STATE_INCOMPLETE");
  if (!checkpoint.workflow_state.workflow_id || checkpoint.workflow_state.execution_ordering.length === 0) failures.push("WORKFLOW_STATE_INCOMPLETE");
  if (!checkpoint.dependency_state.dependency_graph_ref || !checkpoint.dependency_state.dependency_validation_ref) failures.push("DEPENDENCY_STATE_INCOMPLETE");
  if (!checkpoint.resource_state.network_status || checkpoint.resource_state.execution_resources.length === 0 || checkpoint.resource_state.storage_allocation < 0) failures.push("RESOURCE_STATE_INCOMPLETE");
  if (!checkpoint.governance_snapshot.governance_state || !checkpoint.governance_snapshot.policy_snapshot_ref || checkpoint.governance_snapshot.recommendation_refs.length === 0) failures.push("GOVERNANCE_SNAPSHOT_MISSING");
  if (!checkpoint.authority_snapshot.authority_scope || !checkpoint.authority_snapshot.operator_authority || checkpoint.authority_snapshot.authorization_refs.length === 0) failures.push("AUTHORITY_SNAPSHOT_MISSING");
  if (checkpoint.operator_approvals.completed_approvals.length !== checkpoint.operator_approvals.approval_timestamps.length) failures.push("APPROVAL_SNAPSHOT_INCOMPLETE");
  if (!checkpoint.rollback_reference.rollback_identifier || !checkpoint.rollback_reference.recovery_boundary || !checkpoint.rollback_reference.recovery_eligibility) failures.push("ROLLBACK_REFERENCE_MISSING");
  if (!checkpoint.replay_reference) failures.push("REPLAY_REFERENCE_MISSING");
  if (!manager.registry.replay_refs.includes(checkpoint.replay_reference)) failures.push("REPLAY_INCOMPATIBLE");
  if (!checkpoint.lineage_reference.lineage_id || checkpoint.lineage_reference.workflow_progression.length === 0 || checkpoint.lineage_reference.replay_lineage.length === 0) failures.push("LINEAGE_BROKEN");
  if (index > 0 && checkpoint.lineage_reference.parent_checkpoint_id !== manager.checkpoints[index - 1].checkpoint_id) failures.push("LINEAGE_BROKEN");
  if (checkpoint.lineage_reference.execution_sequence !== index + 1) failures.push("CHECKPOINT_ORDER_VIOLATION");
  if (checkpoint.lifecycle_state === "CORRUPTED") failures.push("CHECKPOINT_CORRUPTED");
  if (!checkpoint.timestamp.certified_at || !checkpoint.timestamp.registered_at) failures.push("CHECKPOINT_CORRUPTED");
  if (computeCheckpointHash(checkpoint) !== checkpoint.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return failures;
}

function failuresForManager(manager: CheckpointManagerPackage): CheckpointFailureReason[] {
  const failures: CheckpointFailureReason[] = [];
  if (validateExecutionMonitor(manager.source_monitor).certification_state === "FAIL") failures.push("INVALID_EXECUTION_MONITOR");
  const ids = manager.checkpoints.map((checkpoint) => checkpoint.checkpoint_id);
  if (new Set(ids).size !== ids.length) failures.push("DUPLICATE_CHECKPOINT");
  manager.checkpoints.forEach((checkpoint, index) => failures.push(...failuresForCheckpoint(checkpoint, manager, index)));
  if (!manager.advisory_only || manager.recovery_executed || manager.rollback_executed || manager.recovery_snapshot.recovery_enabled) failures.push("REPLAY_INCOMPATIBLE");
  if (manager.registry.checkpoint_catalog.length !== manager.checkpoints.length) failures.push("CHECKPOINT_CORRUPTED");
  if (hashValue("checkpoint-manager-registry", registryHashSource(manager.registry)) !== manager.registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (hashValue("checkpoint-manager-recovery-snapshot", recoveryHashSource(manager.recovery_snapshot)) !== manager.recovery_snapshot.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (computeCheckpointManagerHash(manager) !== manager.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (manager.registry.version_history.length < manager.checkpoints.length) failures.push("RETENTION_POLICY_GAP");
  return failures;
}

export function validateCheckpointManager(manager: CheckpointManagerPackage): CheckpointValidationResult {
  const failures = uniqueFailures(failuresForManager(manager));
  const warnings = failures.includes("RETENTION_POLICY_GAP") ? freezeArray<CheckpointFailureReason>(["RETENTION_POLICY_GAP"]) : freezeArray<CheckpointFailureReason>([]);
  const hardFailures = failures.filter((failure) => failure !== "RETENTION_POLICY_GAP");
  const certification = hardFailures.length ? "FAIL" as const : warnings.length ? "CONDITIONAL_PASS" as const : "PASS" as const;
  const has = (reason: CheckpointFailureReason) => failures.includes(reason);
  const source = { manager: manager.manager_id, certification, failures, warnings };
  return Object.freeze({
    validation_id: id("CPV", "checkpoint-validation-id", source),
    manager_id: manager.manager_id,
    certification_state: certification,
    failures,
    warnings,
    state_complete: !has("EXECUTION_STATE_INCOMPLETE") && !has("RESOURCE_STATE_INCOMPLETE"),
    workflow_consistent: !has("WORKFLOW_STATE_INCOMPLETE") && !has("CHECKPOINT_ORDER_VIOLATION"),
    dependency_integrity_preserved: !has("DEPENDENCY_STATE_INCOMPLETE"),
    governance_integrity_preserved: !has("GOVERNANCE_SNAPSHOT_MISSING") && !has("INVALID_EXECUTION_MONITOR"),
    authority_integrity_preserved: !has("AUTHORITY_SNAPSHOT_MISSING") && !has("TENANT_ISOLATION_VIOLATION"),
    replay_compatible: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_INCOMPATIBLE"),
    lineage_complete: !has("LINEAGE_BROKEN"),
    immutable_storage_verified: !has("CHECKPOINT_CORRUPTED") && !has("DUPLICATE_CHECKPOINT"),
    recovery_not_executed: !manager.recovery_executed && !manager.rollback_executed && !manager.recovery_snapshot.recovery_enabled,
    ready_for_rollback_preparation: certification === "PASS" || certification === "CONDITIONAL_PASS",
    validation_hash: hashValue("checkpoint-manager-validation", source),
  });
}

export function replayCheckpointManager(manager: CheckpointManagerPackage): CheckpointReplayResult {
  const failures: CheckpointFailureReason[] = [];
  if (computeCheckpointManagerHash(manager) !== manager.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (manager.checkpoints.some((checkpoint) => !checkpoint.replay_reference)) failures.push("REPLAY_REFERENCE_MISSING");
  const validation = validateCheckpointManager(manager);
  const source = {
    replay_id: id("CPR", "checkpoint-replay-id", manager.manager_id),
    manager_id: manager.manager_id,
    replay_checkpoint_order: freezeArray(manager.checkpoints.map((checkpoint) => checkpoint.checkpoint_id)),
    replay_workflow_states: freezeArray(manager.checkpoints.map((checkpoint) => checkpoint.workflow_state.workflow_state)),
    replay_dependency_refs: freezeArray(manager.checkpoints.map((checkpoint) => checkpoint.dependency_state.dependency_graph_ref)),
    validation_state: failures.length ? "FAIL" as const : validation.certification_state,
    failure_reason: failures[0] ?? validation.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("checkpoint-manager-replay", source) });
}

export function buildCheckpointVisibilitySurface(manager: CheckpointManagerPackage): CheckpointVisibilitySurface {
  const validation = validateCheckpointManager(manager);
  return Object.freeze({
    manager_id: manager.manager_id,
    execution_id: manager.execution_id,
    workflow_id: manager.workflow_id,
    checkpoint_count: manager.checkpoints.length,
    lifecycle_state: manager.lifecycle_state,
    certified_checkpoint_ids: freezeArray(manager.checkpoints.filter((checkpoint) => checkpoint.lifecycle_state === "AVAILABLE").map((checkpoint) => checkpoint.checkpoint_id)),
    available_replay_refs: manager.registry.replay_refs,
    failure_reasons: validation.failures,
    integrity_status: validation.failures.includes("INTEGRITY_HASH_MISMATCH") || validation.failures.includes("CHECKPOINT_CORRUPTED") ? "INVALID" : "VALID",
    recovery_enabled: false,
  });
}

export function getCheckpointManagerFramework(): CheckpointManagerFramework {
  const identity = generateAutonomyIdentity();
  const monitor = defaultMonitor(identity);
  const manager = buildCheckpointManager(identity, monitor);
  return Object.freeze({
    identity,
    execution_monitor_validation: validateExecutionMonitor(monitor),
    manager,
    validation: validateCheckpointManager(manager),
    replay: replayCheckpointManager(manager),
    visibility: buildCheckpointVisibilitySurface(manager),
  });
}
