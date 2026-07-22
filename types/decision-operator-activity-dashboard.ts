import type { ReplayCertificationMonitoringResult } from "@/types/decision-replay-certification-monitoring";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type OperatorQueueCategory = "IMMEDIATE_ACTION" | "HIGH_PRIORITY" | "PENDING_APPROVAL" | "PENDING_REVIEW" | "PENDING_EVIDENCE" | "PENDING_SIMULATION" | "DEFERRED" | "ESCALATED";
export type OperatorApprovalState = "REQUESTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED";
export type OperatorOverrideCategory = "RECOMMENDATION_OVERRIDE" | "PRIORITY_OVERRIDE" | "DEFERMENT" | "APPROVAL_OVERRIDE" | "ESCALATION_OVERRIDE" | "CANCELLATION";
export type OperatorEscalationType = "GOVERNANCE" | "CONSTITUTIONAL" | "AUTHORITY" | "OPERATIONAL" | "CERTIFICATION" | "SECURITY" | "MISSION" | "REPLAY";
export type OperatorActionType = "ASSIGNMENT_CREATED" | "REVIEW_STARTED" | "APPROVAL_SUBMITTED" | "APPROVAL_COMPLETED" | "REJECTION_SUBMITTED" | "OVERRIDE_PERFORMED" | "ESCALATION_INITIATED" | "ESCALATION_RESOLVED" | "DEFERMENT_APPLIED" | "EVIDENCE_REQUESTED" | "SIMULATION_REQUESTED" | "REPLAY_VERIFIED" | "CERTIFICATION_VERIFIED";

export type OperatorActivityDashboardFailure =
  | "OPERATOR_WORK_QUEUES_INCOMPLETE"
  | "APPROVAL_HISTORY_MISSING"
  | "OVERRIDES_HIDDEN"
  | "ESCALATION_ACTIVITY_OMITTED"
  | "OPERATOR_HISTORY_RECONSTRUCTION_FAILED"
  | "WORKLOAD_METRICS_INACCURATE"
  | "AUTHORITY_ASSIGNMENTS_INCONSISTENT"
  | "REPLAY_REFERENCES_MISSING"
  | "CERTIFICATION_REFERENCES_ABSENT"
  | "DASHBOARD_ORDER_NONDETERMINISTIC"
  | "CROSS_TENANT_OPERATOR_DATA_VISIBLE"
  | "INTEGRITY_HASH_MISMATCH"
  | "OPERATOR_ACTIVITY_REPLAY_RECONSTRUCTION_FAILED"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type OperatorWorkQueue = Readonly<{
  work_queue_id: string;
  tenant_id: string;
  operator_id: string;
  assigned_decisions: readonly string[];
  queue_order: readonly string[];
  queue_categories: Readonly<Record<OperatorQueueCategory, readonly string[]>>;
  workload_metrics: Readonly<{ assigned_decisions: number; pending_workload: number; completed_workload: number; average_response_minutes: number; utilization: number }>;
  pending_actions: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperatorApprovalDashboard = Readonly<{
  approval_dashboard_id: string;
  tenant_id: string;
  operator_id: string;
  pending_approvals: readonly string[];
  completed_approvals: readonly string[];
  rejected_approvals: readonly string[];
  delegated_approvals: readonly string[];
  expired_approvals: readonly string[];
  approval_history: readonly string[];
  approval_latency_minutes: number;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperatorOverrideDashboard = Readonly<{
  override_dashboard_id: string;
  tenant_id: string;
  operator_id: string;
  override_refs: readonly string[];
  override_categories: readonly OperatorOverrideCategory[];
  original_recommendations: readonly string[];
  justification_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_impact: readonly string[];
  integrity_hash: string;
}>;

export type OperatorEscalationDashboard = Readonly<{
  escalation_dashboard_id: string;
  tenant_id: string;
  operator_id: string;
  escalation_refs: readonly string[];
  escalation_types: readonly OperatorEscalationType[];
  escalation_status: readonly string[];
  assigned_authority: readonly string[];
  response_deadlines: readonly string[];
  resolution_history: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperatorHistoryViewer = Readonly<{
  history_viewer_id: string;
  tenant_id: string;
  operator_id: string;
  activity_refs: readonly string[];
  timeline_refs: readonly string[];
  workload_history: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperatorActivityLedgerEntry = Readonly<{
  operator_activity_ledger_id: string;
  tenant_id: string;
  operator_id: string;
  decision_id: string;
  activity_type: OperatorActionType;
  activity_timestamp: string;
  authority_state: string;
  governance_state: string;
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type OperatorActionRecord = Readonly<{
  action_id: string;
  decision_id: string;
  operator_id: string;
  action_type: OperatorActionType;
  authority_level: string;
  governance_state: string;
  action_timestamp: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type OperatorActivityRecord = Readonly<{
  activity_record_id: string;
  tenant_id: string;
  operator_id: string;
  work_queue_ref: string;
  approval_dashboard_ref: string;
  override_dashboard_ref: string;
  escalation_dashboard_ref: string;
  history_viewer_ref: string;
  activity_ledger_refs: readonly string[];
  action_record_refs: readonly string[];
  replay_ref: string;
  certification_ref: string;
  integrity_hash: string;
}>;

export type OperatorActivityDashboardValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  work_queues_complete: boolean;
  approval_history_complete: boolean;
  overrides_visible: boolean;
  escalations_visible: boolean;
  operator_history_reconstructable: boolean;
  workload_metrics_accurate: boolean;
  authority_assignments_consistent: boolean;
  replay_refs_present: boolean;
  certification_refs_present: boolean;
  deterministic_ordering: boolean;
  tenant_isolated: boolean;
  authorization_valid: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  failures: readonly OperatorActivityDashboardFailure[];
  integrity_hash: string;
}>;

export type OperatorActivityDashboardInput = Readonly<{
  replay_monitoring?: ReplayCertificationMonitoringResult;
  role?: VisibilityRole;
  operator_id?: string;
  scenario?:
    | "BASELINE"
    | "INCOMPLETE_WORK_QUEUE"
    | "MISSING_APPROVAL_HISTORY"
    | "HIDE_OVERRIDES"
    | "OMIT_ESCALATIONS"
    | "BROKEN_HISTORY"
    | "BAD_WORKLOAD_METRICS"
    | "BAD_AUTHORITY_ASSIGNMENTS"
    | "MISSING_REPLAY_REFS"
    | "MISSING_CERTIFICATION_REFS"
    | "NONDETERMINISTIC_ORDER"
    | "CROSS_TENANT"
    | "HASH_MISMATCH"
    | "REPLAY_RECONSTRUCTION_FAILURE"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type OperatorActivityDashboardResult = Readonly<{
  dashboard_version: "decision-operator-activity-dashboard/v1";
  replay_monitoring: ReplayCertificationMonitoringResult;
  work_queue: OperatorWorkQueue;
  approval_dashboard: OperatorApprovalDashboard;
  override_dashboard: OperatorOverrideDashboard;
  escalation_dashboard: OperatorEscalationDashboard;
  history_viewer: OperatorHistoryViewer;
  activity_ledger: readonly OperatorActivityLedgerEntry[];
  action_records: readonly OperatorActionRecord[];
  activity_record: OperatorActivityRecord;
  validation: OperatorActivityDashboardValidation;
  deterministic: true;
  advisory_only: true;
  mutates_operator_or_orchestration: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OperatorActivityDashboardFoundation = Readonly<{
  dashboard_version: "decision-operator-activity-dashboard/v1";
  queue_categories: readonly OperatorQueueCategory[];
  approval_states: readonly OperatorApprovalState[];
  override_categories: readonly OperatorOverrideCategory[];
  escalation_types: readonly OperatorEscalationType[];
  action_types: readonly OperatorActionType[];
  result: OperatorActivityDashboardResult;
}>;
