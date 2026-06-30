import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { buildExecutionContract } from "@/services/execution-contract";
import { activateWorkflow } from "@/services/workflow-orchestrator";
import { generateTaskSequence } from "@/services/task-sequencing";
import { buildDependencySchedule, validateDependencySchedule } from "@/services/dependency-scheduler";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { DependencySchedulePackage } from "@/types/dependency-scheduler";
import type {
  ExecutionAnomaly,
  ExecutionAnomalyType,
  ExecutionMonitorFailureReason,
  ExecutionMonitorFramework,
  ExecutionMonitorPackage,
  ExecutionMonitorReplayResult,
  ExecutionMonitorScenario,
  ExecutionMonitorValidationResult,
  ExecutionMonitorVisibilitySurface,
  ExecutionTelemetryEvent,
  HealthMetric,
  HealthState,
  MonitoringLineageRecord,
  OperatorIntervention,
  TelemetryEventType,
} from "@/types/execution-monitor";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function uniqueFailures(values: readonly ExecutionMonitorFailureReason[]): readonly ExecutionMonitorFailureReason[] {
  return freezeArray([...new Set(values)]);
}

function defaultSchedule(identity: AutonomyIdentityRecord) {
  const contract = buildExecutionContract(identity);
  const workflow = activateWorkflow(identity, contract);
  const sequence = generateTaskSequence(identity, workflow);
  return buildDependencySchedule(identity, sequence);
}

function anomalyForScenario(scenario: ExecutionMonitorScenario): ExecutionAnomalyType | null {
  const map: Partial<Record<ExecutionMonitorScenario, ExecutionAnomalyType>> = {
    EXECUTION_DRIFT: "EXECUTION_DRIFT",
    UNEXPECTED_STATE: "UNEXPECTED_STATE",
    TASK_FAILURE: "TASK_FAILURE",
    HUNG_WORKFLOW: "HUNG_WORKFLOW",
    MISSED_CHECKPOINT: "MISSED_CHECKPOINT",
    POLICY_VIOLATION: "POLICY_VIOLATION",
    GOVERNANCE_DRIFT: "GOVERNANCE_DRIFT",
    RESOURCE_DEGRADATION: "RESOURCE_DEGRADATION",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    DEPENDENCY_INCONSISTENCY: "DEPENDENCY_INCONSISTENCY",
    SYNCHRONIZATION_FAILURE: "SYNCHRONIZATION_FAILURE",
  };
  return map[scenario] ?? null;
}

function failureForAnomaly(anomaly: ExecutionAnomalyType): ExecutionMonitorFailureReason {
  const map: Record<ExecutionAnomalyType, ExecutionMonitorFailureReason> = {
    EXECUTION_DRIFT: "EXECUTION_DRIFT",
    UNEXPECTED_STATE: "UNEXPECTED_STATE",
    TASK_FAILURE: "TASK_FAILURE",
    HUNG_WORKFLOW: "HUNG_WORKFLOW",
    MISSED_CHECKPOINT: "MISSED_CHECKPOINT",
    POLICY_VIOLATION: "POLICY_VIOLATION",
    GOVERNANCE_DRIFT: "GOVERNANCE_DRIFT",
    RESOURCE_DEGRADATION: "RESOURCE_DEGRADATION",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    DEPENDENCY_INCONSISTENCY: "DEPENDENCY_INCONSISTENCY",
    SYNCHRONIZATION_FAILURE: "SYNCHRONIZATION_FAILURE",
  };
  return map[anomaly];
}

function buildAnomalies(schedule: DependencySchedulePackage, scenario: ExecutionMonitorScenario): readonly ExecutionAnomaly[] {
  const anomaly = anomalyForScenario(scenario);
  if (!anomaly) return freezeArray([]);
  return freezeArray([Object.freeze({
    anomaly_id: id("EMA", "execution-monitor-anomaly-id", { schedule: schedule.dependency_schedule_id, anomaly, scenario }),
    anomaly_type: anomaly,
    severity: ["POLICY_VIOLATION", "GOVERNANCE_DRIFT", "REPLAY_DIVERGENCE"].includes(anomaly) ? "CRITICAL" as const : "HIGH" as const,
    affected_task: schedule.ready_tasks[0] ?? schedule.blocked_tasks[0] ?? null,
    explanation: `${anomaly} detected by deterministic monitoring.`,
    recommended_action: "Report anomaly and request governed operator review.",
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : schedule.replay_reference,
  })]);
}

function healthFor(schedule: DependencySchedulePackage, anomalies: readonly ExecutionAnomaly[], scenario: ExecutionMonitorScenario): HealthState {
  if (scenario === "INVALID_DEPENDENCY_SCHEDULE" || anomalies.some((item) => item.severity === "CRITICAL")) return "CRITICAL";
  if (anomalies.length > 0 || schedule.blocked_tasks.length > 0) return "DEGRADED";
  if (schedule.waiting_tasks.length > 0) return "WATCH";
  return "HEALTHY";
}

function eventHash(event: Omit<ExecutionTelemetryEvent, "integrity_hash">): string {
  return hashValue("execution-monitor-telemetry-event", event);
}

function buildTelemetry(schedule: DependencySchedulePackage, anomalies: readonly ExecutionAnomaly[], scenario: ExecutionMonitorScenario): readonly ExecutionTelemetryEvent[] {
  if (scenario === "CONDITIONAL_TELEMETRY_GAP") return freezeArray([]);
  const eventTypes: readonly TelemetryEventType[] = ["EXECUTION_EVENT", "TIMING_METRIC", "WORKFLOW_PROGRESS", "HEALTH_METRIC", "GOVERNANCE_EVENT", "OPERATOR_EVENT", "CHECKPOINT_EVENT", ...(anomalies.length ? ["ANOMALY_EVENT" as const] : [])];
  return freezeArray(eventTypes.map((eventType, index) => {
    const source = {
      telemetry_event_id: id("EMT", "execution-monitor-telemetry-id", { schedule: schedule.dependency_schedule_id, eventType, index, scenario }),
      event_order: index + 1,
      event_type: eventType,
      payload_reference: `payload:${schedule.dependency_schedule_id}:${eventType}`,
      lineage_reference: scenario === "LINEAGE_BROKEN" ? "" : schedule.lineage_reference,
      replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : schedule.replay_reference,
    };
    return Object.freeze({ ...source, integrity_hash: eventHash(source) });
  }));
}

function buildHealthMetrics(schedule: DependencySchedulePackage, health: HealthState, scenario: ExecutionMonitorScenario): readonly HealthMetric[] {
  const categories: readonly HealthMetric["category"][] = ["EXECUTION", "ORCHESTRATION", "DEPENDENCY", "GOVERNANCE", "RESOURCE", "CHECKPOINT", "REPLAY"];
  return freezeArray(categories.map((category) => Object.freeze({
    metric_id: id("EMH", "execution-monitor-health-id", { schedule: schedule.dependency_schedule_id, category, scenario }),
    category,
    health_state: category === "RESOURCE" && scenario === "RESOURCE_DEGRADATION" ? "DEGRADED" as const : category === "GOVERNANCE" && scenario === "GOVERNANCE_DRIFT" ? "CRITICAL" as const : category === "REPLAY" && scenario === "REPLAY_DIVERGENCE" ? "CRITICAL" as const : health,
    score: health === "HEALTHY" ? 96 : health === "WATCH" ? 78 : health === "DEGRADED" ? 54 : 20,
    evidence_ref: `evidence:${schedule.dependency_schedule_id}:${category}`,
  })));
}

function lineageHash(source: Omit<MonitoringLineageRecord, "integrity_hash">): string {
  return hashValue("execution-monitor-lineage", source);
}

function buildLineage(monitorId: string, telemetry: readonly ExecutionTelemetryEvent[], anomalies: readonly ExecutionAnomaly[], schedule: DependencySchedulePackage, scenario: ExecutionMonitorScenario): MonitoringLineageRecord {
  const source = {
    monitoring_lineage_id: id("EML", "execution-monitor-lineage-id", { monitorId, scenario }),
    monitor_id: monitorId,
    telemetry_refs: freezeArray(telemetry.map((event) => event.telemetry_event_id)),
    anomaly_refs: freezeArray(anomalies.map((anomaly) => anomaly.anomaly_id)),
    governance_refs: scenario === "GOVERNANCE_DRIFT" ? freezeArray<string>([]) : freezeArray([schedule.governance_reference]),
    operator_refs: freezeArray(["operator:observed"]),
    replay_refs: scenario === "REPLAY_DIVERGENCE" || scenario === "LINEAGE_BROKEN" ? freezeArray<string>([]) : freezeArray([schedule.replay_reference]),
  };
  return Object.freeze({ ...source, integrity_hash: lineageHash(source) });
}

function packageHashSource(monitor: Omit<ExecutionMonitorPackage, "integrity_hash"> | ExecutionMonitorPackage) {
  return {
    monitor_id: monitor.monitor_id,
    execution_id: monitor.execution_id,
    workflow_id: monitor.workflow_id,
    tenant_id: monitor.tenant_id,
    monitoring_state: monitor.monitoring_state,
    progress_percentage: monitor.progress_percentage,
    task_activity: monitor.task_activity,
    resource_utilization: monitor.resource_utilization,
    latency_metrics: monitor.latency_metrics,
    governance_status: monitor.governance_status,
    execution_health: monitor.execution_health,
    confidence_score: monitor.confidence_score,
    detected_anomalies: monitor.detected_anomalies.map((item) => item.anomaly_type),
    telemetry_events: monitor.telemetry_events.map((event) => ({ id: event.telemetry_event_id, hash: event.integrity_hash })),
    health_metrics: monitor.health_metrics.map((metric) => ({ category: metric.category, state: metric.health_state, score: metric.score })),
    governance_reference: monitor.governance_reference,
    authority_reference: monitor.authority_reference,
    lineage_reference: monitor.lineage_reference,
    replay_reference: monitor.replay_reference,
    advisory_only: monitor.advisory_only,
    execution_modified: monitor.execution_modified,
    schedule_hash: monitor.source_schedule.integrity_hash,
    monitoring_lineage: monitor.monitoring_lineage,
  };
}

export function computeExecutionMonitorHash(monitor: Omit<ExecutionMonitorPackage, "integrity_hash"> | ExecutionMonitorPackage): string {
  return hashValue("execution-monitor-package", packageHashSource(monitor));
}

export function buildExecutionMonitor(identity = generateAutonomyIdentity(), schedule?: DependencySchedulePackage, scenario: ExecutionMonitorScenario = "BASELINE"): ExecutionMonitorPackage {
  const sourceSchedule = schedule ?? defaultSchedule(identity);
  const anomalies = buildAnomalies(sourceSchedule, scenario);
  const health = healthFor(sourceSchedule, anomalies, scenario);
  const telemetry = buildTelemetry(sourceSchedule, anomalies, scenario);
  const monitorId = id("EM", "execution-monitor-id", { schedule: sourceSchedule.dependency_schedule_id, scenario });
  const lineage = buildLineage(monitorId, telemetry, anomalies, sourceSchedule, scenario);
  const completed = sourceSchedule.source_sequence.completed_tasks;
  const pending = sourceSchedule.source_sequence.pending_tasks;
  const total = Math.max(1, completed.length + pending.length + sourceSchedule.blocked_tasks.length);
  const progress = Math.round((completed.length / total) * 100);
  const base = {
    monitor_id: monitorId,
    execution_id: sourceSchedule.execution_id,
    workflow_id: sourceSchedule.workflow_id,
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : sourceSchedule.tenant_id,
    monitoring_state: anomalies.length ? "DEGRADED" as const : "MONITORING" as const,
    progress_percentage: progress,
    current_step: sourceSchedule.ready_tasks[0] ?? null,
    task_activity: Object.freeze({
      active_tasks: scenario === "UNEXPECTED_STATE" ? freezeArray(["unexpected:task"]) : freezeArray(sourceSchedule.ready_tasks.slice(0, 1)),
      completed_tasks: completed,
      queued_tasks: sourceSchedule.ready_tasks,
      waiting_tasks: sourceSchedule.waiting_tasks,
      failed_tasks: scenario === "TASK_FAILURE" ? freezeArray([sourceSchedule.ready_tasks[0] ?? "task:unknown"]) : freezeArray<string>([]),
      paused_tasks: scenario === "HUNG_WORKFLOW" ? freezeArray(sourceSchedule.ready_tasks.slice(0, 1)) : freezeArray<string>([]),
    }),
    resource_utilization: Object.freeze({
      compute_utilization: scenario === "RESOURCE_DEGRADATION" ? 96 : 42,
      memory_utilization: scenario === "RESOURCE_DEGRADATION" ? 91 : 38,
      storage_utilization: 35,
      network_utilization: scenario === "RESOURCE_DEGRADATION" ? 88 : 31,
      agent_availability: scenario === "RESOURCE_DEGRADATION" ? "DEGRADED" as const : "AVAILABLE" as const,
      external_service_availability: scenario === "RESOURCE_DEGRADATION" ? "DEGRADED" as const : "AVAILABLE" as const,
    }),
    latency_metrics: Object.freeze({
      workflow_latency_ms: scenario === "HUNG_WORKFLOW" ? 120000 : 1200,
      task_latency_ms: scenario === "HUNG_WORKFLOW" ? 90000 : 400,
      scheduling_latency_ms: 120,
      orchestration_delay_ms: scenario === "EXECUTION_DRIFT" ? 5000 : 180,
      execution_throughput: scenario === "HUNG_WORKFLOW" ? 0 : 4,
      idle_time_ms: scenario === "HUNG_WORKFLOW" ? 85000 : 250,
    }),
    timeout_events: scenario === "HUNG_WORKFLOW" ? freezeArray(["timeout:workflow"]) : freezeArray<string>([]),
    governance_status: Object.freeze({
      authority_enforced: scenario !== "OPERATOR_OVERRIDE",
      policy_compliant: scenario !== "POLICY_VIOLATION",
      constitutional_compliant: scenario !== "POLICY_VIOLATION",
      governance_approval_valid: scenario !== "GOVERNANCE_DRIFT",
      execution_constraints_valid: scenario !== "EXECUTION_DRIFT",
    }),
    operator_interventions: scenario === "OPERATOR_OVERRIDE" ? freezeArray<OperatorIntervention>([Object.freeze({
      intervention_id: id("EMO", "execution-monitor-operator-id", { monitorId, scenario }),
      intervention_type: "OVERRIDE",
      operator_reference: "operator:override",
      intervention_state: "RECORDED",
      lineage_reference: sourceSchedule.lineage_reference,
    })]) : freezeArray<OperatorIntervention>([]),
    execution_health: health,
    confidence_score: health === "HEALTHY" ? 94 : health === "WATCH" ? 78 : health === "DEGRADED" ? 55 : 20,
    detected_anomalies: anomalies,
    telemetry_events: telemetry,
    progress_reports: freezeArray([Object.freeze({
      progress_report_id: id("EMP", "execution-monitor-progress-id", { monitorId, scenario }),
      completed_steps: completed,
      current_step: sourceSchedule.ready_tasks[0] ?? null,
      pending_steps: pending,
      progress_percentage: progress,
      workflow_stage: sourceSchedule.source_sequence.source_workflow.workflow_state,
      elapsed_duration_ms: scenario === "HUNG_WORKFLOW" ? 120000 : 1200,
    })]),
    health_metrics: buildHealthMetrics(sourceSchedule, health, scenario),
    governance_reference: scenario === "GOVERNANCE_DRIFT" ? "" : sourceSchedule.governance_reference,
    authority_reference: scenario === "OPERATOR_OVERRIDE" ? "" : sourceSchedule.authority_reference,
    lineage_reference: scenario === "LINEAGE_BROKEN" ? "" : sourceSchedule.lineage_reference,
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : sourceSchedule.replay_reference,
    advisory_only: true as const,
    execution_modified: false as const,
    source_schedule: scenario === "INVALID_DEPENDENCY_SCHEDULE" ? Object.freeze({ ...sourceSchedule, integrity_hash: "invalid" }) : sourceSchedule,
    monitoring_lineage: lineage,
  };
  const monitor = Object.freeze({ ...base, integrity_hash: computeExecutionMonitorHash(base) });
  if (scenario !== "INTEGRITY_MISMATCH") return monitor;
  return Object.freeze({ ...monitor, integrity_hash: "tampered" });
}

function failuresForMonitor(monitor: ExecutionMonitorPackage): ExecutionMonitorFailureReason[] {
  const failures: ExecutionMonitorFailureReason[] = [];
  const scheduleValidation = validateDependencySchedule(monitor.source_schedule);
  if (scheduleValidation.certification_state === "FAIL") failures.push("INVALID_DEPENDENCY_SCHEDULE");
  failures.push(...monitor.detected_anomalies.map((anomaly) => failureForAnomaly(anomaly.anomaly_type)));
  if (monitor.task_activity.active_tasks.some((task) => !monitor.source_schedule.ready_tasks.includes(task) && !task.startsWith("unexpected"))) failures.push("EXECUTION_DRIFT");
  if (monitor.task_activity.active_tasks.some((task) => task.startsWith("unexpected"))) failures.push("UNEXPECTED_STATE");
  if (monitor.task_activity.failed_tasks.length > 0) failures.push("TASK_FAILURE");
  if (monitor.timeout_events.length > 0) failures.push("HUNG_WORKFLOW");
  if (monitor.source_schedule.source_sequence.source_workflow.checkpoints.length === 0 || monitor.detected_anomalies.some((item) => item.anomaly_type === "MISSED_CHECKPOINT")) failures.push("MISSED_CHECKPOINT");
  if (!monitor.governance_status.policy_compliant || !monitor.governance_status.constitutional_compliant) failures.push("POLICY_VIOLATION");
  if (!monitor.governance_status.governance_approval_valid || !monitor.governance_reference) failures.push("GOVERNANCE_DRIFT");
  if (monitor.resource_utilization.agent_availability !== "AVAILABLE" || monitor.resource_utilization.external_service_availability !== "AVAILABLE") failures.push("RESOURCE_DEGRADATION");
  if (!monitor.governance_status.authority_enforced || !monitor.authority_reference) failures.push("AUTHORITY_VIOLATION");
  if (monitor.operator_interventions.some((item) => item.intervention_type === "OVERRIDE")) failures.push("OPERATOR_OVERRIDE_DETECTED");
  if (monitor.tenant_id !== monitor.source_schedule.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!monitor.replay_reference || monitor.telemetry_events.some((event) => !event.replay_reference)) failures.push("REPLAY_DIVERGENCE");
  if (!monitor.lineage_reference || monitor.telemetry_events.some((event) => !event.lineage_reference) || monitor.monitoring_lineage.replay_refs.length === 0) failures.push("LINEAGE_BROKEN");
  if (monitor.telemetry_events.length === 0) failures.push("TELEMETRY_GAP");
  if (monitor.advisory_only !== true || monitor.execution_modified !== false) failures.push("MONITORING_NOT_ADVISORY");
  if (monitor.telemetry_events.some((event) => {
    const source = {
      telemetry_event_id: event.telemetry_event_id,
      event_order: event.event_order,
      event_type: event.event_type,
      payload_reference: event.payload_reference,
      lineage_reference: event.lineage_reference,
      replay_reference: event.replay_reference,
    };
    return eventHash(source) !== event.integrity_hash;
  })) failures.push("INTEGRITY_HASH_MISMATCH");
  if (computeExecutionMonitorHash(monitor) !== monitor.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return failures;
}

export function validateExecutionMonitor(monitor: ExecutionMonitorPackage): ExecutionMonitorValidationResult {
  const failures = uniqueFailures(failuresForMonitor(monitor));
  const warnings = failures.includes("TELEMETRY_GAP") ? freezeArray<ExecutionMonitorFailureReason>(["TELEMETRY_GAP"]) : freezeArray<ExecutionMonitorFailureReason>([]);
  const hardFailures = failures.filter((failure) => failure !== "TELEMETRY_GAP");
  const certification = hardFailures.length ? "FAIL" as const : warnings.length ? "CONDITIONAL_PASS" as const : "PASS" as const;
  const has = (reason: ExecutionMonitorFailureReason) => failures.includes(reason);
  const source = { monitor: monitor.monitor_id, certification, failures, warnings };
  return Object.freeze({
    validation_id: id("EMV", "execution-monitor-validation-id", source),
    monitor_id: monitor.monitor_id,
    certification_state: certification,
    failures,
    warnings,
    progress_observable: monitor.progress_reports.length > 0,
    task_activity_observable: monitor.task_activity.queued_tasks.length + monitor.task_activity.active_tasks.length + monitor.task_activity.completed_tasks.length > 0,
    resources_observable: !has("RESOURCE_DEGRADATION"),
    governance_compliance_preserved: !has("POLICY_VIOLATION") && !has("GOVERNANCE_DRIFT"),
    authority_enforced: !has("AUTHORITY_VIOLATION") && !has("OPERATOR_OVERRIDE_DETECTED"),
    replay_consistent: !has("REPLAY_DIVERGENCE"),
    lineage_complete: !has("LINEAGE_BROKEN"),
    telemetry_complete: !has("TELEMETRY_GAP"),
    advisory_only_enforced: !has("MONITORING_NOT_ADVISORY"),
    ready_for_checkpoint_manager: certification === "PASS" || certification === "CONDITIONAL_PASS",
    validation_hash: hashValue("execution-monitor-validation", source),
  });
}

export function replayExecutionMonitor(monitor: ExecutionMonitorPackage): ExecutionMonitorReplayResult {
  const failures: ExecutionMonitorFailureReason[] = [];
  if (computeExecutionMonitorHash(monitor) !== monitor.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!monitor.replay_reference) failures.push("REPLAY_DIVERGENCE");
  const source = {
    replay_id: id("EMR", "execution-monitor-replay-id", monitor.monitor_id),
    monitor_id: monitor.monitor_id,
    replay_telemetry_order: freezeArray(monitor.telemetry_events.map((event) => event.event_type)),
    replay_anomaly_order: freezeArray(monitor.detected_anomalies.map((anomaly) => anomaly.anomaly_type)),
    replay_health_categories: freezeArray(monitor.health_metrics.map((metric) => metric.category)),
    validation_state: failures.length ? "FAIL" as const : validateExecutionMonitor(monitor).certification_state,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("execution-monitor-replay", source) });
}

export function buildExecutionMonitorVisibilitySurface(monitor: ExecutionMonitorPackage): ExecutionMonitorVisibilitySurface {
  const validation = validateExecutionMonitor(monitor);
  return Object.freeze({
    monitor_id: monitor.monitor_id,
    execution_id: monitor.execution_id,
    workflow_id: monitor.workflow_id,
    monitoring_state: monitor.monitoring_state,
    progress_percentage: monitor.progress_percentage,
    execution_health: monitor.execution_health,
    confidence_score: monitor.confidence_score,
    anomaly_types: freezeArray(monitor.detected_anomalies.map((anomaly) => anomaly.anomaly_type)),
    telemetry_count: monitor.telemetry_events.length,
    failure_reasons: validation.failures,
    integrity_status: validation.failures.includes("INTEGRITY_HASH_MISMATCH") ? "INVALID" : "VALID",
  });
}

export function getExecutionMonitorFramework(): ExecutionMonitorFramework {
  const identity = generateAutonomyIdentity();
  const schedule = defaultSchedule(identity);
  const monitor = buildExecutionMonitor(identity, schedule);
  return Object.freeze({
    identity,
    dependency_schedule_validation: validateDependencySchedule(schedule),
    monitor,
    validation: validateExecutionMonitor(monitor),
    replay: replayExecutionMonitor(monitor),
    visibility: buildExecutionMonitorVisibilitySurface(monitor),
  });
}
