import type { PriorityRiskDashboardResult } from "@/types/decision-priority-risk-dashboard";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type GovernanceVisibilityState = "NOT_EVALUATED" | "UNDER_REVIEW" | "COMPLIANT" | "CONDITIONALLY_COMPLIANT" | "NON_COMPLIANT" | "ESCALATED" | "RESOLVED";
export type ConstitutionalVisibilityState = "FULLY_COMPLIANT" | "CONDITIONAL_REVIEW" | "OPERATOR_APPROVAL_REQUIRED" | "GOVERNANCE_APPROVAL_REQUIRED" | "CONSTITUTIONAL_VIOLATION" | "REJECTED";
export type AuthorityVisibilityLevel = "INFORMATIONAL" | "OPERATOR" | "MISSION_LEAD" | "GOVERNANCE_BOARD" | "CONSTITUTIONAL_AUTHORITY" | "EXECUTIVE_AUTHORITY";
export type ApprovalWorkflowStage = "APPROVAL_REQUESTED" | "AUTHORITY_VERIFIED" | "GOVERNANCE_REVIEW" | "OPERATOR_REVIEW" | "DECISION" | "APPROVED" | "REJECTED" | "ARCHIVED";
export type RestrictionType = "GOVERNANCE" | "CONSTITUTIONAL" | "AUTHORITY" | "OPERATOR" | "CERTIFICATION" | "REPLAY" | "EVIDENCE" | "DEPENDENCY";
export type RestrictionState = "ACTIVE" | "PENDING_REVIEW" | "ESCALATED" | "RESOLVED";
export type RestrictionSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type GovernanceAuthorityVisibilityFailure =
  | "GOVERNANCE_STATUS_HIDDEN"
  | "CONSTITUTIONAL_VIOLATIONS_OMITTED"
  | "AUTHORITY_ASSIGNMENTS_INACCURATE"
  | "APPROVAL_WORKFLOWS_INCOMPLETE"
  | "OPERATIONAL_RESTRICTIONS_HIDDEN"
  | "GOVERNANCE_LINEAGE_INCONSISTENT"
  | "REPLAY_REFERENCES_MISSING"
  | "CERTIFICATION_DEPENDENCIES_ABSENT"
  | "DASHBOARD_RENDERING_NONDETERMINISTIC"
  | "CROSS_TENANT_GOVERNANCE_VISIBLE"
  | "INTEGRITY_HASH_MISMATCH"
  | "GOVERNANCE_REPLAY_RECONSTRUCTION_FAILED"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type GovernanceDashboard = Readonly<{
  governance_dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  governance_state: GovernanceVisibilityState;
  policy_results: readonly string[];
  compliance_summary: Readonly<{ compliance_score: number; non_compliant_decisions: number; restricted_decisions: number }>;
  governance_reviews: readonly string[];
  escalation_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConstitutionalDashboard = Readonly<{
  constitutional_dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  constitutional_state: ConstitutionalVisibilityState;
  constitutional_rules: readonly string[];
  violation_refs: readonly string[];
  operator_requirements: readonly string[];
  governance_requirements: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type AuthorityDashboard = Readonly<{
  authority_dashboard_id: string;
  tenant_id: string;
  mission_id: string;
  authority_level: AuthorityVisibilityLevel;
  assigned_authority: readonly string[];
  delegation_chain: readonly string[];
  approval_requirements: readonly string[];
  authority_conflicts: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ApprovalWorkflow = Readonly<{
  workflow_id: string;
  tenant_id: string;
  mission_id: string;
  approval_stage: ApprovalWorkflowStage;
  approval_chain: readonly string[];
  pending_approvals: readonly string[];
  completed_approvals: readonly string[];
  rejected_approvals: readonly string[];
  delegated_approvals: readonly string[];
  expired_approvals: readonly string[];
  escalation_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RestrictionView = Readonly<{
  restriction_view_id: string;
  tenant_id: string;
  mission_id: string;
  restriction_type: RestrictionType;
  restriction_state: RestrictionState;
  severity: RestrictionSeverity;
  policy_refs: readonly string[];
  decision_refs: readonly string[];
  resolution_requirements: readonly string[];
  escalation_path: readonly string[];
  approval_requirements: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceVisibilityLedgerEntry = Readonly<{
  governance_ledger_id: string;
  tenant_id: string;
  mission_id: string;
  event_type:
    | "GOVERNANCE_REVIEW_INITIATED"
    | "GOVERNANCE_REVIEW_COMPLETED"
    | "CONSTITUTIONAL_VALIDATION"
    | "AUTHORITY_VERIFIED"
    | "AUTHORITY_REJECTED"
    | "APPROVAL_REQUESTED"
    | "APPROVAL_COMPLETED"
    | "RESTRICTION_APPLIED"
    | "RESTRICTION_REMOVED"
    | "GOVERNANCE_ESCALATION"
    | "CONSTITUTIONAL_ESCALATION"
    | "REPLAY_VALIDATION"
    | "CERTIFICATION_VALIDATION";
  governance_state: GovernanceVisibilityState;
  constitutional_state: ConstitutionalVisibilityState;
  authority_state: AuthorityVisibilityLevel;
  approval_state: ApprovalWorkflowStage;
  restriction_state: RestrictionState;
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type GovernanceStatusRecord = Readonly<{
  governance_status_id: string;
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  governance_state: GovernanceVisibilityState;
  constitutional_state: ConstitutionalVisibilityState;
  authority_state: AuthorityVisibilityLevel;
  approval_state: ApprovalWorkflowStage;
  restriction_state: RestrictionState;
  policy_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceVisibilityRecord = Readonly<{
  visibility_id: string;
  tenant_id: string;
  mission_id: string;
  governance_dashboard_ref: string;
  constitutional_dashboard_ref: string;
  authority_dashboard_ref: string;
  approval_workflow_ref: string;
  restriction_view_refs: readonly string[];
  governance_ledger_refs: readonly string[];
  status_record_refs: readonly string[];
  replay_ref: string;
  certification_ref: string;
  integrity_hash: string;
}>;

export type GovernanceAuthorityVisibilityValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  governance_status_visible: boolean;
  constitutional_violations_visible: boolean;
  authority_assignments_accurate: boolean;
  approval_workflows_complete: boolean;
  operational_restrictions_visible: boolean;
  governance_lineage_consistent: boolean;
  replay_refs_present: boolean;
  certification_dependencies_present: boolean;
  deterministic_rendering: boolean;
  tenant_isolated: boolean;
  authorization_valid: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  failures: readonly GovernanceAuthorityVisibilityFailure[];
  integrity_hash: string;
}>;

export type GovernanceAuthorityVisibilityInput = Readonly<{
  priority_dashboard?: PriorityRiskDashboardResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "HIDE_GOVERNANCE_STATUS"
    | "OMIT_CONSTITUTIONAL_VIOLATIONS"
    | "BAD_AUTHORITY_ASSIGNMENTS"
    | "INCOMPLETE_APPROVAL_WORKFLOW"
    | "HIDE_RESTRICTIONS"
    | "BAD_GOVERNANCE_LINEAGE"
    | "MISSING_REPLAY_REFS"
    | "MISSING_CERTIFICATION_DEPENDENCIES"
    | "NONDETERMINISTIC_RENDERING"
    | "CROSS_TENANT"
    | "HASH_MISMATCH"
    | "REPLAY_RECONSTRUCTION_FAILURE"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type GovernanceAuthorityVisibilityResult = Readonly<{
  visibility_version: "decision-governance-authority-visibility/v1";
  priority_dashboard: PriorityRiskDashboardResult;
  governance_dashboard: GovernanceDashboard;
  constitutional_dashboard: ConstitutionalDashboard;
  authority_dashboard: AuthorityDashboard;
  approval_workflow: ApprovalWorkflow;
  restriction_views: readonly RestrictionView[];
  governance_ledger: readonly GovernanceVisibilityLedgerEntry[];
  status_records: readonly GovernanceStatusRecord[];
  visibility_record: GovernanceVisibilityRecord;
  validation: GovernanceAuthorityVisibilityValidation;
  deterministic: true;
  advisory_only: true;
  mutates_governance_or_authority: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceAuthorityVisibilityFoundation = Readonly<{
  visibility_version: "decision-governance-authority-visibility/v1";
  governance_states: readonly GovernanceVisibilityState[];
  constitutional_states: readonly ConstitutionalVisibilityState[];
  authority_levels: readonly AuthorityVisibilityLevel[];
  approval_stages: readonly ApprovalWorkflowStage[];
  restriction_types: readonly RestrictionType[];
  result: GovernanceAuthorityVisibilityResult;
}>;
