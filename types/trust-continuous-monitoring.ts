export type TrustMonitoringOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type TrustHealthStatus = "EXCELLENT" | "GOOD" | "STABLE" | "DEGRADED" | "CRITICAL" | "UNKNOWN";
export type MonitoringResult = "NORMAL" | "WARNING" | "ESCALATION_REQUIRED" | "REQUIRES_REEVALUATION" | "MONITORING_FAILURE";
export type MonitoringAlertType = "EVIDENCE_STALE" | "CONFIDENCE_DROP" | "RISK_INCREASE" | "TRUST_DEGRADATION" | "POLICY_DRIFT" | "OPERATIONAL_ANOMALY" | "HEALTH_CRITICAL" | "MONITORING_FAILURE";
export type TrendDirection = "IMPROVING" | "STABLE" | "DETERIORATING" | "VOLATILE" | "UNKNOWN";
export type TrustStanding = "QUALIFIED" | "QUALIFIED_WITH_RESTRICTIONS" | "SUSPENDED" | "REVOKED" | "FAIL_CLOSED";

export type TrustMonitoringFailure =
  | "P5_12_HUMAN_OVERSIGHT_INVALID"
  | "CONTINUOUS_MONITOR_MISSING"
  | "TRUST_HEALTH_ENGINE_MISSING"
  | "STANDING_OBSERVATION_MISSING"
  | "MONITORING_RULES_ENGINE_MISSING"
  | "OPERATIONAL_MONITORING_MISSING"
  | "TREND_ANALYSIS_MISSING"
  | "ALERT_SERVICE_MISSING"
  | "TRUST_DASHBOARD_MISSING"
  | "MONITORING_LEDGER_MISSING"
  | "CERTIFICATION_GATE_MISSING"
  | "MONITORING_EVIDENCE_MISSING"
  | "MONITORING_EVIDENCE_STALE"
  | "MONITORING_EVIDENCE_CONFLICTING"
  | "MONITORING_EVIDENCE_UNVERIFIABLE"
  | "MONITORING_OUTPUT_NOT_REPLAYABLE"
  | "MONITORING_NONDETERMINISTIC"
  | "MONITORING_LINEAGE_INCOMPLETE"
  | "MONITORING_LEDGER_MUTABLE"
  | "HEALTH_NOT_CALCULATED"
  | "STANDING_HISTORY_MISSING"
  | "RULES_NOT_EXECUTED"
  | "OPERATIONAL_CONDITIONS_NOT_CAPTURED"
  | "TREND_REPORT_MISSING"
  | "ALERTS_NOT_GENERATED"
  | "DASHBOARD_INCOMPLETE"
  | "MONITORING_FAILURE_IMPROVED_STANDING"
  | "TRUST_STANDING_CHANGED_DIRECTLY"
  | "TRUST_EVALUATION_EXECUTED"
  | "TRUST_DECISION_CREATED"
  | "TRUST_QUALIFICATION_EXECUTED"
  | "GOVERNANCE_DECISION_CREATED"
  | "OPERATOR_APPROVAL_CREATED"
  | "SAFETY_QUALIFICATION_EXECUTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "FAIL_CLOSED_NOT_ENFORCED"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type TrustMonitoringScenario = "BASELINE" | TrustMonitoringFailure;
export type TrustMonitoringInput = Readonly<{ scenario?: TrustMonitoringScenario; trust_id?: string; tenant_id?: string; monitoring_scope?: string }>;

export type MonitoringAlert = Readonly<{ alert_id: string; alert_type: MonitoringAlertType; severity: "INFO" | "WARNING" | "HIGH" | "CRITICAL"; evidence_refs: readonly string[]; action: "OBSERVE" | "ESCALATE" | "REQUIRE_REEVALUATION" | "MAINTAIN_FAIL_CLOSED"; integrity_hash: string }>;
export type TrustMonitoringRecord = Readonly<{ monitoring_id: string; trust_id: string; tenant_id: string; monitoring_timestamp: string; trust_standing: TrustStanding; observed_trust_standing: TrustStanding; trust_health: TrustHealthStatus; operational_status: "NOMINAL" | "DEGRADED" | "INCIDENT" | "UNKNOWN"; evidence_freshness: "FRESH" | "STALE" | "MISSING" | "CONFLICTING" | "UNVERIFIABLE"; confidence_score: number; risk_score: number; observation_summary: string; monitoring_result: MonitoringResult; generated_alerts: readonly string[]; lineage_refs: readonly string[]; integrity_hash: string }>;
export type TrustHealthReport = Readonly<{ report_id: string; trust_id: string; health_score: number; health_status: TrustHealthStatus; trend: TrendDirection; evidence_quality: number; confidence_stability: number; operational_health: number; recommendations: readonly string[]; generated_at: string; integrity_hash: string }>;
export type MonitoringReport = Readonly<{ report_id: string; monitoring_scope: string; findings: readonly string[]; anomalies: readonly string[]; alerts: readonly string[]; trend_summary: string; evidence_refs: readonly string[]; integrity_hash: string }>;
export type StandingHistory = Readonly<{ history_id: string; standing_transitions: readonly string[]; standing_stability: boolean; observation_history: readonly string[]; integrity_hash: string }>;
export type MonitoringPipeline = Readonly<{ pipeline_id: string; continuous_monitor: boolean; trust_health_engine: boolean; standing_observation_service: boolean; monitoring_rules_engine: boolean; operational_monitoring_service: boolean; trend_analysis_engine: boolean; alert_service: boolean; trust_dashboard: boolean; monitoring_ledger: boolean; certification_gate: boolean; integrity_hash: string }>;
export type TrustDashboard = Readonly<{ dashboard_id: string; standing_visible: boolean; health_visible: boolean; alerts_visible: boolean; evidence_freshness_visible: boolean; operational_status_visible: boolean; historical_trends_visible: boolean; integrity_hash: string }>;
export type MonitoringLedger = Readonly<{ ledger_id: string; monitoring_events: readonly string[]; health_calculations: readonly string[]; alerts: readonly string[]; observations: readonly string[]; trend_analyses: readonly string[]; immutable: boolean; lineage_complete: boolean; replay_refs: readonly string[]; integrity_hash: string }>;
export type MonitoringBoundary = Readonly<{ boundary_id: string; trust_standing_changed_directly: boolean; trust_evaluation_executed: boolean; trust_decision_created: boolean; trust_qualification_executed: boolean; governance_decision_created: boolean; operator_approval_created: boolean; safety_qualification_executed: boolean; tenant_isolation_preserved: boolean; integrity_hash: string }>;
export type TrustMonitoringCertification = Readonly<{ certification_id: string; outcome: TrustMonitoringOutcome; phase_ready: boolean; continuous_monitoring_operational: boolean; health_calculated: boolean; standing_observation_operational: boolean; rules_deterministic: boolean; operational_conditions_captured: boolean; trend_analysis_operational: boolean; alerts_generated: boolean; dashboard_complete: boolean; ledger_immutable: boolean; replayable: boolean; monitoring_failures_fail_closed: boolean; boundary_respected: boolean; failures: readonly TrustMonitoringFailure[]; integrity_hash: string }>;
export type TrustMonitoringResult = Readonly<{ phase_version: "trust-continuous-monitoring/v5.13"; phase_identifier: "TrustContinuousMonitoring"; human_oversight_ref: "trust-human-oversight-governance/v5.12"; pipeline: MonitoringPipeline; record: TrustMonitoringRecord; health: TrustHealthReport; standing: StandingHistory; report: MonitoringReport; alerts: readonly MonitoringAlert[]; dashboard: TrustDashboard; ledger: MonitoringLedger; boundary: MonitoringBoundary; certification: TrustMonitoringCertification; replay_hash: string; integrity_hash: string }>;
export type TrustMonitoringValidation = Readonly<{ valid: boolean; outcome: TrustMonitoringOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; pipeline_valid: boolean; record_valid: boolean; health_valid: boolean; standing_valid: boolean; report_valid: boolean; alerts_valid: boolean; dashboard_valid: boolean; ledger_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly TrustMonitoringFailure[]; integrity_hash: string }>;
export type TrustMonitoringBundle = Readonly<{ doctrine: Readonly<{ version: "trust-continuous-monitoring/v5.13"; owns_trust_monitoring: true; owns_operational_monitoring: true; owns_trust_health: true; owns_standing_observation: true; changes_trust_standing: false; evaluates_trust: false; creates_trust_decisions: false; qualifies_trust: false; creates_governance_decisions: false; creates_operator_approvals: false; qualifies_safety: false }>; result: TrustMonitoringResult; validation: TrustMonitoringValidation }>;
