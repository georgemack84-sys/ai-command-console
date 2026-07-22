export type StrategicOperationsStatus = "PASS" | "FAIL";
export type OperationalSeverity = "INFORMATION" | "NOTICE" | "WARNING" | "ERROR" | "CRITICAL" | "CONSTITUTIONAL" | "GOVERNANCE" | "SECURITY" | "INTEGRITY" | "REPLAY";
export type StrategicOperationsFailure =
  | "DASHBOARD_UNAVAILABLE"
  | "ROLE_VISIBILITY_FAILURE"
  | "CYCLE_STALLED_UNDETECTED"
  | "BLOCKED_CYCLE_UNREPORTED"
  | "ARTIFACT_ANOMALY_UNDETECTED"
  | "POLICY_BINDING_FAILURE_HIDDEN"
  | "PERFORMANCE_BOTTLENECK_HIDDEN"
  | "OBSERVATION_OVERDUE_UNDETECTED"
  | "REPLAY_FAILURE_HIDDEN"
  | "INTEGRITY_FAILURE_HIDDEN"
  | "GOVERNANCE_BACKLOG_HIDDEN"
  | "TENANT_VIOLATION_HIDDEN"
  | "DERIVED_VIEW_INCONSISTENT"
  | "ALERT_ROUTING_NONDETERMINISTIC"
  | "RUNBOOK_INVALID"
  | "ADVISORY_BOUNDARY_VIOLATION";
export type StrategicOperationsScenario = "BASELINE" | StrategicOperationsFailure;
export type StrategicOperationsInput = Readonly<{ scenario?: StrategicOperationsScenario; tenant_id?: string }>;

export type OperationalDashboard = Readonly<{ dashboard_id: string; categories: readonly string[]; widgets: readonly string[]; role_based_visibility: boolean; tenant_isolated: boolean; read_only: boolean; refresh_schedule_seconds: number; constitutional_status_visible: boolean; integrity_hash: string }>;
export type DashboardSummary = Readonly<{ summary_id: string; active_cycles: number; blocked_cycles: number; alerts_open: number; health_score: number; constitutional_compliance: boolean; integrity_hash: string }>;
export type RecommendationCycleStatus = Readonly<{ monitor_id: string; open_cycles: number; blocked_cycles: number; stalled_transitions: number; lifecycle_violations: number; timeout_detected: boolean; recovery_status_reported: boolean; completion_rate: number; queue_depth: number; integrity_hash: string }>;
export type ArtifactHealthReport = Readonly<{ report_id: string; artifacts_monitored: number; orphan_attempts: number; duplicate_conflicts: number; lifecycle_consistent: boolean; schema_valid: boolean; origin_valid: boolean; registry_synchronized: boolean; anomalies_visible: boolean; integrity_hash: string }>;
export type ManifestHealthReport = Readonly<{ report_id: string; policy_binding_failures: number; manifest_complete: boolean; dependencies_valid: boolean; compatibility_valid: boolean; expired_policies: number; revoked_policies: number; governance_approved: boolean; integrity_hash: string }>;
export type OperationalPerformanceReport = Readonly<{ report_id: string; average_latency_ms: number; p95_latency_ms: number; peak_latency_ms: number; throughput_per_hour: number; queue_depth: number; processing_efficiency: number; bottlenecks_visible: boolean; integrity_hash: string }>;
export type ObservationHealthReport = Readonly<{ report_id: string; open_windows: number; overdue_closures: number; pending_evidence: number; late_evidence: number; completeness_rate: number; evaluation_backlog: number; replay_ready: boolean; integrity_hash: string }>;
export type ReplayIntegrityOperationalStatus = Readonly<{ report_id: string; replay_divergences: number; replay_failures: number; replay_success_rate: number; integrity_failures: number; hash_mismatches: number; origin_inconsistencies: number; lineage_failures: number; visible: boolean; integrity_hash: string }>;
export type GovernanceOperationsReport = Readonly<{ report_id: string; governance_review_backlog: number; operator_review_backlog: number; pending_approvals: number; authority_conflicts: number; approval_latency_ms: number; bottlenecks_visible: boolean; constitutional_review_current: boolean; integrity_hash: string }>;
export type TenantOperationalHealth = Readonly<{ report_id: string; tenant_id: string; isolation_failures: number; unauthorized_access_attempts: number; cross_tenant_visibility: boolean; replay_isolated: boolean; policy_isolated: boolean; recommendation_isolated: boolean; immediately_visible: boolean; integrity_hash: string }>;
export type DerivedViewConsistencyReport = Readonly<{ report_id: string; dashboard_synchronized: boolean; lineage_synchronized: boolean; artifact_projection_valid: boolean; recommendation_summaries_valid: boolean; portfolio_summaries_valid: boolean; observation_summaries_valid: boolean; inconsistencies: readonly string[]; integrity_hash: string }>;
export type OperationalAlert = Readonly<{ alert_id: string; source: string; affected_artifact: string; affected_recommendation_cycle: string; severity: OperationalSeverity; timestamp: string; evidence: readonly string[]; recommended_operator_action: string; replay_reference: string; lineage_reference: string; integrity_hash: string }>;
export type AlertQueue = Readonly<{ queue_id: string; alerts: readonly OperationalAlert[]; routing_deterministic: boolean; history_immutable: boolean; critical_configured: boolean; integrity_hash: string }>;
export type OperationalRunbook = Readonly<{ runbook_id: string; name: string; trigger_conditions: readonly string[]; constitutional_considerations: readonly string[]; required_evidence: readonly string[]; investigation_steps: readonly string[]; validation_steps: readonly string[]; governance_requirements: readonly string[]; operator_responsibilities: readonly string[]; recovery_actions: readonly string[]; replay_validation: boolean; closure_criteria: readonly string[]; validated: boolean; integrity_hash: string }>;
export type StrategicOperationsCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: StrategicOperationsFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type StrategicOperationsCertification = Readonly<{ certification_id: string; status: StrategicOperationsStatus; certified: boolean; failures: readonly StrategicOperationsFailure[]; tests: readonly StrategicOperationsCertificationTest[]; integrity_hash: string }>;
export type StrategicOperationsResult = Readonly<{ phase_version: "strategic-observability-operations/v12.13"; phase_identifier: "StrategicObservabilityOperations"; dashboard: OperationalDashboard; summary: DashboardSummary; cycle_monitor: RecommendationCycleStatus; artifact_health: ArtifactHealthReport; manifest_health: ManifestHealthReport; performance: OperationalPerformanceReport; observation_health: ObservationHealthReport; replay_integrity: ReplayIntegrityOperationalStatus; governance_operations: GovernanceOperationsReport; tenant_operations: TenantOperationalHealth; derived_views: DerivedViewConsistencyReport; alerts: AlertQueue; runbooks: readonly OperationalRunbook[]; certification: StrategicOperationsCertification; replay_hash: string; integrity_hash: string }>;
export type StrategicOperationsValidation = Readonly<{ valid: boolean; status: StrategicOperationsStatus; certified: boolean; failures: readonly StrategicOperationsFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; alerts_valid: boolean; runbooks_valid: boolean; advisory_only: boolean; validation_hash: string }>;
export type StrategicOperationsContractBundle = Readonly<{ doctrine: Readonly<{ version: "strategic-observability-operations/v12.13"; read_only_advisory: true; replayable_metrics_required: true; immutable_alert_history_required: true; tenant_isolated_views_required: true; runbooks_required: true; dashboards_non_authoritative: true }>; result: StrategicOperationsResult; validation: StrategicOperationsValidation }>;
