export type PilotMonitoringObservabilityOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type MonitorType = "RUNTIME_HEALTH" | "ADVISORY_ACTIVITY" | "REPLAY_HEALTH" | "EVIDENCE_INGESTION" | "OPERATOR_WORKFLOW" | "CERTIFICATION_STATUS" | "CONSTITUTIONAL_COMPLIANCE";
export type AlertCategory = "OPERATIONAL" | "ADVISORY" | "REPLAY" | "EVIDENCE" | "CERTIFICATION" | "CONSTITUTIONAL";
export type AlertLifecycleState = "DETECTED" | "VALIDATED" | "CLASSIFIED" | "NOTIFIED" | "ACKNOWLEDGED" | "INVESTIGATING" | "ESCALATED" | "RESOLVED" | "CLOSED";
export type ObservabilityStatus = "HEALTHY" | "DEGRADED" | "BLOCKED";
export type PilotMonitoringObservabilityFailure = "DASHBOARDS_INCOMPLETE" | "MONITORING_NOT_OPERATIONAL" | "RUNTIME_HEALTH_NOT_MONITORED" | "ADVISORY_ACTIVITY_NOT_VISIBLE" | "REPLAY_MONITORING_NOT_OPERATIONAL" | "EVIDENCE_INGESTION_NOT_MONITORED" | "OPERATOR_WORKFLOW_NOT_VISIBLE" | "CERTIFICATION_STATUS_NOT_VISIBLE" | "CONSTITUTIONAL_COMPLIANCE_NOT_MONITORED" | "ALERTS_NOT_VALIDATED" | "ALERT_LIFECYCLE_NON_DETERMINISTIC" | "MONITORING_EVIDENCE_MUTABLE" | "REPLAY_REFERENCES_INCOMPLETE" | "TENANT_ISOLATION_NOT_PRESERVED" | "ADVISORY_BOUNDARY_NOT_MAINTAINED" | "DASHBOARD_LINEAGE_NOT_REPRODUCIBLE" | "OPERATIONAL_STATE_NOT_OBSERVABLE" | "HIDDEN_OPERATIONAL_STATE_PRESENT" | "GOVERNANCE_VISIBILITY_INCOMPLETE" | "CERTIFICATION_READINESS_NOT_ASSESSABLE" | "PHASE_16_6_PERFORMANCE_NOT_VALID" | "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING";
export type PilotMonitoringObservabilityScenario = "BASELINE" | PilotMonitoringObservabilityFailure;

export type PilotMonitoringObservabilityInput = Readonly<{ scenario?: PilotMonitoringObservabilityScenario; tenant_id?: string; operator_id?: string; mission_id?: string; dashboard_version?: string }>;

export type PilotObservabilityRecord = Readonly<{
  record_id: string;
  timestamp: string;
  tenant_id: string;
  pilot_scope: string;
  monitor_type: MonitorType;
  monitor_source: string;
  metric_name: string;
  metric_value: number;
  measurement_unit: string;
  threshold_reference: string;
  status: ObservabilityStatus;
  alert_generated: boolean;
  dashboard_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  governance_refs: readonly string[];
  lineage_hash: string;
  integrity_hash: string;
}>;

export type DashboardConfigurationRecord = Readonly<{
  dashboard_id: string;
  dashboard_version: string;
  dashboard_type: "OPERATIONAL" | "RUNTIME_HEALTH" | "RECOMMENDATION" | "REPLAY" | "EVIDENCE" | "CERTIFICATION" | "GOVERNANCE";
  monitored_metrics: readonly string[];
  visualization_definitions: readonly string[];
  alert_bindings: readonly string[];
  refresh_interval_seconds: number;
  role_visibility: readonly string[];
  constitutional_restrictions: readonly string[];
  evidence_refs: readonly string[];
  complete: boolean;
  lineage_reproducible: boolean;
  informational_only: boolean;
  integrity_hash: string;
}>;

export type PilotObservabilityRegistryRecord = Readonly<{
  registry_id: string;
  monitored_services: readonly string[];
  monitored_metrics: readonly string[];
  threshold_mappings: readonly string[];
  dashboard_assignments: readonly string[];
  alert_definitions: readonly string[];
  historical_trends: readonly string[];
  metric_lineage: readonly string[];
  evidence_linkage: readonly string[];
  complete: boolean;
  unified_evidence_platform: boolean;
  integrity_hash: string;
}>;

export type PilotMetricsRegistryRecord = Readonly<{
  metrics_registry_id: string;
  runtime_health_metrics: readonly string[];
  advisory_activity_metrics: readonly string[];
  replay_health_metrics: readonly string[];
  evidence_ingestion_metrics: readonly string[];
  operator_workflow_metrics: readonly string[];
  certification_status_metrics: readonly string[];
  constitutional_compliance_metrics: readonly string[];
  deterministic_collection: boolean;
  fully_observable: boolean;
  integrity_hash: string;
}>;

export type OperationalEventStreamRecord = Readonly<{
  stream_id: string;
  events: readonly string[];
  monitor_types: readonly MonitorType[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  tenant_id: string;
  deterministic: boolean;
  immutable: boolean;
  tenant_isolated: boolean;
  integrity_hash: string;
}>;

export type AlertRecord = Readonly<{
  alert_id: string;
  category: AlertCategory;
  lifecycle: readonly AlertLifecycleState[];
  current_state: AlertLifecycleState;
  validation_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  acknowledged_by: string;
  deterministic_lifecycle: boolean;
  validated: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ObservabilityEvidenceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event_type: "DASHBOARD_CONFIGURED" | "MONITOR_REGISTERED" | "METRIC_COLLECTED" | "EVENT_STREAMED" | "ALERT_VALIDATED" | "CERTIFICATION_STATUS_RECORDED" | "GOVERNANCE_VISIBILITY_RECORDED" | "REPLAY_LINKED" | "EVIDENCE_ARCHIVED";
  observability_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  append_only: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type PilotMonitoringObservabilityCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: PilotMonitoringObservabilityOutcome;
  passed: boolean;
  failure_reason: PilotMonitoringObservabilityFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type PilotMonitoringObservabilityResult = Readonly<{
  phase_version: "pilot-monitoring-observability/v16.7";
  phase_identifier: "PilotMonitoringObservability";
  pilot_performance_reliability_ref: string;
  alert_lifecycle: readonly AlertLifecycleState[];
  observability_records: readonly PilotObservabilityRecord[];
  dashboards: readonly DashboardConfigurationRecord[];
  observability_registry: PilotObservabilityRegistryRecord;
  metrics_registry: PilotMetricsRegistryRecord;
  event_stream: OperationalEventStreamRecord;
  alerts: readonly AlertRecord[];
  evidence_ledger: readonly ObservabilityEvidenceLedgerEntry[];
  certification_tests: readonly PilotMonitoringObservabilityCertificationTest[];
  failures: readonly PilotMonitoringObservabilityFailure[];
  outcome: PilotMonitoringObservabilityOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PilotMonitoringObservabilityValidation = Readonly<{
  valid: boolean;
  outcome: PilotMonitoringObservabilityOutcome;
  dashboards_valid: boolean;
  records_valid: boolean;
  registry_valid: boolean;
  metrics_valid: boolean;
  event_stream_valid: boolean;
  alerts_valid: boolean;
  ledger_valid: boolean;
  certification_valid: boolean;
  result_replay_valid: boolean;
  failures: readonly PilotMonitoringObservabilityFailure[];
  integrity_hash: string;
}>;

export type PilotMonitoringObservabilityBundle = Readonly<{
  doctrine: Readonly<{
    version: "pilot-monitoring-observability/v16.7";
    upstream_phase: "pilot-performance-reliability-validation/v16.6";
    monitor_types: readonly MonitorType[];
    alert_categories: readonly AlertCategory[];
    alert_lifecycle: readonly AlertLifecycleState[];
    certification_outcomes: readonly PilotMonitoringObservabilityOutcome[];
  }>;
  result: PilotMonitoringObservabilityResult;
  validation: PilotMonitoringObservabilityValidation;
}>;
