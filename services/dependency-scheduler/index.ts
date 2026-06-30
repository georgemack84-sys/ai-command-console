import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence, validateTaskSequence } from "@/services/task-sequencing";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { TaskSequencePackage } from "@/types/task-sequencing";
import type {
  BlockingReason,
  DependencyCategory,
  DependencyEvent,
  DependencyGraphEdge,
  DependencyLifecycleState,
  DependencyMonitorRecord,
  DependencyRegistryEntry,
  DependencySchedulePackage,
  DependencyScheduleReplayResult,
  DependencyScheduleValidationResult,
  DependencyScheduleVisibilitySurface,
  DependencySchedulerCertificationState,
  DependencySchedulerFailureReason,
  DependencySchedulerFramework,
  DependencySchedulerScenario,
  RecoveryRecommendation,
  RecoveryRecommendationType,
  TaskReadinessRecord,
} from "@/types/dependency-scheduler";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function uniqueFailures(values: readonly DependencySchedulerFailureReason[]): readonly DependencySchedulerFailureReason[] {
  return freezeArray([...new Set(values)]);
}

function defaultSequence(identity: AutonomyIdentityRecord) {
  const contract = buildExecutionContract(identity);
  const workflow = activateWorkflow(identity, contract);
  return generateTaskSequence(identity, workflow);
}

function dependencyStatusFor(category: DependencyCategory, scenario: DependencySchedulerScenario): DependencyLifecycleState {
  if (scenario === "MISSING_DEPENDENCY" && category === "TASK") return "FAILED";
  if (scenario === "RESOURCE_CONFLICT" && category === "RESOURCE") return "BLOCKED";
  if (scenario === "GOVERNANCE_FAILURE" && category === "GOVERNANCE") return "FAILED";
  if (scenario === "APPROVAL_MISSING" && category === "OPERATOR_APPROVAL") return "BLOCKED";
  if (scenario === "EXTERNAL_PREREQUISITE_MISSING" && category === "EXTERNAL") return "BLOCKED";
  if (scenario === "POLICY_VIOLATION" && category === "POLICY") return "FAILED";
  if (scenario === "SYNC_BARRIER_UNSATISFIED" && category === "SYNCHRONIZATION") return "BLOCKED";
  if (scenario === "CHECKPOINT_MISSING" && category === "CHECKPOINT") return "FAILED";
  if (scenario === "DEPENDENCY_TIMEOUT") return "EXPIRED";
  if (scenario === "BLOCKED_WORKFLOW") return "BLOCKED";
  return "READY";
}

export function registerDependencies(sequence: TaskSequencePackage, scenario: DependencySchedulerScenario = "BASELINE"): readonly DependencyRegistryEntry[] {
  if (scenario === "MISSING_DEPENDENCY") return freezeArray([]);
  const categories: readonly DependencyCategory[] = ["TASK", "RESOURCE", "GOVERNANCE", "OPERATOR_APPROVAL", "EXTERNAL", "POLICY", "SYNCHRONIZATION", "CHECKPOINT"];
  return freezeArray(sequence.task_order.flatMap((task, taskIndex) => categories.map((category) => {
    const status = dependencyStatusFor(category, scenario);
    return Object.freeze({
      dependency_id: id("DEP", "dependency-scheduler-registry-id", { sequence: sequence.sequence_id, task: task.task_id, category, scenario }),
      dependency_type: category,
      owner_task_id: task.task_id,
      dependency_target: `${category.toLowerCase()}:${task.task_id}`,
      dependency_status: status,
      validation_history: scenario === "DEPENDENCY_VIOLATION" ? freezeArray(["DISCOVERED", "REGISTERED", "VALIDATING", "DEPENDENCY_VIOLATION"]) : freezeArray(["DISCOVERED", "REGISTERED", "VALIDATING", status]),
      replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : sequence.replay_reference,
      lineage_reference: scenario === "LINEAGE_BROKEN" ? "" : sequence.lineage_reference,
    });
  })));
}

export function buildDependencyGraph(registry: readonly DependencyRegistryEntry[], scenario: DependencySchedulerScenario = "BASELINE"): readonly DependencyGraphEdge[] {
  const edges = registry.slice(1).map((entry, index) => Object.freeze({
    edge_id: id("DGE", "dependency-scheduler-edge-id", { from: registry[index]?.dependency_id, to: entry.dependency_id, scenario }),
    from_dependency_id: scenario === "CIRCULAR_DEPENDENCY" && index === registry.length - 2 ? entry.dependency_id : registry[index]?.dependency_id ?? "",
    to_dependency_id: scenario === "CIRCULAR_DEPENDENCY" && index === registry.length - 2 ? registry[0]?.dependency_id ?? "" : entry.dependency_id,
    relationship: entry.dependency_type === "OPERATOR_APPROVAL" ? "APPROVES" as const : entry.dependency_type === "GOVERNANCE" ? "GATES" as const : entry.dependency_type === "SYNCHRONIZATION" ? "SYNCHRONIZES_WITH" as const : "REQUIRES" as const,
  }));
  return freezeArray(edges);
}

function failureForDependency(entry: DependencyRegistryEntry, scenario: DependencySchedulerScenario): DependencySchedulerFailureReason | null {
  if (scenario === "MISSING_DEPENDENCY") return "MISSING_DEPENDENCY";
  if (scenario === "DEPENDENCY_TIMEOUT" || entry.dependency_status === "EXPIRED") return "DEPENDENCY_TIMEOUT";
  if (scenario === "DEPENDENCY_VIOLATION") return "DEPENDENCY_VIOLATION";
  if (entry.dependency_type === "RESOURCE" && entry.dependency_status !== "READY") return "RESOURCE_CONFLICT";
  if (entry.dependency_type === "GOVERNANCE" && entry.dependency_status !== "READY") return "GOVERNANCE_FAILURE";
  if (entry.dependency_type === "OPERATOR_APPROVAL" && entry.dependency_status !== "READY") return "APPROVAL_MISSING";
  if (entry.dependency_type === "EXTERNAL" && entry.dependency_status !== "READY") return "EXTERNAL_PREREQUISITE_MISSING";
  if (entry.dependency_type === "POLICY" && entry.dependency_status !== "READY") return "POLICY_VIOLATION";
  if (entry.dependency_type === "SYNCHRONIZATION" && entry.dependency_status !== "READY") return "SYNC_BARRIER_UNSATISFIED";
  if (entry.dependency_type === "CHECKPOINT" && entry.dependency_status !== "READY") return "CHECKPOINT_DEPENDENCY_MISSING";
  if (scenario === "BLOCKED_WORKFLOW" && entry.dependency_status === "BLOCKED") return "BLOCKED_WORKFLOW";
  return null;
}

export function evaluateReadiness(sequence: TaskSequencePackage, registry: readonly DependencyRegistryEntry[], scenario: DependencySchedulerScenario = "BASELINE"): readonly TaskReadinessRecord[] {
  return freezeArray(sequence.task_order.map((task) => {
    const dependencies = registry.filter((entry) => entry.owner_task_id === task.task_id);
    const blockers = dependencies.filter((entry) => entry.dependency_status !== "READY");
    const reasons = blockers.map((entry) => failureForDependency(entry, scenario)).filter(Boolean) as DependencySchedulerFailureReason[];
    return Object.freeze({
      task_id: task.task_id,
      readiness_state: reasons.some((reason) => ["GOVERNANCE_FAILURE", "POLICY_VIOLATION", "DEPENDENCY_VIOLATION", "CHECKPOINT_DEPENDENCY_MISSING"].includes(reason)) ? "FAILED" as const : blockers.length ? "BLOCKED" as const : "READY" as const,
      satisfied_dependencies: freezeArray(dependencies.filter((entry) => entry.dependency_status === "READY").map((entry) => entry.dependency_id)),
      waiting_dependencies: freezeArray(dependencies.filter((entry) => entry.dependency_status === "VALIDATING" || entry.dependency_status === "REGISTERED").map((entry) => entry.dependency_id)),
      blocking_dependencies: freezeArray(blockers.map((entry) => entry.dependency_id)),
      governance_ready: dependencies.every((entry) => entry.dependency_type !== "GOVERNANCE" || entry.dependency_status === "READY"),
      authority_ready: Boolean(sequence.authority_reference),
      resources_ready: dependencies.every((entry) => entry.dependency_type !== "RESOURCE" || entry.dependency_status === "READY"),
      approvals_ready: dependencies.every((entry) => entry.dependency_type !== "OPERATOR_APPROVAL" || entry.dependency_status === "READY"),
      policy_ready: dependencies.every((entry) => entry.dependency_type !== "POLICY" || entry.dependency_status === "READY"),
      explanation: blockers.length ? `Task ${task.task_id} blocked by ${blockers.length} dependencies.` : `Task ${task.task_id} is dependency-ready.`,
    });
  }));
}

function buildBlockingReasons(readiness: readonly TaskReadinessRecord[], registry: readonly DependencyRegistryEntry[], scenario: DependencySchedulerScenario): readonly BlockingReason[] {
  return freezeArray(readiness.flatMap((record) => record.blocking_dependencies.map((dependencyId) => {
    const entry = registry.find((item) => item.dependency_id === dependencyId);
    const reason = entry ? failureForDependency(entry, scenario) ?? "BLOCKED_WORKFLOW" : "MISSING_DEPENDENCY";
    return Object.freeze({
      blocking_reason_id: id("DBR", "dependency-blocking-reason-id", { task: record.task_id, dependencyId, reason, scenario }),
      task_id: record.task_id,
      dependency_id: dependencyId,
      reason,
      owner: entry?.dependency_type ?? "UNKNOWN",
      impact_assessment: reason === "GOVERNANCE_FAILURE" || reason === "POLICY_VIOLATION" ? "CRITICAL" as const : "HIGH" as const,
      expected_resolution: "Resolve dependency through governed validation before execution readiness.",
    });
  })));
}

function recommendationType(reason: DependencySchedulerFailureReason): RecoveryRecommendationType {
  if (reason === "APPROVAL_MISSING") return "REQUEST_OPERATOR_APPROVAL";
  if (reason === "RESOURCE_CONFLICT") return "SCHEDULE_ALTERNATIVE_RESOURCE";
  if (reason === "GOVERNANCE_FAILURE" || reason === "POLICY_VIOLATION") return "ESCALATE_TO_GOVERNANCE";
  if (reason === "DEPENDENCY_TIMEOUT") return "RETRY_VALIDATION";
  if (reason === "BLOCKED_WORKFLOW" || reason === "SYNC_BARRIER_UNSATISFIED") return "PAUSE_WORKFLOW";
  if (reason === "CHECKPOINT_DEPENDENCY_MISSING") return "PREPARE_ROLLBACK";
  return "WAIT_FOR_DEPENDENCY";
}

function buildRecoveryRecommendations(blocking: readonly BlockingReason[], sequence: TaskSequencePackage): readonly RecoveryRecommendation[] {
  return freezeArray(blocking.map((block) => Object.freeze({
    recommendation_id: id("DRR", "dependency-recovery-recommendation-id", { block: block.blocking_reason_id }),
    task_id: block.task_id,
    dependency_id: block.dependency_id,
    recommendation_type: recommendationType(block.reason),
    rationale: `Advisory recommendation for ${block.reason}; dependency bypass is not permitted.`,
    advisory_only: true as const,
    governance_reference: sequence.governance_reference,
    replay_reference: sequence.replay_reference,
  })));
}

function eventHash(event: Omit<DependencyEvent, "integrity_hash">): string {
  return hashValue("dependency-scheduler-event", event);
}

function buildDependencyEvents(registry: readonly DependencyRegistryEntry[], sequence: TaskSequencePackage, scenario: DependencySchedulerScenario): readonly DependencyEvent[] {
  return freezeArray(registry.map((entry, index) => {
    const source = {
      dependency_event_id: id("DSE", "dependency-scheduler-event-id", { dependency: entry.dependency_id, index, scenario }),
      event_order: index + 1,
      dependency_id: entry.dependency_id,
      event_type: entry.dependency_status === "READY" ? "READINESS_EVALUATED" as const : "BLOCKING_DETECTED" as const,
      dependency_status: entry.dependency_status,
      replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : sequence.replay_reference,
      lineage_reference: scenario === "LINEAGE_BROKEN" ? "" : sequence.lineage_reference,
    };
    return Object.freeze({ ...source, integrity_hash: eventHash(source) });
  }));
}

function buildMonitoring(registry: readonly DependencyRegistryEntry[], scenario: DependencySchedulerScenario): readonly DependencyMonitorRecord[] {
  if (scenario === "CONDITIONAL_MONITORING_GAP") return freezeArray([]);
  return freezeArray(registry.map((entry) => Object.freeze({
    monitor_id: id("DSM", "dependency-scheduler-monitor-id", entry.dependency_id),
    dependency_id: entry.dependency_id,
    health_state: entry.dependency_status === "READY" ? "HEALTHY" as const : entry.dependency_status === "EXPIRED" ? "TIMED_OUT" as const : entry.dependency_status === "FAILED" ? "FAILED" as const : "DEGRADED" as const,
    latency_state: entry.dependency_status === "EXPIRED" ? "TIMEOUT" as const : entry.dependency_status === "BLOCKED" ? "SLOW" as const : "NORMAL" as const,
    governance_valid: entry.dependency_type !== "GOVERNANCE" || entry.dependency_status === "READY",
    readiness_valid: entry.dependency_status === "READY",
    last_observed_event: entry.validation_history.at(-1) ?? "UNKNOWN",
  })));
}

function packageHashSource(schedule: Omit<DependencySchedulePackage, "integrity_hash"> | DependencySchedulePackage) {
  return {
    dependency_schedule_id: schedule.dependency_schedule_id,
    execution_id: schedule.execution_id,
    workflow_id: schedule.workflow_id,
    sequence_id: schedule.sequence_id,
    tenant_id: schedule.tenant_id,
    dependency_registry: schedule.dependency_registry.map((entry) => ({ id: entry.dependency_id, status: entry.dependency_status })),
    dependency_graph: schedule.dependency_graph,
    dependency_status: schedule.dependency_status,
    ready_tasks: schedule.ready_tasks,
    blocked_tasks: schedule.blocked_tasks,
    waiting_tasks: schedule.waiting_tasks,
    blocking_reasons: schedule.blocking_reasons,
    recovery_recommendations: schedule.recovery_recommendations,
    governance_reference: schedule.governance_reference,
    authority_reference: schedule.authority_reference,
    lineage_reference: schedule.lineage_reference,
    replay_reference: schedule.replay_reference,
    sequence_hash: schedule.source_sequence.integrity_hash,
  };
}

export function computeDependencyScheduleHash(schedule: Omit<DependencySchedulePackage, "integrity_hash"> | DependencySchedulePackage): string {
  return hashValue("dependency-schedule-package", packageHashSource(schedule));
}

export function buildDependencySchedule(identity = generateAutonomyIdentity(), sequence?: TaskSequencePackage, scenario: DependencySchedulerScenario = "BASELINE"): DependencySchedulePackage {
  const sourceSequence = sequence ?? defaultSequence(identity);
  const registry = registerDependencies(sourceSequence, scenario);
  const graph = buildDependencyGraph(registry, scenario);
  const readiness = evaluateReadiness(sourceSequence, registry, scenario);
  const blocking = buildBlockingReasons(readiness, registry, scenario);
  const recommendations = buildRecoveryRecommendations(blocking, sourceSequence);
  const events = buildDependencyEvents(registry, sourceSequence, scenario);
  const monitors = buildMonitoring(registry, scenario);
  const readyTasks = freezeArray(readiness.filter((record) => record.readiness_state === "READY").map((record) => record.task_id));
  const blockedTasks = freezeArray(readiness.filter((record) => record.readiness_state === "BLOCKED" || record.readiness_state === "FAILED").map((record) => record.task_id));
  const waitingTasks = freezeArray(readiness.filter((record) => record.readiness_state === "WAITING").map((record) => record.task_id));
  const base = {
    dependency_schedule_id: id("DS", "dependency-schedule-id", { sequence: sourceSequence.sequence_id, scenario }),
    execution_id: sourceSequence.execution_id,
    workflow_id: sourceSequence.workflow_id,
    sequence_id: sourceSequence.sequence_id,
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : sourceSequence.source_workflow.tenant_id,
    dependency_registry: registry,
    dependency_graph: graph,
    task_dependencies: freezeArray(registry.filter((entry) => entry.dependency_type === "TASK")),
    resource_dependencies: freezeArray(registry.filter((entry) => entry.dependency_type === "RESOURCE")),
    governance_dependencies: freezeArray(registry.filter((entry) => entry.dependency_type === "GOVERNANCE")),
    operator_dependencies: freezeArray(registry.filter((entry) => entry.dependency_type === "OPERATOR_APPROVAL")),
    external_dependencies: freezeArray(registry.filter((entry) => entry.dependency_type === "EXTERNAL")),
    policy_dependencies: freezeArray(registry.filter((entry) => entry.dependency_type === "POLICY")),
    dependency_status: blockedTasks.length ? "BLOCKED" as const : waitingTasks.length ? "WAITING" as const : "READY" as const,
    ready_tasks: readyTasks,
    blocked_tasks: blockedTasks,
    waiting_tasks: waitingTasks,
    readiness_records: readiness,
    dependency_events: events,
    monitoring_records: monitors,
    blocking_reasons: blocking,
    recovery_recommendations: recommendations,
    governance_reference: scenario === "GOVERNANCE_FAILURE" ? "" : sourceSequence.governance_reference,
    authority_reference: sourceSequence.authority_reference,
    lineage_reference: scenario === "LINEAGE_BROKEN" ? "" : sourceSequence.lineage_reference,
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : sourceSequence.replay_reference,
    source_sequence: scenario === "INVALID_TASK_SEQUENCE" ? Object.freeze({ ...sourceSequence, integrity_hash: "invalid" }) : sourceSequence,
  };
  const schedule = Object.freeze({ ...base, integrity_hash: computeDependencyScheduleHash(base) });
  if (scenario !== "INTEGRITY_MISMATCH") return schedule;
  return Object.freeze({ ...schedule, integrity_hash: "tampered" });
}

function hasCycle(edges: readonly DependencyGraphEdge[]): boolean {
  const last = edges.at(-1);
  return Boolean(last?.to_dependency_id && edges[0]?.from_dependency_id && last.to_dependency_id === edges[0].from_dependency_id);
}

function scheduleFailures(schedule: DependencySchedulePackage): DependencySchedulerFailureReason[] {
  const failures: DependencySchedulerFailureReason[] = [];
  const sequenceValidation = validateTaskSequence(schedule.source_sequence);
  if (sequenceValidation.certification_state === "FAIL") failures.push("INVALID_TASK_SEQUENCE");
  if (schedule.dependency_registry.some((entry) => entry.validation_history.includes("DEPENDENCY_VIOLATION"))) failures.push("DEPENDENCY_VIOLATION");
  if (schedule.dependency_registry.length === 0) failures.push("MISSING_DEPENDENCY");
  if (hasCycle(schedule.dependency_graph)) failures.push("CIRCULAR_DEPENDENCY");
  if (schedule.blocked_tasks.length > 0 && schedule.blocking_reasons.length === 0) failures.push("BLOCKED_WORKFLOW");
  failures.push(...schedule.blocking_reasons.map((block) => block.reason));
  if (schedule.tenant_id !== schedule.source_sequence.source_workflow.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!schedule.governance_reference) failures.push("GOVERNANCE_FAILURE");
  if (!schedule.replay_reference || schedule.dependency_events.some((event) => !event.replay_reference)) failures.push("REPLAY_DIVERGENCE");
  if (!schedule.lineage_reference || schedule.dependency_events.some((event) => !event.lineage_reference)) failures.push("LINEAGE_BROKEN");
  if (schedule.monitoring_records.length === 0) failures.push("MONITORING_GAP");
  if (schedule.recovery_recommendations.some((item) => item.advisory_only !== true)) failures.push("INTEGRITY_HASH_MISMATCH");
  if (schedule.dependency_events.some((event) => {
    const source = {
      dependency_event_id: event.dependency_event_id,
      event_order: event.event_order,
      dependency_id: event.dependency_id,
      event_type: event.event_type,
      dependency_status: event.dependency_status,
      replay_reference: event.replay_reference,
      lineage_reference: event.lineage_reference,
    };
    return eventHash(source) !== event.integrity_hash;
  })) failures.push("INTEGRITY_HASH_MISMATCH");
  if (computeDependencyScheduleHash(schedule) !== schedule.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return failures;
}

export function validateDependencySchedule(schedule: DependencySchedulePackage): DependencyScheduleValidationResult {
  const failures = uniqueFailures(scheduleFailures(schedule));
  const warnings = failures.includes("MONITORING_GAP") ? freezeArray<DependencySchedulerFailureReason>(["MONITORING_GAP"]) : freezeArray<DependencySchedulerFailureReason>([]);
  const hardFailures = failures.filter((failure) => failure !== "MONITORING_GAP");
  const certification: DependencySchedulerCertificationState = hardFailures.length ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  const has = (reason: DependencySchedulerFailureReason) => failures.includes(reason);
  const source = { schedule: schedule.dependency_schedule_id, certification, failures, warnings };
  return Object.freeze({
    validation_id: id("DSV", "dependency-schedule-validation-id", source),
    dependency_schedule_id: schedule.dependency_schedule_id,
    certification_state: certification,
    failures,
    warnings,
    registry_complete: !has("MISSING_DEPENDENCY"),
    graph_complete: schedule.dependency_graph.length > 0,
    graph_acyclic: !has("CIRCULAR_DEPENDENCY"),
    readiness_deterministic: !has("DEPENDENCY_VIOLATION") && !has("BLOCKED_WORKFLOW"),
    governance_enforced: !has("GOVERNANCE_FAILURE") && !has("POLICY_VIOLATION"),
    authority_enforced: Boolean(schedule.authority_reference),
    approvals_enforced: !has("APPROVAL_MISSING"),
    resources_available: !has("RESOURCE_CONFLICT"),
    replay_consistent: !has("REPLAY_DIVERGENCE"),
    lineage_complete: !has("LINEAGE_BROKEN"),
    recovery_recommendations_advisory: schedule.recovery_recommendations.every((item) => item.advisory_only),
    ready_for_execution_monitor: certification === "PASS" || certification === "CONDITIONAL_PASS",
    validation_hash: hashValue("dependency-schedule-validation", source),
  });
}

export function replayDependencySchedule(schedule: DependencySchedulePackage): DependencyScheduleReplayResult {
  const failures: DependencySchedulerFailureReason[] = [];
  if (computeDependencyScheduleHash(schedule) !== schedule.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!schedule.replay_reference) failures.push("REPLAY_DIVERGENCE");
  const source = {
    replay_id: id("DSR", "dependency-schedule-replay-id", schedule.dependency_schedule_id),
    dependency_schedule_id: schedule.dependency_schedule_id,
    replay_dependency_order: freezeArray(schedule.dependency_registry.map((entry) => entry.dependency_id)),
    replay_ready_tasks: schedule.ready_tasks,
    replay_blocked_tasks: schedule.blocked_tasks,
    replay_event_order: freezeArray(schedule.dependency_events.map((event) => event.event_type)),
    validation_state: failures.length ? "FAIL" as const : validateDependencySchedule(schedule).certification_state,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("dependency-schedule-replay", source) });
}

export function buildDependencyScheduleVisibilitySurface(schedule: DependencySchedulePackage): DependencyScheduleVisibilitySurface {
  const validation = validateDependencySchedule(schedule);
  return Object.freeze({
    dependency_schedule_id: schedule.dependency_schedule_id,
    execution_id: schedule.execution_id,
    workflow_id: schedule.workflow_id,
    dependency_status: schedule.dependency_status,
    ready_tasks: schedule.ready_tasks,
    blocked_tasks: schedule.blocked_tasks,
    waiting_tasks: schedule.waiting_tasks,
    blocking_reasons: freezeArray(schedule.blocking_reasons.map((reason) => reason.reason)),
    recovery_recommendations: freezeArray(schedule.recovery_recommendations.map((recommendation) => recommendation.recommendation_type)),
    dependency_count: schedule.dependency_registry.length,
    integrity_status: validation.failures.includes("INTEGRITY_HASH_MISMATCH") ? "INVALID" : "VALID",
  });
}

export function getDependencySchedulerFramework(): DependencySchedulerFramework {
  const identity = generateAutonomyIdentity();
  const sequence = defaultSequence(identity);
  const schedule = buildDependencySchedule(identity, sequence);
  return Object.freeze({
    identity,
    sequence_validation: validateTaskSequence(sequence),
    schedule,
    validation: validateDependencySchedule(schedule),
    replay: replayDependencySchedule(schedule),
    visibility: buildDependencyScheduleVisibilitySurface(schedule),
  });
}
