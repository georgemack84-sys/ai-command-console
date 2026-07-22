import type { FailClosedEnforcementResult } from "@/types/fail-closed-enforcement-engine";
import type { GovernanceEnforcementState } from "@/types/governance-decision-filter-contract";

export type GovernanceLedgerQueryType =
  | "governance_decision"
  | "mission_timeline"
  | "operator_approvals"
  | "governance_reviews"
  | "enforcement_outcomes"
  | "replay_references"
  | "certification_history"
  | "lineage_history";

export type GovernanceDecisionLedgerRecord = Readonly<{
  ledger_id: string;
  governance_decision_id: string;
  mission_id: string;
  tenant_id: string;
  validation_results: readonly string[];
  constitutional_results: readonly string[];
  authority_results: readonly string[];
  tenant_results: readonly string[];
  certification_results: readonly string[];
  replay_results: readonly string[];
  integrity_results: readonly string[];
  enforcement_outcome: GovernanceEnforcementState;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  created_at: string;
  integrity_hash: string;
}>;

export type GovernanceReviewRecord = Readonly<{
  review_id: string;
  governance_decision_id: string;
  reviewer_ref: string;
  review_outcome: "APPROVED" | "REJECTED" | "ESCALATED" | "NOT_REQUIRED";
  review_rationale: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  reviewed_at: string;
  integrity_hash: string;
}>;

export type OperatorApprovalRecord = Readonly<{
  approval_id: string;
  governance_decision_id: string;
  operator_identity: string;
  approval_outcome: "APPROVED" | "REJECTED" | "PENDING" | "NOT_REQUIRED";
  approval_scope: string;
  approval_rationale: string;
  approval_evidence: readonly string[];
  approved_at: string;
  integrity_hash: string;
}>;

export type GovernanceTimelineEvent = Readonly<{
  event_id: string;
  governance_decision_id: string;
  event_type:
    | "Decision Candidate"
    | "Governance Validation"
    | "Constitution Validation"
    | "Authority Validation"
    | "Tenant Validation"
    | "Certification Validation"
    | "Replay Validation"
    | "Integrity Validation"
    | "Enforcement Decision"
    | "Ledger Record Created";
  event_order: number;
  event_result: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  occurred_at: string;
  integrity_hash: string;
}>;

export type GovernanceDecisionArchive = Readonly<{
  archive_id: string;
  governance_decision_id: string;
  ledger_ref: string;
  timeline_refs: readonly string[];
  approval_refs: readonly string[];
  review_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  export_ref: string;
  integrity_hash: string;
}>;

export type GovernanceDecisionLedgerFailureReason =
  | "DUPLICATE_LEDGER_IDENTIFIER"
  | "MISSING_GOVERNANCE_DECISION_ID"
  | "INCOMPLETE_VALIDATION_RESULTS"
  | "MISSING_REPLAY_REFERENCES"
  | "MISSING_LINEAGE_REFERENCES"
  | "INVALID_INTEGRITY_HASH"
  | "MALFORMED_EVIDENCE_REFERENCE"
  | "FINALIZED_RECORD_MODIFICATION_ATTEMPT"
  | "RECORD_DELETION_ATTEMPT"
  | "RECORD_ORDERING_VIOLATION"
  | "ENFORCEMENT_RECORD_INVALID"
  | "UNAUTHORIZED_GOVERNANCE_LEDGER_ACCESS"
  | "REPLAY_DIVERGENCE";

export type GovernanceDecisionLedgerValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly GovernanceDecisionLedgerFailureReason[];
  checks: Readonly<{
    governance_decision_present: boolean;
    validations_complete: boolean;
    replay_refs_present: boolean;
    lineage_refs_present: boolean;
    evidence_refs_well_formed: boolean;
    integrity_hash_valid: boolean;
    append_only: boolean;
    ordering_valid: boolean;
  }>;
}>;

export type GovernanceDecisionLedgerInput = Readonly<{
  enforcement_result?: FailClosedEnforcementResult;
  existing_records?: readonly GovernanceDecisionLedgerRecord[];
  record_modification_attempt?: boolean;
  record_deletion_attempt?: boolean;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type GovernanceDecisionLedgerResult = Readonly<{
  ledger_status: "PASS" | "FAIL";
  fail_closed: boolean;
  enforcement_result: FailClosedEnforcementResult;
  ledger_record: GovernanceDecisionLedgerRecord;
  timeline: readonly GovernanceTimelineEvent[];
  operator_approvals: readonly OperatorApprovalRecord[];
  governance_reviews: readonly GovernanceReviewRecord[];
  archive: GovernanceDecisionArchive;
  validation: GovernanceDecisionLedgerValidation;
  replay_hash: string;
  failures: readonly GovernanceDecisionLedgerFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type GovernanceDecisionLedgerQuery = Readonly<{
  query_id: string;
  query_type: GovernanceLedgerQueryType;
  records: readonly string[];
  results: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceDecisionLedgerReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  governance_decision_id: string;
  ledger_ref: string;
  timeline_refs: readonly string[];
  enforcement_outcome: GovernanceEnforcementState;
  validation_results: readonly string[];
  approval_refs: readonly string[];
  review_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly GovernanceDecisionLedgerFailureReason[];
  integrity_hash: string;
}>;

export type GovernanceDecisionLedgerObservability = Readonly<{
  ledger_write_events: number;
  ledger_read_events: number;
  integrity_verification_events: number;
  replay_retrieval_events: number;
  audit_query_events: number;
  governance_review_events: number;
  operator_approval_events: number;
  lineage_reconstruction_events: number;
  export_events: number;
}>;

export type GovernanceDecisionLedgerFoundation = Readonly<{
  ledger_version: "governance-decision-ledger/v1";
  query_types: readonly GovernanceLedgerQueryType[];
  result: GovernanceDecisionLedgerResult;
  replay: GovernanceDecisionLedgerReplay;
  observability: GovernanceDecisionLedgerObservability;
}>;
