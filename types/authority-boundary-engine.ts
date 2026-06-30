import type { BoundaryDecisionType, BoundaryEnforcementContract, BoundaryRestrictionType } from "@/types/boundary-enforcement-contract";

export type AuthorityBoundaryLevel = "NONE" | "VIEW" | "RECOMMEND" | "PLAN" | "ORCHESTRATE" | "DELEGATE" | "SUPERVISE" | "EXECUTE" | "ROLLBACK" | "RECOVER" | "ADMINISTRATIVE" | "SYSTEM";
export type AuthorityBoundaryState = "UNVERIFIED" | "VALIDATING" | "AUTHORIZED" | "RESTRICTED" | "ESCALATED" | "BLOCKED" | "FAILED";
export type AuthorityBoundaryDecisionType = "ALLOW" | "ALLOW_WITH_RESTRICTIONS" | "ESCALATE" | "BLOCK" | "FAIL_SAFE";
export type AuthorityBoundaryType = "planning" | "orchestration" | "delegation" | "supervision" | "execution" | "recovery" | "rollback" | "escalation" | "replay" | "visibility" | "governance_interaction";

export type AuthorityBoundaryScenario =
  | "BASELINE"
  | "ALLOW_WITH_RESTRICTIONS"
  | "OPERATOR_ESCALATION_REQUIRED"
  | "MISSING_AUTHORITY_SOURCE"
  | "INSUFFICIENT_SCOPE"
  | "PRIVILEGE_ESCALATION"
  | "ROLE_EXPANSION"
  | "IMPLICIT_AUTHORITY"
  | "UNAUTHORIZED_DELEGATION"
  | "DELEGATION_LOOP"
  | "RECURSIVE_DELEGATION"
  | "DELEGATION_OUTSIDE_SCOPE"
  | "EXPIRED_DELEGATION"
  | "HIDDEN_DELEGATION"
  | "GOVERNANCE_REJECTION"
  | "CONSTITUTIONAL_VIOLATION"
  | "POLICY_VIOLATION"
  | "OPERATOR_APPROVAL_MISSING"
  | "MISSION_SCOPE_VIOLATION"
  | "TENANT_MISMATCH"
  | "AUTHORITY_EXPIRED"
  | "RUNTIME_AUTHORITY_LOST"
  | "UNKNOWN_CONDITION"
  | "REPLAY_MISMATCH"
  | "LINEAGE_MISSING"
  | "TRUTH_LEDGER_MISSING"
  | "HASH_MISMATCH"
  | "SIGNATURE_MISMATCH";

export type AuthorityBoundaryFailureReason =
  | "AUTHORITY_SOURCE_MISSING"
  | "AUTHORITY_SCOPE_INSUFFICIENT"
  | "PRIVILEGE_ESCALATION_DETECTED"
  | "UNAUTHORIZED_ROLE_EXPANSION"
  | "IMPLICIT_AUTHORITY_ASSUMPTION"
  | "UNAUTHORIZED_DELEGATION"
  | "DELEGATION_LOOP_DETECTED"
  | "RECURSIVE_DELEGATION_DETECTED"
  | "DELEGATION_OUTSIDE_SCOPE"
  | "DELEGATION_EXPIRED"
  | "HIDDEN_DELEGATION_DETECTED"
  | "GOVERNANCE_REJECTED"
  | "CONSTITUTIONAL_VIOLATION"
  | "POLICY_VIOLATION"
  | "OPERATOR_APPROVAL_MISSING"
  | "MISSION_SCOPE_VIOLATION"
  | "TENANT_MISMATCH"
  | "AUTHORITY_EXPIRED"
  | "RUNTIME_AUTHORITY_LOST"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "LINEAGE_REFERENCE_MISSING"
  | "TRUTH_LEDGER_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISMATCH"
  | "DIGITAL_SIGNATURE_INVALID"
  | "FAIL_CLOSED";

export type AuthorityScopeValidation = Readonly<{
  scope_id: string;
  requested_action: string;
  requested_scope: readonly string[];
  granted_scope: readonly string[];
  denied_scope: readonly string[];
  requested_level: AuthorityBoundaryLevel;
  granted_level: AuthorityBoundaryLevel;
  least_privilege_enforced: boolean;
  validation_state: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type DelegationAuthorityValidation = Readonly<{
  delegation_id: string;
  delegation_exists: boolean;
  delegation_valid: boolean;
  delegation_scope: readonly string[];
  delegation_issuer: string;
  delegation_recipient: string;
  delegation_lineage: string;
  expires_at: string;
  failures: readonly AuthorityBoundaryFailureReason[];
  validation_state: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type AuthorityValidation = Readonly<{
  authority_validation_id: string;
  authority_source: string;
  authority_type: AuthorityBoundaryType;
  authority_level: AuthorityBoundaryLevel;
  requested_action: string;
  requested_scope: readonly string[];
  granted_scope: readonly string[];
  validation_result: AuthorityBoundaryState;
  restriction_reason: string | null;
  escalation_reason: string | null;
  confidence: number;
  evaluated_rules: readonly string[];
  evidence: readonly string[];
  operator_required: boolean;
  governance_required: boolean;
  timestamp: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type AuthorizationDecision = Readonly<{
  authorization_decision_id: string;
  decision: AuthorityBoundaryDecisionType;
  boundary_decision: BoundaryDecisionType;
  approved_scope: readonly string[];
  denied_scope: readonly string[];
  restrictions: readonly BoundaryRestrictionType[];
  escalation_request: string | null;
  failures: readonly AuthorityBoundaryFailureReason[];
  operator_required: boolean;
  governance_required: boolean;
  confidence: number;
  timestamp: string;
  integrity_hash: string;
}>;

export type RuntimeAuthorityMonitor = Readonly<{
  monitor_id: string;
  authority_still_active: boolean;
  governance_unchanged: boolean;
  policies_unchanged: boolean;
  operator_approval_valid: boolean;
  delegation_still_valid: boolean;
  mission_authorization_active: boolean;
  runtime_action: "CONTINUE" | "RESTRICT" | "ESCALATE" | "BLOCK" | "FAIL_SAFE";
  integrity_hash: string;
}>;

export type AuthorityBoundaryEvidence = Readonly<{
  evidence_id: string;
  authority_event: string;
  authorization_evidence: readonly string[];
  denied_permissions: readonly string[];
  granted_permissions: readonly string[];
  delegation_evidence: readonly string[];
  governance_references: readonly string[];
  constitutional_references: readonly string[];
  operator_references: readonly string[];
  replay_references: readonly string[];
  lineage_reference: string;
  truth_ledger_reference: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type AuthorityBoundaryLedgerEntry = Readonly<{
  ledger_entry_id: string;
  authorization_decision_id: string;
  authority_event: string;
  evidence_hash: string;
  decision_hash: string;
  replay_references: readonly string[];
  append_only: true;
  recorded_at: string;
  ledger_hash: string;
}>;

export type AuthorityBoundaryReplayResult = Readonly<{
  replay_id: string;
  authorization_decision_id: string;
  reconstructed_pipeline: readonly string[];
  reconstructed_decision: AuthorityBoundaryDecisionType;
  reconstructed_authority_hash: string;
  reconstructed_scope_hash: string;
  reconstructed_delegation_hash: string;
  reconstructed_evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: AuthorityBoundaryFailureReason | null;
  replay_hash: string;
}>;

export type AuthorityBoundaryPackage = Readonly<{
  package_id: string;
  engine_version: "authority-boundary-engine/v8F.2";
  source_boundary_contract: BoundaryEnforcementContract;
  authority_state: AuthorityBoundaryState;
  authority_validation: AuthorityValidation;
  scope_validation: AuthorityScopeValidation;
  delegation_validation: DelegationAuthorityValidation;
  authorization_decision: AuthorizationDecision;
  runtime_monitor: RuntimeAuthorityMonitor;
  authority_evidence: AuthorityBoundaryEvidence;
  ledger_entry: AuthorityBoundaryLedgerEntry;
  replay: AuthorityBoundaryReplayResult;
  authority_granted: false;
  new_authority_created: false;
  autonomous_execution_performed: false;
  package_hash: string;
}>;

export type AuthorityBoundaryVisibilitySurface = Readonly<{
  package_id: string;
  authority_state: AuthorityBoundaryState;
  authority_source: string;
  authority_level: AuthorityBoundaryLevel;
  requested_permissions: readonly string[];
  granted_permissions: readonly string[];
  denied_permissions: readonly string[];
  delegation_chain: readonly string[];
  evaluated_governance_rules: readonly string[];
  constitutional_constraints: readonly string[];
  decision_explanation: string;
  confidence_score: number;
  replay_status: "PASS" | "FAIL";
  execution_timeline: readonly string[];
  integrity_status: "VALID" | "INVALID";
}>;

export type AuthorityBoundaryFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "authority-boundary-engine/v8F.2";
    authority_levels: readonly AuthorityBoundaryLevel[];
    authority_states: readonly AuthorityBoundaryState[];
    decision_types: readonly AuthorityBoundaryDecisionType[];
    authority_types: readonly AuthorityBoundaryType[];
  }>;
  package: AuthorityBoundaryPackage;
  visibility: AuthorityBoundaryVisibilitySurface;
}>;
