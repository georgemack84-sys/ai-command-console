import type { ConstitutionalAdaptationValidatorResult } from "@/types/constitutional-adaptation-validator";
import type { GovernanceAdaptationValidatorResult } from "@/types/governance-adaptation-validator";
import type { RiskAdaptationFoundationResult, RiskAdaptationScenario } from "@/types/risk-adaptation-engine-foundation";

export type AuthorityDomain =
  | "RECOMMENDATION_AUTHORITY"
  | "DECISION_AUTHORITY"
  | "APPROVAL_AUTHORITY"
  | "GOVERNANCE_AUTHORITY"
  | "CONSTITUTIONAL_AUTHORITY"
  | "OPERATOR_AUTHORITY"
  | "EXECUTIVE_AUTHORITY"
  | "EXECUTION_AUTHORITY"
  | "RUNTIME_AUTHORITY"
  | "DEPLOYMENT_AUTHORITY"
  | "SIMULATION_AUTHORITY"
  | "REVIEW_AUTHORITY"
  | "AUDIT_AUTHORITY"
  | "ADMINISTRATIVE_AUTHORITY"
  | "DELEGATED_AUTHORITY"
  | "TENANT_AUTHORITY"
  | "PLATFORM_AUTHORITY"
  | "MISSION_AUTHORITY"
  | "RECOVERY_AUTHORITY"
  | "EMERGENCY_AUTHORITY";

export type AuthorityClassification = "ASSIGNED" | "REQUESTED" | "EFFECTIVE" | "MAXIMUM" | "PROHIBITED";
export type AuthorityCheckStatus = "VALID" | "INVALID" | "MISSING" | "AMBIGUOUS";
export type AuthorityEscalationLevel = "NONE" | "OPERATOR_REVIEW" | "GOVERNANCE_REVIEW" | "CONSTITUTIONAL_REVIEW" | "EXECUTIVE_REVIEW" | "MULTI_STAGE_ESCALATION";

export type AuthorityBoundaryStatus =
  | "AUTHORIZED"
  | "AUTHORIZED_WITH_APPROVAL"
  | "REQUIRES_OPERATOR_REVIEW"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "REQUIRES_CONSTITUTIONAL_REVIEW"
  | "AUTHORITY_CONFLICT"
  | "RESTRICTED"
  | "REJECTED"
  | "FAIL_CLOSED";

export type AuthorityBoundaryFailure =
  | "AUTHORITY_SCOPE_UNDETERMINED"
  | "AUTHORITY_OWNERSHIP_AMBIGUOUS"
  | "APPROVAL_AUTHORITY_UNVERIFIED"
  | "EXECUTION_AUTHORITY_EXPANDED"
  | "AUTONOMOUS_EXECUTION_DETECTED"
  | "GOVERNANCE_AUTHORITY_WEAKENED"
  | "OPERATOR_SUPREMACY_REDUCED"
  | "UNAUTHORIZED_DELEGATION"
  | "PRIVILEGE_ESCALATION_DETECTED"
  | "HIDDEN_EXECUTION_DETECTED"
  | "AUTHORITY_LINEAGE_INCOMPLETE"
  | "CROSS_TENANT_AUTHORITY_LEAKAGE"
  | "AUTHORITY_EVIDENCE_MISSING"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "AUTHORITY_DECISION_RECORDING_FAILED"
  | "INVALID_APPROVAL_CHAIN"
  | "AUTHORITY_INHERITANCE_VIOLATION"
  | "RUNTIME_AUTHORITY_ACQUIRED"
  | "PRODUCTION_EXECUTION_AUTHORITY"
  | "SELF_GRANTED_PERMISSION"
  | "IMPLICIT_AUTHORITY_ELEVATION"
  | "UNDOCUMENTED_AUTHORITY_DEPENDENCY";

export type AuthorityBoundaryScenario =
  | RiskAdaptationScenario
  | "BASELINE"
  | "APPROVAL_REQUIRED"
  | "OPERATOR_REVIEW"
  | "GOVERNANCE_REVIEW"
  | "CONSTITUTIONAL_REVIEW"
  | "EXECUTIVE_REVIEW"
  | "AUTHORITY_CONFLICT"
  | "RESTRICTED_PROPOSAL"
  | "SCOPE_UNDETERMINED"
  | "OWNER_AMBIGUOUS"
  | "APPROVAL_UNVERIFIED"
  | "EXECUTION_EXPANSION"
  | "AUTONOMOUS_EXECUTION"
  | "GOVERNANCE_WEAKENING"
  | "OPERATOR_REDUCTION"
  | "UNAUTHORIZED_DELEGATION"
  | "PRIVILEGE_ESCALATION"
  | "HIDDEN_EXECUTION"
  | "LINEAGE_INCOMPLETE"
  | "CROSS_TENANT_AUTHORITY"
  | "MISSING_EVIDENCE"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "LEDGER_FAILURE"
  | "INVALID_APPROVAL_CHAIN"
  | "AUTHORITY_INHERITANCE"
  | "RUNTIME_AUTHORITY"
  | "PRODUCTION_AUTHORITY"
  | "SELF_GRANTED_PERMISSION"
  | "IMPLICIT_ELEVATION"
  | "UNDOCUMENTED_DEPENDENCY";

export type AuthorityScopeAssessment = Readonly<{
  scope_id: string;
  domain: AuthorityDomain;
  assigned_authority: boolean;
  requested_authority: boolean;
  within_boundary: boolean;
  classification: AuthorityClassification;
  reasoning: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type AuthorityValidationResult = Readonly<{
  result_id: string;
  domain: AuthorityDomain;
  status: AuthorityCheckStatus;
  violations: readonly AuthorityBoundaryFailure[];
  reasoning: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type AuthorityDelegationResult = Readonly<{
  delegation_id: string;
  delegated: boolean;
  delegation_valid: boolean;
  temporary: boolean;
  expires: string;
  reasoning: string;
  violations: readonly AuthorityBoundaryFailure[];
  integrity_hash: string;
}>;

export type AuthorityEscalationRequirement = Readonly<{
  escalation_id: string;
  level: AuthorityEscalationLevel;
  required_reviewers: readonly string[];
  reasoning: string;
  integrity_hash: string;
}>;

export type AuthorityViolation = Readonly<{
  violation_id: string;
  failure: AuthorityBoundaryFailure;
  domain: AuthorityDomain;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  blocks_authorization: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type AuthorityBoundaryLedgerEntry = Readonly<{
  ledger_entry_id: string;
  validation_id: string;
  proposal_id: string;
  tenant_id: string;
  final_status: AuthorityBoundaryStatus;
  append_only: true;
  immutable: true;
  replayable: true;
  tenant_isolated: boolean;
  recorded_at: string;
  integrity_hash: string;
}>;

export type AuthorityBoundaryValidation = Readonly<{
  validation_id: string;
  tenant_id: string;
  proposal_id: string;
  authority_scope: readonly AuthorityScopeAssessment[];
  authority_owner: string;
  authority_classification: AuthorityClassification;
  approval_authority_results: readonly AuthorityValidationResult[];
  execution_authority_results: readonly AuthorityValidationResult[];
  governance_authority_results: readonly AuthorityValidationResult[];
  operator_authority_results: readonly AuthorityValidationResult[];
  delegation_results: readonly AuthorityDelegationResult[];
  escalation_requirements: readonly AuthorityEscalationRequirement[];
  authority_violations: readonly AuthorityViolation[];
  authority_status: AuthorityBoundaryStatus;
  authority_reasoning: readonly string[];
  failures: readonly AuthorityBoundaryFailure[];
  supporting_evidence: readonly string[];
  replay_reference: string;
  validation_timestamp: string;
  integrity_hash: string;
}>;

export type AuthorityBoundaryApiSurface = Readonly<{
  api_id: string;
  validate_proposal: "POST /authority-boundary-validator/validate";
  retrieve_scope: "POST /authority-boundary-validator/scope";
  retrieve_approvals: "POST /authority-boundary-validator/approvals";
  retrieve_execution: "POST /authority-boundary-validator/execution";
  retrieve_governance: "POST /authority-boundary-validator/governance";
  retrieve_operator: "POST /authority-boundary-validator/operator";
  retrieve_delegation: "POST /authority-boundary-validator/delegation";
  retrieve_escalation: "POST /authority-boundary-validator/escalation";
  retrieve_violations: "POST /authority-boundary-validator/violations";
  retrieve_ledger: "POST /authority-boundary-validator/ledger";
  replay_validation: "POST /authority-boundary-validator/replay";
  retrieve_contract: "GET /authority-boundary-validator/contract";
  authority_grant_supported: false;
  execution_authority_supported: false;
  authority_expansion_supported: false;
  self_grant_supported: false;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AuthorityBoundaryValidatorInput = Readonly<{
  scenario?: AuthorityBoundaryScenario;
  adaptation_result?: RiskAdaptationFoundationResult;
  governance_result?: GovernanceAdaptationValidatorResult;
  constitutional_result?: ConstitutionalAdaptationValidatorResult;
}>;

export type AuthorityBoundaryValidatorResult = Readonly<{
  authority_boundary_validator_version: "authority-boundary-validator/v1";
  api_surface: AuthorityBoundaryApiSurface;
  validation: AuthorityBoundaryValidation;
  ledger_entry: AuthorityBoundaryLedgerEntry;
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: boolean;
  advisory_only: true;
  human_controlled: true;
  governance_enforced: true;
  least_authority_enforced: true;
  fail_closed: boolean;
  tenant_isolated: boolean;
  authority_granted: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AuthorityBoundaryValidatorFoundation = Readonly<{
  authority_boundary_validator_version: "authority-boundary-validator/v1";
  api_surface: AuthorityBoundaryApiSurface;
  result: AuthorityBoundaryValidatorResult;
}>;
