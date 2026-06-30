import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { DependencySchedulePackage, DependencyScheduleValidationResult } from "@/types/dependency-scheduler";

export type ExecutionMonitorCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type MonitoringState = "INITIALIZING" | "OBSERVING" | "ANALYZING" | "REPORTING" | "MONITORING" | "WARNING" | "DEGRADED" | "FAILED" | "COMPLETED";
export type HealthState = "HEALTHY" | "STABLE" | "WATCH" | "DEGRADED" | "CRITICAL";
export type ExecutionAnomalyType = "EXECUTION_DRIFT" | "UNEXPECTED_STATE" | "TASK_FAILURE" | "HUNG_WORKFLOW" | "MISSED_CHECKPOINT" | "POLICY_VIOLATION" | "GOVERNANCE_DRIFT" | "RESOURCE_DEGRADATION" | "REPLAY_DIVERGENCE" | "DEPENDENCY_INCONSISTENCY" | "SYNCHRONIZATION_FAILURE";
export type TelemetryEventType = "EXECUTION_EVENT" | "TIMING_METRIC" | "WORKFLOW_PROGRESS" | "HEALTH_METRIC" | "GOVERNANCE_EVENT" | "OPERATOR_EVENT" | "CHECKPOINT_EVENT" | "ANOMALY_EVENT";

export type ExecutionMonitorScenario =
  | "BASELINE"
  | "INVALID_DEPENDENCY_SCHEDULE"
  | "EXECUTION_DRIFT"
  | "UNEXPECTED_STATE"
  | "TASK_FAILURE"
  | "HUNG_WORKFLOW"
  | "MISSED_CHECKPOINT"
  | "POLICY_VIOLATION"
  | "GOVERNANCE_DRIFT"
  | "RESOURCE_DEGRADATION"
  | "REPLAY_DIVERGENCE"
  | "DEPENDENCY_INCONSISTENCY"
  | "SYNCHRONIZATION_FAILURE"
  | "OPERATOR_OVERRIDE"
  | "TENANT_VIOLATION"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_MISMATCH"
  | "CONDITIONAL_TELEMETRY_GAP";

export type ExecutionMonitorFailureReason =
  | "INVALID_DEPENDENCY_SCHEDULE"
  | "EXECUTION_DRIFT"
  | "UNEXPECTED_STATE"
  | "TASK_FAILURE"
  | "HUNG_WORKFLOW"
  | "MISSED_CHECKPOINT"
  | "POLICY_VIOLATION"
  | "GOVERNANCE_DRIFT"
  | "RESOURCE_DEGRADATION"
  | "REPLAY_DIVERGENCE"
  | "DEPENDENCY_INCONSISTENCY"
  | "SYNCHRONIZATION_FAILURE"
  | "OPERATOR_OVERRIDE_DETECTED"
  | "AUTHORITY_VIOLATION"
  | "TENANT_ISOLATION_VIOLATION"
  | "LINEAGE_BROKEN"
  | "TELEMETRY_GAP"
  | "MONITORING_NOT_ADVISORY"
  | "INTEGRITY_HASH_MISMATCH";

export type ExecutionProgressReport = Readonly<{
  progress_report_id: string;
  completed_steps: readonly string[];
  current_step: string | null;
  pending_steps: readonly string[];
  progress_percentage: number;
  workflow_stage: string;
  elapsed_duration_ms: number;
}>;

export type TaskActivitySnapshot = Readonly<{
  active_tasks: readonly string[];
  completed_tasks: readonly string[];
  queued_tasks: readonly string[];
  waiting_tasks: readonly string[];
  failed_tasks: readonly string[];
  paused_tasks: readonly string[];
}>;

export type ResourceUtilization = Readonly<{
  compute_utilization: number;
  memory_utilization: number;
  storage_utilization: number;
  network_utilization: number;
  agent_availability: "AVAILABLE" | "DEGRADED" | "UNAVAILABLE";
  external_service_availability: "AVAILABLE" | "DEGRADED" | "UNAVAILABLE";
}>;

export type LatencyMetrics = Readonly<{
  workflow_latency_ms: number;
  task_latency_ms: number;
  scheduling_latency_ms: number;
  orchestration_delay_ms: number;
  execution_throughput: number;
  idle_time_ms: number;
}>;

export type GovernanceMonitoringStatus = Readonly<{
  authority_enforced: boolean;
  policy_compliant: boolean;
  constitutional_compliant: boolean;
  governance_approval_valid: boolean;
  execution_constraints_valid: boolean;
}>;

export type OperatorIntervention = Readonly<{
  intervention_id: string;
  intervention_type: "APPROVAL" | "PAUSE" | "RESUME" | "CANCEL" | "OVERRIDE" | "ACKNOWLEDGEMENT" | "ESCALATION_REQUEST";
  operator_reference: string;
  intervention_state: "RECORDED" | "PENDING" | "REJECTED";
  lineage_reference: string;
}>;

export type ExecutionAnomaly = Readonly<{
  anomaly_id: string;
  anomaly_type: ExecutionAnomalyType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affected_task: string | null;
  explanation: string;
  recommended_action: string;
  replay_reference: string;
}>;

export type HealthMetric = Readonly<{
  metric_id: string;
  category: "EXECUTION" | "ORCHESTRATION" | "DEPENDENCY" | "GOVERNANCE" | "RESOURCE" | "CHECKPOINT" | "REPLAY";
  health_state: HealthState;
  score: number;
  evidence_ref: string;
}>;

export type ExecutionTelemetryEvent = Readonly<{
  telemetry_event_id: string;
  event_order: number;
  event_type: TelemetryEventType;
  payload_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type MonitoringLineageRecord = Readonly<{
  monitoring_lineage_id: string;
  monitor_id: string;
  telemetry_refs: readonly string[];
  anomaly_refs: readonly string[];
  governance_refs: readonly string[];
  operator_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ExecutionMonitorPackage = Readonly<{
  monitor_id: string;
  execution_id: string;
  workflow_id: string;
  tenant_id: string;
  monitoring_state: MonitoringState;
  progress_percentage: number;
  current_step: string | null;
  task_activity: TaskActivitySnapshot;
  resource_utilization: ResourceUtilization;
  latency_metrics: LatencyMetrics;
  timeout_events: readonly string[];
  governance_status: GovernanceMonitoringStatus;
  operator_interventions: readonly OperatorIntervention[];
  execution_health: HealthState;
  confidence_score: number;
  detected_anomalies: readonly ExecutionAnomaly[];
  telemetry_events: readonly ExecutionTelemetryEvent[];
  progress_reports: readonly ExecutionProgressReport[];
  health_metrics: readonly HealthMetric[];
  governance_reference: string;
  authority_reference: string;
  lineage_reference: string;
  replay_reference: string;
  advisory_only: true;
  execution_modified: false;
  source_schedule: DependencySchedulePackage;
  monitoring_lineage: MonitoringLineageRecord;
  integrity_hash: string;
}>;

export type ExecutionMonitorValidationResult = Readonly<{
  validation_id: string;
  monitor_id: string;
  certification_state: ExecutionMonitorCertificationState;
  failures: readonly ExecutionMonitorFailureReason[];
  warnings: readonly ExecutionMonitorFailureReason[];
  progress_observable: boolean;
  task_activity_observable: boolean;
  resources_observable: boolean;
  governance_compliance_preserved: boolean;
  authority_enforced: boolean;
  replay_consistent: boolean;
  lineage_complete: boolean;
  telemetry_complete: boolean;
  advisory_only_enforced: boolean;
  ready_for_checkpoint_manager: boolean;
  validation_hash: string;
}>;

export type ExecutionMonitorReplayResult = Readonly<{
  replay_id: string;
  monitor_id: string;
  replay_telemetry_order: readonly TelemetryEventType[];
  replay_anomaly_order: readonly ExecutionAnomalyType[];
  replay_health_categories: readonly string[];
  validation_state: ExecutionMonitorCertificationState;
  failure_reason: ExecutionMonitorFailureReason | null;
  replay_hash: string;
}>;

export type ExecutionMonitorVisibilitySurface = Readonly<{
  monitor_id: string;
  execution_id: string;
  workflow_id: string;
  monitoring_state: MonitoringState;
  progress_percentage: number;
  execution_health: HealthState;
  confidence_score: number;
  anomaly_types: readonly ExecutionAnomalyType[];
  telemetry_count: number;
  failure_reasons: readonly ExecutionMonitorFailureReason[];
  integrity_status: "VALID" | "INVALID";
}>;

export type ExecutionMonitorFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  dependency_schedule_validation: DependencyScheduleValidationResult;
  monitor: ExecutionMonitorPackage;
  validation: ExecutionMonitorValidationResult;
  replay: ExecutionMonitorReplayResult;
  visibility: ExecutionMonitorVisibilitySurface;
}>;
