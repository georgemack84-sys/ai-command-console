import type { AutonomyMaturityDomain } from "@/types/autonomy-maturity-assessment-contract";
import type { AssessmentReplayRepository } from "@/types/assessment-replay-explainability";

export type ContinuousMaturityMonitoringScenario = "BASELINE" | "CHANGES_NOT_DETECTED" | "TRIGGER_MISMATCH" | "NONDETERMINISTIC_ALERTS" | "MONITORING_HISTORY_MODIFIED" | "REPLAY_RECONSTRUCTION_MISMATCH" | "GOVERNANCE_CHANGES_MISSED" | "CONSTITUTIONAL_CHANGES_MISSED" | "CERTIFICATION_CHANGES_MISSED" | "INTEGRITY_VERIFICATION_FAILURE" | "HIDDEN_MONITORING_LOGIC" | "RUNTIME_BEHAVIOR_MODIFICATION" | "OPERATOR_AUTHORITY_BYPASS" | "TENANT_ISOLATION_VIOLATION";
export type ContinuousMaturityMonitoringFailure = "MONITORED_CHANGES_NOT_DETECTED" | "ASSESSMENT_TRIGGERS_DIFFERED_FOR_IDENTICAL_EVENTS" | "ALERTS_NONDETERMINISTIC" | "MONITORING_HISTORY_MODIFIED" | "REPLAY_RECONSTRUCTION_MISMATCHED" | "GOVERNANCE_CHANGES_MISSED" | "CONSTITUTIONAL_CHANGES_MISSED" | "CERTIFICATION_CHANGES_MISSED" | "INTEGRITY_VERIFICATION_FAILED" | "HIDDEN_MONITORING_LOGIC_DETECTED" | "RUNTIME_BEHAVIOR_MODIFICATION_ATTEMPTED" | "OPERATOR_AUTHORITY_BYPASSED" | "TENANT_ISOLATION_VIOLATED";
export type MonitoringDomain = "ARCHITECTURE" | "GOVERNANCE" | "CONSTITUTION" | "RUNTIME" | "REPLAY" | "RESILIENCE" | "CERTIFICATION" | "EXPLAINABILITY" | "OPTIMIZATION" | "RECOVERY" | "HISTORICAL_MATURITY";
export type ChangeCategory = "INFORMATIONAL" | "MINOR" | "MODERATE" | "MAJOR" | "CRITICAL";
export type AlertSeverity = "INFORMATIONAL" | "ADVISORY" | "WARNING" | "HIGH" | "CRITICAL";
export type TriggerStatus = "NOT_REQUIRED" | "ADVISORY_REASSESSMENT_RECOMMENDED" | "SCHEDULED_REASSESSMENT_ADVISED";

export type MonitoringRule = Readonly<{
  rule_id: string;
  monitored_domain: MonitoringDomain;
  rule_version: "continuous-monitoring-rules/v1";
  threshold: ChangeCategory;
  approved: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type DetectedMaturityChange = Readonly<{
  change_id: string;
  monitored_domain: MonitoringDomain;
  affected_maturity_domains: readonly AutonomyMaturityDomain[];
  category: ChangeCategory;
  description: string;
  readiness_impact: number;
  certification_impact: number;
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type AssessmentTriggerDecision = Readonly<{
  trigger_id: string;
  trigger_status: TriggerStatus;
  trigger_reason: string;
  duplicate_trigger_rejected: boolean;
  deterministic_order: number;
  evidence_reference: string;
  replay_reference: string;
  advisory_only: true;
  assessment_execution_authorized: false;
  integrity_hash: string;
}>;

export type MonitoringScheduleRecord = Readonly<{
  schedule_id: string;
  schedule_mode: "SCHEDULED" | "MILESTONE" | "CERTIFICATION" | "DEPLOYMENT" | "GOVERNANCE" | "CONSTITUTIONAL" | "OPERATOR_REQUESTED";
  cadence: "DETERMINISTIC_CYCLE";
  next_cycle_hint: string;
  version: "monitoring-schedule/v1";
  advisory_only: true;
  background_job_started: false;
  integrity_hash: string;
}>;

export type MaturityMonitoringAlert = Readonly<{
  alert_id: string;
  alert_type: "MATURITY_INCREASED" | "MATURITY_DECREASED" | "READINESS_CHANGED" | "CERTIFICATION_BLOCKED" | "GOVERNANCE_DEGRADED" | "CONSTITUTIONAL_ISSUE_DETECTED" | "REPLAY_INCONSISTENCY_DETECTED" | "RESILIENCE_DEGRADATION" | "OPTIMIZATION_OPPORTUNITY";
  severity: AlertSeverity;
  message: string;
  affected_domains: readonly AutonomyMaturityDomain[];
  recommended_operator_actions: readonly string[];
  replay_reference: string;
  advisory_only: true;
  corrective_action_authorized: false;
  integrity_hash: string;
}>;

export type MonitoringLedgerEntry = Readonly<{
  monitoring_id: string;
  monitoring_cycle: number;
  monitored_domains: readonly MonitoringDomain[];
  detected_changes: readonly string[];
  trigger_status: TriggerStatus;
  generated_alerts: readonly string[];
  governance_status: "PASS" | "FAIL";
  constitutional_status: "PASS" | "FAIL";
  replay_reference: string;
  lineage_reference: string;
  immutable: boolean;
  timestamp: "1970-01-01T00:00:00.000Z";
  integrity_hash: string;
}>;

export type MonitoringAuditReport = Readonly<{
  report_id: string;
  monitoring_id: string;
  monitoring_version: "continuous-maturity-monitoring/v8ALT.11.11";
  trigger_engine_version: "assessment-trigger/v1";
  monitoring_rule_version: "continuous-monitoring-rules/v1";
  evidence_references: readonly string[];
  governance_references: readonly string[];
  constitutional_references: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timestamp: "1970-01-01T00:00:00.000Z";
}>;

export type ContinuousMaturityMonitoringRepository = Readonly<{
  repository_id: string;
  final_state: "CONTINUOUS_MATURITY_MONITORING_COMPLETE" | "CONTINUOUS_MATURITY_MONITORING_FAILED";
  replay_repository: AssessmentReplayRepository;
  rules: readonly MonitoringRule[];
  changes: readonly DetectedMaturityChange[];
  triggers: readonly AssessmentTriggerDecision[];
  schedules: readonly MonitoringScheduleRecord[];
  alerts: readonly MaturityMonitoringAlert[];
  ledger: readonly MonitoringLedgerEntry[];
  audit_report: MonitoringAuditReport;
  failures: readonly ContinuousMaturityMonitoringFailure[];
  advisory_only: true;
  runtime_behavior_modification_authorized: false;
  recommendation_execution_authorized: false;
  maturity_level_change_authorized: false;
  governance_policy_change_authorized: false;
  constitutional_rule_change_authorized: false;
  scoring_model_change_authorized: false;
  autonomous_recovery_authorized: false;
  certification_approval_authorized: false;
  operator_authority_bypass_authorized: false;
  integrity_hash: string;
}>;

export type ContinuousMaturityMonitoringValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  changes_detected: boolean;
  triggers_deterministic: boolean;
  alerts_deterministic: boolean;
  history_immutable: boolean;
  replay_reconstruction_verified: boolean;
  governance_changes_detected: boolean;
  constitutional_changes_detected: boolean;
  certification_changes_detected: boolean;
  integrity_verified: boolean;
  no_hidden_logic: boolean;
  runtime_behavior_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  failures: readonly ContinuousMaturityMonitoringFailure[];
  validation_hash: string;
}>;

export type ContinuousMaturityMonitoringObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  rule_count: number;
  change_count: number;
  trigger_count: number;
  schedule_count: number;
  alert_count: number;
  ledger_count: number;
  failure_count: number;
  advisory_only: true;
  runtime_behavior_modification_authorized: false;
  integrity_hash: string;
}>;

export type ContinuousMaturityMonitoringInput = Readonly<{ scenario?: ContinuousMaturityMonitoringScenario; repository?: ContinuousMaturityMonitoringRepository; replay_repository?: AssessmentReplayRepository }>;

export type ContinuousMaturityMonitoringBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "continuous-maturity-monitoring/v8ALT.11.11";
    final_state: "CONTINUOUS_MATURITY_MONITORING_READY";
    principles: readonly string[];
  }>;
  repository: ContinuousMaturityMonitoringRepository;
  validation: ContinuousMaturityMonitoringValidationResult;
  observability: ContinuousMaturityMonitoringObservabilitySurface;
}>;
