import type { AdaptiveReplayTraceabilityResult } from "@/types/adaptive-replay-traceability-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type OperatorApprovalLevel = "LEVEL_1_OPERATIONAL" | "LEVEL_2_MISSION" | "LEVEL_3_GOVERNANCE" | "LEVEL_4_EXECUTIVE";
export type OperatorApprovalStatus = "PENDING_ASSIGNMENT" | "ASSIGNED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED" | "ESCALATED" | "DEFERRED" | "SUPERSEDED";
export type OperatorApprovalDecisionType = "APPROVE" | "REJECT" | "REQUEST_REVISION" | "ESCALATE" | "DEFER";
export type OperatorApprovalValidationState = "PASS" | "FAIL";

export type OperatorApprovalCheck =
  | "ADVISORY_ONLY"
  | "GOVERNANCE_DEPENDENCY"
  | "APPROVAL_POLICY"
  | "OPERATOR_AUTHORITY"
  | "SEPARATION_OF_DUTIES"
  | "WORKFLOW_STATE"
  | "REPLAY_DEPENDENCY"
  | "AUDIT_TRAIL"
  | "CERTIFICATION_DEPENDENCY"
  | "TENANT_ISOLATION"
  | "INTEGRITY"
  | "LEDGER_IMMUTABILITY";

export type OperatorApprovalFailure =
  | "GOVERNANCE_VALIDATION_INCOMPLETE"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "AUTHORITY_VALIDATION_FAILED"
  | "REPLAY_VALIDATION_INCOMPLETE"
  | "APPROVAL_IDENTIFIER_MISSING"
  | "APPROVAL_POLICY_VIOLATED"
  | "APPROVAL_REQUIREMENT_MISSING"
  | "APPROVAL_LEVEL_INVALID"
  | "OPERATOR_NOT_AUTHORIZED"
  | "OPERATOR_IMPERSONATION"
  | "SEPARATION_OF_DUTIES_VIOLATED"
  | "TENANT_SCOPE_MISMATCH"
  | "AUTHORITY_SCOPE_EXCEEDED"
  | "WORKFLOW_BYPASS"
  | "AUTOMATIC_ADOPTION_ATTEMPTED"
  | "SELF_APPROVAL_ATTEMPTED"
  | "GOVERNANCE_BYPASS"
  | "REPLAY_REFERENCES_MISSING"
  | "AUDIT_REFERENCES_MISSING"
  | "CERTIFICATION_REFERENCES_MISSING"
  | "APPROVAL_REPLAY_OMITTED"
  | "AUDIT_TRAIL_DELETION"
  | "CERTIFICATION_BYPASS"
  | "HIDDEN_APPROVAL"
  | "INTEGRITY_HASH_MISMATCH"
  | "FAIL_OPEN_APPROVAL_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type OperatorApprovalContract = Readonly<{
  contract_id: string;
  proposal_id: string;
  adaptation_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  approval_required: boolean;
  required_approval_level: OperatorApprovalLevel;
  authorized_approvers: readonly string[];
  governance_dependency: string;
  replay_requirement: string;
  certification_dependency: string;
  audit_requirement: string;
  immutable_after_review_entry: boolean;
  advisory_only_until_approved: boolean;
  created_at: string;
  integrity_hash: string;
}>;

export type OperatorApprovalPolicy = Readonly<{
  policy_id: string;
  approval_required: boolean;
  required_approval_level: OperatorApprovalLevel;
  governance_dependencies: readonly string[];
  certification_dependencies: readonly string[];
  escalation_required: boolean;
  separation_of_duties_required: boolean;
  eligible_operator_roles: readonly VisibilityRole[];
  policy_source_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperatorAuthorityValidation = Readonly<{
  validation_id: string;
  operator_id: string;
  operator_role: VisibilityRole;
  tenant_membership_verified: boolean;
  mission_authorization_verified: boolean;
  governance_permissions_verified: boolean;
  certification_eligibility_verified: boolean;
  operator_identity_verified: boolean;
  operator_authorized: boolean;
  separation_of_duties_verified: boolean;
  integrity_hash: string;
}>;

export type OperatorApprovalWorkflow = Readonly<{
  workflow_id: string;
  approval_id: string;
  states: readonly OperatorApprovalStatus[];
  current_status: OperatorApprovalStatus;
  transition_history: readonly string[];
  governance_completed_before_review: boolean;
  deterministic_transitions: boolean;
  bypass_detected: boolean;
  integrity_hash: string;
}>;

export type OperatorApprovalRecord = Readonly<{
  approval_id: string;
  proposal_id: string;
  adaptation_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  approval_level: OperatorApprovalLevel;
  assigned_operator: string;
  operator_role: VisibilityRole;
  approval_status: OperatorApprovalStatus;
  approval_reason: string;
  governance_dependency: string;
  replay_reference: string;
  audit_reference: string;
  certification_reference: string;
  approval_timestamp: string;
  integrity_hash: string;
}>;

export type OperatorApprovalDecision = Readonly<{
  decision_id: string;
  approval_id: string;
  proposal_id: string;
  assigned_operator: string;
  operator_role: VisibilityRole;
  decision_type: OperatorApprovalDecisionType;
  decision_rationale: string;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  audit_refs: readonly string[];
  certification_refs: readonly string[];
  deterministic_replay_verified: boolean;
  decision_outcome: OperatorApprovalValidationState;
  integrity_hash: string;
}>;

export type OperatorApprovalReplay = Readonly<{
  replay_id: string;
  approval_id: string;
  proposal_id: string;
  assigned_operator: string;
  operator_role: VisibilityRole;
  decision_type: OperatorApprovalDecisionType;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  audit_refs: readonly string[];
  certification_refs: readonly string[];
  identical_workflow: boolean;
  identical_decision: boolean;
  identical_integrity_hashes: boolean;
  replay_result: OperatorApprovalValidationState;
  integrity_hash: string;
}>;

export type OperatorApprovalLedgerRecord = Readonly<{
  record_id: string;
  approval_id: string;
  proposal_id: string;
  adaptation_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  approval_level: OperatorApprovalLevel;
  operator_id: string;
  approval_decision: OperatorApprovalDecisionType;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  audit_refs: readonly string[];
  certification_refs: readonly string[];
  integrity_hash: string;
  timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
}>;

export type OperatorApprovalDashboard = Readonly<{
  dashboard_id: string;
  pending_approvals: number;
  assigned_reviewers: readonly string[];
  approval_statuses: readonly OperatorApprovalStatus[];
  rejection_reasons: readonly string[];
  revision_requests: readonly string[];
  governance_dependencies: readonly string[];
  replay_verification: OperatorApprovalValidationState;
  audit_history_refs: readonly string[];
  approval_metrics: Readonly<{
    total_approvals: number;
    unauthorized_approvals: number;
    automatic_adoptions: number;
    governance_bypasses: number;
    separation_of_duties_violations: number;
  }>;
  bottlenecks: readonly string[];
  integrity_hash: string;
}>;

export type OperatorApprovalCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OperatorApprovalCheck[];
  human_approval_required: boolean;
  advisory_only_enforced: boolean;
  governance_completed_first: boolean;
  operator_authority_verified: boolean;
  separation_of_duties_verified: boolean;
  replay_verified: boolean;
  audit_complete: boolean;
  certification_bound: boolean;
  tenant_isolation_preserved: boolean;
  ledger_immutable: boolean;
  integrity_verified: boolean;
  failure_analysis: readonly OperatorApprovalFailure[];
  certification_decision: OperatorApprovalValidationState;
  integrity_hash: string;
}>;

export type OperatorApprovalValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  governance_complete: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  replay_valid: boolean;
  approval_identifier_present: boolean;
  approval_policy_valid: boolean;
  approval_required: boolean;
  approval_level_valid: boolean;
  operator_authorized: boolean;
  separation_of_duties_verified: boolean;
  tenant_isolated: boolean;
  authority_within_scope: boolean;
  workflow_enforced: boolean;
  advisory_only_until_approved: boolean;
  replay_references_present: boolean;
  audit_references_present: boolean;
  certification_references_present: boolean;
  ledger_immutable: boolean;
  integrity_verified: boolean;
  authorization_valid: boolean;
  execution_authority_absent: boolean;
  failures: readonly OperatorApprovalFailure[];
  integrity_hash: string;
}>;

export type OperatorApprovalFrameworkInput = Readonly<{
  replay_traceability?: AdaptiveReplayTraceabilityResult;
  role?: VisibilityRole;
  approval_level?: OperatorApprovalLevel;
  decision_type?: OperatorApprovalDecisionType;
  scenario?:
    | "BASELINE"
    | "GOVERNANCE_INCOMPLETE"
    | "CONSTITUTIONAL_FAILURE"
    | "AUTHORITY_INVALID"
    | "REPLAY_INCOMPLETE"
    | "MISSING_APPROVAL_ID"
    | "POLICY_VIOLATION"
    | "APPROVAL_NOT_REQUIRED"
    | "INVALID_APPROVAL_LEVEL"
    | "UNAUTHORIZED_OPERATOR"
    | "OPERATOR_IMPERSONATION"
    | "SEPARATION_OF_DUTIES"
    | "TENANT_MISMATCH"
    | "AUTHORITY_SCOPE_EXCEEDED"
    | "WORKFLOW_BYPASS"
    | "AUTOMATIC_ADOPTION"
    | "SELF_APPROVAL"
    | "GOVERNANCE_BYPASS"
    | "MISSING_REPLAY_REFS"
    | "MISSING_AUDIT_REFS"
    | "MISSING_CERTIFICATION_REFS"
    | "APPROVAL_REPLAY_OMITTED"
    | "AUDIT_DELETION"
    | "CERTIFICATION_BYPASS"
    | "HIDDEN_APPROVAL"
    | "HASH_MISMATCH"
    | "FAIL_OPEN"
    | "EXECUTION_AUTHORITY";
}>;

export type OperatorApprovalFrameworkResult = Readonly<{
  approval_framework_version: "operator-approval-framework/v1";
  replay_traceability: AdaptiveReplayTraceabilityResult;
  approval_contract: OperatorApprovalContract;
  approval_policy: OperatorApprovalPolicy;
  authority_validation: OperatorAuthorityValidation;
  approval_workflow: OperatorApprovalWorkflow;
  approval_record: OperatorApprovalRecord;
  approval_decision: OperatorApprovalDecision;
  approval_replay: OperatorApprovalReplay;
  approval_ledger: readonly OperatorApprovalLedgerRecord[];
  dashboard: OperatorApprovalDashboard;
  certification_report: OperatorApprovalCertificationReport;
  validation: OperatorApprovalValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  human_approval_required: true;
  recommendation_available_for_implementation: boolean;
  permits_automatic_adoption: false;
  permits_execution: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OperatorApprovalFrameworkFoundation = Readonly<{
  approval_framework_version: "operator-approval-framework/v1";
  checks: readonly OperatorApprovalCheck[];
  approval_levels: readonly OperatorApprovalLevel[];
  approval_statuses: readonly OperatorApprovalStatus[];
  decision_types: readonly OperatorApprovalDecisionType[];
  result: OperatorApprovalFrameworkResult;
}>;
