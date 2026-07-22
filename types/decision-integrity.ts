import type { DecisionReplayLineageContract } from "@/types/decision-replay-lineage";

export type DecisionVerificationState =
  | "UNVERIFIED"
  | "VERIFIED"
  | "HASH_MISMATCH"
  | "SERIALIZATION_FAILURE"
  | "ORDERING_FAILURE"
  | "MUTATION_DETECTED"
  | "REPLAY_FAILURE"
  | "LINEAGE_FAILURE";

export type DecisionIntegrityFailure =
  | "HASH_MISMATCH"
  | "SERIALIZATION_MISMATCH"
  | "ORDERING_VIOLATION"
  | "HISTORICAL_MUTATION"
  | "OVERWRITE_ATTEMPT"
  | "RECORD_DELETION"
  | "REPLAY_INCONSISTENCY"
  | "LINEAGE_INCONSISTENCY"
  | "GOVERNANCE_EVIDENCE_TAMPERING"
  | "CONSTITUTIONAL_EVIDENCE_TAMPERING"
  | "UNAUTHORIZED_LIFECYCLE_EDIT"
  | "UNSUPPORTED_SERIALIZATION_VERSION"
  | "UNSUPPORTED_INTEGRITY_ALGORITHM"
  | "TENANT_BOUNDARY_VIOLATION";

export type DecisionIntegrityRecord = Readonly<{
  integrity_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  record_version: "decision-integrity-record/v1";
  serialization_version: "decision-integrity-canonical-json/v1";
  integrity_algorithm: "SHA-256";
  integrity_hash: string;
  parent_hash?: string;
  replay_hash: string;
  lineage_hash: string;
  verification_status: DecisionVerificationState;
  created_at: string;
  append_only: true;
}>;

export type IntegrityMetadata = Readonly<{
  integrity_id: string;
  orchestration_id: string;
  serialization_version: "decision-integrity-canonical-json/v1";
  integrity_algorithm: "SHA-256";
  verification_state: DecisionVerificationState;
  replay_hash: string;
  lineage_hash: string;
  audit_refs: readonly string[];
  verification_timestamp: string;
  integrity_hash: string;
}>;

export type IntegrityAuditRecord = Readonly<{
  audit_id: string;
  integrity_id: string;
  orchestration_id: string;
  verification_state: DecisionVerificationState;
  failures: readonly DecisionIntegrityFailure[];
  append_only: true;
  advisory_only: true;
  recorded_at: string;
  integrity_hash: string;
}>;

export type DecisionIntegrityLedgerEntry = Readonly<{
  ledger_entry_id: string;
  integrity_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  sequence: number;
  previous_entry_hash?: string;
  record_hash: string;
  append_only: true;
  deleted: false;
  recorded_at: string;
  integrity_hash: string;
}>;

export type DecisionIntegrityEvaluation = Readonly<{
  evaluation_id: string;
  replay_contract: DecisionReplayLineageContract;
  integrity_record: DecisionIntegrityRecord;
  metadata: IntegrityMetadata;
  audit_record: IntegrityAuditRecord;
  ledger: readonly DecisionIntegrityLedgerEntry[];
  verification_state: DecisionVerificationState;
  failures: readonly DecisionIntegrityFailure[];
  advisory_only: true;
  integrity_hash: string;
}>;

export type DecisionIntegrityValidationResult = Readonly<{
  validation_status: "VALID" | "FAILED_CLOSED";
  verification_state: DecisionVerificationState;
  integrity_id: string;
  failures: readonly DecisionIntegrityFailure[];
  checks: Readonly<{
    serialization_consistent: boolean;
    hash_reproducible: boolean;
    append_only_compliant: boolean;
    ordering_valid: boolean;
    replay_compatible: boolean;
    lineage_intact: boolean;
    tenant_ownership_preserved: boolean;
    schema_version_supported: boolean;
    governance_evidence_preserved: boolean;
    constitutional_evidence_preserved: boolean;
  }>;
}>;

export type IntegrityMutationReport = Readonly<{
  mutation_detected: boolean;
  failures: readonly DecisionIntegrityFailure[];
  original_hash: string;
  candidate_hash: string;
}>;

export type DecisionIntegrityInput = Readonly<{
  replay_contract?: DecisionReplayLineageContract;
  parent_hash?: string;
  scenario?: "BASELINE" | "HASH_MISMATCH" | "SERIALIZATION_MISMATCH" | "ORDERING_VIOLATION" | "HISTORICAL_MUTATION" | "OVERWRITE_ATTEMPT" | "RECORD_DELETION" | "REPLAY_INCONSISTENCY" | "LINEAGE_INCONSISTENCY" | "GOVERNANCE_TAMPERING" | "CONSTITUTIONAL_TAMPERING" | "LIFECYCLE_EDIT" | "UNSUPPORTED_SERIALIZATION" | "UNSUPPORTED_ALGORITHM" | "TENANT_VIOLATION";
}>;

export type DecisionIntegrityObservability = Readonly<{
  integrity_validations: number;
  hash_generation_latency_ms: number;
  verification_failures: number;
  mutation_detection_events: number;
  ordering_violations: number;
  replay_integrity_failures: number;
  append_only_violations: number;
  serialization_mismatches: number;
  integrity_algorithm_usage: Readonly<Record<string, number>>;
  verification_success_rate: number;
}>;
