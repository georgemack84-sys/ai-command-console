import type { DecisionAuditEngineResult } from "@/types/decision-audit-engine";

export type IntegrityOutcome = "VERIFIED" | "MODIFIED" | "CORRUPTED" | "MISSING" | "FAIL_CLOSED";
export type IntegrityLifecycleState = "CREATED" | "VALIDATING" | "VERIFIED" | "MONITORED" | "ARCHIVED" | "MODIFIED" | "CORRUPTED" | "MISSING" | "FAIL_CLOSED";
export type HashMatchStatus = "MATCH" | "MISMATCH";

export type IntegrityVerificationFailure =
  | "HASH_MISMATCH"
  | "LINEAGE_BROKEN"
  | "REPLAY_INCONSISTENCY"
  | "PACKAGE_INCONSISTENCY"
  | "OPERATOR_INCONSISTENCY"
  | "SNAPSHOT_INCONSISTENCY"
  | "LEDGER_INCONSISTENCY"
  | "CORRUPTED_ARTIFACT"
  | "MISSING_ARTIFACT"
  | "UNSUPPORTED_HASH_ALGORITHM"
  | "VERIFICATION_INTERRUPTED"
  | "TENANT_BOUNDARY_VIOLATION"
  | "UNKNOWN_INTEGRITY_OUTCOME";

export type HashVerificationResult = Readonly<{
  artifact_id: string;
  stored_hash: string;
  recomputed_hash: string;
  hash_algorithm: "SHA-256";
  match_status: HashMatchStatus;
  verification_timestamp: string;
  integrity_hash: string;
}>;

export type IntegrityDomainResult = Readonly<{
  domain_id: string;
  domain:
    | "HASH"
    | "LINEAGE"
    | "SNAPSHOT"
    | "LEDGER"
    | "REPLAY"
    | "PACKAGE"
    | "OPERATOR"
    | "TAMPER";
  verified: boolean;
  failed_artifacts: readonly string[];
  integrity_hash: string;
}>;

export type IntegrityReport = Readonly<{
  report_id: string;
  verification_id: string;
  verified_artifacts: readonly string[];
  modified_artifacts: readonly string[];
  corrupted_artifacts: readonly string[];
  missing_artifacts: readonly string[];
  lineage_summary: string;
  consistency_summary: string;
  tamper_summary: string;
  integrity_outcome: IntegrityOutcome;
  certification_ready: boolean;
  integrity_hash: string;
}>;

export type IntegrityVerificationRecord = Readonly<{
  verification_id: string;
  orchestration_id: string;
  replay_id: string;
  mission_id: string;
  tenant_id: string;
  verification_version: "decision-integrity-verification-engine/v1";
  schema_version: "decision-integrity-verification-schema/v1";
  verification_scope: readonly string[];
  artifact_refs: readonly string[];
  hash_results: readonly HashVerificationResult[];
  lineage_results: IntegrityDomainResult;
  consistency_results: readonly IntegrityDomainResult[];
  tamper_results: IntegrityDomainResult;
  integrity_outcome: IntegrityOutcome;
  validation_status: "VALID" | "BLOCKED";
  report_ref: string;
  integrity_hash: string;
}>;

export type IntegrityLedgerEntry = Readonly<{
  ledger_entry_id: string;
  verification_id: string;
  sequence: number;
  record_hash: string;
  report_hash: string;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type IntegrityVerificationEngineResult = Readonly<{
  verification_engine_version: "decision-integrity-verification-engine/v1";
  audit_result: DecisionAuditEngineResult;
  verification_record: IntegrityVerificationRecord;
  report: IntegrityReport;
  ledger: readonly IntegrityLedgerEntry[];
  failures: readonly IntegrityVerificationFailure[];
  deterministic: true;
  advisory_only: true;
  mutates_artifacts: false;
  certification_ready: boolean;
  integrity_hash: string;
}>;

export type IntegrityVerificationEngineFoundation = Readonly<{
  verification_engine_version: "decision-integrity-verification-engine/v1";
  lifecycle_states: readonly IntegrityLifecycleState[];
  outcomes: readonly IntegrityOutcome[];
  result: IntegrityVerificationEngineResult;
}>;
