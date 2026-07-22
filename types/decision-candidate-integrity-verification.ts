import type { DecisionCandidatePayload, DecisionIntakeFailureReason } from "@/types/decision-intake-engine";
import type { SchemaValidationResult } from "@/types/decision-candidate-schema-validation";

export type IntegrityVerificationState =
  | "PENDING"
  | "PAYLOAD_CANONICALIZED"
  | "HASH_VERIFIED"
  | "REPLAY_VERIFIED"
  | "LINEAGE_VERIFIED"
  | "EVIDENCE_VERIFIED"
  | "GOVERNANCE_VERIFIED"
  | "PASSED"
  | "FAILED_CANONICALIZATION"
  | "FAILED_HASH"
  | "FAILED_REPLAY"
  | "FAILED_LINEAGE"
  | "FAILED_EVIDENCE"
  | "FAILED_GOVERNANCE";

export type IntegrityVerificationFailureReason =
  | "SCHEMA_VALIDATION_FAILED"
  | "UNSERIALIZABLE_PAYLOAD"
  | "NONDETERMINISTIC_FIELD_ORDER"
  | "UNSTABLE_REFERENCE_ORDER"
  | "MISSING_INTEGRITY_HASH"
  | "INVALID_HASH_FORMAT"
  | "UNSUPPORTED_HASH_ALGORITHM"
  | "HASH_MISMATCH"
  | "BROKEN_HASH_CHAIN"
  | "MISSING_REPLAY_REFERENCE"
  | "UNRESOLVED_REPLAY_REFERENCE"
  | "REPLAY_VERSION_MISMATCH"
  | "REPLAY_CORRUPTION"
  | "REPLAY_INCOMPATIBLE_CANDIDATE"
  | "MISSING_LINEAGE_REFERENCE"
  | "UNRESOLVED_PARENT_REFERENCE"
  | "ORPHANED_CANDIDATE"
  | "BROKEN_LINEAGE_CHAIN"
  | "SOURCE_RECORD_MISMATCH"
  | "MISSING_EVIDENCE"
  | "UNRESOLVED_EVIDENCE"
  | "CROSS_TENANT_EVIDENCE"
  | "UNRELATED_MISSION_EVIDENCE"
  | "INCONSISTENT_EVIDENCE"
  | "BROKEN_EVIDENCE_LINEAGE"
  | "MISSING_GOVERNANCE_REFERENCE"
  | "UNRESOLVED_POLICY_REFERENCE"
  | "AUTHORITY_REFERENCE_MISMATCH"
  | "CONSTITUTIONAL_REFERENCE_OMISSION"
  | "GOVERNANCE_VERSION_MISMATCH"
  | "GOVERNANCE_LINEAGE_CORRUPTION"
  | "MALFORMED_INTEGRITY_METADATA";

export type IntegrityVerificationRequest = Readonly<{
  verification_id: string;
  intake_id: string;
  candidate_id: string;
  source_system: string;
  tenant_id: string;
  mission_id: string;
  candidate_payload_ref: string;
  candidate_payload: DecisionCandidatePayload;
  integrity_hash?: string;
  hash_algorithm: "SHA-256";
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  schema_validation?: SchemaValidationResult;
}>;

export type VerificationCheckStatus = "PASS" | "FAIL" | "NOT_CHECKED";

export type HashVerificationRecord = Readonly<{
  record_id: string;
  verification_id: string;
  hash_algorithm: string;
  canonical_payload_ref: string;
  canonical_hash: string;
  submitted_hash?: string;
  hash_match: boolean;
  result: VerificationCheckStatus;
  integrity_hash: string;
}>;

export type ReplayReferenceVerificationRecord = Readonly<{
  record_id: string;
  verification_id: string;
  replay_refs_checked: readonly string[];
  unresolved_replay_refs: readonly string[];
  replay_version_status: VerificationCheckStatus;
  replay_compatibility_status: VerificationCheckStatus;
  result: VerificationCheckStatus;
  integrity_hash: string;
}>;

export type LineageReferenceVerificationRecord = Readonly<{
  record_id: string;
  verification_id: string;
  lineage_refs_checked: readonly string[];
  unresolved_lineage_refs: readonly string[];
  lineage_continuity_status: VerificationCheckStatus;
  source_record_status: VerificationCheckStatus;
  result: VerificationCheckStatus;
  integrity_hash: string;
}>;

export type EvidenceConsistencyRecord = Readonly<{
  record_id: string;
  verification_id: string;
  evidence_refs_checked: readonly string[];
  unresolved_evidence_refs: readonly string[];
  tenant_consistency_status: VerificationCheckStatus;
  mission_consistency_status: VerificationCheckStatus;
  rationale_consistency_status: VerificationCheckStatus;
  result: VerificationCheckStatus;
  integrity_hash: string;
}>;

export type GovernanceReferenceVerificationRecord = Readonly<{
  record_id: string;
  verification_id: string;
  governance_refs_checked: readonly string[];
  unresolved_governance_refs: readonly string[];
  policy_reference_status: VerificationCheckStatus;
  authority_reference_status: VerificationCheckStatus;
  constitutional_reference_status: VerificationCheckStatus;
  governance_version_status: VerificationCheckStatus;
  result: VerificationCheckStatus;
  integrity_hash: string;
}>;

export type IntegrityVerificationAuditRecord = Readonly<{
  audit_id: string;
  verification_id: string;
  event_type:
    | "CANONICAL_PAYLOAD_GENERATED"
    | "HASH_VERIFIED"
    | "REPLAY_REFERENCES_CHECKED"
    | "LINEAGE_REFERENCES_CHECKED"
    | "EVIDENCE_CONSISTENCY_CHECKED"
    | "GOVERNANCE_REFERENCES_CHECKED"
    | "INTEGRITY_VERIFICATION_PASSED"
    | "INTEGRITY_VERIFICATION_FAILED"
    | "INTAKE_REJECTED";
  verification_stage: IntegrityVerificationState;
  result: "PASS" | "FAIL";
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type IntegrityVerificationLedgerRecord = Readonly<{
  ledger_entry_id: string;
  ledger_event: "INTEGRITY_VERIFICATION_PASSED" | "INTEGRITY_VERIFICATION_FAILED";
  verification_id: string;
  intake_id: string;
  candidate_id: string;
  failed_stage?: IntegrityVerificationState;
  failure_reason?: IntegrityVerificationFailureReason;
  canonical_hash: string;
  submitted_hash?: string;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type IntegrityVerificationResult = Readonly<{
  verification_id: string;
  intake_id: string;
  candidate_id: string;
  verification_status: "PASS" | "FAIL";
  verification_state: IntegrityVerificationState;
  failure_reason?: IntegrityVerificationFailureReason;
  failure_reasons: readonly IntegrityVerificationFailureReason[];
  failed_stage?: IntegrityVerificationState;
  canonical_hash: string;
  submitted_hash?: string;
  replay_status: VerificationCheckStatus;
  lineage_status: VerificationCheckStatus;
  evidence_status: VerificationCheckStatus;
  governance_status: VerificationCheckStatus;
  hash_record: HashVerificationRecord;
  replay_record: ReplayReferenceVerificationRecord;
  lineage_record: LineageReferenceVerificationRecord;
  evidence_record: EvidenceConsistencyRecord;
  governance_record: GovernanceReferenceVerificationRecord;
  ledger_record: IntegrityVerificationLedgerRecord;
  audit_records: readonly IntegrityVerificationAuditRecord[];
  replay_ref: string;
  downstream_allowed: boolean;
  timestamp: string;
  integrity_hash: string;
}>;

export type IntegrityVerificationReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  verification_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: IntegrityVerificationState;
  reconstructed_failure_reason?: IntegrityVerificationFailureReason;
  failures: readonly IntegrityVerificationFailureReason[];
  integrity_hash: string;
}>;

export type IntegrityVerificationIntakeBridge = Readonly<{
  integrity_verification: IntegrityVerificationResult;
  intake_failure_reasons: readonly DecisionIntakeFailureReason[];
  intake_allowed: boolean;
}>;

export type IntegrityVerificationObservability = Readonly<{
  integrity_verification_attempts: number;
  integrity_verification_passes: number;
  integrity_verification_failures: number;
  hash_mismatch_count: number;
  replay_reference_failures: number;
  lineage_failures: number;
  evidence_consistency_failures: number;
  governance_reference_failures: number;
  cross_tenant_reference_failures: number;
  canonicalization_failures: number;
}>;
