import type { OperatorApprovalFrameworkResult } from "@/types/operator-approval-framework";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type AdaptiveLedgerEventType = "PROPOSAL_CREATED" | "VALIDATION" | "SIMULATION" | "GOVERNANCE_REVIEW" | "OPERATOR_APPROVAL" | "CERTIFICATION" | "ROLLBACK" | "REJECTION";
export type AdaptiveLedgerLifecycleState = "PROPOSED" | "VALIDATED" | "SIMULATED" | "GOVERNANCE_REVIEWED" | "OPERATOR_APPROVED" | "CERTIFIED" | "AVAILABLE" | "ROLLED_BACK" | "REJECTED";
export type AdaptiveLedgerValidationState = "PASS" | "FAIL";

export type AdaptiveLedgerCheck =
  | "SCHEMA_INTEGRITY"
  | "SEQUENCE_INTEGRITY"
  | "PARENT_CHILD_CONSISTENCY"
  | "HASH_VERIFICATION"
  | "PREVIOUS_HASH_CHAIN"
  | "REPLAY_REFERENCE_VALIDATION"
  | "LINEAGE_COMPLETENESS"
  | "TENANT_ISOLATION"
  | "APPEND_ONLY"
  | "READ_AUTHORIZATION"
  | "WRITE_AUTHORIZATION"
  | "DETERMINISTIC_REPLAY";

export type AdaptiveLedgerFailure =
  | "SCHEMA_INVALID"
  | "INTEGRITY_HASH_MISMATCH"
  | "REPLAY_REFERENCES_MISSING"
  | "SEQUENCE_VIOLATION"
  | "DUPLICATE_LEDGER_IDENTIFIER"
  | "TENANT_ISOLATION_VIOLATED"
  | "LINEAGE_INCOMPLETE"
  | "APPEND_OVERWRITE_ATTEMPTED"
  | "PREVIOUS_HASH_INVALID"
  | "PARENT_CHILD_INCONSISTENT"
  | "RECORD_MODIFICATION_ATTEMPTED"
  | "RECORD_DELETION_ATTEMPTED"
  | "HISTORY_REWRITE_ATTEMPTED"
  | "HASH_TAMPERING"
  | "HIDDEN_LEDGER_ENTRY"
  | "UNAUTHORIZED_WRITE"
  | "UNAUTHORIZED_READ"
  | "TENANT_CROSSOVER"
  | "CHAIN_CORRUPTION"
  | "APPROVAL_RECORD_MISSING"
  | "CERTIFICATION_RECORD_MISSING"
  | "ROLLBACK_REPLAY_MISSING"
  | "REJECTION_RECORD_MISSING"
  | "FAIL_OPEN_LEDGER_BEHAVIOR";

export type AdaptiveLedgerRecord = Readonly<{
  record_id: string;
  ledger_sequence: number;
  tenant_id: string;
  mission_scope: readonly string[];
  adaptation_id: string;
  proposal_id: string;
  event_type: AdaptiveLedgerEventType;
  lifecycle_state: AdaptiveLedgerLifecycleState;
  event_timestamp: string;
  event_summary: string;
  evidence_refs: readonly string[];
  simulation_refs: readonly string[];
  governance_refs: readonly string[];
  operator_refs: readonly string[];
  certification_refs: readonly string[];
  rollback_refs: readonly string[];
  replay_refs: readonly string[];
  parent_record_refs: readonly string[];
  child_record_refs: readonly string[];
  integrity_hash: string;
  previous_hash: string;
  recorded_by: string;
  schema_version: "adaptive-ledger-record/v1";
  append_only: true;
  deleted: false;
}>;

export type AdaptiveLedgerEvent = Readonly<{
  event_id: string;
  adaptation_id: string;
  proposal_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  event_type: AdaptiveLedgerEventType;
  lifecycle_state: AdaptiveLedgerLifecycleState;
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  simulation_refs: readonly string[];
  governance_refs: readonly string[];
  operator_refs: readonly string[];
  certification_refs: readonly string[];
  rollback_refs: readonly string[];
  integrity_hash: string;
  previous_hash: string;
  timestamp: string;
}>;

export type AdaptiveLedgerQuery = Readonly<{
  query_id: string;
  proposal_id?: string;
  adaptation_id?: string;
  tenant_id?: string;
  mission?: string;
  event_type?: AdaptiveLedgerEventType;
  lifecycle_state?: AdaptiveLedgerLifecycleState;
  governance_ref?: string;
  certification_ref?: string;
  replay_ref?: string;
  integrity_hash?: string;
}>;

export type AdaptiveLedgerReaderResult = Readonly<{
  reader_id: string;
  query: AdaptiveLedgerQuery;
  records: readonly AdaptiveLedgerRecord[];
  chronological_order_preserved: boolean;
  tenant_isolated: boolean;
  read_authorized: boolean;
  integrity_hash: string;
}>;

export type AdaptiveLedgerWriterConfirmation = Readonly<{
  writer_id: string;
  records_appended: number;
  assigned_sequences: readonly number[];
  first_record_id: string;
  last_record_id: string;
  append_only: boolean;
  overwrite_attempted: boolean;
  integrity_hash: string;
}>;

export type AdaptiveLedgerIntegrityReport = Readonly<{
  report_id: string;
  checks: readonly AdaptiveLedgerCheck[];
  schema_integrity: boolean;
  sequence_integrity: boolean;
  parent_child_consistency: boolean;
  hash_integrity: boolean;
  previous_hash_chain_valid: boolean;
  replay_references_complete: boolean;
  lineage_complete: boolean;
  tenant_isolation_preserved: boolean;
  append_only_preserved: boolean;
  deterministic_replay_verified: boolean;
  failure_analysis: readonly AdaptiveLedgerFailure[];
  validation_result: AdaptiveLedgerValidationState;
  integrity_hash: string;
}>;

export type AdaptiveLedgerReplayResult = Readonly<{
  replay_id: string;
  records_replayed: number;
  event_types_reconstructed: readonly AdaptiveLedgerEventType[];
  lifecycle_states_reconstructed: readonly AdaptiveLedgerLifecycleState[];
  identical_history: boolean;
  identical_hash_chain: boolean;
  deterministic_result: AdaptiveLedgerValidationState;
  integrity_hash: string;
}>;

export type AdaptiveLedgerIndex = Readonly<{
  index_id: string;
  by_proposal: readonly string[];
  by_adaptation: readonly string[];
  by_tenant: readonly string[];
  by_mission: readonly string[];
  by_event_type: readonly AdaptiveLedgerEventType[];
  by_lifecycle_state: readonly AdaptiveLedgerLifecycleState[];
  by_governance_ref: readonly string[];
  by_certification_ref: readonly string[];
  by_replay_ref: readonly string[];
  by_integrity_hash: readonly string[];
  integrity_hash: string;
}>;

export type AdaptiveLedgerRetentionPolicy = Readonly<{
  policy_id: string;
  retention_mode: "PERMANENT";
  deletion_permitted: false;
  mutation_permitted: false;
  history_rewrite_permitted: false;
  tenant_isolation_required: true;
  rollback_records_retained: true;
  rejection_records_retained: true;
  integrity_hash: string;
}>;

export type AdaptiveLedgerDashboard = Readonly<{
  dashboard_id: string;
  ledger_growth: number;
  append_activity: number;
  integrity_validation_status: AdaptiveLedgerValidationState;
  replay_completeness: AdaptiveLedgerValidationState;
  lifecycle_distribution: readonly AdaptiveLedgerLifecycleState[];
  governance_events: number;
  approval_history: number;
  certification_history: number;
  rollback_history: number;
  rejection_statistics: number;
  integrity_hash: string;
}>;

export type AdaptiveLedgerCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly AdaptiveLedgerCheck[];
  all_lifecycle_events_recorded: boolean;
  append_only_compliant: boolean;
  reproducible_hashes: boolean;
  no_overwritten_records: boolean;
  no_deleted_records: boolean;
  replay_complete: boolean;
  deterministic_replay: boolean;
  tenant_isolation_complete: boolean;
  auditability_complete: boolean;
  failure_analysis: readonly AdaptiveLedgerFailure[];
  certification_decision: AdaptiveLedgerValidationState;
  integrity_hash: string;
}>;

export type AdaptiveLedgerValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  schema_valid: boolean;
  hash_integrity: boolean;
  replay_references_present: boolean;
  sequence_valid: boolean;
  ledger_identifiers_unique: boolean;
  tenant_isolated: boolean;
  lineage_complete: boolean;
  append_only: boolean;
  previous_hash_valid: boolean;
  parent_child_consistent: boolean;
  read_authorized: boolean;
  write_authorized: boolean;
  deterministic_replay: boolean;
  failures: readonly AdaptiveLedgerFailure[];
  integrity_hash: string;
}>;

export type AdaptiveIntelligenceLedgerInput = Readonly<{
  approval_framework?: OperatorApprovalFrameworkResult;
  role?: VisibilityRole;
  query?: AdaptiveLedgerQuery;
  scenario?:
    | "BASELINE"
    | "SCHEMA_INVALID"
    | "HASH_MISMATCH"
    | "MISSING_REPLAY_REFS"
    | "SEQUENCE_VIOLATION"
    | "DUPLICATE_LEDGER_ID"
    | "TENANT_VIOLATION"
    | "LINEAGE_INCOMPLETE"
    | "APPEND_OVERWRITE"
    | "PREVIOUS_HASH_INVALID"
    | "PARENT_CHILD_INCONSISTENT"
    | "RECORD_MODIFICATION"
    | "RECORD_DELETION"
    | "HISTORY_REWRITE"
    | "HASH_TAMPERING"
    | "HIDDEN_LEDGER_ENTRY"
    | "UNAUTHORIZED_WRITE"
    | "UNAUTHORIZED_READ"
    | "TENANT_CROSSOVER"
    | "CHAIN_CORRUPTION"
    | "MISSING_APPROVAL_RECORD"
    | "MISSING_CERTIFICATION_RECORD"
    | "MISSING_ROLLBACK_REPLAY"
    | "MISSING_REJECTION_RECORD"
    | "FAIL_OPEN";
}>;

export type AdaptiveIntelligenceLedgerResult = Readonly<{
  ledger_version: "adaptive-intelligence-ledger/v1";
  approval_framework: OperatorApprovalFrameworkResult;
  writer_confirmation: AdaptiveLedgerWriterConfirmation;
  records: readonly AdaptiveLedgerRecord[];
  events: readonly AdaptiveLedgerEvent[];
  reader_result: AdaptiveLedgerReaderResult;
  integrity_report: AdaptiveLedgerIntegrityReport;
  replay_result: AdaptiveLedgerReplayResult;
  index: AdaptiveLedgerIndex;
  retention_policy: AdaptiveLedgerRetentionPolicy;
  dashboard: AdaptiveLedgerDashboard;
  certification_report: AdaptiveLedgerCertificationReport;
  validation: AdaptiveLedgerValidation;
  deterministic: true;
  replayable: true;
  append_only: true;
  tenant_isolated: boolean;
  mutates_history: false;
  permits_record_deletion: false;
  permits_overwrite: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveIntelligenceLedgerFoundation = Readonly<{
  ledger_version: "adaptive-intelligence-ledger/v1";
  checks: readonly AdaptiveLedgerCheck[];
  event_types: readonly AdaptiveLedgerEventType[];
  lifecycle_states: readonly AdaptiveLedgerLifecycleState[];
  result: AdaptiveIntelligenceLedgerResult;
}>;
