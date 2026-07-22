export type TelemetrySeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type HealthStatus = "HEALTHY" | "DEGRADED" | "WARNING" | "CRITICAL" | "OFFLINE";
export type AlertDisposition = "OPEN" | "ROUTED" | "SUPPRESSED" | "ESCALATED" | "RESOLVED";
export type ObservabilityCertificationOutcome = "PASS" | "FAIL" | "PRUNED";
export type TraceStatus = "OK" | "WARNING" | "ERROR";

export type ObservabilityTelemetryFailure =
  | "P3_1_AGENT_REGISTRY_INVALID"
  | "P3_3_RUNTIME_INVALID"
  | "P3_4_MEMORY_INVALID"
  | "P3_5_PLANNING_INVALID"
  | "P3_6_COLLABORATION_INVALID"
  | "P3_7_GOVERNANCE_INVALID"
  | "P3_8_SAFETY_INVALID"
  | "P3_9_INTERACTION_INVALID"
  | "CCI_OBSERVABILITY_NOT_CONSUMED"
  | "TELEMETRY_INCOMPLETE"
  | "TRACE_NON_DETERMINISTIC"
  | "TRACE_NOT_REPLAYABLE"
  | "METRICS_INCOMPLETE"
  | "DIAGNOSTICS_INCOMPLETE"
  | "HEALTH_MONITORING_INCOMPLETE"
  | "DASHBOARDS_INCOMPLETE"
  | "ALERT_ROUTING_NON_DETERMINISTIC"
  | "OPERATIONAL_EVIDENCE_MISSING"
  | "REPLAY_DIVERGENCE"
  | "CCI_OBSERVABILITY_DUPLICATED"
  | "CERTIFICATION_PRUNED";

export type ObservabilityTelemetryScenario = "BASELINE" | ObservabilityTelemetryFailure;
export type ObservabilityTelemetryInput = Readonly<{ scenario?: ObservabilityTelemetryScenario; tenant_id?: string }>;

export type AgentTelemetryRecord = Readonly<{
  telemetry_id: string;
  timestamp: string;
  agent_id: string;
  execution_id: string;
  event_type: string;
  event_source: string;
  lifecycle_state: string;
  severity: TelemetrySeverity;
  payload_reference: string;
  correlation_id: string;
  integrity_hash: string;
}>;

export type AgentTraceRecord = Readonly<{
  trace_id: string;
  execution_id: string;
  parent_span: string;
  span_id: string;
  component: string;
  operation: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  status: TraceStatus;
  replayable: boolean;
  integrity_hash: string;
}>;

export type AgentMetricRecord = Readonly<{
  metric_id: string;
  timestamp: string;
  metric_name: string;
  metric_category: "AGENT" | "EXECUTION" | "PLANNING" | "REASONING" | "MEMORY" | "GOVERNANCE" | "SAFETY" | "OPERATOR" | "COLLABORATION";
  metric_value: number;
  aggregation_window: string;
  labels: Readonly<Record<string, string>>;
  integrity_hash: string;
}>;

export type DiagnosticRecord = Readonly<{
  diagnostic_id: string;
  timestamp: string;
  component: string;
  diagnostic_type: string;
  findings: readonly string[];
  severity: TelemetrySeverity;
  recommended_actions: readonly string[];
  integrity_hash: string;
}>;

export type HealthRecord = Readonly<{
  health_id: string;
  timestamp: string;
  component: string;
  health_status: HealthStatus;
  contributing_factors: readonly string[];
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type AlertRecord = Readonly<{
  alert_id: string;
  timestamp: string;
  alert_type: string;
  severity: TelemetrySeverity;
  originating_component: string;
  affected_agent: string;
  disposition: AlertDisposition;
  route_ref: string;
  deterministic: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type DashboardDefinition = Readonly<{
  dashboard_id: string;
  dashboard_name: string;
  components: readonly string[];
  filters: readonly string[];
  drill_down_enabled: boolean;
  integrity_hash: string;
}>;

export type ObservabilityEvidence = Readonly<{
  evidence_id: string;
  telemetry_evidence_refs: readonly string[];
  trace_evidence_refs: readonly string[];
  metric_evidence_refs: readonly string[];
  diagnostic_evidence_refs: readonly string[];
  immutable: boolean;
  replayable: boolean;
  audit_ready: boolean;
  integrity_hash: string;
}>;

export type ObservabilityReplayValidation = Readonly<{
  replay_validation_id: string;
  telemetry_replayed: boolean;
  traces_replayed: boolean;
  metrics_replayed: boolean;
  diagnostics_replayed: boolean;
  health_replayed: boolean;
  alerts_replayed: boolean;
  dashboards_replayed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type ObservabilityTelemetryCertification = Readonly<{
  certification_id: string;
  outcome: ObservabilityCertificationOutcome;
  certified: boolean;
  consumes_cci_observability: boolean;
  does_not_duplicate_cci: boolean;
  telemetry_complete: boolean;
  traces_deterministic: boolean;
  traces_replayable: boolean;
  metrics_complete: boolean;
  diagnostics_complete: boolean;
  health_monitoring_complete: boolean;
  dashboards_complete: boolean;
  alerts_routed_deterministically: boolean;
  evidence_complete: boolean;
  replay_reproducible: boolean;
  failures: readonly ObservabilityTelemetryFailure[];
  integrity_hash: string;
}>;

export type ObservabilityTelemetryResult = Readonly<{
  phase_version: "caf-observability-telemetry/v3.10";
  phase_identifier: "CafObservabilityTelemetry";
  cci_observability_ref: "Program 2 - CCI Observability Infrastructure";
  cci_logging_ref: "Program 2 - CCI Logging Infrastructure";
  cci_metrics_ref: "Program 2 - CCI Metrics Infrastructure";
  cci_tracing_ref: "Program 2 - CCI Distributed Tracing";
  cci_events_ref: "Program 2 - CCI Event Infrastructure";
  cci_evidence_ref: "Program 2 - CCI Evidence Infrastructure";
  agent_identity_lifecycle_ref: "caf-agent-identity-lifecycle/v3.1";
  runtime_orchestration_ref: "caf-runtime-orchestration/v3.3";
  memory_knowledge_ref: "caf-memory-knowledge/v3.4";
  planning_reasoning_ref: "caf-planning-reasoning/v3.5";
  collaboration_federation_ref: "caf-collaboration-federation/v3.6";
  governance_authority_policy_ref: "caf-governance-authority-policy/v3.7";
  safety_behavioral_constraints_ref: "caf-safety-behavioral-constraints/v3.8";
  human_operator_interaction_ref: "caf-human-operator-interaction/v3.9";
  telemetry_records: readonly AgentTelemetryRecord[];
  trace_records: readonly AgentTraceRecord[];
  metric_records: readonly AgentMetricRecord[];
  diagnostic_records: readonly DiagnosticRecord[];
  health_records: readonly HealthRecord[];
  alert_records: readonly AlertRecord[];
  dashboards: readonly DashboardDefinition[];
  evidence: ObservabilityEvidence;
  replay_validation: ObservabilityReplayValidation;
  certification: ObservabilityTelemetryCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ObservabilityTelemetryValidation = Readonly<{
  valid: boolean;
  outcome: ObservabilityCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  telemetry_valid: boolean;
  traces_valid: boolean;
  metrics_valid: boolean;
  diagnostics_valid: boolean;
  health_valid: boolean;
  alerts_valid: boolean;
  dashboards_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly ObservabilityTelemetryFailure[];
  integrity_hash: string;
}>;

export type ObservabilityTelemetryBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-observability-telemetry/v3.10";
    owns_agent_observability: true;
    consumes_cci_observability: true;
    duplicates_cci_observability: false;
    deterministic_traces_required: true;
    replay_safe_required: true;
    operational_evidence_required: true;
  }>;
  result: ObservabilityTelemetryResult;
  validation: ObservabilityTelemetryValidation;
}>;
