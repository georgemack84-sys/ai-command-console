export type OperationalDashboardView = "Validation Overview" | "Environment Status" | "Scenario Execution" | "Replay Health" | "Certification Status" | "Dependency Health" | "Integrity Status" | "Boundary Violations" | "Remediation Progress" | "Alert Summary";
export type OperationalComponent = "OPERATIONAL_DASHBOARD" | "VALIDATION_PROGRESS" | "DEPENDENCY_VERIFICATION" | "REPLAY_HEALTH" | "LINEAGE_INTEGRITY" | "BOUNDARY_VIOLATION" | "CERTIFICATION_REMEDIATION" | "ALERT_MANAGEMENT" | "OPERATIONAL_RUNBOOKS" | "OPERATIONAL_EVIDENCE_LEDGER";
export type OperationalObservationType = "DASHBOARD_RENDERED" | "MONITOR_EVALUATED" | "ALERT_EVALUATED" | "RUNBOOK_REGISTERED" | "CERTIFICATION_EVALUATED";
export type OperationalStatus = "HEALTHY" | "WATCH" | "DEGRADED" | "BLOCKED";
export type OperationalAlertCategory = "VALIDATION_ALERT" | "DEPENDENCY_ALERT" | "REPLAY_ALERT" | "CERTIFICATION_ALERT" | "LINEAGE_ALERT" | "INTEGRITY_ALERT" | "GOVERNANCE_ALERT" | "BOUNDARY_ALERT" | "REMEDIATION_ALERT" | "SUPERSESSION_ALERT";
export type OperationalAlertSeverity = "INFORMATION" | "WARNING" | "HIGH" | "CRITICAL";
export type OperationalCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ObservabilityOperationsFailure = "DASHBOARD_COVERAGE_INCOMPLETE" | "VALIDATION_NOT_OBSERVABLE" | "DEPENDENCY_VISIBILITY_INCOMPLETE" | "REPLAY_MONITORING_DEGRADED" | "LINEAGE_MONITORING_INCOMPLETE" | "BOUNDARY_MONITORING_INCOMPLETE" | "CERTIFICATION_NOT_VISIBLE" | "REMEDIATION_NOT_TRACEABLE" | "ALERTS_NON_DETERMINISTIC" | "RUNBOOKS_INCOMPLETE" | "EVIDENCE_LEDGER_MUTABLE" | "REPLAY_NOT_REPRODUCIBLE" | "TENANT_ISOLATION_BROKEN" | "CONSTITUTIONAL_BOUNDARY_BREACH" | "NON_CONSTITUTIONAL_OPERATIONAL_WARNING";
export type ObservabilityOperationsScenario = "BASELINE" | ObservabilityOperationsFailure;

export type ObservabilityOperationsInput = Readonly<{ tenant_id?: string; scenario?: ObservabilityOperationsScenario }>;

export type OperationalDashboard = Readonly<{
  dashboard_id: string;
  tenant_id: string;
  views: readonly OperationalDashboardView[];
  widget_registry: readonly string[];
  layout_engine: "DETERMINISTIC_GRID";
  rendering_service: "READ_ONLY_RENDERER";
  state_manager: "IMMUTABLE_DASHBOARD_STATE";
  deterministic_rendering: boolean;
  tenant_isolated: boolean;
  execution_authority: false;
  integrity_hash: string;
}>;

export type OperationalMonitor = Readonly<{
  monitor_id: string;
  component: OperationalComponent;
  monitored_signals: readonly string[];
  metrics: readonly string[];
  status: OperationalStatus;
  deterministic: boolean;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperationalAlert = Readonly<{
  alert_id: string;
  category: OperationalAlertCategory;
  severity: OperationalAlertSeverity;
  status: OperationalStatus;
  explanation: string;
  affected_artifacts: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type OperationalRunbook = Readonly<{
  runbook_id: string;
  name: string;
  sections: readonly ("detection" | "evidence collection" | "investigation" | "replay validation" | "governance escalation" | "remediation" | "certification impact" | "closure")[];
  deterministic: boolean;
  advisory_only: boolean;
  integrity_hash: string;
}>;

export type OperationalObservationRecord = Readonly<{
  observation_id: string;
  tenant_id: string;
  observation_timestamp: string;
  dashboard_view: OperationalDashboardView;
  monitored_component: OperationalComponent;
  observation_type: OperationalObservationType;
  observed_status: OperationalStatus;
  severity: OperationalAlertSeverity;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  validation_refs: readonly string[];
  certification_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperationalCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: OperationalCertificationOutcome;
  passed: boolean;
  failure_reason: ObservabilityOperationsFailure | null;
  integrity_hash: string;
}>;

export type ObservabilityOperationsResult = Readonly<{
  phase_version: "observability-operations/v14.11";
  phase_identifier: "ObservabilityOperations";
  replay_integrity_ref: string;
  dashboard: OperationalDashboard;
  monitors: readonly OperationalMonitor[];
  alerts: readonly OperationalAlert[];
  runbooks: readonly OperationalRunbook[];
  evidence_ledger: readonly OperationalObservationRecord[];
  certification_tests: readonly OperationalCertificationTest[];
  failures: readonly ObservabilityOperationsFailure[];
  outcome: OperationalCertificationOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ObservabilityOperationsValidation = Readonly<{
  valid: boolean;
  outcome: OperationalCertificationOutcome;
  dashboard_valid: boolean;
  monitors_valid: boolean;
  alerts_valid: boolean;
  runbooks_valid: boolean;
  ledger_valid: boolean;
  certification_valid: boolean;
  replay_valid: boolean;
  failures: readonly ObservabilityOperationsFailure[];
  integrity_hash: string;
}>;

export type ObservabilityOperationsBundle = Readonly<{
  doctrine: Readonly<{
    version: "observability-operations/v14.11";
    upstream_phase: "replay-integrity-explainability/v14.10";
    dashboard_views: readonly OperationalDashboardView[];
    alert_categories: readonly OperationalAlertCategory[];
    alert_severities: readonly OperationalAlertSeverity[];
    certification_outcomes: readonly OperationalCertificationOutcome[];
  }>;
  result: ObservabilityOperationsResult;
  validation: ObservabilityOperationsValidation;
}>;
