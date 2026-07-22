import type { ConstitutionalDecisionValidationResult } from "@/types/constitutional-decision-validator";
import type { GovernanceDecisionRecord } from "@/types/governance-decision-filter-contract";
import type { GovernancePolicyValidationResult } from "@/types/governance-policy-validation-engine";

export type AuthorityType =
  | "Operator Authority"
  | "Governance Authority"
  | "Certification Authority"
  | "Mission Authority"
  | "Delegated Authority"
  | "Emergency Governance Authority"
  | "Observation Authority"
  | "Recommendation Authority"
  | "Simulation Authority"
  | "Recovery Authority";

export type AuthorityOutcome = "AUTHORIZED" | "OPERATOR_REQUIRED" | "GOVERNANCE_REQUIRED" | "CERTIFICATION_REQUIRED" | "UNAUTHORIZED";
export type AuthorityScope = "ADVISORY" | "MISSION" | "GOVERNANCE" | "CERTIFICATION" | "OPERATOR" | "SIMULATION" | "RECOVERY";
export type DelegationLevel = "NONE" | "LIMITED" | "BOUNDED" | "EMERGENCY";

export type AuthorityAssignment = Readonly<{
  authority_assignment_id: string;
  authority_type: AuthorityType;
  authority_scope: AuthorityScope;
  authority_holder: string;
  tenant_id: string;
  mission_id: string;
  delegation_source: string;
  delegation_level: DelegationLevel;
  delegated_by: string;
  approval_requirements: readonly string[];
  certification_requirements: readonly string[];
  escalation_requirements: readonly string[];
  effective_date: string;
  expiration_date?: string;
  revoked: boolean;
  replay_ref: string;
  integrity_hash: string;
}>;

export type ApprovalChainEntry = Readonly<{
  approval_id: string;
  approval_type: "operator" | "governance" | "certification" | "mission" | "delegated";
  approver_ref: string;
  source_authority_ref: string;
  approval_order: number;
  approved: boolean;
  replay_ref: string;
  integrity_hash: string;
}>;

export type AuthorityEvaluation = Readonly<{
  evaluation_id: string;
  authority_assignment_id: string;
  authority_result: "VALID" | "CONDITIONAL" | "REJECTED";
  scope_valid: boolean;
  mission_valid: boolean;
  tenant_valid: boolean;
  active: boolean;
  delegation_valid: boolean;
  approvals_complete: boolean;
  escalation_required: boolean;
  rationale: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type AuthorityEvidenceReport = Readonly<{
  report_id: string;
  governance_decision_id: string;
  authority_assignments: readonly string[];
  authority_results: readonly string[];
  mission_authority: "VALID" | "REJECTED";
  delegation_results: readonly string[];
  approval_chain: readonly string[];
  escalation_results: readonly string[];
  authority_outcome: AuthorityOutcome;
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type AuthorityDecisionLedgerRecord = Readonly<{
  ledger_id: string;
  governance_decision_id: string;
  authority_assignment_ids: readonly string[];
  approval_results: readonly string[];
  delegation_results: readonly string[];
  escalation_results: readonly string[];
  authority_outcome: AuthorityOutcome;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  created_at: string;
  integrity_hash: string;
}>;

export type AuthorityApprovalFailureReason =
  | "GOVERNANCE_CONTRACT_INVALID"
  | "GOVERNANCE_POLICY_INVALID"
  | "CONSTITUTIONAL_AUTHORITY_INVALID"
  | "MISSING_AUTHORITY_ASSIGNMENTS"
  | "INVALID_AUTHORITY_SCOPE"
  | "EXPIRED_AUTHORITY"
  | "REVOKED_AUTHORITY"
  | "MISSING_APPROVALS"
  | "INVALID_DELEGATION"
  | "CIRCULAR_APPROVAL_CHAIN"
  | "UNRESOLVED_AUTHORITY_REFERENCE"
  | "DUPLICATE_AUTHORITY_IDENTIFIER"
  | "AUTHORITY_INTEGRITY_MISMATCH"
  | "AUTHORITY_ESCALATION_REQUIRED"
  | "UNAUTHORIZED_PRIVILEGE_ESCALATION"
  | "ADVISORY_ONLY_VIOLATION"
  | "REPLAY_DIVERGENCE"
  | "UNAUTHORIZED_AUTHORITY_RESOLVER_ACCESS"
  | "AUTHORITY_LEDGER_FAILED";

export type AuthorityApprovalValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly AuthorityApprovalFailureReason[];
  checks: Readonly<{
    contract_valid: boolean;
    constitutional_authority_valid: boolean;
    authority_present: boolean;
    scope_valid: boolean;
    authority_active: boolean;
    delegation_valid: boolean;
    approvals_complete: boolean;
    escalation_resolved: boolean;
    replay_valid: boolean;
    advisory_only: boolean;
  }>;
}>;

export type AuthorityApprovalResolverInput = Readonly<{
  governance_decision?: GovernanceDecisionRecord;
  governance_policy_result?: GovernancePolicyValidationResult;
  constitutional_result?: ConstitutionalDecisionValidationResult;
  authority_assignments?: readonly AuthorityAssignment[];
  approval_chain?: readonly ApprovalChainEntry[];
  required_authority_types?: readonly AuthorityType[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type AuthorityApprovalResolverResult = Readonly<{
  authority_resolution_status: "PASS" | "FAIL";
  fail_closed: boolean;
  governance_decision: GovernanceDecisionRecord;
  governance_policy_result?: GovernancePolicyValidationResult;
  constitutional_result?: ConstitutionalDecisionValidationResult;
  authority_assignments: readonly AuthorityAssignment[];
  approval_chain: readonly ApprovalChainEntry[];
  evaluations: readonly AuthorityEvaluation[];
  evidence_report: AuthorityEvidenceReport;
  ledger_records: readonly AuthorityDecisionLedgerRecord[];
  validation: AuthorityApprovalValidation;
  replay_hash: string;
  failures: readonly AuthorityApprovalFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type AuthorityApprovalResolverReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  governance_decision_id: string;
  authority_assignment_refs: readonly string[];
  approval_refs: readonly string[];
  evidence_report_ref: string;
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly AuthorityApprovalFailureReason[];
  integrity_hash: string;
}>;

export type AuthorityApprovalResolverObservability = Readonly<{
  authority_validation_events: number;
  approval_resolution_events: number;
  delegation_validation_events: number;
  escalation_events: number;
  approval_chain_events: number;
  authority_outcome_events: number;
  replay_verification_events: number;
  ledger_append_events: number;
}>;

export type AuthorityApprovalResolverFoundation = Readonly<{
  resolver_version: "authority-approval-requirement-resolver/v1";
  authority_types: readonly AuthorityType[];
  authority_outcomes: readonly AuthorityOutcome[];
  authority_scopes: readonly AuthorityScope[];
  delegation_levels: readonly DelegationLevel[];
  result: AuthorityApprovalResolverResult;
  replay: AuthorityApprovalResolverReplay;
  observability: AuthorityApprovalResolverObservability;
}>;
