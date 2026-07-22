import type { IntegrityVerificationEngineResult } from "@/types/decision-integrity-verification-engine";

export type ImmutableLedgerType =
  | "REPLAY_REQUEST"
  | "REPLAY_EXECUTION"
  | "REPLAY_OUTCOME"
  | "AUDIT_REPORT"
  | "OPERATOR_REVIEW"
  | "DIVERGENCE_REPORT"
  | "INTEGRITY_VERIFICATION"
  | "CERTIFICATION_EVIDENCE";

export type ImmutableLedgerLifecycleState = "CREATED" | "VALIDATED" | "READY_FOR_COMMIT" | "COMMITTED" | "ARCHIVED";

export type ImmutableLedgerFailure =
  | "APPEND_ONLY_VIOLATION"
  | "RECORD_MODIFICATION_ATTEMPT"
  | "RECORD_DELETION_ATTEMPT"
  | "RECORD_REPLACEMENT_ATTEMPT"
  | "HASH_MISMATCH"
  | "LINEAGE_BROKEN"
  | "DUPLICATE_RECORD_IDENTITY"
  | "UNSUPPORTED_LEDGER_TYPE"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "TENANT_BOUNDARY_VIOLATION"
  | "INCOMPLETE_VALIDATION"
  | "UNKNOWN_LIFECYCLE_STATE";

export type ImmutableLedgerRecord = Readonly<{
  ledger_record_id: string;
  ledger_type: ImmutableLedgerType;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  record_version: "immutable-decision-ledger-record/v1";
  schema_version: "immutable-decision-ledger-schema/v1";
  lifecycle_state: ImmutableLedgerLifecycleState;
  artifact_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  audit_refs: readonly string[];
  integrity_refs: readonly string[];
  certification_refs: readonly string[];
  parent_record_refs: readonly string[];
  child_record_refs: readonly string[];
  commit_sequence: number;
  commit_timestamp: string;
  integrity_hash: string;
}>;

export type LedgerCommitResult = Readonly<{
  commit_id: string;
  ledger_record_id: string;
  validation_result: "VALID" | "BLOCKED";
  commit_status: "COMMITTED" | "REJECTED";
  commit_sequence: number;
  lineage_verified: boolean;
  integrity_verified: boolean;
  commit_timestamp: string;
  failures: readonly ImmutableLedgerFailure[];
  integrity_hash: string;
}>;

export type LedgerQueryType =
  | "REPLAY_HISTORY"
  | "AUDIT_HISTORY"
  | "INTEGRITY_HISTORY"
  | "DIVERGENCE_REPORTS"
  | "OPERATOR_REVIEWS"
  | "CERTIFICATION_EVIDENCE"
  | "MISSION_LEDGER"
  | "TENANT_LEDGER"
  | "LINEAGE_CHAIN"
  | "REPLAY_CHAIN";

export type LedgerQueryResult = Readonly<{
  query_id: string;
  query_type: LedgerQueryType;
  matching_records: readonly ImmutableLedgerRecord[];
  lineage_chain: readonly string[];
  replay_ready: boolean;
  integrity_verified: boolean;
  query_timestamp: string;
  read_only: true;
  integrity_hash: string;
}>;

export type ImmutableDecisionLedgerResult = Readonly<{
  ledger_version: "immutable-decision-ledger/v1";
  integrity_result: IntegrityVerificationEngineResult;
  records: readonly ImmutableLedgerRecord[];
  commits: readonly LedgerCommitResult[];
  query_results: readonly LedgerQueryResult[];
  failures: readonly ImmutableLedgerFailure[];
  append_only: true;
  read_only_queries: true;
  deterministic: true;
  advisory_only: true;
  mutates_history: false;
  certification_ready: boolean;
  integrity_hash: string;
}>;

export type ImmutableDecisionLedgerFoundation = Readonly<{
  ledger_version: "immutable-decision-ledger/v1";
  ledger_types: readonly ImmutableLedgerType[];
  lifecycle_states: readonly ImmutableLedgerLifecycleState[];
  terminal_states: readonly ImmutableLedgerLifecycleState[];
  query_types: readonly LedgerQueryType[];
  result: ImmutableDecisionLedgerResult;
}>;
