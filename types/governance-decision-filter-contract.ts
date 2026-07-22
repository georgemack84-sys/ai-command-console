export type GovernanceDecisionStatus = "PENDING" | "VALID" | "CONDITIONAL" | "VIOLATION" | "FAILED" | "UNKNOWN";
export type ConstitutionalDecisionStatus = "NOT_VALIDATED" | "COMPLIANT" | "NON_COMPLIANT" | "CONDITIONAL" | "FAILED" | "UNKNOWN";
export type GovernanceAuthorityStatus = "NOT_REQUIRED" | "AUTHORIZED" | "OPERATOR_REQUIRED" | "GOVERNANCE_REQUIRED" | "CERTIFICATION_REQUIRED" | "UNAUTHORIZED";
export type GovernanceApprovalStatus = "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
export type GovernanceCertificationStatus = "NOT_REQUIRED" | "PENDING" | "CERTIFIED" | "FAILED" | "UNKNOWN";
export type GovernanceReplayStatus = "AVAILABLE" | "VERIFIED" | "PARTIAL" | "MISSING" | "FAILED";
export type GovernanceLineageStatus = "COMPLETE" | "PARTIAL" | "BROKEN" | "UNKNOWN";
export type GovernanceIntegrityStatus = "VERIFIED" | "PARTIAL" | "FAILED" | "UNKNOWN";
export type GovernanceEnforcementState =
  | "ALLOW"
  | "ALLOW_WITH_OPERATOR_APPROVAL"
  | "ALLOW_WITH_GOVERNANCE_REVIEW"
  | "RESTRICT"
  | "DEFER"
  | "ESCALATE"
  | "BLOCK"
  | "FAIL_CLOSED";
export type GovernanceDecisionLifecycleState = "CREATED" | "REGISTERED" | "VALIDATED" | "READY_FOR_ENFORCEMENT" | "UNDER_ENFORCEMENT" | "FINALIZED" | "ARCHIVED";

export type GovernanceDecisionRecord = Readonly<{
  governance_decision_id: string;
  decision_candidate_id: string;
  mission_id: string;
  tenant_id: string;
  governance_status: GovernanceDecisionStatus;
  constitutional_status: ConstitutionalDecisionStatus;
  authority_status: GovernanceAuthorityStatus;
  approval_status: GovernanceApprovalStatus;
  certification_status: GovernanceCertificationStatus;
  replay_status: GovernanceReplayStatus;
  lineage_status: GovernanceLineageStatus;
  integrity_status: GovernanceIntegrityStatus;
  enforcement_state: GovernanceEnforcementState;
  lifecycle_state: GovernanceDecisionLifecycleState;
  validation_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  created_at: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type GovernanceDecisionLifecycleAuditEvent = Readonly<{
  audit_event_id: string;
  governance_decision_id: string;
  previous_state: GovernanceDecisionLifecycleState;
  new_state: GovernanceDecisionLifecycleState;
  transition_valid: boolean;
  replay_ref: string;
  transition_timestamp: string;
  integrity_hash: string;
}>;

export type GovernanceDecisionContractFailureReason =
  | "REQUIRED_FIELD_MISSING"
  | "DUPLICATE_GOVERNANCE_DECISION_ID"
  | "INVALID_SCHEMA"
  | "INVALID_LIFECYCLE_TRANSITION"
  | "UNRESOLVED_VALIDATION_REFERENCE"
  | "UNRESOLVED_EVIDENCE_REFERENCE"
  | "MISSING_REPLAY_REFERENCE"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_HASH_MISMATCH"
  | "TENANT_OWNERSHIP_AMBIGUOUS"
  | "TENANT_ISOLATION_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION"
  | "REPLAY_DIVERGENCE"
  | "MALFORMED_METADATA";

export type GovernanceDecisionContractValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly GovernanceDecisionContractFailureReason[];
  checks: Readonly<{
    schema_valid: boolean;
    identity_valid: boolean;
    lifecycle_valid: boolean;
    references_resolved: boolean;
    replay_ready: boolean;
    lineage_complete: boolean;
    integrity_valid: boolean;
    tenant_isolated: boolean;
    advisory_only: boolean;
  }>;
}>;

export type GovernanceDecisionContractInput = Readonly<{
  governance_decision_id?: string;
  decision_candidate_id?: string;
  mission_id?: string;
  tenant_id?: string;
  governance_status?: GovernanceDecisionStatus;
  constitutional_status?: ConstitutionalDecisionStatus;
  authority_status?: GovernanceAuthorityStatus;
  approval_status?: GovernanceApprovalStatus;
  certification_status?: GovernanceCertificationStatus;
  replay_status?: GovernanceReplayStatus;
  lineage_status?: GovernanceLineageStatus;
  integrity_status?: GovernanceIntegrityStatus;
  enforcement_state?: GovernanceEnforcementState;
  lifecycle_state?: GovernanceDecisionLifecycleState;
  validation_refs?: readonly string[];
  evidence_refs?: readonly string[];
  replay_refs?: readonly string[];
  lineage_refs?: readonly string[];
  created_at?: string;
  advisory_only?: boolean;
  existing_governance_decision_ids?: readonly string[];
}>;

export type GovernanceDecisionContractReplay = Readonly<{
  replay_id: string;
  governance_decision_id: string;
  replay_valid: boolean;
  reconstructed_hash: string;
  expected_hash: string;
  lifecycle_events: readonly GovernanceDecisionLifecycleAuditEvent[];
  failures: readonly GovernanceDecisionContractFailureReason[];
  integrity_hash: string;
}>;

export type GovernanceDecisionContractObservability = Readonly<{
  contract_creation_events: number;
  validation_events: number;
  lifecycle_transitions: number;
  integrity_verification_events: number;
  replay_verification_events: number;
  contract_failures: number;
  enforcement_readiness_events: number;
}>;

export type GovernanceDecisionFilterContractFoundation = Readonly<{
  contract_version: "governance-decision-filter-contract/v1";
  governance_statuses: readonly GovernanceDecisionStatus[];
  constitutional_statuses: readonly ConstitutionalDecisionStatus[];
  authority_statuses: readonly GovernanceAuthorityStatus[];
  approval_statuses: readonly GovernanceApprovalStatus[];
  certification_statuses: readonly GovernanceCertificationStatus[];
  replay_statuses: readonly GovernanceReplayStatus[];
  lineage_statuses: readonly GovernanceLineageStatus[];
  integrity_statuses: readonly GovernanceIntegrityStatus[];
  enforcement_states: readonly GovernanceEnforcementState[];
  lifecycle_states: readonly GovernanceDecisionLifecycleState[];
  allowed_lifecycle_transitions: Readonly<Record<GovernanceDecisionLifecycleState, readonly GovernanceDecisionLifecycleState[]>>;
  record: GovernanceDecisionRecord;
  validation: GovernanceDecisionContractValidation;
  replay: GovernanceDecisionContractReplay;
  observability: GovernanceDecisionContractObservability;
}>;
