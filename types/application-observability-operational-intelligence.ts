export type ApplicationOperationalOutcome = "PASS" | "FAIL" | "PRUNED";
export type ApplicationDashboardType = "EXECUTIVE" | "OPERATIONS" | "HEALTH" | "DIAGNOSTICS" | "APPLICATION" | "TENANT" | "CAPABILITY" | "INTEGRATION";
export type DiagnosticSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AvailabilityStatus = "AVAILABLE" | "DEGRADED" | "UNAVAILABLE";

export type ApplicationOperationalFailure =
  | "P4_9_REPLAY_AUDIT_FORENSICS_INVALID"
  | "CCI_OBSERVABILITY_INFRASTRUCTURE_INVALID"
  | "CCI_METRICS_INVALID"
  | "CCI_LOGS_INVALID"
  | "CCI_TRACES_INVALID"
  | "CCI_MONITORING_SERVICES_INVALID"
  | "CAF_AGENT_TELEMETRY_INVALID"
  | "CAF_RUNTIME_TELEMETRY_INVALID"
  | "CAF_OPERATIONAL_EVENTS_INVALID"
  | "CAF_HEALTH_SIGNALS_INVALID"
  | "CAF_EXECUTION_SUMMARIES_INVALID"
  | "DASHBOARD_FRAMEWORK_MISSING"
  | "APPLICATION_DASHBOARD_MISSING"
  | "EXECUTIVE_DASHBOARD_MISSING"
  | "TENANT_DASHBOARD_MISSING"
  | "DASHBOARD_GOVERNANCE_MISSING"
  | "OPERATIONAL_INTELLIGENCE_MISSING"
  | "ANOMALY_INTERPRETATION_MISSING"
  | "TREND_ANALYSIS_MISSING"
  | "DIAGNOSTICS_FRAMEWORK_MISSING"
  | "DEPENDENCY_DIAGNOSTICS_MISSING"
  | "CAPABILITY_DIAGNOSTICS_MISSING"
  | "INTERFACE_DIAGNOSTICS_MISSING"
  | "TELEMETRY_VIEW_MISSING"
  | "TELEMETRY_AGGREGATION_INVALID"
  | "HEALTH_INTELLIGENCE_MISSING"
  | "DEPENDENCY_HEALTH_NOT_VISIBLE"
  | "APPLICATION_HEALTH_NOT_MEASURABLE"
  | "OPERATIONAL_ALERT_VIEW_MISSING"
  | "OPERATIONAL_TRENDS_NOT_VISIBLE"
  | "TENANT_OPERATIONAL_VIEW_INCOMPLETE"
  | "TELEMETRY_COLLECTION_ATTEMPTED"
  | "METRICS_INFRASTRUCTURE_ATTEMPTED"
  | "TRACING_INFRASTRUCTURE_ATTEMPTED"
  | "LOG_STORAGE_ATTEMPTED"
  | "RUNTIME_MONITORING_INFRASTRUCTURE_ATTEMPTED"
  | "AGENT_TELEMETRY_GENERATION_ATTEMPTED"
  | "REPLAY_OWNERSHIP_ATTEMPTED"
  | "FORENSIC_EVIDENCE_OWNERSHIP_ATTEMPTED"
  | "ALERT_GENERATION_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type ApplicationOperationalScenario = "BASELINE" | ApplicationOperationalFailure;
export type ApplicationOperationalInput = Readonly<{ scenario?: ApplicationOperationalScenario; application_id?: string; tenant_id?: string }>;

export type ApplicationDashboard = Readonly<{
  dashboard_id: string;
  application_id: string;
  tenant_id: string;
  dashboard_name: string;
  dashboard_type: ApplicationDashboardType;
  layout_version: string;
  widget_refs: readonly string[];
  visibility_scope: readonly string[];
  generated_timestamp: string;
  governed: boolean;
  integrity_hash: string;
}>;

export type OperationalIntelligenceRecord = Readonly<{
  intelligence_id: string;
  application_id: string;
  tenant_id: string;
  summary: string;
  health_assessment: string;
  availability_status: AvailabilityStatus;
  operational_findings: readonly string[];
  recommendations: readonly string[];
  anomaly_interpretation_refs: readonly string[];
  trend_analysis_refs: readonly string[];
  generated_timestamp: string;
  integrity_hash: string;
}>;

export type DiagnosticRecord = Readonly<{
  diagnostic_id: string;
  application_id: string;
  diagnostic_type: string;
  severity: DiagnosticSeverity;
  diagnostic_summary: string;
  affected_components: readonly string[];
  dependency_refs: readonly string[];
  recommended_actions: readonly string[];
  generated_timestamp: string;
  integrity_hash: string;
}>;

export type TelemetryViewRecord = Readonly<{
  view_id: string;
  application_id: string;
  tenant_id: string;
  telemetry_sources: readonly string[];
  metrics_refs: readonly string[];
  trace_refs: readonly string[];
  log_refs: readonly string[];
  health_summary: string;
  generated_timestamp: string;
  aggregation_valid: boolean;
  consumes_only_authoritative_sources: boolean;
  integrity_hash: string;
}>;

export type HealthIntelligenceRecord = Readonly<{
  health_id: string;
  application_id: string;
  dependency_health_refs: readonly string[];
  operational_score: number;
  availability_status: AvailabilityStatus;
  runtime_stability_summary: string;
  capability_health_refs: readonly string[];
  interface_health_refs: readonly string[];
  measurable: boolean;
  integrity_hash: string;
}>;

export type OperationalAlertView = Readonly<{
  alert_view_id: string;
  application_id: string;
  warning_summary_refs: readonly string[];
  operational_notification_refs: readonly string[];
  dashboard_alert_refs: readonly string[];
  visualizes_alerts: boolean;
  generates_alerts: boolean;
  integrity_hash: string;
}>;

export type ApplicationOperationalCertification = Readonly<{
  certification_id: string;
  outcome: ApplicationOperationalOutcome;
  phase_ready: boolean;
  dashboards_operational: boolean;
  operational_intelligence_produced: boolean;
  diagnostics_complete: boolean;
  telemetry_views_available: boolean;
  dependency_health_visible: boolean;
  application_health_measurable: boolean;
  executive_dashboards_available: boolean;
  operational_trends_visible: boolean;
  tenant_operational_views_complete: boolean;
  dashboard_governance_implemented: boolean;
  no_observability_infrastructure_ownership: boolean;
  no_telemetry_generation: boolean;
  no_out_of_scope_ownership: boolean;
  failures: readonly ApplicationOperationalFailure[];
  integrity_hash: string;
}>;

export type ApplicationOperationalIntelligenceResult = Readonly<{
  phase_version: "application-observability-operational-intelligence/v4.10";
  phase_identifier: "ApplicationObservabilityOperationalIntelligence";
  replay_audit_forensics_ref: "application-replay-audit-forensics/v4.9";
  cci_observability_ref: "Program 2 - CCI Observability Infrastructure";
  caf_runtime_telemetry_ref: "Program 3 - CAF Runtime Telemetry";
  dashboards: readonly ApplicationDashboard[];
  operational_intelligence: OperationalIntelligenceRecord;
  diagnostics: readonly DiagnosticRecord[];
  telemetry_view: TelemetryViewRecord;
  health_intelligence: HealthIntelligenceRecord;
  alert_view: OperationalAlertView;
  certification: ApplicationOperationalCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApplicationOperationalValidation = Readonly<{
  valid: boolean;
  outcome: ApplicationOperationalOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  dashboards_valid: boolean;
  intelligence_valid: boolean;
  diagnostics_valid: boolean;
  telemetry_valid: boolean;
  health_valid: boolean;
  alerts_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApplicationOperationalFailure[];
  integrity_hash: string;
}>;

export type ApplicationOperationalBundle = Readonly<{
  doctrine: Readonly<{
    version: "application-observability-operational-intelligence/v4.10";
    owns_application_operational_visibility: true;
    owns_application_dashboards: true;
    owns_operational_intelligence: true;
    owns_application_diagnostics: true;
    owns_application_telemetry_views: true;
    owns_operational_health_interpretation: true;
    owns_telemetry_collection: false;
    owns_metrics_infrastructure: false;
    owns_tracing_infrastructure: false;
    owns_log_storage: false;
    owns_runtime_monitoring_infrastructure: false;
    generates_agent_runtime_telemetry: false;
  }>;
  result: ApplicationOperationalIntelligenceResult;
  validation: ApplicationOperationalValidation;
}>;
