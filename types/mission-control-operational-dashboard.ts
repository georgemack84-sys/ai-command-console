import type { MissionControlVisibilityContractReport } from "@/types/mission-control-visibility-contract";

export type OperationalTimelineEventType = "MISSION_CREATED" | "PLAN_GENERATED" | "EXECUTION_STARTED" | "TASK_STARTED" | "TASK_COMPLETED" | "CHECKPOINT_CREATED" | "RETRY_STARTED" | "RETRY_COMPLETED" | "FAILURE_DETECTED" | "ROLLBACK_STARTED" | "ROLLBACK_COMPLETED" | "EXECUTION_COMPLETED" | "MISSION_COMPLETED";
export type OperationalExecutionState = "PLANNING" | "READY" | "RUNNING" | "WAITING" | "PAUSED" | "INTERVENED" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
export type GovernancePanelStatus = "PASS" | "WARNING" | "BLOCKED" | "ESCALATED";
export type ConstitutionalComplianceStatus = "COMPLIANT" | "NON_COMPLIANT" | "UNDER_REVIEW";
export type AuthorityValidationStatus = "AUTHORIZED" | "UNAUTHORIZED" | "LIMITED";
export type PolicyValidationStatus = "VALID" | "WARNING" | "VIOLATION";
export type OperationalConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW" | "INSUFFICIENT";
export type ConfidenceTrendState = "IMPROVING" | "STABLE" | "DECLINING" | "VOLATILE";
export type OperationalRiskSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type OperationalRiskLikelihood = "UNLIKELY" | "POSSIBLE" | "LIKELY" | "VERY_LIKELY";
export type OperationalRiskImpact = "MINOR" | "MODERATE" | "MAJOR" | "SEVERE";
export type OperationalSupervisionState = "MONITORING" | "STABLE" | "WATCH" | "DEGRADED" | "CRITICAL" | "ESCALATED";
export type OperationalDriftState = "NONE" | "MINOR" | "MODERATE" | "SEVERE";
export type OperationalAlertType = "MISSION_STARTED" | "MISSION_COMPLETED" | "CHECKPOINT_CREATED" | "CHECKPOINT_FAILED" | "CONFIDENCE_DROP" | "RISK_INCREASE" | "POLICY_WARNING" | "AUTHORITY_WARNING" | "EXECUTION_FAILURE" | "ROLLBACK_READY" | "SUPERVISION_ALERT" | "DRIFT_DETECTED" | "OPERATOR_ACTION_REQUIRED";
export type DashboardRefreshMode = "REAL_TIME" | "EVENT_DRIVEN" | "REPLAY_MODE" | "SNAPSHOT_MODE";
export type OperationalDashboardValidationOutcome = "VALID" | "INVALID" | "BLOCKED";

export type MissionControlOperationalDashboardScenario =
  | "BASELINE"
  | "INCOMPLETE_TIMELINE"
  | "NONDETERMINISTIC_STATE"
  | "HIDDEN_EXECUTION"
  | "MISSING_GOVERNANCE"
  | "CONFIDENCE_NOT_REPRODUCIBLE"
  | "RISK_INCONSISTENT"
  | "SUPERVISION_UNAVAILABLE"
  | "MISSING_REPLAY_REFERENCE"
  | "MISSING_LINEAGE_REFERENCE"
  | "MISSING_INTEGRITY_HASH"
  | "EXECUTION_AUTHORITY_EXPOSED"
  | "UNAUTHORIZED_ACCESS"
  | "CROSS_TENANT_DISPLAY";

export type OperationalDashboardFailure =
  | "EXECUTION_TIMELINE_INCOMPLETE"
  | "DASHBOARD_STATE_NONDETERMINISTIC"
  | "HIDDEN_EXECUTION_EXISTS"
  | "GOVERNANCE_STATUS_MISSING"
  | "CONFIDENCE_METRICS_NOT_REPRODUCIBLE"
  | "RISK_INDICATORS_INCONSISTENT"
  | "SUPERVISION_HEALTH_UNAVAILABLE"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISSING"
  | "DASHBOARD_EXECUTION_AUTHORITY_EXPOSED"
  | "UNAUTHORIZED_DASHBOARD_ACCESS"
  | "CROSS_TENANT_INFORMATION_DISPLAYED";

export type OperationalTimelineEvent = Readonly<{
  timeline_event_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  event_type: OperationalTimelineEventType;
  execution_state: OperationalExecutionState;
  step_name: string;
  step_order: number;
  started_at: string;
  completed_at: string | null;
  duration: string;
  checkpoint_reference: string | null;
  retry_count: number;
  rollback_reference: string | null;
  operator_intervention: boolean;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  event_hash: string;
}>;

export type OperationalStateRecord = Readonly<{
  state_record_id: string;
  mission_id: string;
  execution_id: string;
  current_state: OperationalExecutionState;
  previous_state: OperationalExecutionState;
  state_entered_at: string;
  state_duration: string;
  transition_reason: string;
  transition_source: string;
  operator_required: boolean;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  state_hash: string;
}>;

export type OperationalGovernanceRecord = Readonly<{
  governance_record_id: string;
  mission_id: string;
  execution_id: string;
  constitutional_status: ConstitutionalComplianceStatus;
  authority_validation: AuthorityValidationStatus;
  policy_validation: PolicyValidationStatus;
  governance_status: GovernancePanelStatus;
  approval_status: "APPROVED" | "PENDING" | "REJECTED";
  blocking_reason: string | null;
  escalation_reference: string | null;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  governance_hash: string;
}>;

export type OperationalConfidenceRecord = Readonly<{
  confidence_record_id: string;
  mission_id: string;
  execution_id: string;
  planning_confidence: OperationalConfidenceLevel;
  execution_confidence: OperationalConfidenceLevel;
  recommendation_confidence: OperationalConfidenceLevel;
  supervision_confidence: OperationalConfidenceLevel;
  overall_confidence: number;
  trend_direction: ConfidenceTrendState;
  explanation: string;
  confidence_factors: readonly string[];
  timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  confidence_hash: string;
}>;

export type OperationalRiskRecord = Readonly<{
  risk_record_id: string;
  mission_id: string;
  execution_id: string;
  risk_category: "EXECUTION" | "POLICY" | "AUTHORITY" | "GOVERNANCE" | "OPERATIONAL";
  severity: OperationalRiskSeverity;
  likelihood: OperationalRiskLikelihood;
  impact: OperationalRiskImpact;
  risk_score: number;
  mitigation: string;
  owner: string;
  status: "OPEN" | "WATCHING" | "MITIGATED";
  timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  risk_hash: string;
}>;

export type OperationalSupervisionRecord = Readonly<{
  supervision_record_id: string;
  mission_id: string;
  execution_id: string;
  supervision_state: OperationalSupervisionState;
  health_score: number;
  drift_status: OperationalDriftState;
  policy_violation_count: number;
  constitutional_violation_count: number;
  active_alerts: number;
  recommended_action: string;
  timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  supervision_hash: string;
}>;

export type MissionSummaryRecord = Readonly<{
  mission_summary_id: string;
  mission_id: string;
  tenant_id: string;
  overall_status: "ACTIVE" | "COMPLETED" | "FAILED" | "PAUSED";
  overall_health: number;
  overall_confidence: number;
  overall_risk: OperationalRiskSeverity;
  governance_status: GovernancePanelStatus;
  execution_progress: number;
  active_alerts: number;
  timestamp: string;
  summary_hash: string;
}>;

export type OperationalAlertRecord = Readonly<{
  alert_id: string;
  mission_id: string;
  severity: OperationalRiskSeverity;
  category: OperationalAlertType;
  description: string;
  recommended_action: string;
  operator_required: boolean;
  timestamp: string;
  alert_hash: string;
}>;

export type DashboardRefreshRecord = Readonly<{
  refresh_id: string;
  refresh_mode: DashboardRefreshMode;
  certified_data_sources: readonly string[];
  deterministic_refresh_order: readonly string[];
  replay_frozen_at: string | null;
  historical_snapshot_immutable: boolean;
  refresh_hash: string;
}>;

export type OperationalDashboardValidationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: OperationalDashboardFailure | null;
  evidence_refs: readonly string[];
  test_hash: string;
}>;

export type MissionControlOperationalDashboardReport = Readonly<{
  phase_version: "8J.2";
  schema_version: "mission-control-operational-dashboard/v8J.2";
  dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  validation_outcome: OperationalDashboardValidationOutcome;
  visibility_contract: MissionControlVisibilityContractReport;
  timeline: readonly OperationalTimelineEvent[];
  state_monitor: OperationalStateRecord;
  governance_panel: OperationalGovernanceRecord | null;
  confidence_monitor: OperationalConfidenceRecord;
  risk_monitor: readonly OperationalRiskRecord[];
  supervision_monitor: OperationalSupervisionRecord | null;
  mission_summary: MissionSummaryRecord;
  alerts: readonly OperationalAlertRecord[];
  refresh_record: DashboardRefreshRecord;
  validation_tests: readonly OperationalDashboardValidationTest[];
  failures: readonly OperationalDashboardFailure[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  advisory_only: true;
  execution_authority_granted: false;
  dashboard_hash: string;
}>;

export type MissionControlOperationalDashboardInput = Readonly<{
  scenario?: MissionControlOperationalDashboardScenario;
  refresh_mode?: DashboardRefreshMode;
}>;

export type MissionControlOperationalDashboardValidationResult = Readonly<{
  dashboard_id: string | null;
  valid: boolean;
  validation_outcome: OperationalDashboardValidationOutcome;
  failures: readonly OperationalDashboardFailure[];
  dashboard_hash_valid: boolean;
  advisory_only: boolean;
  validation_hash: string;
}>;

export type MissionControlOperationalDashboardObservabilitySurface = Readonly<{
  dashboard_id: string;
  validation_outcome: OperationalDashboardValidationOutcome;
  timeline_events: number;
  current_state: OperationalExecutionState;
  governance_status: GovernancePanelStatus | null;
  confidence: number;
  active_risks: number;
  supervision_state: OperationalSupervisionState | null;
  active_alerts: number;
  failed_tests: number;
  failures: readonly OperationalDashboardFailure[];
  advisory_only: boolean;
  execution_authority_granted: boolean;
  dashboard_hash: string;
}>;
