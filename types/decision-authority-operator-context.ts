import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContext, DecisionContextDomain } from "@/types/decision-context-contract";
import type { MissionTenantContextPackage } from "@/types/decision-mission-tenant-context";

export type OperatorRole = "MISSION_OPERATOR" | "MISSION_OWNER" | "GOVERNANCE_OFFICER" | "CONSTITUTIONAL_REVIEWER" | "SECURITY_AUTHORITY" | "RISK_AUTHORITY";
export type OperatorStatus = "ACTIVE" | "SUSPENDED" | "UNAUTHENTICATED" | "REVOKED";
export type AuthorityLevel = "ADVISORY" | "OPERATOR_APPROVAL" | "GOVERNANCE_APPROVAL" | "CONSTITUTIONAL_APPROVAL";
export type DelegationStatus = "NONE" | "VALID" | "INVALID" | "EXPIRED" | "EXCEEDS_AUTHORITY";
export type AdvisoryOnlyStatus = "ENFORCED" | "VIOLATED";

export type AuthorityOperatorResolutionState =
  | "PENDING"
  | "OPERATOR_IDENTITY_RESOLVED"
  | "AUTHENTICATION_VALIDATED"
  | "AUTHORITY_RESOLVED"
  | "DELEGATION_RESOLVED"
  | "APPROVALS_RESOLVED"
  | "ESCALATION_RESOLVED"
  | "GOVERNANCE_AUTHORITY_VALIDATED"
  | "CONSTITUTION_VALIDATED"
  | "ADVISORY_VALIDATED"
  | "AUTHORITY_VALIDATED"
  | "CACHE_RECORDED"
  | "PASSED"
  | "FAILED_OPERATOR"
  | "FAILED_AUTHORITY"
  | "FAILED_DELEGATION"
  | "FAILED_ESCALATION"
  | "FAILED_GOVERNANCE"
  | "FAILED_CONSTITUTION"
  | "FAILED_ADVISORY"
  | "FAILED_ISOLATION"
  | "FAILED_INTEGRITY";

export type AuthorityOperatorFailureReason =
  | "OPERATOR_NOT_FOUND"
  | "OPERATOR_NOT_AUTHENTICATED"
  | "OPERATOR_TENANT_MISMATCH"
  | "AUTHORITY_NOT_FOUND"
  | "AUTHORITY_SCOPE_INVALID"
  | "APPROVAL_AUTHORITY_INSUFFICIENT"
  | "DELEGATION_INVALID"
  | "DELEGATION_EXCEEDS_AUTHORITY"
  | "NESTED_DELEGATION_PROHIBITED"
  | "ESCALATION_REQUIRED_UNRESOLVED"
  | "REQUIRED_APPROVALS_INCOMPLETE"
  | "GOVERNANCE_APPROVAL_UNAVAILABLE"
  | "CONSTITUTIONAL_VALIDATION_UNAVAILABLE"
  | "ADVISORY_ONLY_VIOLATION"
  | "AUTHORITY_ESCALATION_ATTEMPT"
  | "SELF_DELEGATION_ATTEMPT"
  | "CROSS_TENANT_AUTHORITY"
  | "INTEGRITY_VERIFICATION_FAILED";

export type AuthorityExplainability = Readonly<{
  authority_source: string;
  source_record: string;
  approval_reasoning: string;
  delegation_chain: readonly string[];
  escalation_reasoning: string;
  governance_influence: readonly string[];
  constitutional_influence: readonly string[];
  validation_results: readonly string[];
  replay_reference: string;
  supporting_evidence: readonly string[];
  integrity_hash: string;
}>;

export type OperatorContext = Readonly<{
  operator_id: string;
  operator_name: string;
  operator_role: OperatorRole;
  operator_permissions: readonly string[];
  operator_certifications: readonly string[];
  operator_tenant: string;
  operator_status: OperatorStatus;
  authority_level: AuthorityLevel;
  delegation_status: DelegationStatus;
  integrity_hash: string;
}>;

export type ApprovalAuthority = Readonly<{
  approval_level: AuthorityLevel;
  approval_scope: readonly string[];
  maximum_authority: AuthorityLevel;
  decision_class_permissions: readonly string[];
  governance_restrictions: readonly string[];
  constitutional_restrictions: readonly string[];
  sufficient: boolean;
  integrity_hash: string;
}>;

export type DelegationAuthority = Readonly<{
  delegating_authority?: string;
  delegated_operator?: string;
  delegation_scope: readonly string[];
  delegation_duration: string;
  delegation_validity: DelegationStatus;
  delegation_lineage: readonly string[];
  integrity_hash: string;
}>;

export type EscalationAuthority = Readonly<{
  escalation_required: boolean;
  escalation_level?: AuthorityLevel;
  escalation_target?: string;
  escalation_triggers: readonly string[];
  required_escalation_approvals: readonly string[];
  escalation_governance: readonly string[];
  escalation_priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  integrity_hash: string;
}>;

export type RequiredApproval = Readonly<{
  approval_id: string;
  approval_role: OperatorRole;
  approval_required: boolean;
  approval_status: "PENDING" | "SATISFIED" | "NOT_REQUIRED";
  approval_order: number;
  integrity_hash: string;
}>;

export type AuthorityContext = Readonly<{
  authority_context_id: string;
  decision_candidate_id: string;
  operator_identity: OperatorContext;
  approval_authority: ApprovalAuthority;
  delegation_authority: DelegationAuthority;
  escalation_authority: EscalationAuthority;
  required_approvals: readonly RequiredApproval[];
  advisory_only_status: AdvisoryOnlyStatus;
  authority_scope: readonly string[];
  authority_constraints: readonly string[];
  authority_lineage: readonly string[];
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  validation_state: AuthorityOperatorResolutionState;
  explainability: AuthorityExplainability;
  integrity_hash: string;
}>;

export type AuthorityContextCache = Readonly<{
  cache_id: string;
  decision_candidate_id: string;
  authority_context: AuthorityContext;
  authority_version: "authority-context/v1";
  integrity_hash: string;
  timestamp: string;
}>;

export type AuthorityOperatorContextRequest = Readonly<{
  resolution_id: string;
  candidate: DecisionCandidate;
  base_context?: DecisionContext;
  mission_tenant_package?: MissionTenantContextPackage;
  operator_id: string;
  requested_authority_level: AuthorityLevel;
  delegated_by?: string;
  escalation_reason?: string;
  resolver_version: "authority-operator-context-resolver/v1";
}>;

export type AuthorityOperatorValidationResult = Readonly<{
  validation_status: "PASS" | "FAIL";
  validation_state: AuthorityOperatorResolutionState;
  failure_reason?: AuthorityOperatorFailureReason;
  failure_reasons: readonly AuthorityOperatorFailureReason[];
  checks: Readonly<{
    operator_exists: boolean;
    operator_authenticated: boolean;
    tenant_membership_verified: boolean;
    authority_exists: boolean;
    authority_scope_valid: boolean;
    approval_authority_sufficient: boolean;
    delegation_valid: boolean;
    escalation_authority_valid: boolean;
    required_approvals_complete: boolean;
    governance_approval_satisfied: boolean;
    constitutional_authority_satisfied: boolean;
    advisory_only_enforced: boolean;
    tenant_isolated: boolean;
    integrity_verified: boolean;
  }>;
}>;

export type AuthorityOperatorContextPackage = Readonly<{
  resolution_id: string;
  candidate_id: string;
  authority_context: AuthorityContext;
  operator_context: OperatorContext;
  operator_domain: DecisionContextDomain;
  cache_entry: AuthorityContextCache;
  validation: AuthorityOperatorValidationResult;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type AuthorityOperatorReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  resolution_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: AuthorityOperatorResolutionState;
  failures: readonly AuthorityOperatorFailureReason[];
  integrity_hash: string;
}>;

export type AuthorityOperatorObservability = Readonly<{
  resolution_attempts: number;
  successful_resolutions: number;
  failed_resolutions: number;
  operator_failures: number;
  authority_failures: number;
  delegation_failures: number;
  escalation_failures: number;
  governance_failures: number;
  constitutional_failures: number;
  advisory_failures: number;
  isolation_failures: number;
  replay_success_rate: number;
}>;
