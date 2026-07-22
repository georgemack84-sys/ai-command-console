import type { LedgerIntegrityCertificationResult } from "@/types/decision-ledger-integrity-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type ObservabilityDashboardScope =
  | "ACTIVE_DECISIONS"
  | "BLOCKED_DECISIONS"
  | "ESCALATIONS"
  | "CONFLICTS"
  | "DEPENDENCIES"
  | "TIMELINE"
  | "REPLAY"
  | "GOVERNANCE"
  | "CERTIFICATION"
  | "OPERATOR_ACTIVITY"
  | "SYSTEM_HEALTH";

export type ObservabilityDashboardCheck =
  | "DASHBOARD_COVERAGE"
  | "STATE_VISIBILITY"
  | "TRANSITION_VISIBILITY"
  | "TIMELINE_ACCURACY"
  | "REPLAY_VISIBILITY"
  | "GOVERNANCE_VISIBILITY"
  | "CERTIFICATION_VISIBILITY"
  | "OPERATOR_VISIBILITY"
  | "TENANT_ISOLATION"
  | "INTEGRITY_VERIFICATION";

export type ObservabilityCertificationState = "PASS" | "FAIL";

export type ObservabilityDashboardCertificationFailure =
  | "LEDGER_INTEGRITY_CERTIFICATION_INVALID"
  | "HIDDEN_ORCHESTRATION_STATE"
  | "HIDDEN_WORKFLOW_TRANSITION"
  | "MISSING_ACTIVE_DECISION"
  | "MISSING_BLOCKED_DECISION"
  | "MISSING_ESCALATION"
  | "MISSING_CONFLICT"
  | "MISSING_DEPENDENCY"
  | "MISSING_TIMELINE_EVENT"
  | "MISSING_REPLAY_STATUS"
  | "MISSING_GOVERNANCE_STATUS"
  | "MISSING_CERTIFICATION_STATUS"
  | "MISSING_OPERATOR_ACTION"
  | "INCORRECT_DASHBOARD_DATA"
  | "REPLAY_DASHBOARD_INCONSISTENCY"
  | "GOVERNANCE_DASHBOARD_INCONSISTENCY"
  | "CROSS_TENANT_DASHBOARD_DATA_EXPOSURE"
  | "HIDDEN_SYSTEM_HEALTH_CONDITION"
  | "INTEGRITY_HASH_MISMATCH"
  | "REPLAY_VISIBILITY_MISMATCH"
  | "FAIL_OPEN_DASHBOARD_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type DashboardSnapshot = Readonly<{
  dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  active_decisions: readonly string[];
  blocked_decisions: readonly string[];
  blocking_reasons: readonly string[];
  escalations: readonly string[];
  conflicts: readonly string[];
  dependencies: readonly string[];
  timeline_events: readonly string[];
  replay_statuses: readonly string[];
  governance_statuses: readonly string[];
  certification_statuses: readonly string[];
  operator_actions: readonly string[];
  system_health_conditions: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type DashboardCoverageReport = Readonly<{
  coverage_report_id: string;
  tenant_id: string;
  mission_id: string;
  covered_scopes: readonly ObservabilityDashboardScope[];
  feature_coverage_complete: boolean;
  workflow_coverage_complete: boolean;
  decision_coverage_complete: boolean;
  governance_coverage_complete: boolean;
  replay_coverage_complete: boolean;
  certification_coverage_complete: boolean;
  operational_coverage_complete: boolean;
  validation_state: ObservabilityCertificationState;
  integrity_hash: string;
}>;

export type VisibilityVerificationReport = Readonly<{
  visibility_report_id: string;
  tenant_id: string;
  mission_id: string;
  state_visibility_complete: boolean;
  transition_visibility_complete: boolean;
  status_indicators_complete: boolean;
  health_indicators_complete: boolean;
  alerts_generated: boolean;
  operator_notifications_complete: boolean;
  hidden_state_refs: readonly string[];
  validation_state: ObservabilityCertificationState;
  integrity_hash: string;
}>;

export type StateMonitoringReport = Readonly<{
  state_report_id: string;
  tenant_id: string;
  mission_id: string;
  current_state_ref: string;
  previous_state_ref: string;
  transition_history_refs: readonly string[];
  transition_integrity_verified: boolean;
  state_consistency_verified: boolean;
  validation_state: ObservabilityCertificationState;
  integrity_hash: string;
}>;

export type TimelineVerificationReport = Readonly<{
  timeline_report_id: string;
  tenant_id: string;
  mission_id: string;
  event_ordering_deterministic: boolean;
  timestamp_sequence_valid: boolean;
  workflow_chronology_complete: boolean;
  operator_chronology_complete: boolean;
  governance_chronology_complete: boolean;
  replay_chronology_complete: boolean;
  certification_chronology_complete: boolean;
  timeline_refs: readonly string[];
  validation_state: ObservabilityCertificationState;
  integrity_hash: string;
}>;

export type ObservabilityEvidencePackage = Readonly<{
  evidence_package_id: string;
  tenant_id: string;
  mission_id: string;
  dashboard_evidence_refs: readonly string[];
  state_evidence_refs: readonly string[];
  timeline_evidence_refs: readonly string[];
  governance_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  operator_evidence_refs: readonly string[];
  integrity_evidence_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ObservabilityCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  executive_summary: string;
  certification_scope: readonly ObservabilityDashboardScope[];
  certified_checks: readonly ObservabilityDashboardCheck[];
  dashboard_coverage_assessment: ObservabilityCertificationState;
  active_decision_visibility: ObservabilityCertificationState;
  blocked_decision_visibility: ObservabilityCertificationState;
  escalation_visibility: ObservabilityCertificationState;
  conflict_visibility: ObservabilityCertificationState;
  dependency_visibility: ObservabilityCertificationState;
  timeline_assessment: ObservabilityCertificationState;
  replay_monitoring_assessment: ObservabilityCertificationState;
  governance_visibility_assessment: ObservabilityCertificationState;
  certification_visibility_assessment: ObservabilityCertificationState;
  operator_activity_assessment: ObservabilityCertificationState;
  integrity_verification: ObservabilityCertificationState;
  failure_analysis: readonly ObservabilityDashboardCertificationFailure[];
  certification_decision: ObservabilityCertificationState;
  production_readiness: "READY" | "BLOCKED";
  integrity_hash: string;
}>;

export type ObservabilityCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "DASHBOARD_VALIDATED" | "VISIBILITY_VALIDATED" | "TIMELINE_VALIDATED" | "REPLAY_VISIBILITY_VALIDATED" | "GOVERNANCE_VISIBILITY_VALIDATED" | "OBSERVABILITY_CERTIFIED" | "OBSERVABILITY_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  certification_state: ObservabilityCertificationState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type ObservabilityDashboardCertificationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  ledger_certification_valid: boolean;
  orchestration_states_visible: boolean;
  workflow_transitions_visible: boolean;
  active_decisions_visible: boolean;
  blocked_decisions_visible: boolean;
  escalations_visible: boolean;
  conflicts_visible: boolean;
  dependencies_visible: boolean;
  timeline_events_visible: boolean;
  replay_status_visible: boolean;
  governance_status_visible: boolean;
  certification_status_visible: boolean;
  operator_actions_visible: boolean;
  dashboard_data_correct: boolean;
  replay_dashboard_consistent: boolean;
  governance_dashboard_consistent: boolean;
  tenant_isolated: boolean;
  system_health_visible: boolean;
  integrity_verified: boolean;
  replay_visibility_consistent: boolean;
  fail_closed: boolean;
  authorization_valid: boolean;
  advisory_only: boolean;
  failures: readonly ObservabilityDashboardCertificationFailure[];
  integrity_hash: string;
}>;

export type ObservabilityDashboardCertificationInput = Readonly<{
  ledger_certification?: LedgerIntegrityCertificationResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "LEDGER_INVALID"
    | "HIDDEN_STATE"
    | "HIDDEN_TRANSITION"
    | "MISSING_ACTIVE_DECISION"
    | "MISSING_BLOCKED_DECISION"
    | "MISSING_ESCALATION"
    | "MISSING_CONFLICT"
    | "MISSING_DEPENDENCY"
    | "MISSING_TIMELINE_EVENT"
    | "MISSING_REPLAY_STATUS"
    | "MISSING_GOVERNANCE_STATUS"
    | "MISSING_CERTIFICATION_STATUS"
    | "MISSING_OPERATOR_ACTION"
    | "INCORRECT_DASHBOARD_DATA"
    | "REPLAY_DASHBOARD_INCONSISTENCY"
    | "GOVERNANCE_DASHBOARD_INCONSISTENCY"
    | "CROSS_TENANT"
    | "HIDDEN_SYSTEM_HEALTH"
    | "HASH_MISMATCH"
    | "REPLAY_VISIBILITY_MISMATCH"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type ObservabilityDashboardCertificationResult = Readonly<{
  certification_version: "decision-observability-dashboard-certification/v1";
  ledger_certification: LedgerIntegrityCertificationResult;
  dashboard_snapshot: DashboardSnapshot;
  coverage_report: DashboardCoverageReport;
  visibility_report: VisibilityVerificationReport;
  state_report: StateMonitoringReport;
  timeline_report: TimelineVerificationReport;
  evidence_package: ObservabilityEvidencePackage;
  observability_report: ObservabilityCertificationReport;
  observability_ledger: readonly ObservabilityCertificationLedgerEntry[];
  validation: ObservabilityDashboardCertificationValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  mutates_dashboard_state: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ObservabilityDashboardCertificationFoundation = Readonly<{
  certification_version: "decision-observability-dashboard-certification/v1";
  scopes: readonly ObservabilityDashboardScope[];
  checks: readonly ObservabilityDashboardCheck[];
  result: ObservabilityDashboardCertificationResult;
}>;
