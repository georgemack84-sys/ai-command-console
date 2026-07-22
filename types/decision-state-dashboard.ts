import type { DecisionObservabilityResult, VisibilityRole } from "@/types/decision-observability-contract";

export type DecisionDashboardLifecycleState = "REGISTERED" | "QUEUED" | "ACTIVE" | "BLOCKED" | "ESCALATED" | "DEFERRED" | "RESUMED" | "COMPLETED" | "CANCELLED" | "ARCHIVED";
export type DecisionOrchestrationStage = "INTAKE" | "CONTEXT" | "GRAPH" | "PRIORITY" | "ARBITRATION" | "GOVERNANCE" | "PACKAGE" | "OPERATOR_WORKFLOW" | "REPLAY_AUDIT" | "CERTIFICATION";
export type DecisionPriorityBand = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "DEFERRED";
export type DecisionRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type DecisionGovernanceState = "COMPLIANT" | "RESTRICTED" | "REVIEW_REQUIRED" | "BLOCKED";
export type DecisionAuthorityState = "AUTHORIZED" | "APPROVAL_REQUIRED" | "ESCALATION_REQUIRED" | "UNAUTHORIZED";
export type DecisionEscalationState = "NONE" | "ACTIVE" | "HISTORICAL" | "RESOLVED";
export type DecisionDeferredState = "NONE" | "AWAITING_EVIDENCE" | "AWAITING_APPROVAL" | "AWAITING_SIMULATION" | "AWAITING_DEPENDENCY" | "AWAITING_GOVERNANCE" | "OPERATOR_DEFERRED";

export type DecisionDashboardFailure =
  | "ACTIVE_DECISIONS_MISSING"
  | "BLOCKED_DECISIONS_HIDDEN"
  | "ESCALATION_STATUS_INACCURATE"
  | "DEFERRED_DECISIONS_UNTRACKED"
  | "OPERATOR_QUEUE_INCOMPLETE"
  | "DASHBOARD_STATE_MISMATCH"
  | "LIFECYCLE_TRANSITION_INVALID"
  | "GOVERNANCE_RESTRICTIONS_OMITTED"
  | "REPLAY_STATUS_INCONSISTENT"
  | "CERTIFICATION_STATUS_ABSENT"
  | "CROSS_TENANT_INFORMATION_VISIBLE"
  | "INTEGRITY_HASH_MISMATCH"
  | "DASHBOARD_REPLAY_RECONSTRUCTION_FAILED"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type DecisionStateRecord = Readonly<{
  state_record_id: string;
  orchestration_id: string;
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  lifecycle_state: DecisionDashboardLifecycleState;
  orchestration_stage: DecisionOrchestrationStage;
  dashboard_state: DecisionDashboardLifecycleState;
  priority: DecisionPriorityBand;
  risk_level: DecisionRiskLevel;
  confidence_score: number;
  governance_state: DecisionGovernanceState;
  constitutional_state: "COMPLIANT" | "VIOLATION" | "REVIEW_REQUIRED";
  authority_state: DecisionAuthorityState;
  escalation_state: DecisionEscalationState;
  deferred_state: DecisionDeferredState;
  replay_state: "READY" | "VALIDATED" | "DIVERGED" | "FAILED";
  certification_state: "PASS" | "CONDITIONAL_PASS" | "FAIL" | "PENDING";
  assigned_operator: string;
  blocker_reason: string | null;
  dependency_chain: readonly string[];
  unresolved_conflicts: readonly string[];
  recovery_recommendation: string | null;
  created_at: string;
  updated_at: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type ActiveDecisionDashboard = Readonly<{
  dashboard_id: string;
  records: readonly DecisionStateRecord[];
  filters: readonly string[];
  deterministic_sort: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type BlockedDecisionDashboard = Readonly<{
  dashboard_id: string;
  records: readonly DecisionStateRecord[];
  blocker_categories: readonly string[];
  pending_approval_count: number;
  pending_evidence_count: number;
  replay_ref: string;
  integrity_hash: string;
}>;

export type EscalationDashboard = Readonly<{
  dashboard_id: string;
  active_escalations: readonly DecisionStateRecord[];
  historical_escalations: readonly DecisionStateRecord[];
  escalation_types: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type DeferredDecisionDashboard = Readonly<{
  dashboard_id: string;
  records: readonly DecisionStateRecord[];
  deferred_categories: readonly DecisionDeferredState[];
  expected_review_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type OperatorQueueDashboard = Readonly<{
  dashboard_id: string;
  operator_id: string;
  assigned_decisions: readonly string[];
  pending_approvals: readonly string[];
  pending_overrides: readonly string[];
  pending_escalations: readonly string[];
  pending_reviews: readonly string[];
  simulation_requests: readonly string[];
  evidence_requests: readonly string[];
  governance_requests: readonly string[];
  queue_size: number;
  average_age_minutes: number;
  highest_priority: DecisionPriorityBand;
  overdue_items: number;
  completed_today: number;
  escalation_rate: number;
  replay_ref: string;
  integrity_hash: string;
}>;

export type DecisionDashboardMetrics = Readonly<{
  active_decisions: number;
  queued_decisions: number;
  blocked_decisions: number;
  completed_decisions: number;
  deferred_decisions: number;
  escalated_decisions: number;
  restricted_decisions: number;
  pending_approvals: number;
  governance_reviews: number;
  constitutional_violations: number;
  operator_workload: number;
  replay_readiness: number;
  replay_failures: number;
  replay_divergence: number;
  certification_completion: number;
  outstanding_validations: number;
  failed_checks: number;
  readiness_score: number;
  integrity_hash: string;
}>;

export type DecisionStateDashboardValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  active_decisions_visible: boolean;
  blocked_decisions_visible: boolean;
  escalations_accurate: boolean;
  deferred_decisions_tracked: boolean;
  operator_queue_complete: boolean;
  dashboard_state_synchronized: boolean;
  lifecycle_transitions_valid: boolean;
  governance_visible: boolean;
  replay_consistent: boolean;
  certification_visible: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  authorization_valid: boolean;
  advisory_only: boolean;
  failures: readonly DecisionDashboardFailure[];
  integrity_hash: string;
}>;

export type DecisionStateDashboardInput = Readonly<{
  observability_result?: DecisionObservabilityResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "MISSING_ACTIVE"
    | "HIDE_BLOCKED"
    | "BAD_ESCALATION"
    | "MISSING_DEFERRED"
    | "INCOMPLETE_OPERATOR_QUEUE"
    | "STATE_MISMATCH"
    | "BAD_LIFECYCLE"
    | "HIDE_GOVERNANCE"
    | "BAD_REPLAY"
    | "MISSING_CERTIFICATION"
    | "CROSS_TENANT"
    | "HASH_MISMATCH"
    | "REPLAY_RECONSTRUCTION_FAILURE"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type DecisionStateDashboardResult = Readonly<{
  dashboard_version: "decision-state-dashboard/v1";
  observability_result: DecisionObservabilityResult;
  registry: readonly DecisionStateRecord[];
  active_dashboard: ActiveDecisionDashboard;
  blocked_dashboard: BlockedDecisionDashboard;
  escalation_dashboard: EscalationDashboard;
  deferred_dashboard: DeferredDecisionDashboard;
  operator_queue_dashboard: OperatorQueueDashboard;
  metrics: DecisionDashboardMetrics;
  validation: DecisionStateDashboardValidation;
  deterministic: true;
  advisory_only: true;
  mutates_orchestration: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DecisionStateDashboardFoundation = Readonly<{
  dashboard_version: "decision-state-dashboard/v1";
  lifecycle_states: readonly DecisionDashboardLifecycleState[];
  orchestration_stages: readonly DecisionOrchestrationStage[];
  result: DecisionStateDashboardResult;
}>;
