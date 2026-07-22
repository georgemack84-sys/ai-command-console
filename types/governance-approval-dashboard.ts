import type { AdaptiveDashboardResult, DashboardRole } from "@/types/adaptive-dashboard-foundation";

export type GovernanceApprovalDashboardStatus = "AUTHORITATIVE" | "REJECTED";
export type GovernanceApprovalValidationOutcome = "VALID" | "INVALID";
export type GovernanceReviewState = "NOT_STARTED" | "EVIDENCE_PENDING" | "READY_FOR_REVIEW" | "IN_REVIEW" | "ADDITIONAL_EVIDENCE_REQUIRED" | "CONDITIONALLY_APPROVED" | "APPROVED" | "REJECTED" | "BLOCKED" | "ESCALATION_REQUIRED" | "EXPIRED" | "REVOKED" | "SUPERSEDED";
export type ApprovalState = "NOT_REQUIRED" | "PENDING" | "IN_REVIEW" | "APPROVED" | "CONDITIONALLY_APPROVED" | "REJECTED" | "DEFERRED" | "ESCALATED" | "EXPIRED" | "REVOKED" | "SUPERSEDED" | "INVALID_AUTHORITY";
export type GovernanceOutcome = "NOT_ASSESSED" | "COMPLIANT" | "CONDITIONALLY_COMPLIANT" | "NONCOMPLIANT" | "REVIEW_REQUIRED" | "ADDITIONAL_EVIDENCE_REQUIRED" | "ESCALATION_REQUIRED" | "BLOCKED";
export type ConstitutionalOutcome = "NOT_ASSESSED" | "COMPLIANT" | "CONDITIONALLY_COMPLIANT" | "REVIEW_REQUIRED" | "CONFLICT_DETECTED" | "ESCALATION_REQUIRED" | "BLOCKED";
export type AuthorityOutcome = "VALID" | "CONDITIONALLY_VALID" | "REVIEW_REQUIRED" | "INSUFFICIENT_AUTHORITY" | "AUTHORITY_CONFLICT" | "UNAUTHORIZED_EXPANSION" | "EXPIRED_AUTHORITY" | "BLOCKED";
export type BlockerState = "OPEN" | "UNDER_REVIEW" | "REMEDIATION_REQUIRED" | "AWAITING_EVIDENCE" | "ESCALATED" | "RESOLVED" | "ACCEPTED_BY_AUTHORITY" | "SUPERSEDED" | "NON_WAIVABLE";
export type CertificationState = "UNASSESSED" | "EVIDENCE_PENDING" | "READY" | "IN_PROGRESS" | "PASS" | "CONDITIONAL_PASS" | "FAIL" | "EXPIRED" | "REVOKED" | "SUPERSEDED";
export type ReplayReadinessState = "READY" | "PARTIAL" | "MISSING_REFERENCES" | "VERSION_MISMATCH" | "DIVERGED" | "INTEGRITY_FAILURE" | "UNAVAILABLE" | "BLOCKED";
export type RollbackReadinessState = "NOT_ASSESSED" | "PLAN_REQUIRED" | "PLAN_AVAILABLE" | "VALIDATION_REQUIRED" | "SIMULATION_REQUIRED" | "SIMULATION_IN_PROGRESS" | "READY" | "CONDITIONALLY_READY" | "NOT_READY" | "FAILED" | "EXPIRED";
export type EscalationState = "NOT_REQUIRED" | "REQUIRED" | "INITIATED" | "ACKNOWLEDGED" | "UNDER_REVIEW" | "ADDITIONAL_EVIDENCE_REQUIRED" | "RESOLVED" | "REJECTED" | "RETURNED_FOR_REMEDIATION" | "EXPIRED";
export type NextPermittedAction = "SUBMIT_EVIDENCE" | "BEGIN_GOVERNANCE_REVIEW" | "BEGIN_CONSTITUTIONAL_REVIEW" | "VALIDATE_AUTHORITY" | "REQUEST_OPERATOR_REVIEW" | "RUN_ADDITIONAL_SIMULATION" | "REMEDIATE_BLOCKER" | "ESCALATE" | "SUBMIT_FOR_CERTIFICATION" | "PREPARE_ROLLBACK_PLAN" | "REJECT_PROPOSAL" | "DEFER_PROPOSAL" | "NO_ACTION_PERMITTED";
export type GovernanceAlertSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type GovernanceApprovalWidget = "Approval Queue" | "Governance Status" | "Constitutional Status" | "Escalation Timeline" | "Certification Queue" | "Rollback Readiness" | "Authority Boundary" | "Dependency Graph" | "Evidence Workspace" | "Decision History" | "Alert Center";

export type GovernanceApprovalDashboardScenario =
  | "BASELINE"
  | "FOUNDATION_UNAVAILABLE"
  | "PROPOSAL_HIDDEN"
  | "BLOCKER_HIDDEN"
  | "CONSTITUTIONAL_CONFLICT"
  | "INVALID_AUTHORITY"
  | "SILENCE_AS_APPROVAL"
  | "CONDITIONAL_APPROVAL_UNMET"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "MISSING_AUTHORITY"
  | "MISSING_OPERATOR_APPROVAL"
  | "MISSING_EVIDENCE"
  | "MISSING_CERTIFICATION"
  | "CONDITIONAL_CERTIFICATION"
  | "MISSING_REPLAY"
  | "MISSING_ROLLBACK"
  | "HIDDEN_APPROVAL_STATE"
  | "VERSION_MISMATCH"
  | "UNAUTHORIZED_ROLE"
  | "TENANT_LEAK"
  | "RESTRICTED_FIELD_LEAK"
  | "INTEGRITY_FAILURE"
  | "WRITE_AUTHORITY_EXPOSED";

export type GovernanceApprovalDashboardFailure =
  | "DASHBOARD_FOUNDATION_UNAVAILABLE"
  | "PROPOSAL_RECORD_HIDDEN"
  | "GOVERNANCE_BLOCKER_HIDDEN"
  | "CONSTITUTIONAL_CONFLICT_UNRESOLVED"
  | "INVALID_DECISION_AUTHORITY"
  | "SILENCE_TREATED_AS_APPROVAL"
  | "CONDITIONAL_APPROVAL_INCOMPLETE"
  | "GOVERNANCE_STATUS_UNAVAILABLE"
  | "CONSTITUTIONAL_STATUS_UNAVAILABLE"
  | "AUTHORITY_STATUS_UNAVAILABLE"
  | "OPERATOR_APPROVAL_MISSING"
  | "EVIDENCE_REFERENCE_BROKEN"
  | "CERTIFICATION_STATUS_UNAVAILABLE"
  | "CONDITIONAL_CERTIFICATION_MISREPRESENTED"
  | "REPLAY_READINESS_UNAVAILABLE"
  | "ROLLBACK_READINESS_UNAVAILABLE"
  | "HIDDEN_REVIEW_OR_APPROVAL_STATE"
  | "PROPOSAL_VERSION_INTEGRITY_FAILED"
  | "UNAUTHORIZED_DASHBOARD_ACCESS"
  | "TENANT_ISOLATION_VIOLATED"
  | "RESTRICTED_FIELD_EXPOSED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DASHBOARD_WRITE_AUTHORITY_EXPOSED";

export type GovernanceApprovalDashboardRecord = Readonly<{
  dashboard_record_id: string;
  tenant_id: string;
  mission_scope: string;
  proposal_id: string;
  proposal_version: string;
  proposal_type: string;
  proposal_status: string;
  proposal_summary: string;
  supporting_evidence_refs: readonly string[];
  applicable_policy_refs: readonly string[];
  governance_review_status: GovernanceReviewState;
  governance_decision_refs: readonly string[];
  governance_blockers: readonly string[];
  constitutional_review_status: ConstitutionalOutcome;
  constitutional_analysis_refs: readonly string[];
  authority_review_status: AuthorityOutcome;
  authority_boundary_refs: readonly string[];
  operator_approval_status: ApprovalState;
  operator_decision_refs: readonly string[];
  required_approvals: readonly string[];
  completed_approvals: readonly string[];
  unmet_conditions: readonly string[];
  simulation_status: string;
  simulation_refs: readonly string[];
  certification_requirements: readonly string[];
  certification_status: CertificationState;
  certification_refs: readonly string[];
  replay_readiness: ReplayReadinessState;
  replay_refs: readonly string[];
  rollback_readiness: RollbackReadinessState;
  rollback_plan_ref: string;
  escalation_status: EscalationState;
  escalation_refs: readonly string[];
  next_permitted_action: NextPermittedAction;
  next_action_rationale: string;
  visible_to_roles: readonly DashboardRole[];
  restricted_fields: readonly string[];
  alerts: readonly string[];
  created_at: string;
  updated_at: string;
  integrity_hash: string;
}>;

export type GovernanceBlocker = Readonly<{ blocker_id: string; proposal_id: string; tenant_id: string; blocker_category: string; severity: GovernanceAlertSeverity; description: string; source_ref: string; governing_policy_ref: string; detected_at: string; detected_by: string; remediation_requirement: string; responsible_authority: string; current_status: BlockerState; resolution_refs: readonly string[]; resolved_at: string | null; non_waivable: boolean; integrity_hash: string }>;
export type ApprovalQueueView = Readonly<{ queue_id: string; sorted_proposal_refs: readonly string[]; category_counts: readonly string[]; blocker_counts: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type ProposalGovernanceDetailView = Readonly<{ detail_id: string; proposal_ref: string; requested_change: string; affected_capabilities: readonly string[]; lineage_refs: readonly string[]; unresolved_blockers: readonly string[]; next_permitted_action: NextPermittedAction; integrity_hash: string }>;
export type GovernanceStatusView = Readonly<{ view_id: string; outcome: GovernanceOutcome; applicable_policy_refs: readonly string[]; fulfilled_controls: readonly string[]; missing_controls: readonly string[]; decision_conditions: readonly string[]; distinguishes_approval_from_certification: true; integrity_hash: string }>;
export type ConstitutionalReviewView = Readonly<{ view_id: string; outcome: ConstitutionalOutcome; protected_principles: readonly string[]; conflicts: readonly string[]; required_safeguards: readonly string[]; ordinary_operator_override_allowed: false; integrity_hash: string }>;
export type AuthorityBoundaryView = Readonly<{ view_id: string; outcome: AuthorityOutcome; reviewer_authority_valid: boolean; tenant_authority_valid: boolean; mission_authority_valid: boolean; implementation_authority_implied: false; certification_authority_implied: false; conflicts: readonly string[]; integrity_hash: string }>;
export type OperatorApprovalWorkspace = Readonly<{ workspace_id: string; decision_state: ApprovalState; silence_treated_as_approval: false; auto_selected_approval: false; version_current: boolean; authority_valid: boolean; required_acknowledgements: readonly string[]; preserved_decisions: readonly string[]; integrity_hash: string }>;
export type ApprovalDependencyGraph = Readonly<{ graph_id: string; dependencies: readonly string[]; dependency_states: readonly string[]; mandatory_dependencies_satisfied: boolean; explicit_rules_used: boolean; deterministic: boolean; integrity_hash: string }>;
export type EscalationTimeline = Readonly<{ timeline_id: string; events: readonly string[]; preserves_event_ordering: boolean; responsible_authorities: readonly string[]; replay_refs: readonly string[]; integrity_hash: string }>;
export type CertificationQueue = Readonly<{ queue_id: string; proposal_refs: readonly string[]; certification_state: CertificationState; completed_tests: readonly string[]; failed_tests: readonly string[]; unresolved_findings: readonly string[]; conditional_pass_distinguished: boolean; deterministic: boolean; integrity_hash: string }>;
export type ReplayReadinessView = Readonly<{ view_id: string; state: ReplayReadinessState; replay_refs: readonly string[]; canonical_event_ordering: boolean; versioned_policies: readonly string[]; verified_decision_lineage: boolean; integrity_hash: string }>;
export type RollbackReadinessView = Readonly<{ view_id: string; state: RollbackReadinessState; rollback_plan_ref: string; rollback_authority: string; unresolved_blockers: readonly string[]; implementation_eligible: boolean; integrity_hash: string }>;
export type ReviewEvidenceWorkspace = Readonly<{ workspace_id: string; evidence_refs: readonly string[]; evidence_state: "VERIFIED" | "RELIABLE" | "CONDITIONALLY_RELIABLE" | "INCOMPLETE" | "CONFLICTING" | "STALE" | "UNVERIFIED" | "REJECTED" | "SUSPECTED_TAMPERING"; decision_context_preserved: boolean; integrity_hash: string }>;
export type GovernanceDecisionHistory = Readonly<{ history_id: string; decisions: readonly string[]; append_only: boolean; retains_rejections_expirations_revocations: boolean; overwritten: false; replay_refs: readonly string[]; integrity_hash: string }>;
export type GovernanceAlertCenter = Readonly<{ alert_id: string; alerts: readonly string[]; highest_severity: GovernanceAlertSeverity; critical_alerts_visible: boolean; integrity_hash: string }>;
export type GovernanceApprovalPermission = Readonly<{ permission_id: string; role: DashboardRole; tenant_id: string; allowed: boolean; restricted_fields: readonly string[]; tenant_isolated: boolean; governance_authorized: boolean; constitutional_authorized: boolean; operator_review_authorized: boolean; certification_authorized: boolean; replay_authorized: boolean; integrity_hash: string }>;
export type GovernanceApprovalMetrics = Readonly<{ proposal_sync_latency_ms: number; approval_queue_freshness_ms: number; missing_governance_records: number; missing_constitutional_records: number; missing_authority_records: number; expired_approvals: number; stale_reviews: number; unresolved_conditions: number; escalation_deadline_failures: number; broken_evidence_references: number; replay_failures: number; rollback_state_inconsistencies: number; certification_state_inconsistencies: number; proposal_version_mismatches: number; unauthorized_access_attempts: number; cross_tenant_exposure: number; integrity_verification_failures: number; integrity_hash: string }>;
export type GovernanceApprovalValidationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: GovernanceApprovalDashboardFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type GovernanceApprovalDashboardApiSurface = Readonly<{
  api_id: string;
  retrieve_dashboard: "POST /governance-approval-dashboard/dashboard";
  retrieve_contract: "GET /governance-approval-dashboard/contract";
  retrieve_queue: "POST /governance-approval-dashboard/queue";
  retrieve_detail: "POST /governance-approval-dashboard/detail";
  retrieve_governance: "POST /governance-approval-dashboard/governance";
  retrieve_blockers: "POST /governance-approval-dashboard/blockers";
  retrieve_constitutional: "POST /governance-approval-dashboard/constitutional";
  retrieve_authority: "POST /governance-approval-dashboard/authority";
  retrieve_operator: "POST /governance-approval-dashboard/operator";
  retrieve_dependencies: "POST /governance-approval-dashboard/dependencies";
  retrieve_escalation: "POST /governance-approval-dashboard/escalation";
  retrieve_certification: "POST /governance-approval-dashboard/certification";
  retrieve_replay: "POST /governance-approval-dashboard/replay";
  retrieve_rollback: "POST /governance-approval-dashboard/rollback";
  retrieve_evidence: "POST /governance-approval-dashboard/evidence";
  retrieve_history: "POST /governance-approval-dashboard/history";
  retrieve_alerts: "POST /governance-approval-dashboard/alerts";
  validate_dashboard: "POST /governance-approval-dashboard/validate";
  inspect_dashboard: "POST /governance-approval-dashboard/inspect";
  creation_supported: false;
  mutation_supported: false;
  independent_approval_supported: false;
  authority_expansion_supported: false;
  governance_outcome_mutation_supported: false;
  constitutional_requirement_mutation_supported: false;
  adaptation_activation_supported: false;
  integrity_hash: string;
}>;

export type GovernanceApprovalDashboardInput = Readonly<{ scenario?: GovernanceApprovalDashboardScenario; role?: DashboardRole; tenant_id?: string }>;

export type GovernanceApprovalDashboardResult = Readonly<{
  governance_approval_dashboard_version: "governance-approval-dashboard/v10.14.7";
  dashboard_identifier: "GovernanceApprovalDashboard";
  status: GovernanceApprovalDashboardStatus;
  api_surface: GovernanceApprovalDashboardApiSurface;
  dashboard_foundation: AdaptiveDashboardResult;
  records: readonly GovernanceApprovalDashboardRecord[];
  approval_queue: ApprovalQueueView;
  detail_view: ProposalGovernanceDetailView;
  governance_status_view: GovernanceStatusView;
  blocker_registry: readonly GovernanceBlocker[];
  constitutional_view: ConstitutionalReviewView;
  authority_view: AuthorityBoundaryView;
  operator_workspace: OperatorApprovalWorkspace;
  dependency_graph: ApprovalDependencyGraph;
  escalation_timeline: EscalationTimeline;
  certification_queue: CertificationQueue;
  replay_view: ReplayReadinessView;
  rollback_view: RollbackReadinessView;
  evidence_workspace: ReviewEvidenceWorkspace;
  decision_history: GovernanceDecisionHistory;
  alert_center: GovernanceAlertCenter;
  permissions: readonly GovernanceApprovalPermission[];
  widgets: readonly GovernanceApprovalWidget[];
  metrics: GovernanceApprovalMetrics;
  validation_tests: readonly GovernanceApprovalValidationTest[];
  validation_outcome: GovernanceApprovalValidationOutcome;
  failures: readonly GovernanceApprovalDashboardFailure[];
  deterministic: boolean;
  replayable: boolean;
  tenant_isolated: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  constitutional_visible: boolean;
  authority_visible: boolean;
  operator_approval_visible: boolean;
  certification_visible: boolean;
  rollback_visible: boolean;
  read_only: true;
  advisory_only: true;
  write_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceApprovalDashboardValidationResult = Readonly<{ dashboard_id: string | null; valid: boolean; validation_outcome: GovernanceApprovalValidationOutcome; failures: readonly GovernanceApprovalDashboardFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; read_only: boolean; validation_hash: string }>;
export type GovernanceApprovalDashboardObservabilitySurface = Readonly<{ dashboard_id: string; status: GovernanceApprovalDashboardStatus; validation_outcome: GovernanceApprovalValidationOutcome; proposals: number; blockers: number; failed_tests: number; failures: readonly GovernanceApprovalDashboardFailure[]; replayable: boolean; tenant_isolated: boolean; read_only: boolean; integrity_hash: string }>;
export type GovernanceApprovalDashboardContract = Readonly<{ doctrine: Readonly<{ version: "governance-approval-dashboard/v10.14.7"; widgets: readonly GovernanceApprovalWidget[]; governance_states: readonly GovernanceReviewState[]; approval_states: readonly ApprovalState[]; navigation_dimensions: readonly string[]; required_data_sources: readonly string[]; read_only: true; advisory_only: true }>; result: GovernanceApprovalDashboardResult; validation: GovernanceApprovalDashboardValidationResult; observability: GovernanceApprovalDashboardObservabilitySurface }>;
