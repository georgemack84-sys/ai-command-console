export type ProductionOperationsObservabilityOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type HealthState = "HEALTHY" | "DEGRADED" | "WARNING" | "CRITICAL" | "FAILED" | "RECOVERING" | "UNKNOWN";
export type ComponentType = "TENANT" | "REGION" | "INFRASTRUCTURE" | "SERVICE" | "SCHEDULING" | "REPLICATION" | "DISASTER_RECOVERY" | "WORKLOAD_DISTRIBUTION" | "CERTIFICATION" | "GOVERNANCE" | "REPLAY" | "RESOURCE_UTILIZATION";
export type MetricCategory = "TENANT" | "REGIONAL" | "INFRASTRUCTURE" | "GOVERNANCE" | "REPLAY";
export type AlertCategory = "TENANT_HEALTH" | "REGIONAL_HEALTH" | "INFRASTRUCTURE_HEALTH" | "REPLAY_DEGRADATION" | "CERTIFICATION_BACKLOG" | "GOVERNANCE_VIOLATION" | "RESOURCE_EXHAUSTION" | "REPLICATION_FAILURE" | "DISASTER_RECOVERY_READINESS" | "OBSERVABILITY_FAILURE";
export type AlertSeverity = "INFORMATIONAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertResponse = "LOG" | "NOTIFY" | "ESCALATE" | "REQUIRE_OPERATOR_REVIEW" | "REQUIRE_GOVERNANCE_REVIEW" | "REQUIRE_RECERTIFICATION" | "FAIL_CLOSED";
export type ProductionOperationsObservabilityFailure =
  | "OPERATIONS_DASHBOARD_INCOMPLETE"
  | "CAPACITY_DASHBOARD_INCOMPLETE"
  | "TENANT_HEALTH_DASHBOARD_INCOMPLETE"
  | "INFRASTRUCTURE_DASHBOARD_INCOMPLETE"
  | "OPERATIONAL_VISIBILITY_INCOMPLETE"
  | "ALERTS_NOT_VALIDATED"
  | "OBSERVABILITY_NOT_REPLAYABLE"
  | "MONITORING_NOT_DETERMINISTIC"
  | "TENANT_ISOLATION_VIOLATED"
  | "OPERATIONAL_EVIDENCE_NOT_IMMUTABLE"
  | "MONITORING_NOT_CERTIFIED"
  | "OPERATIONAL_READINESS_NOT_CONFIRMED"
  | "GOVERNANCE_VISIBILITY_MISSING"
  | "UNKNOWN_CONDITIONS_NOT_FAIL_CLOSED"
  | "OBSERVABILITY_MODIFIES_PRODUCTION_STATE"
  | "PHASE_17_8_SCALABILITY_NOT_VALID"
  | "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING";
export type ProductionOperationsObservabilityScenario = "BASELINE" | ProductionOperationsObservabilityFailure;
export type ProductionOperationsObservabilityInput = Readonly<{ scenario?: ProductionOperationsObservabilityScenario; tenant_id?: string; operator_id?: string; mission_id?: string; region_id?: string; component_id?: string }>;

export type ProductionMetric = Readonly<{ metric_id: string; name: string; description: string; category: MetricCategory; unit: string; collection_interval: string; aggregation_method: string; authority_source: string; owner: string; version: string; effective_date: string; integrity_hash: string }>;
export type ProductionHealthRecord = Readonly<{ health_record_id: string; tenant_id: string; region_id: string; component_type: ComponentType; component_id: string; health_state: HealthState; health_score: number; observed_metrics: readonly string[]; observed_conditions: readonly string[]; alert_refs: readonly string[]; incident_refs: readonly string[]; certification_refs: readonly string[]; governance_refs: readonly string[]; replay_refs: readonly string[]; assessment_timestamp: string; assessment_version: string; integrity_hash: string }>;
export type AlertRecord = Readonly<{ alert_id: string; tenant_id: string; region_id: string; alert_category: AlertCategory; alert_severity: AlertSeverity; trigger_condition: string; supporting_metric_refs: readonly string[]; supporting_health_refs: readonly string[]; response: AlertResponse; operator_actions: readonly string[]; resolution_status: string; resolution_refs: readonly string[]; evidence_refs: readonly string[]; integrity_hash: string }>;
export type DashboardView = Readonly<{ dashboard_id: string; dashboard_type: "OPERATIONS" | "CAPACITY" | "TENANT_HEALTH" | "INFRASTRUCTURE"; displayed_fields: readonly string[]; derived_from_authoritative_evidence: boolean; replayable_history: boolean; tenant_isolated: boolean; passive_only: boolean; complete: boolean; integrity_hash: string }>;
export type AlertPolicyRegistry = Readonly<{ registry_id: string; alert_categories: readonly AlertCategory[]; severity_classification_deterministic: boolean; responses_governed: boolean; equivalent_state_equivalent_alerts: boolean; unknown_conditions_fail_closed: boolean; monitoring_authorizes_actions: boolean; integrity_hash: string }>;
export type ObservabilityEventRegistry = Readonly<{ registry_id: string; event_categories: readonly ComponentType[]; events_replayable: boolean; events_attributable: boolean; events_governed: boolean; cross_tenant_visibility_prohibited: boolean; observability_self_monitoring_enabled: boolean; integrity_hash: string }>;
export type ProductionMetricsRegistry = Readonly<{ registry_id: string; metrics: readonly ProductionMetric[]; metrics_registered: boolean; authority_sources_present: boolean; versions_present: boolean; deterministic_collection: boolean; integrity_hash: string }>;
export type HealthAssessmentEngine = Readonly<{ engine_id: string; assessed_domains: readonly ComponentType[]; deterministic_classification: boolean; unknown_fails_closed: boolean; preserves_tenant_isolation: boolean; governance_visible: boolean; replay_refs: readonly string[]; integrity_hash: string }>;
export type OperationalEvidenceLedgerEntry = Readonly<{ ledger_entry_id: string; sequence: number; evidence_type: string; health_ref: string; dashboard_ref: string; alert_ref: string; metric_refs: readonly string[]; replay_ref: string; governance_ref: string; append_only: boolean; immutable: boolean; integrity_hash: string }>;
export type ProductionObservabilityCertificationPackage = Readonly<{ package_id: string; operations_dashboard_complete: boolean; capacity_dashboard_complete: boolean; tenant_health_dashboard_complete: boolean; infrastructure_dashboard_complete: boolean; operational_visibility_comprehensive: boolean; alerts_validated: boolean; observability_replayable: boolean; monitoring_deterministic: boolean; tenant_isolation_preserved: boolean; immutable_operational_evidence_complete: boolean; monitoring_certified: boolean; operational_readiness_confirmed: boolean; governance_visibility: boolean; observability_passive: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ProductionOperationsObservabilityTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: ProductionOperationsObservabilityOutcome; passed: boolean; failure_reason: ProductionOperationsObservabilityFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type ProductionOperationsObservabilityResult = Readonly<{ phase_version: "production-operations-observability/v17.9"; phase_identifier: "ProductionOperationsObservability"; performance_scalability_validation_ref: string; dashboards: readonly DashboardView[]; health_engine: HealthAssessmentEngine; health_records: readonly ProductionHealthRecord[]; event_registry: ObservabilityEventRegistry; metrics_registry: ProductionMetricsRegistry; alert_policy_registry: AlertPolicyRegistry; alerts: readonly AlertRecord[]; evidence_ledger: readonly OperationalEvidenceLedgerEntry[]; certification_package: ProductionObservabilityCertificationPackage; certification_tests: readonly ProductionOperationsObservabilityTest[]; failures: readonly ProductionOperationsObservabilityFailure[]; outcome: ProductionOperationsObservabilityOutcome; replay_hash: string; integrity_hash: string }>;
export type ProductionOperationsObservabilityValidation = Readonly<{ valid: boolean; outcome: ProductionOperationsObservabilityOutcome; dashboards_valid: boolean; health_valid: boolean; event_registry_valid: boolean; metrics_registry_valid: boolean; alerts_valid: boolean; evidence_valid: boolean; certification_package_valid: boolean; certification_valid: boolean; result_replay_valid: boolean; failures: readonly ProductionOperationsObservabilityFailure[]; integrity_hash: string }>;
export type ProductionOperationsObservabilityBundle = Readonly<{ doctrine: Readonly<{ version: "production-operations-observability/v17.9"; upstream_phase: "performance-scalability-validation/v17.8"; health_states: readonly HealthState[]; component_types: readonly ComponentType[]; alert_categories: readonly AlertCategory[]; alert_severities: readonly AlertSeverity[]; certification_outcomes: readonly ProductionOperationsObservabilityOutcome[] }>; result: ProductionOperationsObservabilityResult; validation: ProductionOperationsObservabilityValidation }>;
